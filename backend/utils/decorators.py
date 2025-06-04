from functools import wraps
from flask import request, jsonify, g
import jwt
from config.settings import Config
from database.repositories.user_repository import UserRepository

user_repo = UserRepository()

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'success': False, 'error': {'message': 'Token is missing'}}), 401
        if token.startswith('Bearer '):
            token = token[7:]
        try:
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
            user = user_repo.find_by_id(data.get('sub'))
            if not user:
                raise Exception('User not found')
        except Exception:
            return jsonify({'success': False, 'error': {'message': 'Token is invalid'}}), 401
        g.current_user = user
        return f(*args, **kwargs)
    return decorated
