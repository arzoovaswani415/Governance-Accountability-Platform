import requests
from bs4 import BeautifulSoup

url = "https://pib.gov.in/PressReleasePage.aspx?PRID=2238808"
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}

response = requests.get(url, headers=headers, timeout=30)
soup = BeautifulSoup(response.content, "html.parser")

print("--- Title Div ---")
title_div = soup.find("div", class_="Release_Heding")
if title_div:
    print(title_div.get_text(strip=True))
else:
    print("Not found")

print("\n--- Meta Div ---")
meta_div = soup.find("div", class_="Release_Date_Time")
if meta_div:
    print(meta_div.get_text(separator="|", strip=True))
else:
    # Try finding any div with Date in text
    potential_meta = soup.find_all("div")
    for d in potential_meta:
        if "Posted On" in d.get_text():
            print(f"Found alternative meta: {d.get_text(strip=True)}")
            break
    else:
        print("Not found")

print("\n--- Content Div ---")
content_div = soup.find("div", class_="ReleaseText")
if content_div:
    print(content_div.get_text(strip=True)[:200] + "...")
else:
    print("Not found")

# List all classes in the body
# print("\n--- Classes in body ---")
# for tag in soup.find_all(True):
#     if tag.has_attr('class'):
#         print(tag['class'])
