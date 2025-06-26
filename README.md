# Playlist Converter

A full-stack application to convert Spotify playlists to YouTube Music playlists.

## 🚀 Features

- **Easy Conversion**: Simply paste a public Spotify playlist URL
- **Smart Matching**: Advanced fuzzy matching to find the best YouTube Music equivalents
- **Real-time Progress**: Live updates during the conversion process
- **Detailed Results**: See exactly which tracks were converted and which failed
- **Public Playlists**: Creates public YouTube Music playlists for easy sharing
- **Conversion Logs**: Keeps track of all conversions for reference

## 🏗️ Architecture

- **Frontend**: React + TypeScript, Vite, Tailwind CSS, Ant Design
- **Backend**: Express.js + TypeScript, REST API
- **Python Microservice**: Flask + ytmusicapi for YouTube Music integration
- **External APIs**: Spotify Web API (public playlists only)

## 📋 Prerequisites

Before running this application, you need:

### 1. Spotify API Credentials ✅

- ✅ Already configured with your credentials
- Client ID: `f97e23dc2f3f40518867efbcf3a4278a`

### 2. YouTube Music Authentication ✅

- ✅ OAuth authentication configured (oauth.json + oauth_credentials.json)

### 3. Software Requirements

- Node.js 18+
- Python 3.8+
- Docker (optional, for Python microservice)

## 🔧 Quick Start

### 1. Test YouTube Music Authentication

```bash
# First, test if Python microservice is running
curl http://localhost:8000/health
```

### 2. Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on: `http://localhost:3001`

### 3. Start Python Microservice

#### Option A: Using Docker (Recommended)

```bash
cd ytmusic-microservice
docker-compose up --build
```

#### Option B: Local Python

```bash
cd ytmusic-microservice
pip install -r requirements.txt
python app.py
```

Microservice runs on: `http://localhost:8000`

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

### 5. Open the App! 🎉

Visit: **http://localhost:5173**

## 🎯 How to Use

1. **Open the app** at `http://localhost:5173`
2. **Check the health status** (top-right) - should show green
3. **Get a Spotify playlist URL**:
   - Open Spotify → Go to a **public** playlist
   - Click "⋯" → Share → Copy link to playlist
4. **Paste the URL** and click "Convert Playlist"
5. **Wait for conversion** (shows real-time progress)
6. **View results** and click the YouTube Music playlist link!

## 📁 Project Structure

```
playlist-converter/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Spotify & YTMusic services
│   │   ├── middleware/     # Error handling
│   │   └── types/          # TypeScript types
│   ├── .env               # Your Spotify credentials
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── services/      # API calls
│   │   └── types/         # TypeScript types
│   └── package.json
├── ytmusic-microservice/   # Python Flask service
│   ├── app.py            # Main Flask app
│   ├── requirements.txt  # Python deps
│   ├── Dockerfile        # Docker config
│   └── docker-compose.yml # Docker Compose
├── logs/                  # Conversion logs (auto-created)
├── oauth.json            # ✅ YTMusic OAuth tokens
├── oauth_credentials.json # ✅ Google OAuth credentials
└── README.md
```

## 🚨 Troubleshooting

### Common Issues:

**❌ "YouTube Music service unavailable"**

```bash
# Check if Python service is running
curl http://localhost:8000/health

# If not, restart it:
cd ytmusic-microservice
python app.py
```

**❌ "Invalid Spotify playlist URL"**

- Make sure playlist is **public** in Spotify
- Use full URL: `https://open.spotify.com/playlist/...`

**❌ Docker issues**

```bash
# If docker-compose fails, run Python locally:
cd ytmusic-microservice
pip install -r requirements.txt
export YTMUSIC_OAUTH_FILE=../oauth.json
python app.py
```

**❌ Tracks not found**

- This is normal! Not all Spotify tracks exist on YouTube Music
- Check the detailed results to see what failed

## 🔍 API Endpoints

### Backend (Express.js)

- `POST /api/playlist/convert` - Convert a playlist
- `GET /api/playlist/logs` - View conversion history
- `GET /api/playlist/health` - Check services

### Python Microservice

- `POST /search` - Search YouTube Music
- `POST /create-playlist` - Create YT playlist
- `POST /add-to-playlist` - Add tracks
- `GET /health` - Health check

## 🎨 Features in Detail

### ✨ Smart Matching

- Uses fuzzy string matching to find the best YouTube Music equivalents
- Compares track titles and artist names
- Handles variations in spelling and formatting

### 📊 Real-time Progress

- Live updates during conversion
- Shows current processing stage
- Displays which track is being processed

### 📋 Detailed Results

- Success/failure statistics
- Track-by-track conversion details
- Links to original Spotify tracks and new YouTube Music matches
- Conversion logs with timestamps

### 🔗 Easy Sharing

- Creates public YouTube Music playlists
- Provides shareable URLs
- Maintains playlist metadata

## 🔐 Security & Privacy

- ✅ Only accesses **public** Spotify playlists
- ✅ No user login required
- ✅ Spotify credentials are server-side only
- ✅ YouTube Music playlists created under your account
- ✅ No personal data stored

## 🧪 Testing the Setup

### 1. Test Backend

```bash
curl http://localhost:3001/api/health
# Should return: {"success": true, ...}
```

### 2. Test Python Service

```bash
curl http://localhost:8000/health
# Should return: {"success": true, "status": "healthy", ...}
```

### 3. Test Full Integration

Use this public Spotify playlist for testing:

```
https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
```

## 📝 Development Scripts

**Backend:**

```bash
npm run dev        # Development server
npm run build      # Build TypeScript
npm start          # Production server
```

**Frontend:**

```bash
npm run dev        # Development server
npm run build      # Build for production
npm run preview    # Preview build
```

**Python Service:**

```bash
python app.py                    # Run locally
docker-compose up --build       # Run with Docker
```

## 📊 Tech Stack

| Component      | Technology                                        |
| -------------- | ------------------------------------------------- |
| Frontend       | React, TypeScript, Vite, Tailwind CSS, Ant Design |
| Backend        | Express.js, TypeScript, Axios                     |
| Python Service | Flask, ytmusicapi, Docker                         |
| APIs           | Spotify Web API, YouTube Music (via ytmusicapi)   |
| Storage        | JSON logs, local filesystem                       |

---

## 🎵 Ready to Convert?

1. **Start all services** (backend, Python, frontend)
2. **Visit http://localhost:5173**
3. **Paste a public Spotify playlist URL**
4. **Watch the magic happen!** ✨

Your Spotify playlists will be perfectly converted to YouTube Music with detailed tracking of what worked and what didn't. Enjoy! 🎶
