import hashlib
import uuid
from datetime import datetime
import jwt

from config.settings import Config
from database.repositories.user_repository import UserRepository

class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()

    def _generate_token(self, user_id: str):
        return jwt.encode({'sub': user_id}, Config.SECRET_KEY, algorithm='HS256')

    def login(self, email: str, password: str):
        user = self.user_repo.find_by_email(email)
        if not user or user['passwordHash'] != hashlib.sha256(password.encode()).hexdigest():
            raise ValueError('Invalid credentials')
        token = self._generate_token(user['id'])
        return {
            'token': token,
            'user': {k: v for k, v in user.items() if k != 'passwordHash'}
        }

    def register(self, data: dict):
        if self.user_repo.find_by_email(data['email']):
            raise ValueError('User already exists')
        user_id = str(uuid.uuid4())
        user = {
            'id': user_id,
            'email': data['email'],
            'username': data['username'],
            'displayName': data['displayName'],
            'passwordHash': hashlib.sha256(data['password'].encode()).hexdigest(),
            'isStreamer': False,
            'isVerified': False,
            'walletBalance': 100,
            'createdAt': datetime.now().isoformat(),
        }
        self.user_repo.create(user)
        token = self._generate_token(user_id)
        return {
            'token': token,
            'user': {k: v for k, v in user.items() if k != 'passwordHash'}
        }
