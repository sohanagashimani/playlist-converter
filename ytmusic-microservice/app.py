import os
import json
import logging
import time
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import Optional, Dict, Any, List
import re
from difflib import SequenceMatcher
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()


try:
    from ytmusicapi import YTMusic
except ImportError:
    print("❌ ytmusicapi not installed. Run: pip install ytmusicapi")
    exit(1)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)


ytmusic: Optional[YTMusic] = None
db: Optional[Any] = None  # Use Any instead of firestore.Client to avoid import issues

def init_firestore():
    """Initialize Firestore connection"""
    global db
    
    try:

        if not firebase_admin._apps:

            google_creds = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
            if google_creds:
                try:

                    service_account = json.loads(
                        base64.b64decode(google_creds).decode()
                    )
                    logger.info("✅ Using base64 decoded credentials")
                except:
                    try:

                        service_account = json.loads(google_creds)
                        logger.info("✅ Using direct JSON credentials")
                    except:
                        logger.error("❌ Failed to parse GOOGLE_APPLICATION_CREDENTIALS")
                        return False
                
                cred = credentials.Certificate(service_account)
                project_id = service_account['project_id']
            else:

                service_account_path = 'serviceAccountKey.json'
                if os.path.exists(service_account_path):
                    cred = credentials.Certificate(service_account_path)
                    with open(service_account_path, 'r') as f:
                        service_account = json.load(f)
                    project_id = service_account['project_id']
                else:
                    logger.error("❌ No Firebase credentials found. Set GOOGLE_APPLICATION_CREDENTIALS or provide serviceAccountKey.json")
                    return False
            
            firebase_admin.initialize_app(cred, {
                'projectId': project_id,
            })
        
        db = firestore.client()
        logger.info("✅ Firestore connected")
        return True
        
    except Exception as e:
        logger.error(f"❌ Firestore connection failed: {str(e)}")
        db = None
        return False

def init_ytmusic():
    """Initialize YTMusic with OAuth authentication using proper ytmusicapi OAuth classes"""
    global ytmusic
    
    try:
        oauth_file = os.getenv('YTMUSIC_OAUTH_FILE', 'auth/oauth.json')
        

        if not os.path.exists(oauth_file):
            oauth_file = '/app/auth/oauth.json'
        
        if not os.path.exists(oauth_file):
            logger.error("❌ OAuth file not found")
            return False
        

        client_id = os.getenv('GOOGLE_CLIENT_ID')
        client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        

        if not client_id or not client_secret:
            creds_file = os.getenv('OAUTH_CREDENTIALS_FILE', 'auth/oauth_credentials.json')
            if not os.path.exists(creds_file):
                creds_file = '/app/auth/oauth_credentials.json'
            
            if os.path.exists(creds_file):
                with open(creds_file, 'r') as f:
                    creds = json.load(f)
                client_id = creds.get('client_id')
                client_secret = creds.get('client_secret')
        
        if not client_id or not client_secret:
            logger.error("❌ OAuth client credentials not found")
            return False
        

        try:
            from ytmusicapi.auth.oauth import OAuthCredentials, RefreshingToken
            

            oauth_credentials = OAuthCredentials(
                client_id=client_id,
                client_secret=client_secret
            )
            

            with open(oauth_file, 'r') as f:
                token_data = json.load(f)
            

            refreshing_token = RefreshingToken(
                scope=token_data.get('scope', 'https://www.googleapis.com/auth/youtube'),
                token_type=token_data.get('token_type', 'Bearer'),
                access_token=token_data['access_token'],
                refresh_token=token_data['refresh_token'],
                expires_at=token_data.get('expires_at', 0),
                expires_in=token_data.get('expires_in', 3600),
                credentials=oauth_credentials,
                _local_cache=oauth_file  # This will auto-save token updates
            )
            

            refreshing_token.store_token(oauth_file)
            

            ytmusic = YTMusic(oauth_file, oauth_credentials=oauth_credentials)
            logger.info("✅ YTMusic initialized with RefreshingToken (auto-refresh enabled)")
            
        except ImportError as e:
            logger.warning(f"⚠️ ytmusicapi OAuth classes not available: {str(e)}")
            logger.warning("⚠️ Falling back to manual token refresh...")
            

            with open(oauth_file, 'r') as f:
                oauth_data = json.load(f)
            

            expires_at = oauth_data.get('expires_at', 0)
            current_time = time.time()
            
            if current_time > expires_at:
                logger.warning("⚠️ OAuth token has expired, attempting to refresh...")
                

                refresh_token = oauth_data.get('refresh_token')
                if not refresh_token:
                    logger.error("❌ No refresh token available. Please re-authenticate.")
                    return False
                

                import requests
                
                token_refresh_data = {
                    'grant_type': 'refresh_token',
                    'refresh_token': refresh_token,
                    'client_id': client_id,
                    'client_secret': client_secret
                }
                
                try:
                    response = requests.post(
                        'https://oauth2.googleapis.com/token',
                        data=token_refresh_data
                    )
                    
                    if response.status_code == 200:
                        token_data = response.json()
                        

                        oauth_data['access_token'] = token_data['access_token']
                        oauth_data['expires_in'] = token_data['expires_in']
                        oauth_data['expires_at'] = current_time + token_data['expires_in']
                        

                        with open(oauth_file, 'w') as f:
                            json.dump(oauth_data, f, indent=2)
                        
                        logger.info("✅ OAuth token refreshed successfully")
                    else:
                        logger.error(f"❌ Token refresh failed: {response.status_code} - {response.text}")
                        return False
                        
                except Exception as e:
                    logger.error(f"❌ Token refresh error: {str(e)}")
                    return False
            

            ytmusic = YTMusic(oauth_file)
            logger.info("✅ YTMusic initialized with oauth file (manual refresh)")
        

        try:

            test_result = ytmusic.get_library_playlists(limit=1)
            logger.info("✅ YouTube Music authentication verified")
            return True
            
        except Exception as e:
            logger.error(f"❌ Authentication verification failed: {str(e)}")
            if "401" in str(e) or "unauthorized" in str(e).lower():
                logger.error("❌ Authentication failed - token may be invalid. Please re-authenticate.")
            return False
        
    except Exception as e:
        logger.error(f"❌ OAuth authentication failed: {str(e)}")
        return False

def normalize_string(s: str) -> str:
    """Normalize string for better matching - less aggressive normalization"""
    # Keep some punctuation that might be important for matching
    s = re.sub(r'[^\w\s\-\'\&]', '', s.lower().strip())
    # Remove extra whitespace
    s = ' '.join(s.split())
    return s

def calculate_similarity(str1: str, str2: str) -> float:
    """Calculate similarity between two strings"""
    norm1 = normalize_string(str1)
    norm2 = normalize_string(str2)
    return SequenceMatcher(None, norm1, norm2).ratio()

def find_best_match(query_title: str, query_artist: str, results: List[Dict]) -> Optional[Dict]:
    """Find the best matching track from search results using improved similarity scoring"""
    if not results:
        return None
    
    best_match = None
    best_score = 0.0
    
    logger.info(f"🔍 Finding best match for: '{query_title}' by '{query_artist}'")
    
    for i, result in enumerate(results):
        try:
            # Extract title and artists
            result_title = result.get('title', '').strip()
            result_artists = result.get('artists', [])
            
            if not result_title:
                continue
            
            # Get artist names
            artist_names = []
            for artist in result_artists:
                if isinstance(artist, dict):
                    name = artist.get('name', '')
                    if name:
                        artist_names.append(name)
                elif isinstance(artist, str):
                    artist_names.append(artist)
            
            result_artist = ', '.join(artist_names)
            
            # Calculate similarity scores
            title_similarity = calculate_similarity(query_title, result_title)
            
            # Improved artist matching - check individual artists too
            artist_similarity = calculate_similarity(query_artist, result_artist)
            
            # Also check if any individual artist from query matches any result artist
            query_artists = [a.strip() for a in query_artist.split(',')]
            individual_artist_scores = []
            
            for qa in query_artists:
                for artist_name in artist_names:
                    score = calculate_similarity(qa, artist_name)
                    individual_artist_scores.append(score)
            
            # Use the best individual artist match if it's better
            best_individual_artist = max(individual_artist_scores) if individual_artist_scores else 0.0
            artist_similarity = max(artist_similarity, best_individual_artist)
            
            # Combined score with slightly more emphasis on title
            combined_score = (title_similarity * 0.75) + (artist_similarity * 0.25)
            
            # Bonus for exact title match (case insensitive)
            if normalize_string(query_title) == normalize_string(result_title):
                combined_score += 0.1
            
            logger.info(f"🔍 Result {i+1}: '{result_title}' by '{result_artist}'")
            logger.info(f"   Title sim: {title_similarity:.3f}, Artist sim: {artist_similarity:.3f}, Combined: {combined_score:.3f}")
            
            if combined_score > best_score:
                best_score = combined_score
                best_match = result
        
        except Exception as e:
            logger.error(f"❌ Error processing search result: {str(e)}")
            continue
    
    # Lower threshold for better matching (0.3 instead of 0.4)
    if best_score >= 0.3 and best_match:
        match_title = best_match.get('title', 'Unknown')
        match_artists = ', '.join([a.get('name', '') if isinstance(a, dict) else str(a) for a in best_match.get('artists', [])])
        logger.info(f"✅ Best match found with score {best_score:.3f}: '{match_title}' by '{match_artists}'")
        return best_match
    else:
        logger.info(f"❌ No match above threshold 0.3 (best score: {best_score:.3f})")
        return None




@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'ytmusic_initialized': ytmusic is not None,
        'firestore_connected': db is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/search', methods=['POST'])
def search_track():
    """Search for a track on YouTube Music"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No JSON data provided'}), 400
        
        query = data.get('query', '').strip()
        title = data.get('title', '').strip()
        artist = data.get('artist', '').strip()
        
        if not query and not (title and artist):
            return jsonify({'success': False, 'error': 'Query or title+artist required'}), 400
        
        if not ytmusic:
            return jsonify({'success': False, 'error': 'YTMusic not initialized'}), 500
        

        search_query = query if query else f"{title} {artist}"
        
        logger.info(f"🔍 Searching: '{search_query}'")
        

        search_results = ytmusic.search(search_query, filter='songs', limit=10)
        
        if not search_results:
            logger.info(f"❌ No results found for: '{search_query}'")
            return jsonify({
                'success': True,
                'result': None,
                'message': 'No results found'
            })
        

        best_match = find_best_match(title, artist, search_results)
        
        if not best_match:
            logger.info(f"❌ No suitable match found for: '{search_query}'")
            return jsonify({
                'success': True,
                'result': None,
                'message': 'No suitable match found'
            })
        

        logger.debug(f"🔍 best_match type: {type(best_match)}, value: {best_match}")
        

        if not isinstance(best_match, dict):
            logger.error(f"❌ best_match is not a dict: {type(best_match)} - {best_match}")
            return jsonify({
                'success': False,
                'error': 'Invalid search result format'
            }), 500
        

        result = {
            'videoId': best_match.get('videoId'),
            'title': best_match.get('title'),
            'artists': best_match.get('artists', []),
            'duration': best_match.get('duration')  # Duration is already a string like "4:19"
        }
        
        logger.info(f"✅ Found match: {result['title']} by {[a.get('name') if isinstance(a, dict) else str(a) for a in result['artists']]}")
        
        return jsonify({
            'success': True,
            'result': result,
            'message': 'Track found successfully'
        })
        
    except Exception as e:
        logger.error(f"❌ Search error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Search failed: {str(e)}'
        }), 500

@app.route('/create-playlist-with-tracks', methods=['POST'])
def create_playlist_with_tracks():
    """Create a new playlist on YouTube Music with tracks"""
    try:
        data = request.get_json()
        logger.info(f"📥 Received create playlist with tracks request")
        
        if not data:
            logger.error("❌ No JSON data provided in request")
            return jsonify({'success': False, 'error': 'No JSON data provided'}), 400
        
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        video_ids = data.get('videoIds', [])
        conversion_id = data.get('conversionId', '').strip()
        
        logger.info(f"📝 Playlist details - Title: '{title}', Description: '{description}', Tracks: {len(video_ids)}")
        
        if not title:
            logger.error("❌ Playlist title is empty or missing")
            return jsonify({'success': False, 'error': 'Playlist title is required'}), 400

        # Check for cancellation
        if conversion_id and db:
            try:
                conversion_doc = db.collection('conversion-jobs').document(conversion_id).get()
                if conversion_doc.exists:
                    conversion_data = conversion_doc.to_dict()
                    if conversion_data.get('status') == 'cancelled':
                        logger.info(f"🛑 Conversion {conversion_id} was cancelled, aborting playlist creation")
                        return jsonify({
                            'success': False, 
                            'error': 'Conversion was cancelled',
                            'cancelled': True
                        }), 409
            except Exception as e:
                logger.warning(f"⚠️ Could not check conversion status for {conversion_id}: {str(e)}")

        if not ytmusic:
            logger.error("❌ YTMusic instance is not initialized")
            return jsonify({'success': False, 'error': 'YTMusic not initialized'}), 500
        
        logger.info(f"📝 Creating UNLISTED YouTube Music playlist with {len(video_ids)} tracks: '{title}'")
        
        # Create playlist with all tracks at once
        playlist_result = ytmusic.create_playlist(
            title, 
            description, 
            privacy_status='UNLISTED',
            video_ids=video_ids if video_ids else None
        )
        
        logger.info(f"✅ UNLISTED playlist with tracks creation successful")
        logger.info(f"📊 Playlist result: {playlist_result}")

        if isinstance(playlist_result, dict):
            logger.error(f"❌ Playlist creation returned dict (error): {playlist_result}")
            return jsonify({
                'success': False, 
                'error': f'Playlist creation returned error: {playlist_result}'
            }), 500
        
        playlist_id = str(playlist_result).strip()
        logger.info(f"📋 Created playlist ID: '{playlist_id}' with {len(video_ids)} tracks")
        
        if not playlist_id:
            logger.error("❌ Playlist ID is empty after creation")
            return jsonify({'success': False, 'error': 'Failed to create playlist - empty ID returned'}), 500
        
        playlist_url = f"https://music.youtube.com/playlist?list={playlist_id}"
        
        result = {
            'playlistId': playlist_id,
            'title': title,
            'description': description,
            'url': playlist_url,
            'tracksAdded': len(video_ids)
        }
        
        logger.info(f"✅ Successfully created playlist with tracks: {playlist_id}")
        
        return jsonify({
            'success': True,
            'playlist': result,
            'message': f'Playlist created successfully with {len(video_ids)} tracks'
        })
        
    except Exception as e:
        logger.error(f"❌ Playlist creation error: {str(e)}")
        import traceback
        logger.error(f"❌ Full traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': f'Playlist creation failed: {str(e)}'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

# Initialize services on startup
logger.info("🚀 Starting YTMusic Microservice...")

firestore_ready = init_firestore()
ytmusic_ready = init_ytmusic()

if not ytmusic_ready:
    logger.error("❌ YTMusic initialization failed!")
    exit(1)

if not firestore_ready:
    logger.warning("⚠️ Firestore initialization failed - continuing without Firestore")

logger.info("✅ YTMusic service initialized successfully")

if __name__ == '__main__':
    # This will only run for local development
    port = int(os.getenv('PORT', 8000))
    logger.info(f"🎵 YTMusic service starting on port {port} (development mode)")
    app.run(host='0.0.0.0', port=port, debug=False) 