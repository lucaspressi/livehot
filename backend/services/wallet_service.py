from database.repositories.user_repository import UserRepository
from database.repositories.transaction_repository import TransactionRepository
import uuid
from datetime import datetime

class WalletService:
    def __init__(self):
        self.user_repo = UserRepository()
        self.transaction_repo = TransactionRepository()

    def get_wallet_info(self, user_id: str):
        user = self.user_repo.find_by_id(user_id)
        if not user:
            raise ValueError('User not found')

        transactions = self.transaction_repo.find_by_user_id(user_id, limit=10)

        return {
            'balance': user['walletBalance'],
            'transactions': transactions
        }

    def purchase_coins(self, user_id: str, package: str):
        packages = {
            'basic': {'coins': 100, 'price': 9.99},
            'premium': {'coins': 500, 'price': 39.99},
            'vip': {'coins': 1000, 'price': 69.99}
        }

        if package not in packages:
            raise ValueError('Invalid package')

        user = self.user_repo.find_by_id(user_id)
        if not user:
            raise ValueError('User not found')

        coins = packages[package]['coins']
        user['walletBalance'] += coins

        self.user_repo.update_by_id(user_id, user)

        transaction = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'type': 'purchase',
            'amount': coins,
            'package': package,
            'price': packages[package]['price'],
            'created_at': datetime.now().isoformat()
        }

        self.transaction_repo.create(transaction)

        return {
            'coins': coins,
            'newBalance': user['walletBalance'],
            'transactionId': transaction['id']
        }

    def get_transactions(self, user_id: str, page: int = 1, limit: int = 20):
        return self.transaction_repo.find_by_user_id(user_id, page, limit)
