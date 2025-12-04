from pydantic import BaseModel
from typing import List, Optional
import uuid

class SessionState(BaseModel):
    session_id: str
    photos: List[str] = []
    selected_filter: str = "color" # color, bw
    selected_frame: str = "default"
    is_printing: bool = False
    is_complete: bool = False

class StateManager:
    def __init__(self):
        self.current_session = None

    def start_session(self):
        session_id = str(uuid.uuid4())
        self.current_session = SessionState(session_id=session_id)
        return self.current_session
    
    def add_photo(self, photo_path: str):
        if self.current_session:
            self.current_session.photos.append(photo_path)
            
    def set_filter(self, filter_type: str):
        if self.current_session:
            self.current_session.selected_filter = filter_type

    def set_frame(self, frame_id: str):
        if self.current_session:
            self.current_session.selected_frame = frame_id

    def reset(self):
        self.current_session = None
        
    def get_state(self):
        return self.current_session
