from flask import Flask, request, jsonify, render_template, abort, url_for, make_response
from flask_cors import CORS
from .routes.user import user_bp
import os
from dotenv import load_dotenv
import json
import uuid
from io import BytesIO
from datetime import datetime, timedelta
import hashlib
import base64
import hmac
from functools import wraps
import jwt
from PIL import Image

load_dotenv()

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'livehot-secret-key-change-in-production')

# LiveKit configuration for scalable streaming
LIVEKIT_URL = os.environ.get('LIVEKIT_URL', 'wss://livekit.example.com')
LIVEKIT_API_KEY = os.environ.get('LIVEKIT_API_KEY', 'devkey')
LIVEKIT_API_SECRET = os.environ.get('LIVEKIT_API_SECRET', 'devsecret')

# Enable CORS for all routes with specific configuration
CORS(app,
     origins=['*'],
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     supports_credentials=True)

# Register user routes
app.register_blueprint(user_bp, url_prefix='/api')

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

# Generate LiveKit token for publishing or viewing
def generate_livekit_token(room, identity, name, can_publish=False, ttl_seconds=3600):
    now = datetime.utcnow()
    payload = {
        'iss': LIVEKIT_API_KEY,
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
    return jwt.encode(payload, LIVEKIT_API_SECRET, algorithm='HS256')

# In-memory storage
users = {}
streams = {}
analytics = {
    'view_time': {},       # total seconds watched per stream
    'watch_sessions': {},  # (user_id, stream_id) -> start_time
    'visitor_count': 0,
    'registrations': 0,
    'logins': {},          # user_id -> [timestamps]
    'gifts_sent': 0,
    'revenue': 0.0
}
gifts = [
    {"id": "1", "name": "Heart", "emoji": "❤️", "costCoins": 10, "rarity": "COMMON"},
    {"id": "2", "name": "Rose", "emoji": "🌹", "costCoins": 25, "rarity": "UNCOMMON"},
    {"id": "3", "name": "Diamond", "emoji": "💎", "costCoins": 100, "rarity": "RARE"},
    {"id": "4", "name": "Crown", "emoji": "👑", "costCoins": 500, "rarity": "LEGENDARY"}
]

# Demo users with theme support
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
        "createdAt": datetime.now().isoformat(),
        "preferredCategories": [],
        "theme": "dark",
        "accentColor": "#ec4899",
        "specialTheme": ""
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
        "createdAt": datetime.now().isoformat(),
        "preferredCategories": [],
        "theme": "dark",
        "accentColor": "#ec4899",
        "specialTheme": ""
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
        "giftCount": 0,
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

    analytics['logins'].setdefault(user['id'], []).append(datetime.now())

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
        'createdAt': datetime.now().isoformat(),
        'preferredCategories': [],
        'theme': 'dark',
        'accentColor': '#ec4899',
        'specialTheme': ''
    }

    analytics['registrations'] += 1
    analytics['logins'].setdefault(user_id, []).append(datetime.now())

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
    if not request.headers.get('Authorization'):
        analytics['visitor_count'] += 1

    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    category = request.args.get('category')

    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        data = verify_token(token[7:], app.config['SECRET_KEY'])
        if data:
            current_user = users.get(data['email'])
            if current_user is not None and category:
                prefs = current_user.setdefault('preferredCategories', [])
                if category not in prefs:
                    prefs.append(category)

    live_streams = [s for s in streams.values() if s['isLive']]
    if category:
        live_streams = [s for s in live_streams if s['category'].lower() == category.lower()]
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
        'giftCount': 0,
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

# Broadcast route - generates LiveKit token and returns connection info
@app.route('/api/broadcast/<stream_id>', methods=['POST'])
@token_required
def broadcast_stream(current_user, stream_id):
    stream = streams.get(stream_id)
    if not stream:
        return jsonify({'success': False, 'error': {'message': 'Stream not found'}}), 404

    is_owner = stream['streamerId'] == current_user['id']
    if is_owner and not stream['isLive']:
        stream['isLive'] = True
        stream['startedAt'] = datetime.now().isoformat()

    token = generate_livekit_token(
        stream['livekitRoomName'],
        identity=current_user['id'],
        name=current_user['displayName'],
        can_publish=is_owner
    )

    return jsonify({
        'success': True,
        'data': {
            'url': LIVEKIT_URL,
            'room': stream['livekitRoomName'],
            'token': token,
            'stream': stream
        }
    })

@app.route('/api/streams/<stream_id>/watch', methods=['POST'])
@token_required
def watch_stream(current_user, stream_id):
    action = request.get_json().get('action', 'start')
    session_key = (current_user['id'], stream_id)
    if action == 'start':
        analytics['watch_sessions'][session_key] = datetime.now()
        return jsonify({'success': True})
    elif action == 'stop':
        start = analytics['watch_sessions'].pop(session_key, None)
        duration = 0
        if start:
            duration = (datetime.now() - start).total_seconds()
            analytics['view_time'][stream_id] = analytics['view_time'].get(stream_id, 0) + duration
        return jsonify({'success': True, 'duration': duration})
    else:
        return jsonify({'success': False, 'error': {'message': 'Invalid action'}}), 400

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

# Ranking and trending endpoints
@app.route('/api/streams/ranking', methods=['GET'])
def streams_ranking():
    limit = int(request.args.get('limit', 10))
    live_streams = [s for s in streams.values() if s['isLive']]
    ranked = sorted(live_streams, key=lambda s: s.get('viewerCount', 0), reverse=True)[:limit]
    return jsonify({'success': True, 'data': {'streams': ranked}})

@app.route('/api/streams/trending', methods=['GET'])
def streams_trending():
    limit = int(request.args.get('limit', 10))
    live_streams = [s for s in streams.values() if s['isLive']]
    for s in live_streams:
        s['engagementScore'] = s.get('viewerCount', 0) + s.get('giftCount', 0) * 5
    trending = sorted(live_streams, key=lambda s: s.get('engagementScore', 0), reverse=True)[:limit]
    return jsonify({'success': True, 'data': {'streams': trending}})

@app.route('/api/streams/categories', methods=['GET'])
def stream_categories():
    categories = {}
    for s in streams.values():
        if s['isLive']:
            categories[s['category']] = categories.get(s['category'], 0) + 1
    category_list = [{'name': k, 'count': v} for k, v in categories.items()]
    return jsonify({'success': True, 'data': {'categories': category_list}})

@app.route('/api/streams/recommendations', methods=['GET'])
@token_required
def stream_recommendations(current_user):
    limit = int(request.args.get('limit', 5))
    live_streams = [s for s in streams.values() if s['isLive']]
    for s in live_streams:
        s['engagementScore'] = s.get('viewerCount', 0) + s.get('giftCount', 0) * 5
    preferred = current_user.get('preferredCategories') or []
    if preferred:
        live_streams = [s for s in live_streams if s['category'] in preferred]
    recommended = sorted(live_streams, key=lambda s: s.get('engagementScore', 0), reverse=True)[:limit]
    return jsonify({'success': True, 'data': {'streams': recommended}})

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

    # Deduct coins from sender
    current_user['walletBalance'] -= gift['costCoins']
    # Give 70% to recipient (streamer)
    recipient['walletBalance'] += int(gift['costCoins'] * 0.7)
    
    # Update stream gift count if recipient is currently streaming
    stream = next((s for s in streams.values() if s['streamerId'] == recipient_id and s['isLive']), None)
    if stream:
        stream['giftCount'] = stream.get('giftCount', 0) + 1
    
    # Update analytics
    analytics['gifts_sent'] += 1
    analytics['revenue'] += gift['costCoins']

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
    analytics['revenue'] += packages[package]['price']
    
    return jsonify({
        'success': True,
        'data': {
            'coins': coins,
            'newBalance': current_user['walletBalance'],
            'transactionId': str(uuid.uuid4())
        }
    })

# Image upload with automatic compression for mobile optimization
@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'success': False, 'error': {'message': 'Image missing'}}), 400

    file = request.files['image']
    try:
        img = Image.open(file.stream)
    except Exception:
        return jsonify({'success': False, 'error': {'message': 'Invalid image'}}), 400

    # Compress image for mobile optimization
    img_io = BytesIO()
    img.convert('RGB').save(img_io, 'JPEG', quality=70, optimize=True)
    img_io.seek(0)

    # Save to uploads directory
    uploads_dir = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    filename = f"{uuid.uuid4()}.jpg"
    filepath = os.path.join(uploads_dir, filename)
    with open(filepath, 'wb') as f:
        f.write(img_io.read())

    return jsonify({'success': True, 'data': {'url': f'/static/uploads/{filename}'}})

# User preferences and theme routes
@app.route('/api/users/preferences', methods=['PUT'])
@token_required
def update_preferences(current_user):
    data = request.get_json()
    categories = data.get('categories', [])
    if not isinstance(categories, list):
        return jsonify({'success': False, 'error': {'message': 'Categories must be a list'}}), 400
    current_user['preferredCategories'] = categories
    return jsonify({'success': True, 'data': {'preferredCategories': categories}})

@app.route('/api/users/<user_id>', methods=['PUT'])
@token_required
def update_user(current_user, user_id):
    if current_user['id'] != user_id:
        return jsonify({'success': False, 'error': {'message': 'Unauthorized'}}), 403
    
    data = request.get_json()
    
    # Update allowed fields
    updatable_fields = ['displayName', 'avatarUrl', 'theme', 'accentColor', 'specialTheme']
    for field in updatable_fields:
        if field in data:
            current_user[field] = data[field]
    
    return jsonify({
        'success': True,
        'data': {k: v for k, v in current_user.items() if k != 'passwordHash'}
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

# Analytics endpoint
@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    total_users = analytics['registrations'] + len(demo_users)
    returning = len([u for u, logs in analytics['logins'].items() if len(logs) > 1])
    retention = returning / total_users if total_users else 0
    conversion = analytics['registrations'] / analytics['visitor_count'] if analytics['visitor_count'] else 0
    return jsonify({
        'success': True,
        'data': {
            'view_time': analytics['view_time'],
            'retention_rate': retention,
            'conversion_rate': conversion,
            'gifts_sent': analytics['gifts_sent'],
            'revenue': analytics['revenue']
        }
    })

# SEO and sharing routes
@app.route('/streams/<stream_id>')
def share_stream(stream_id):
    """Public sharing page for streams with SEO meta tags"""
    stream = streams.get(stream_id)
    if not stream:
        abort(404)

    url = request.url
    return render_template('share.html', stream=stream, url=url)

@app.route('/sitemap.xml')
def sitemap():
    """Generate sitemap for SEO optimization"""
    pages = [url_for('index', _external=True)]
    
    # Add all public stream pages to sitemap
    for stream in streams.values():
        if not stream.get('isPrivate', False):  # Only include public streams
            pages.append(url_for('share_stream', stream_id=stream['id'], _external=True))

    xml_items = '\n'.join(f'<url><loc>{p}</loc></url>' for p in pages)
    xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{xml_items}
</urlset>'''

    response = make_response(xml)
    response.headers['Content-Type'] = 'application/xml'
    return response

# Root endpoint
@app.route('/')
def index():
    analytics['visitor_count'] += 1
    return jsonify({
        'message': 'LiveHot.app Backend API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth/*',
            'streams': '/api/streams',
            'gifts': '/api/gifts',
            'wallet': '/api/wallet',
            'users': '/api/users/*',
            'health': '/api/health',
            'analytics': '/api/analytics',
            'sitemap': '/sitemap.xml'
        },
        'demo_credentials': {
            'streamer': {'email': 'demo@livehot.app', 'password': 'password123'},
            'viewer': {'email': 'viewer@livehot.app', 'password': 'password123'}
        }
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))

