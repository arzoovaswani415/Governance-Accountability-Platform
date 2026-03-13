import sys
from pathlib import Path

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import engine, Base
# Import all models so they are registered with Base metadata
from app.models import *
from app.models.chat import ChatSession, ChatMessage, UploadedDocument, DocumentChunk

def create_chat_tables():
    print("Creating chat and document tables...")
    # This will create any missing tables (like the 4 new ones)
    Base.metadata.create_all(bind=engine)
    print("Successfully created ChatSession, ChatMessage, UploadedDocument, and DocumentChunk tables!")

if __name__ == "__main__":
    create_chat_tables()
