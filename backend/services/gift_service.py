from database.repositories.gift_repository import GiftRepository
from database.repositories.user_repository import UserRepository
from database.repositories.transaction_repository import TransactionRepository
import uuid
from datetime import datetime

class GiftService:
    def __init__(self):
        self.gift_repo = GiftRepository()
        self.user_repo = UserRepository()
        self.transaction_repo = TransactionRepository()

    def get_available_gifts(self):
        return self.gift_repo.get_all()

    def send_gift(self, sender_id: str, recipient_id: str, gift_id: str, amount: int = 1):
        gift = self.gift_repo.find_by_id(gift_id)
        if not gift:
            raise ValueError('Gift not found')

        sender = self.user_repo.find_by_id(sender_id)
        recipient = self.user_repo.find_by_id(recipient_id)

        if not sender or not recipient:
            raise ValueError('User not found')

        total_cost = gift['costCoins'] * amount

        if sender['walletBalance'] < total_cost:
            raise ValueError('Insufficient balance')

        # Update balances
        sender['walletBalance'] -= total_cost
        recipient['walletBalance'] += int(total_cost * 0.7)  # 70% goes to recipient

        self.user_repo.update_by_id(sender_id, sender)
        self.user_repo.update_by_id(recipient_id, recipient)

        # Create transaction record
        transaction = {
            'id': str(uuid.uuid4()),
            'sender_id': sender_id,
            'receiver_id': recipient_id,
            'gift_id': gift_id,
            'amount': amount,
            'total_value': total_cost,
            'created_at': datetime.now().isoformat()
        }

        self.transaction_repo.create(transaction)

        return {
            'gift': gift,
            'amount': amount,
            'recipient': {k: v for k, v in recipient.items() if k != 'passwordHash'},
            'newBalance': sender['walletBalance']
        }
