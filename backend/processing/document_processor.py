import os
from sqlalchemy.orm import Session
from app.models.chat import UploadedDocument, DocumentChunk

# Try to use the same sentence model as similarity search
from app.api.similarity import _get_model, _encode

def extract_text_from_file(file_path: str, file_type: str) -> str:
    """Extract raw text based on file type."""
    text = ""
    try:
        if file_type == "application/pdf" or file_path.endswith('.pdf'):
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
                        
        elif file_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or file_path.endswith('.docx'):
            import docx
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
                
        elif file_type == "text/plain" or file_path.endswith('.txt'):
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
                
    except Exception as e:
        import logging
        logging.error(f"Error extracting text from {file_path}: {str(e)}")
        
    return text.strip()


def text_to_chunks(text: str, chunk_size: int = 600, overlap: int = 100) -> list[str]:
    """Split text into overlapping chunks of roughly `chunk_size` characters."""
    words = text.split()
    chunks = []
    
    # We chunk by words to avoid cutting words in half, treating `chunk_size` as rough word count proxy
    # For a token limit approximation, let's use words
    words_per_chunk = chunk_size // 5  # Rough estimate: 5 chars per word
    words_overlap = overlap // 5
    
    if words_per_chunk <= 0:
        words_per_chunk = 100
        words_overlap = 20

    i = 0
    while i < len(words):
        chunk_words = words[i:i + words_per_chunk]
        chunk_text = " ".join(chunk_words)
        chunks.append(chunk_text)
        i += (words_per_chunk - words_overlap)
        
    return chunks


def process_and_store_document(db: Session, document_id: int):
    """
    Extracts text, splits it into chunks, generates embeddings, 
    and stores them in the database.
    """
    doc = db.query(UploadedDocument).filter(UploadedDocument.id == document_id).first()
    if not doc:
        return False
        
    # 1. Extract text
    raw_text = extract_text_from_file(doc.file_path, doc.file_type)
    if not raw_text:
        return False
        
    # 2. Chunk text
    chunks = text_to_chunks(raw_text, chunk_size=800, overlap=100)
    
    # 3. Generate embeddings & Store
    for idx, chunk_text in enumerate(chunks):
        # Use existing SentenceTransformer pool
        embedding_tensor = _encode([chunk_text])[0]
        embedding_list = embedding_tensor.tolist()
        
        doc_chunk = DocumentChunk(
            document_id=doc.id,
            chunk_text=chunk_text,
            embedding=embedding_list,
            chunk_index=idx
        )
        db.add(doc_chunk)
        
    try:
        db.commit()
        return True
    except Exception as e:
        import logging
        logging.error(f"Failed to save document chunks: {e}")
        db.rollback()
        return False
