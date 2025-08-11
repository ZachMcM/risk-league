from utils import getenv_required
import requests

DATA_FEEDS_API_TOKEN = getenv_required("DATA_FEEDS_API_TOKEN")
API_BASE_URL = getenv_required("API_BASE_URL")

def main():
    request = requests.get(f"{API_BASE_URL}/team-info/NBA?RSC_token={DATA_FEEDS_API_TOKEN}")
    data = request.json()
    print(data)
  
if __name__ == "__main__":
    main()