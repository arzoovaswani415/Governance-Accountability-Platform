import re
from bs4 import BeautifulSoup

def clean_text(text):
    """
    Remove extra whitespace, newlines, and normalize text.
    """
    if not text:
        return ""
    
    # Remove HTML tags if any remain
    text = BeautifulSoup(text, "html.parser").get_text()
    
    # Replace newlines and tabs with space
    text = re.sub(r'[\r\n\t]+', ' ', text)
    
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def normalize_metadata(data):
    """
    Ensure consistent casing or types for common fields.
    """
    if 'party_name' in data:
        data['party_name'] = data['party_name'].upper()
    return data