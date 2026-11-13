"""HTTP client for the inventory service."""
import json
import time
import urllib.error
import urllib.request


class Client:
    def __init__(self, base_url, timeout=10, max_retries=2):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries

    def get(self, item_id):
        """Return the item as a dict, or None when the item does not exist (HTTP 404)."""
        url = f"{self.base_url}/items/{item_id}"
        for attempt in range(self.max_retries + 1):
            try:
                with urllib.request.urlopen(url, timeout=self.timeout) as resp:
                    return json.load(resp)
            except urllib.error.HTTPError:
                raise
            except urllib.error.URLError:
                if attempt == self.max_retries:
                    raise
                time.sleep(2 ** attempt)
