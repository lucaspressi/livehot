from flask import Blueprint, request, jsonify
from services.stream_service import StreamService
from utils.decorators import token_required
import uuid

streams_bp = Blueprint('streams', __name__)
stream_service = StreamService()

@streams_bp.route('/', methods=['GET'])
def get_streams():
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    
    result = stream_service.get_active_streams(page, limit)
    return jsonify({'success': True, 'data': result})

@streams_bp.route('/', methods=['POST'])
@token_required
def create_stream():
    from flask import g
    data = request.get_json()
    
    if not g.current_user.get('isStreamer'):
        return jsonify({'success': False, 'error': {'message': 'Only streamers can create streams'}}), 403
    
    stream_data = {
        'title': data.get('title', 'Untitled Stream'),
        'description': data.get('description', ''),
        'category': data.get('category', 'Entertainment'),
        'isPrivate': data.get('isPrivate', False)
    }
    
    result = stream_service.create_stream(g.current_user['id'], stream_data)
    return jsonify({'success': True, 'data': result}), 201

@streams_bp.route('/<stream_id>', methods=['GET'])
def get_stream(stream_id):
    result = stream_service.get_stream_by_id(stream_id)
    if not result:
        return jsonify({'success': False, 'error': {'message': 'Stream not found'}}), 404
    
    return jsonify({'success': True, 'data': result})

@streams_bp.route('/<stream_id>/start', methods=['POST'])
@token_required
def start_stream(stream_id):
    from flask import g
    try:
        result = stream_service.start_stream(stream_id, g.current_user['id'])
        return jsonify({'success': True, 'data': result})
    except ValueError as e:
        return jsonify({'success': False, 'error': {'message': str(e)}}), 403
    except Exception as e:
        return jsonify({'success': False, 'error': {'message': 'Stream not found'}}), 404

@streams_bp.route('/<stream_id>/stop', methods=['POST'])
@token_required
def stop_stream(stream_id):
    from flask import g
    try:
        result = stream_service.stop_stream(stream_id, g.current_user['id'])
        return jsonify({'success': True, 'data': result})
    except ValueError as e:
        return jsonify({'success': False, 'error': {'message': str(e)}}), 403
    except Exception as e:
        return jsonify({'success': False, 'error': {'message': 'Stream not found'}}), 404
