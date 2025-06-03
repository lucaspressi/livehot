from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class Stream:
    id: str
    title: str
    description: str
    category: str
    streamer_id: str
    is_live: bool = False
    is_private: bool = False
    viewer_count: int = 0
    thumbnail_url: Optional[str] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    livekit_room_name: Optional[str] = None
    livekit_token: Optional[str] = None
