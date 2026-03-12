from pydantic import BaseModel, UUID4
from typing import List, Optional
from datetime import datetime

class ChatMessageBase(BaseModel):
    role: str
    message: str

class ChatMessageCreate(ChatMessageBase):
    session_id: UUID4

class ChatMessageOut(ChatMessageBase):
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class ChatSessionCreate(BaseModel):
    user_id: Optional[str] = None
    session_title: Optional[str] = "New Conversation"

class ChatSessionOut(BaseModel):
    id: UUID4
    user_id: Optional[str]
    session_title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageOut] = []
    
    class Config:
        orm_mode = True

class UploadedDocumentOut(BaseModel):
    id: int
    session_id: UUID4
    file_name: str
    file_type: str
    uploaded_at: datetime
    
    class Config:
        orm_mode = True

# --- API Payloads ---

class SendMessagePayload(BaseModel):
    session_id: UUID4
    message: str
    
class AiChatResponse(BaseModel):
    answer: str
    reasoning: Optional[str] = None
    tools_used: List[str] = []
