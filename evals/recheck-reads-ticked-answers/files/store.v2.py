"""A tiny JSON record store. Single writer only: one process uses it at a time. Records are dicts with an 'id' and a 'created' unix timestamp."""
import json
import os
import time

PATH = os.environ.get("STORE_PATH", "records.json")


def load():
    if not os.path.exists(PATH):
        return []
    with open(PATH, encoding="utf-8") as f:
        return json.load(f)


def save(records):
    tmp = PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(records, f)
    os.replace(tmp, PATH)


def add(record):
    records = load()
    record.setdefault("created", time.time())
    records.append(record)
    save(records)


def prune(days):
    """Delete records older than `days` days and return how many were removed."""
    cutoff = time.time() - days * 86400
    records = load()
    kept = [r for r in records if r["created"] >= cutoff]
    save(kept)
    return len(records) - len(kept)
