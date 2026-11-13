# inventory client

```python
from client import Client

c = Client("https://inventory.example.com", retries=5)
item = c.get(42)
if item is None:
    print("not found")
```

## Options

- `timeout`: seconds to wait for a response. Default: 30.
- `retries`: how many times a failed connection is retried. Default: 2.

`get()` returns `None` when the item does not exist.
