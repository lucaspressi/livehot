from flask import Blueprint, request, jsonify
from services.wallet_service import WalletService
from utils.decorators import token_required

wallet_bp = Blueprint('wallet', __name__)
wallet_service = WalletService()

@wallet_bp.route('/', methods=['GET'])
@token_required
def get_wallet():
    from flask import g
    result = wallet_service.get_wallet_info(g.current_user['id'])
    return jsonify({'success': True, 'data': result})

@wallet_bp.route('/purchase', methods=['POST'])
@token_required
def purchase_coins():
    from flask import g
    data = request.get_json()
    package = data.get('package', 'basic')
    
    try:
        result = wallet_service.purchase_coins(g.current_user['id'], package)
        return jsonify({'success': True, 'data': result})
    except ValueError as e:
        return jsonify({'success': False, 'error': {'message': str(e)}}), 400

@wallet_bp.route('/transactions', methods=['GET'])
@token_required
def get_transactions():
    from flask import g
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    
    result = wallet_service.get_transactions(g.current_user['id'], page, limit)
    return jsonify({'success': True, 'data': result})
