GIFTS = [
    {"id": "1", "name": "Heart", "emoji": "❤️", "costCoins": 10, "rarity": "COMMON"},
    {"id": "2", "name": "Rose", "emoji": "🌹", "costCoins": 25, "rarity": "UNCOMMON"},
    {"id": "3", "name": "Diamond", "emoji": "💎", "costCoins": 100, "rarity": "RARE"},
    {"id": "4", "name": "Crown", "emoji": "👑", "costCoins": 500, "rarity": "LEGENDARY"},
]

class GiftRepository:
    def __init__(self):
        self.gifts = GIFTS

    def get_all(self):
        return self.gifts

    def find_by_id(self, gift_id: str):
        for gift in self.gifts:
            if gift["id"] == gift_id:
                return gift
        return None
