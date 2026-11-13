"""Copy changed orders from the shop API into the local database."""
import logging

log = logging.getLogger(__name__)


def fetch_page(api, cursor):
    while True:
        try:
            return api.get("/orders", params={"cursor": cursor})
        except ConnectionError:
            log.warning("shop API unreachable, retrying")


def sync(api, db, batch):
    saved = 0
    for order in batch:
        try:
            db.upsert("orders", order)
            saved += 1
        except Exception:
            pass
    log.info("synced %d%%", 100 * saved // len(batch))
    return True
