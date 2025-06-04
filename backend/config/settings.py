import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'livehot-secret-key')
    LIVEKIT_URL = os.environ.get('LIVEKIT_URL', 'wss://livekit.example.com')
    LIVEKIT_API_KEY = os.environ.get('LIVEKIT_API_KEY', 'devkey')
    LIVEKIT_API_SECRET = os.environ.get('LIVEKIT_API_SECRET', 'devsecret')
