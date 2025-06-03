from flask import Blueprint, request, jsonify
from services.gift_service import GiftService
from utils.decorators import token_required

gifts_bp = Blueprint('gifts', __name__)
gift_service = GiftService()

@gifts_bp.route('/', methods=['GET'])
def get_gifts():
    result = gift_service.get_available_gifts()
    return jsonify({'success': True, 'data': {'gifts': result}})

@gifts_bp.route('/send', methods=['POST'])
@token_required
def send_gift():
    from flask import g
    data = request.get_json()
    gift_id = data.get('giftId')
    recipient_id = data.get('recipientId')
    amount = data.get('amount', 1)
    
    if not gift_id or not recipient_id:
        return jsonify({'success': False, 'error': {'message': 'Gift ID and recipient ID required'}}), 400
    
    try:
        result = gift_service.send_gift(g.current_user['id'], recipient_id, gift_id, amount)
        return jsonify({'success': True, 'data': result})
    except ValueError as e:
        return jsonify({'success': False, 'error': {'message': str(e)}}), 400
