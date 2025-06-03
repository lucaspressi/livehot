from flask import Blueprint, request, jsonify

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    # TODO: Mover código de login do main.py
    pass

@auth_bp.route('/register', methods=['POST'])
def register():
    # TODO: Mover código de register do main.py
    pass

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    # TODO: Mover código do main.py
    pass
