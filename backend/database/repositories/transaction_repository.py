from datetime import datetime

TRANSACTIONS = []

class TransactionRepository:
    def __init__(self):
        self.transactions = TRANSACTIONS

    def create(self, transaction: dict):
        self.transactions.append(transaction)
        return transaction

    def find_by_user_id(self, user_id: str, page: int = 1, limit: int = 20):
        filtered = [t for t in self.transactions if t.get('sender_id') == user_id or t.get('receiver_id') == user_id or t.get('user_id') == user_id]
        start = (page - 1) * limit
        end = start + limit
        return filtered[start:end]
