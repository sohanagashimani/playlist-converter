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
    """Normalize string for better matching"""

    return re.sub(r'[^\w\s]', '', s.lower().strip())

def calculate_similarity(str1: str, str2: str) -> float:
    """Calculate similarity between two strings"""
    norm1 = normalize_string(str1)
    norm2 = normalize_string(str2)
    return SequenceMatcher(None, norm1, norm2).ratio()

def find_best_match(query_title: str, query_artist: str, results: List[Dict]) -> Optional[Dict]:
    """Find the best match from search results using fuzzy matching"""
    if not results:
        return None
    
    best_match = None
    best_score = 0.0
    
    logger.info(f"Searching for: '{query_title}' by '{query_artist}'")
    
    for i, result in enumerate(results[:10]):  # Check top 10 results
        try:
            if not isinstance(result, dict):
                continue
                
            title = result.get('title', '')
            artists = result.get('artists', [])
            
            if not title:
                continue
            

            title_score = calculate_similarity(query_title, title)
            

            artist_score = 0.0
            if artists:
                artist_scores = []
                query_artists = [a.strip() for a in query_artist.split(',')]
                
                for artist in artists:
                    artist_name = artist.get('name', '') if isinstance(artist, dict) else str(artist)
                    if artist_name:

                        for qa in query_artists:
                            score = calculate_similarity(qa, artist_name)
                            artist_scores.append(score)
                
                artist_score = max(artist_scores) if artist_scores else 0.0
            

            combined_score = (title_score * 0.7) + (artist_score * 0.3)
            

            if normalize_string(title) == normalize_string(query_title):
                combined_score += 0.15
            

            logger.info(f"Result {i+1}: '{title}' - Title: {title_score:.2f}, Artist: {artist_score:.2f}, Combined: {combined_score:.2f}")
            
            if combined_score > best_score and combined_score > 0.4:
                best_score = combined_score
                best_match = result
                
        except Exception as e:
            logger.warning(f"Error processing search result: {e}")
            continue
    
    if best_match:
        logger.info(f"✅ Best match found with score {best_score:.2f}: {best_match.get('title', 'Unknown')}")
    else:
        logger.warning(f"❌ No suitable match found (best score was {best_score:.2f})")
    
    return best_match


def store_conversion_data(data: Dict) -> Optional[str]:
    """Store conversion data in Firestore and return the auto-generated document ID"""
    try:
        if db is None:
            return None
        

        data['created_at'] = datetime.now().isoformat()
        data['updated_at'] = datetime.now().isoformat()
        

        doc_ref = db.collection('conversion-jobs').add(data)
        return doc_ref[1].id  # doc_ref is a tuple (update_time, document_reference)
    except Exception as e:
        logger.error(f"❌ Failed to store conversion data: {str(e)}")
        return None

def update_conversion_data(conversion_id: str, data: Dict) -> bool:
    """Update conversion data in Firestore"""
    try:
        if db is None:
            return False
        
        data['updated_at'] = datetime.now().isoformat()
        db.collection('conversion-jobs').document(conversion_id).set(data, merge=True)
        return True
    except Exception as e:
        logger.error(f"❌ Failed to update conversion data: {str(e)}")
        return False

def get_conversion_data(conversion_id: str) -> Optional[Dict]:
    """Get conversion data from Firestore"""
    try:
        if db is None:
            return None
        
        doc = db.collection('conversion-jobs').document(conversion_id).get()
        return doc.to_dict() if doc.exists else None
    except Exception as e:
        logger.error(f"❌ Failed to get conversion data: {str(e)}")
        return None

def update_conversion_status(conversion_id: str, status: str, progress: int = 0, result: Optional[Dict] = None) -> bool:
    """Update conversion status"""
    try:
        data = {
            'status': status,
            'progress': progress,
            'updated_at': datetime.now().isoformat()
        }
        
        if result:
            data['result'] = result
        
        return update_conversion_data(conversion_id, data)
    except Exception as e:
        logger.error(f"❌ Failed to update conversion status: {str(e)}")
        return False

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

@app.route('/start-conversion', methods=['POST'])
def start_conversion():
    """Start a new conversion and return conversion ID"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No JSON data provided'}), 400
        
        spotify_url = data.get('spotifyUrl', '').strip()
        playlist_title = data.get('playlistTitle', '').strip()
        
        if not spotify_url:
            return jsonify({'success': False, 'error': 'Spotify URL is required'}), 400
        

        conversion_data = {
            'spotify_url': spotify_url,
            'playlist_title': playlist_title,
            'status': 'started',
            'progress': 0
        }
        
        conversion_id = store_conversion_data(conversion_data)
        if conversion_id:
            logger.info(f"🎵 Started conversion {conversion_id} for {spotify_url}")
            return jsonify({
                'success': True,
                'conversionId': conversion_id,
                'message': 'Conversion started'
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to create conversion job'}), 500
            
    except Exception as e:
        logger.error(f"❌ Start conversion error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to start conversion: {str(e)}'
        }), 500

@app.route('/conversion-status/<conversion_id>', methods=['GET'])
def get_conversion_status(conversion_id: str):
    """Get conversion status by ID"""
    try:
        data = get_conversion_data(conversion_id)
        if not data:
            return jsonify({'success': False, 'error': 'Conversion not found'}), 404
        
        return jsonify({
            'success': True,
            'conversion': data
        })
        
    except Exception as e:
        logger.error(f"❌ Get conversion status error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to get conversion status: {str(e)}'
        }), 500

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

def search_single_track(track_data: Dict) -> Dict:
    """Helper function to search for a single track"""
    try:
        title = track_data.get('title', '').strip()
        artist = track_data.get('artist', '').strip()
        
        if not title or not artist:
            return {
                'success': False,
                'error': 'Title and artist required',
                'originalTitle': title,
                'originalArtist': artist
            }
        
        search_query = f"{title} {artist}"
        

        if ytmusic is None:
            return {
                'success': False,
                'error': 'YTMusic not initialized',
                'originalTitle': title,
                'originalArtist': artist
            }
        
        search_results = ytmusic.search(search_query, filter='songs', limit=10)
        
        if not search_results:
            return {
                'success': False,
                'error': 'No results found',
                'originalTitle': title,
                'originalArtist': artist
            }
        

        best_match = find_best_match(title, artist, search_results)
        
        if not best_match:
            return {
                'success': False,
                'error': 'No suitable match found',
                'originalTitle': title,
                'originalArtist': artist
            }
        

        result = {
            'videoId': best_match.get('videoId'),
            'title': best_match.get('title'),
            'artists': best_match.get('artists', []),
            'duration': best_match.get('duration')
        }
        
        return {
            'success': True,
            'result': result,
            'originalTitle': title,
            'originalArtist': artist
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Search failed: {str(e)}',
            'originalTitle': track_data.get('title', ''),
            'originalArtist': track_data.get('artist', '')
        }

@app.route('/search-batch', methods=['POST'])
def search_batch():
    """Search for multiple tracks in parallel"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No JSON data provided'}), 400
        
        tracks = data.get('tracks', [])
        if not tracks:
            return jsonify({'success': False, 'error': 'No tracks provided'}), 400
        
        if not ytmusic:
            return jsonify({'success': False, 'error': 'YTMusic not initialized'}), 500
        
        logger.info(f"🔍 Batch searching {len(tracks)} tracks...")
        
        results = []
        

        max_workers = min(10, len(tracks))  # Limit concurrent requests to avoid overwhelming the API
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:

            future_to_track = {executor.submit(search_single_track, track): track for track in tracks}
            

            for future in as_completed(future_to_track):
                track = future_to_track[future]
                try:
                    result = future.result()
                    results.append(result)
                    
                    if result['success']:
                        logger.info(f"✅ Found: {result['originalTitle']} -> {result['result']['title']}")
                    else:
                        logger.warning(f"❌ Failed: {result['originalTitle']} - {result['error']}")
                        
                except Exception as e:
                    logger.error(f"❌ Thread error for {track.get('title', 'Unknown')}: {str(e)}")
                    results.append({
                        'success': False,
                        'error': f'Thread error: {str(e)}',
                        'originalTitle': track.get('title', ''),
                        'originalArtist': track.get('artist', '')
                    })
        


        successful_count = sum(1 for r in results if r['success'])
        failed_count = len(results) - successful_count
        
        logger.info(f"📊 Batch search complete: {successful_count} found, {failed_count} failed")
        
        return jsonify({
            'success': True,
            'results': results,
            'summary': {
                'total': len(tracks),
                'successful': successful_count,
                'failed': failed_count
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Batch search error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Batch search failed: {str(e)}'
        }), 500

@app.route('/create-playlist', methods=['POST'])
def create_playlist():
    """Create a new playlist on YouTube Music"""
    try:
        data = request.get_json()
        logger.info(f"📥 Received create playlist request: {data}")
        
        if not data:
            logger.error("❌ No JSON data provided in request")
            return jsonify({'success': False, 'error': 'No JSON data provided'}), 400
        
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        conversion_id = data.get('conversionId', '').strip()
        
        logger.info(f"📝 Playlist details - Title: '{title}', Description: '{description}', ConversionID: '{conversion_id}'")
        
        if not title:
            logger.error("❌ Playlist title is empty or missing")
            return jsonify({'success': False, 'error': 'Playlist title is required'}), 400
        

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
                        }), 409  # Conflict status
            except Exception as e:
                logger.warning(f"⚠️ Could not check conversion status for {conversion_id}: {str(e)}")

        
        if not ytmusic:
            logger.error("❌ YTMusic instance is not initialized")
            return jsonify({'success': False, 'error': 'YTMusic not initialized'}), 500
        
        logger.info(f"📝 Creating PUBLIC YouTube Music playlist: '{title}'")
        

        playlist_result = ytmusic.create_playlist(title, description, privacy_status='PUBLIC')
        logger.info(f"✅ PUBLIC playlist creation successful")
        logger.info(f"📊 Playlist result type: {type(playlist_result)}, value: {playlist_result}")
        

        if isinstance(playlist_result, dict):
            logger.error(f"❌ Playlist creation returned dict (error): {playlist_result}")
            return jsonify({
                'success': False, 
                'error': f'Playlist creation returned error: {playlist_result}'
            }), 500
        
        playlist_id = str(playlist_result).strip()
        logger.info(f"📋 Extracted playlist ID: '{playlist_id}' (type: {type(playlist_id)})")
        
        if not playlist_id:
            logger.error("❌ Playlist ID is empty after creation")
            return jsonify({'success': False, 'error': 'Failed to create playlist - empty ID returned'}), 500
        
        playlist_url = f"https://music.youtube.com/playlist?list={playlist_id}"
        logger.info(f"🔗 Generated playlist URL: {playlist_url}")
        
        result = {
            'playlistId': playlist_id,
            'title': title,
            'description': description,
            'url': playlist_url
        }
        
        logger.info(f"✅ Successfully created playlist: {playlist_id}")
        logger.info(f"📤 Returning result: {result}")
        
        return jsonify({
            'success': True,
            'playlist': result,
            'message': 'Playlist created successfully'
        })
        
    except Exception as e:
        logger.error(f"❌ Playlist creation error: {str(e)}")
        logger.error(f"❌ Error type: {type(e)}")
        import traceback
        logger.error(f"❌ Full traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': f'Playlist creation failed: {str(e)}'
        }), 500

@app.route('/add-to-playlist', methods=['POST'])
def add_to_playlist():
    """Add a track to a YouTube Music playlist"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No JSON data provided'}), 400
        

        playlist_id_raw = data.get('playlistId', '')
        if isinstance(playlist_id_raw, dict):
            logger.error(f"❌ Received dict as playlistId: {playlist_id_raw}")
            return jsonify({'success': False, 'error': 'Invalid playlistId format'}), 400
        
        playlist_id = playlist_id_raw.strip() if playlist_id_raw else ''
        video_id = data.get('videoId', '').strip()
        
        if not playlist_id or not video_id:
            return jsonify({'success': False, 'error': 'playlistId and videoId are required'}), 400
        
        if not ytmusic:
            return jsonify({'success': False, 'error': 'YTMusic not initialized'}), 500
        
        logger.info(f"➕ Adding track {video_id} to playlist {playlist_id}")
        

        result = ytmusic.add_playlist_items(playlist_id, [video_id])
        

        if isinstance(result, dict) and result.get('status') == 'STATUS_SUCCEEDED':
            logger.info(f"✅ Successfully added track to playlist")
            return jsonify({
                'success': True,
                'message': 'Track added to playlist successfully'
            })
        elif result:  # If result exists but is not a success dict
            logger.info(f"✅ Track added to playlist (result: {result})")
            return jsonify({
                'success': True,
                'message': 'Track added to playlist successfully'
            })
        else:
            logger.warning(f"⚠️ Failed to add track to playlist: {result}")
            return jsonify({
                'success': False,
                'error': 'Failed to add track to playlist'
            }), 500
        
    except Exception as e:
        logger.error(f"❌ Add to playlist error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to add track to playlist: {str(e)}'
        }), 500

@app.route('/add-batch-to-playlist', methods=['POST'])
def add_batch_to_playlist():
    """Add multiple tracks to a YouTube Music playlist in parallel"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No JSON data provided'}), 400
        
        playlist_id_raw = data.get('playlistId', '')
        if isinstance(playlist_id_raw, dict):
            logger.error(f"❌ Received dict as playlistId: {playlist_id_raw}")
            return jsonify({'success': False, 'error': 'Invalid playlistId format'}), 400
        
        playlist_id = playlist_id_raw.strip() if playlist_id_raw else ''
        video_ids = data.get('videoIds', [])
        
        if not playlist_id or not video_ids:
            return jsonify({'success': False, 'error': 'playlistId and videoIds are required'}), 400
        
        if not ytmusic:
            return jsonify({'success': False, 'error': 'YTMusic not initialized'}), 500
        
        logger.info(f"📚 Adding {len(video_ids)} tracks to playlist {playlist_id}")
        

        try:
            result = ytmusic.add_playlist_items(playlist_id, video_ids)
            

            if isinstance(result, dict) and result.get('status') == 'STATUS_SUCCEEDED':
                logger.info(f"✅ Successfully added {len(video_ids)} tracks to playlist")
                return jsonify({
                    'success': True,
                    'message': f'Added {len(video_ids)} tracks to playlist successfully'
                })
            elif result:  # If result exists but is not a success dict
                logger.info(f"✅ Added {len(video_ids)} tracks to playlist (result: {result})")
                return jsonify({
                    'success': True,
                    'message': f'Added {len(video_ids)} tracks to playlist successfully'
                })
            else:
                logger.warning(f"⚠️ Failed to add tracks to playlist: {result}")
                return jsonify({
                    'success': False,
                    'error': 'Failed to add tracks to playlist'
                }), 500
                
        except Exception as api_error:
            logger.error(f"❌ API error adding tracks: {str(api_error)}")
            return jsonify({
                'success': False,
                'error': f'API error: {str(api_error)}'
            }), 500
        
    except Exception as e:
        logger.error(f"❌ Batch add to playlist error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to add tracks to playlist: {str(e)}'
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

if __name__ == '__main__':
  # Initialize Firestore
    if not init_firestore():
        logger.warning("⚠️  Firestore not available - conversion tracking disabled")
    
    # Initialize YTMusic on startup
    if not init_ytmusic():
        logger.error("❌ Failed to initialize YTMusic. Exiting...")
        exit(1)
    
    # Start Flask app

    port = int(os.getenv('PORT', 8000))
    host = os.getenv('HOST', '0.0.0.0')
    
    logger.info(f"🚀 Starting YTMusic microservice on {host}:{port}")
    app.run(host=host, port=port, debug=os.getenv('DEBUG', 'False').lower() == 'true') 