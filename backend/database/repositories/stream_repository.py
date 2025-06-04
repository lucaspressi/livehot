from datetime import datetime

STREAMS = {}

class StreamRepository:
    def __init__(self):
        self.streams = STREAMS
        if not self.streams:
            self._init_demo()

    def _init_demo(self):
        self.streams["stream-1"] = {
            "id": "stream-1",
            "title": "🔥 Hot Live Show - Come Chat!",
            "description": "Interactive live streaming with chat and gifts",
            "category": "Entertainment",
            "isLive": True,
            "isPrivate": False,
            "viewerCount": 127,
            "giftCount": 0,
            "streamerId": "demo-user-1",
            "startedAt": datetime.now().isoformat(),
            "thumbnailUrl": None,
            "livekitRoomName": "room_stream-1",
        }

    def find_active_streams(self, page: int, limit: int):
        active = [s for s in self.streams.values() if s.get("isLive")]
        start = (page - 1) * limit
        end = start + limit
        return active[start:end]

    def count_active_streams(self):
        return len([s for s in self.streams.values() if s.get("isLive")])

    def create(self, stream: dict):
        self.streams[stream["id"]] = stream
        return stream

    def find_by_id(self, stream_id: str):
        return self.streams.get(stream_id)

    def update(self, stream_id: str, data: dict):
        self.streams[stream_id] = data
        return data
