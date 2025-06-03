from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Transaction:
    id: str
    sender_id: str
    receiver_id: str
    stream_id: Optional[str]
    gift_id: str
    amount: int
    total_value: int
    created_at: datetime
