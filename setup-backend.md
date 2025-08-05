# Backend Setup Guide

## Prerequisites

1. Python 3.8 or higher
2. Gemini AI API key from Google AI Studio

## Setup Steps

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Virtual Environment
```bash
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
```bash
# Copy example environment file
cp .env.example .env

# Edit .env file and add your Gemini API key
# Get your API key from: https://makersuite.google.com/app/apikey
```

### 5. Start the Backend Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: http://localhost:8000

### 6. Test the Backend
Visit http://localhost:8000/docs to see the interactive API documentation.

## API Endpoints

- `GET /` - API status
- `GET /health` - System health check
- `POST /tahmin-et` - Vehicle price estimation
- `GET /istatistikler` - System statistics

## Database

The application uses SQLite by default. The database file `arac_tahmini.db` will be created automatically in the backend directory.

## Troubleshooting

1. **Import Error**: Make sure virtual environment is activated
2. **Gemini API Error**: Check your API key in .env file
3. **Port Already in Use**: Change port with `uvicorn main:app --reload --port 8001`