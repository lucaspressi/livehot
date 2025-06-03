from flask import Blueprint, request, jsonify
from services.auth_service import AuthService
from utils.decorators import token_required
import hashlib

auth_bp = Blueprint('auth', __name__)
auth_service = AuthService()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'error': {'message': 'Email and password required'}}), 400
    
    try:
        result = auth_service.login(email, password)
        return jsonify({'success': True, 'data': result})
    except ValueError as e:
        return jsonify({'success': False, 'error': {'message': str(e)}}), 401

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    username = data.get('username')
    display_name = data.get('displayName')
    
    if not all([email, password, username, display_name]):
        return jsonify({'success': False, 'error': {'message': 'All fields required'}}), 400
    
    try:
        result = auth_service.register({
            'email': email,
            'password': password,
            'username': username,
            'displayName': display_name
        })
        return jsonify({'success': True, 'data': result}), 201
    except ValueError as e:
        return jsonify({'success': False, 'error': {'message': str(e)}}), 400

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    from flask import g
    return jsonify({'success': True, 'data': g.current_user})

