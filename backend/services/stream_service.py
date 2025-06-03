from datetime import datetime
from database.repositories.stream_repository import StreamRepository
from database.repositories.user_repository import UserRepository
from services.livekit_service import LiveKitService
from config.settings import Config
import uuid


class StreamService:
    def __init__(self):
        self.stream_repo = StreamRepository()
        self.user_repo = UserRepository()
        self.livekit = LiveKitService(
            Config.LIVEKIT_API_KEY,
            Config.LIVEKIT_API_SECRET,
            Config.LIVEKIT_URL
        )

    def get_active_streams(self, page: int = 1, limit: int = 20):
        streams = self.stream_repo.find_active_streams(page, limit)
        total = self.stream_repo.count_active_streams()

        return {
            'streams': streams,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'totalPages': (total + limit - 1) // limit
            }
        }

    def create_stream(self, user_id: str, stream_data: dict):
        user = self.user_repo.find_by_id(user_id)
        if not user or not user.get('isStreamer'):
            raise ValueError('Only streamers can create streams')

        stream_id = str(uuid.uuid4())
        room_name = f"room_{stream_id}"

        stream = {
            'id': stream_id,
            'title': stream_data['title'],
            'description': stream_data['description'],
            'category': stream_data['category'],
            'isLive': False,
            'isPrivate': stream_data['isPrivate'],
            'viewerCount': 0,
            'streamerId': user_id,
            'streamer': {k: v for k, v in user.items() if k != 'passwordHash'},
            'startedAt': datetime.now().isoformat(),
            'livekitRoomName': room_name,
            'thumbnailUrl': None
        }

        return self.stream_repo.create(stream)

    def get_stream_by_id(self, stream_id: str):
        return self.stream_repo.find_by_id(stream_id)

    def start_stream(self, stream_id: str, user_id: str):
        stream = self.stream_repo.find_by_id(stream_id)
        if not stream:
            raise Exception('Stream not found')

        if stream['streamerId'] != user_id:
            raise ValueError('Unauthorized')

        stream['isLive'] = True
        stream['startedAt'] = datetime.now().isoformat()

        return self.stream_repo.update(stream_id, stream)

    def stop_stream(self, stream_id: str, user_id: str):
        stream = self.stream_repo.find_by_id(stream_id)
        if not stream:
            raise Exception('Stream not found')

        if stream['streamerId'] != user_id:
            raise ValueError('Unauthorized')

        stream['isLive'] = False
        stream['endedAt'] = datetime.now().isoformat()

        return self.stream_repo.update(stream_id, stream)
