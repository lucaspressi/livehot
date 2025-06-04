import hashlib
from datetime import datetime
import uuid

USERS = {}

class UserRepository:
    def __init__(self):
        self.users = USERS
        if not self.users:
            self._init_demo()

    def _init_demo(self):
        demo_streamer = {
            "id": "demo-user-1",
            "email": "demo@livehot.app",
            "username": "demo_streamer",
            "displayName": "Demo Streamer",
            "passwordHash": hashlib.sha256("password123".encode()).hexdigest(),
            "isStreamer": True,
            "isVerified": True,
            "walletBalance": 1000,
            "createdAt": datetime.now().isoformat(),
        }
        demo_viewer = {
            "id": "demo-user-2",
            "email": "viewer@livehot.app",
            "username": "demo_viewer",
            "displayName": "Demo Viewer",
            "passwordHash": hashlib.sha256("password123".encode()).hexdigest(),
            "isStreamer": False,
            "isVerified": False,
            "walletBalance": 500,
            "createdAt": datetime.now().isoformat(),
        }
        self.users[demo_streamer["id"]] = demo_streamer
        self.users[demo_viewer["id"]] = demo_viewer

    def find_by_id(self, user_id: str):
        return self.users.get(user_id)

    def find_by_email(self, email: str):
        for user in self.users.values():
            if user.get("email") == email:
                return user
        return None

    def create(self, user: dict):
        self.users[user["id"]] = user
        return user

    def update_by_id(self, user_id: str, data: dict):
        self.users[user_id] = data
        return data

    def get_all(self):
        return list(self.users.values())
