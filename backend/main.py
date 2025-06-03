from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import uuid
from datetime import datetime, timedelta
import hashlib
import base64
import hmac
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = 'livehot-secret-key-change-in-production'

# Enable CORS for all routes with specific configuration
CORS(app, 
     origins=['*'],
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     supports_credentials=True)

# Simple JWT implementation
def create_token(payload, secret, expiry_hours=168):
    header = {"alg": "HS256", "typ": "JWT"}
    payload['exp'] = int((datetime.utcnow() + timedelta(hours=expiry_hours)).timestamp())
    
    header_encoded = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
    payload_encoded = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
    
    message = f"{header_encoded}.{payload_encoded}"
    signature = base64.urlsafe_b64encode(
        hmac.new(secret.encode(), message.encode(), hashlib.sha256).digest()
    ).decode().rstrip('=')
    
    return f"{message}.{signature}"

def verify_token(token, secret):
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
            
        header_encoded, payload_encoded, signature = parts
        
        message = f"{header_encoded}.{payload_encoded}"
        expected_signature = base64.urlsafe_b64encode(
            hmac.new(secret.encode(), message.encode(), hashlib.sha256).digest()
        ).decode().rstrip('=')
        
        if signature != expected_signature:
            return None
        
        payload_padded = payload_encoded + '=' * (4 - len(payload_encoded) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_padded))
        
        if payload.get('exp', 0) < int(datetime.utcnow().timestamp()):
            return None
            
        return payload
    except:
        return None

# In-memory storage
users = {}
streams = {}
gifts = [
    {"id": "1", "name": "Heart", "emoji": "❤️", "costCoins": 10, "rarity": "COMMON"},
    {"id": "2", "name": "Rose", "emoji": "🌹", "costCoins": 25, "rarity": "UNCOMMON"},
    {"id": "3", "name": "Diamond", "emoji": "💎", "costCoins": 100, "rarity": "RARE"},
    {"id": "4", "name": "Crown", "emoji": "👑", "costCoins": 500, "rarity": "LEGENDARY"}
]

# Demo users
demo_users = {
    "demo@livehot.app": {
        "id": "demo-user-1",
        "email": "demo@livehot.app",
        "username": "demo_streamer",
        "displayName": "Demo Streamer",
        "passwordHash": hashlib.sha256("password123".encode()).hexdigest(),
        "isStreamer": True,
        "isVerified": True,
        "walletBalance": 1000,
        "avatarUrl": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        "createdAt": datetime.now().isoformat()
    },
    "viewer@livehot.app": {
        "id": "demo-user-2", 
        "email": "viewer@livehot.app",
        "username": "demo_viewer",
        "displayName": "Demo Viewer",
        "passwordHash": hashlib.sha256("password123".encode()).hexdigest(),
        "isStreamer": False,
        "isVerified": False,
        "walletBalance": 500,
        "avatarUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        "createdAt": datetime.now().isoformat()
    }
}

users.update(demo_users)

# Demo streams
demo_streams = [
    {
        "id": "stream-1",
        "title": "🔥 Hot Live Show - Come Chat!",
        "description": "Interactive live streaming with chat and gifts",
        "category": "Entertainment",
        "isLive": True,
        "isPrivate": False,
        "viewerCount": 127,
        "streamerId": "demo-user-1",
        "streamer": demo_users["demo@livehot.app"],
        "startedAt": datetime.now().isoformat(),
        "thumbnailUrl": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop"
    }
]

streams.update({s["id"]: s for s in demo_streams})

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'success': False, 'error': {'message': 'Token is missing'}}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = verify_token(token, app.config['SECRET_KEY'])
            if not data:
                return jsonify({'success': False, 'error': {'message': 'Token is invalid'}}), 401
            current_user = users.get(data['email'])
            if not current_user:
                return jsonify({'success': False, 'error': {'message': 'User not found'}}), 401
        except:
            return jsonify({'success': False, 'error': {'message': 'Token is invalid'}}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

# Auth routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'error': {'message': 'Email and password required'}}), 400
    
    user = users.get(email)
    if not user or user['passwordHash'] != hashlib.sha256(password.encode()).hexdigest():
        return jsonify({'success': False, 'error': {'message': 'Invalid credentials'}}), 401
    
    token = create_token({'email': email}, app.config['SECRET_KEY'])
    
    return jsonify({
        'success': True,
        'data': {
            'token': token,
            'user': {k: v for k, v in user.items() if k != 'passwordHash'}
        }
    })

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    username = data.get('username')
    displayName = data.get('displayName')
    
    if not all([email, password, username, displayName]):
        return jsonify({'success': False, 'error': {'message': 'All fields required'}}), 400
    
    if email in users:
        return jsonify({'success': False, 'error': {'message': 'User already exists'}}), 400
    
    user_id = str(uuid.uuid4())
    users[email] = {
        'id': user_id,
        'email': email,
        'username': username,
        'displayName': displayName,
        'passwordHash': hashlib.sha256(password.encode()).hexdigest(),
        'isStreamer': False,
        'isVerified': False,
        'walletBalance': 100,
        'avatarUrl': f"https://ui-avatars.com/api/?name={displayName}&background=random",
        'createdAt': datetime.now().isoformat()
    }
    
    token = create_token({'email': email}, app.config['SECRET_KEY'])
    
    return jsonify({
        'success': True,
        'data': {
            'token': token,
            'user': {k: v for k, v in users[email].items() if k != 'passwordHash'}
        }
    }), 201

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({
        'success': True,
        'data': {k: v for k, v in current_user.items() if k != 'passwordHash'}
    })

# Streams routes
@app.route('/api/streams', methods=['GET'])
def get_streams():
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    
    live_streams = [s for s in streams.values() if s['isLive']]
    total = len(live_streams)
    
    start = (page - 1) * limit
    end = start + limit
    paginated_streams = live_streams[start:end]
    
    return jsonify({
        'success': True,
        'data': {
            'streams': paginated_streams,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'totalPages': (total + limit - 1) // limit
            }
        }
    })

@app.route('/api/streams/<stream_id>', methods=['GET'])
def get_stream(stream_id):
    stream = streams.get(stream_id)
    if not stream:
        return jsonify({'success': False, 'error': {'message': 'Stream not found'}}), 404
    
    return jsonify({
        'success': True,
        'data': stream
    })

@app.route('/api/streams', methods=['POST'])
@token_required
def create_stream(current_user):
    if not current_user['isStreamer']:
        return jsonify({'success': False, 'error': {'message': 'Only streamers can create streams'}}), 403
    
    data = request.get_json()
    stream_id = str(uuid.uuid4())
    
    stream = {
        'id': stream_id,
        'title': data.get('title', 'Untitled Stream'),
        'description': data.get('description', ''),
        'category': data.get('category', 'Entertainment'),
        'isLive': False,
        'isPrivate': data.get('isPrivate', False),
        'viewerCount': 0,
        'streamerId': current_user['id'],
        'streamer': {k: v for k, v in current_user.items() if k != 'passwordHash'},
        'startedAt': datetime.now().isoformat(),
        'livekitRoomName': f"room_{stream_id}",
        'livekitToken': f"demo_token_{stream_id}"
    }
    
    streams[stream_id] = stream
    
    return jsonify({
        'success': True,
        'data': stream
    }), 201

@app.route('/api/streams/<stream_id>/start', methods=['POST'])
@token_required
def start_stream(current_user, stream_id):
    stream = streams.get(stream_id)
    if not stream:
        return jsonify({'success': False, 'error': {'message': 'Stream not found'}}), 404
    
    if stream['streamerId'] != current_user['id']:
        return jsonify({'success': False, 'error': {'message': 'Unauthorized'}}), 403
    
    stream['isLive'] = True
    stream['startedAt'] = datetime.now().isoformat()
    
    return jsonify({
        'success': True,
        'data': stream
    })

@app.route('/api/streams/<stream_id>/stop', methods=['POST'])
@token_required
def stop_stream(current_user, stream_id):
    stream = streams.get(stream_id)
    if not stream:
        return jsonify({'success': False, 'error': {'message': 'Stream not found'}}), 404
    
    if stream['streamerId'] != current_user['id']:
        return jsonify({'success': False, 'error': {'message': 'Unauthorized'}}), 403
    
    stream['isLive'] = False
    stream['endedAt'] = datetime.now().isoformat()
    
    return jsonify({
        'success': True,
        'data': stream
    })

@app.route('/api/streams/<stream_id>/update', methods=['PUT'])
@token_required
def update_stream(current_user, stream_id):
    stream = streams.get(stream_id)
    if not stream:
        return jsonify({'success': False, 'error': {'message': 'Stream not found'}}), 404
    
    if stream['streamerId'] != current_user['id']:
        return jsonify({'success': False, 'error': {'message': 'Unauthorized'}}), 403
    
    data = request.get_json()
    
    if 'title' in data:
        stream['title'] = data['title']
    if 'description' in data:
        stream['description'] = data['description']
    if 'category' in data:
        stream['category'] = data['category']
    if 'isPrivate' in data:
        stream['isPrivate'] = data['isPrivate']
    
    return jsonify({
        'success': True,
        'data': stream
    })

# Gifts routes
@app.route('/api/gifts', methods=['GET'])
def get_gifts():
    return jsonify({
        'success': True,
        'data': {'gifts': gifts}
    })

@app.route('/api/gifts/send', methods=['POST'])
@token_required
def send_gift(current_user):
    data = request.get_json()
    gift_id = data.get('giftId')
    recipient_id = data.get('recipientId')
    
    gift = next((g for g in gifts if g['id'] == gift_id), None)
    if not gift:
        return jsonify({'success': False, 'error': {'message': 'Gift not found'}}), 404
    
    if current_user['walletBalance'] < gift['costCoins']:
        return jsonify({'success': False, 'error': {'message': 'Insufficient balance'}}), 400
    
    recipient = next((u for u in users.values() if u['id'] == recipient_id), None)
    if not recipient:
        return jsonify({'success': False, 'error': {'message': 'Recipient not found'}}), 404
    
    current_user['walletBalance'] -= gift['costCoins']
    recipient['walletBalance'] += int(gift['costCoins'] * 0.7)
    
    return jsonify({
        'success': True,
        'data': {
            'gift': gift,
            'recipient': {k: v for k, v in recipient.items() if k != 'passwordHash'},
            'newBalance': current_user['walletBalance']
        }
    })

# Wallet routes
@app.route('/api/wallet', methods=['GET'])
@token_required
def get_wallet(current_user):
    return jsonify({
        'success': True,
        'data': {
            'balance': current_user['walletBalance'],
            'transactions': []
        }
    })

@app.route('/api/wallet/purchase', methods=['POST'])
@token_required
def purchase_coins(current_user):
    data = request.get_json()
    package = data.get('package', 'basic')
    
    packages = {
        'basic': {'coins': 100, 'price': 9.99},
        'premium': {'coins': 500, 'price': 39.99},
        'vip': {'coins': 1000, 'price': 69.99}
    }
    
    if package not in packages:
        return jsonify({'success': False, 'error': {'message': 'Invalid package'}}), 400
    
    coins = packages[package]['coins']
    current_user['walletBalance'] += coins
    
    return jsonify({
        'success': True,
        'data': {
            'coins': coins,
            'newBalance': current_user['walletBalance'],
            'transactionId': str(uuid.uuid4())
        }
    })

# Users routes
@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    user = next((u for u in users.values() if u['id'] == user_id), None)
    if not user:
        return jsonify({'success': False, 'error': {'message': 'User not found'}}), 404
    
    return jsonify({
        'success': True,
        'data': {k: v for k, v in user.items() if k != 'passwordHash'}
    })

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'users': len(users),
        'streams': len([s for s in streams.values() if s['isLive']])
    })

# Root endpoint
@app.route('/')
def index():
    return jsonify({
        'message': 'LiveHot.app Backend API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth/*',
            'streams': '/api/streams',
            'gifts': '/api/gifts',
            'wallet': '/api/wallet',
            'users': '/api/users/*',
            'health': '/api/health'
        },
        'demo_credentials': {
            'streamer': {'email': 'demo@livehot.app', 'password': 'password123'},
            'viewer': {'email': 'viewer@livehot.app', 'password': 'password123'}
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

