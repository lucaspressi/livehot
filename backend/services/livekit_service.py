from datetime import datetime, timedelta
import jwt

class LiveKitService:
    def __init__(self, api_key: str, api_secret: str, url: str):
        self.api_key = api_key
        self.api_secret = api_secret
        self.url = url

    def generate_token(self, room: str, identity: str, name: str, can_publish: bool = False, ttl_seconds: int = 3600):
        now = datetime.utcnow()
        payload = {
            'iss': self.api_key,
            'sub': identity,
            'name': name,
            'nbf': int(now.timestamp()),
            'exp': int((now + timedelta(seconds=ttl_seconds)).timestamp()),
            'video': {
                'roomJoin': True,
                'room': room,
                'canPublish': can_publish,
                'canSubscribe': True
            }
        }
        return jwt.encode(payload, self.api_secret, algorithm='HS256')
