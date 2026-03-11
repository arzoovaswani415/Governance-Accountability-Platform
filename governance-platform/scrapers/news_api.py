import requests
import json
import logging
from config.settings import LOG_FILE, NEWS_DIR, NEWS_API_KEY, REQUEST_TIMEOUT

# Setup logging
logging.basicConfig(filename=LOG_FILE, level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

def fetch_news():
    """
    Fetch news articles using NewsAPI.
    """
    if not NEWS_API_KEY or NEWS_API_KEY == "your_news_api_key":
        logging.warning("NEWS_API_KEY not set. Skipping News fetching.")
        return

    query = "India government policy OR scheme OR bill"
    url = f"https://newsapi.org/v2/everything?q={query}&apiKey={NEWS_API_KEY}&sortBy=publishedAt&language=en"
    
    try:
        logging.info(f"Fetching news for query: {query}")
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        
        data = response.json()
        articles = data.get("articles", [])
        
        news_data = []
        for art in articles:
            news_data.append({
                "headline": art.get("title"),
                "source": art.get("source", {}).get("name"),
                "author": art.get("author"),
                "description": art.get("description"),
                "article_url": art.get("url"),
                "published_at": art.get("publishedAt")
            })
            
        # Save to JSON
        output_file = NEWS_DIR / "news.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(news_data, f, indent=4, ensure_ascii=False)
            
        logging.info(f"Successfully fetched {len(news_data)} news articles.")
        
    except Exception as e:
        logging.error(f"Error fetching news from NewsAPI: {e}")

if __name__ == "__main__":
    fetch_news()