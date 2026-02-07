import os
import logging
import datetime as dt
from decimal import Decimal, InvalidOperation

import requests
from bs4 import BeautifulSoup
from psycopg import connect


logger = logging.getLogger("product_costs_snapshot")

BASE = "https://secretlines.ru/ozon_analytics"
INDEX_URL = f"{BASE}/index.php"

PASSWORD = os.getenv("SECRET_LINES_PASSWORD", "")
PG_DSN = os.getenv("PG_DSN", "")

UPSERT_SQL = """
INSERT INTO product_costs (
    export_date, article,
    calculated_price, purchase_price, pack_quantity,
    packing_work_cost, acquiring_percent,
    warehouse_unloading, withdraw_from_sale,
    testing_status, testing_success, hidden, stop_shipments
)
VALUES (
    %(export_date)s, %(article)s,
    %(calculated_price)s, %(purchase_price)s, %(pack_quantity)s,
    %(packing_work_cost)s, %(acquiring_percent)s,
    %(warehouse_unloading)s, %(withdraw_from_sale)s,
    %(testing_status)s, %(testing_success)s, %(hidden)s, %(stop_shipments)s
)
ON CONFLICT (export_date, article) DO UPDATE SET
    calculated_price = EXCLUDED.calculated_price,
    purchase_price = EXCLUDED.purchase_price,
    pack_quantity = EXCLUDED.pack_quantity,
    packing_work_cost = EXCLUDED.packing_work_cost,
    acquiring_percent = EXCLUDED.acquiring_percent,
    warehouse_unloading = EXCLUDED.warehouse_unloading,
    withdraw_from_sale = EXCLUDED.withdraw_from_sale,
    testing_status = EXCLUDED.testing_status,
    testing_success = EXCLUDED.testing_success,
    hidden = EXCLUDED.hidden,
    stop_shipments = EXCLUDED.stop_shipments
;
"""


def to_decimal(s: str | None):
    if s is None:
        return None
    s = s.strip().replace("\xa0", "").replace(" ", "")
    if s == "":
        return None
    s = s.replace(",", ".")
    try:
        return Decimal(s)
    except InvalidOperation:
        return None


def to_int(s: str | None):
    if s is None:
        return None
    s = s.strip().replace("\xa0", "").replace(" ", "")
    if s == "":
        return None
    try:
        return int(s)
    except ValueError:
        return None


def login_and_get_index_html(session: requests.Session) -> str:
    r = session.post(
        INDEX_URL,
        data={"pass": PASSWORD},
        timeout=30,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    r.raise_for_status()
    return r.text


def parse_index(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    table = soup.select_one("table.data")
    if not table:
        raise RuntimeError("Не найдена таблица table.data (проверь авторизацию/URL)")

    rows: list[dict] = []
    for tr in table.select("tbody tr.table-data"):
        tds = tr.find_all("td")
        if len(tds) < 12:
            continue

        article = tds[0].get_text(strip=True)
        if not article:
            continue

        def get_input_value(td_idx: int) -> str | None:
            inp = tds[td_idx].find("input")
            if not inp:
                return None
            return (inp.get("value") or "").strip()

        def get_checkbox(td_idx: int) -> bool:
            inp = tds[td_idx].find("input", {"type": "checkbox"})
            return bool(inp and inp.has_attr("checked"))

        rows.append({
            "article": article,
            "calculated_price": to_decimal(get_input_value(1)),
            "purchase_price": to_decimal(get_input_value(2)),
            "pack_quantity": to_int(get_input_value(3)),
            "packing_work_cost": to_decimal(get_input_value(4)),
            "acquiring_percent": to_decimal(get_input_value(5)),
            "warehouse_unloading": get_checkbox(6),
            "withdraw_from_sale": get_checkbox(7),
            "testing_status": (get_input_value(8) or None),
            "testing_success": get_checkbox(9),
            "hidden": get_checkbox(10),
            "stop_shipments": get_checkbox(11),
        })

    return rows


def upsert_product_costs(pg_dsn: str, export_date: dt.date, parsed_rows: list[dict]) -> int:
    if not parsed_rows:
        return 0

    payload = [
        {
            "export_date": export_date,
            "article": r["article"],
            "calculated_price": r.get("calculated_price"),
            "purchase_price": r.get("purchase_price"),
            "pack_quantity": r.get("pack_quantity"),
            "packing_work_cost": r.get("packing_work_cost"),
            "acquiring_percent": r.get("acquiring_percent"),
            "warehouse_unloading": r.get("warehouse_unloading", False),
            "withdraw_from_sale": r.get("withdraw_from_sale", False),
            "testing_status": r.get("testing_status"),
            "testing_success": r.get("testing_success", False),
            "hidden": r.get("hidden", False),
            "stop_shipments": r.get("stop_shipments", False),
        }
        for r in parsed_rows
    ]

    with connect(pg_dsn) as conn:
        with conn.cursor() as cur:
            cur.executemany(UPSERT_SQL, payload)
        conn.commit()

    return len(payload)


def main():
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO"),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    if not PASSWORD:
        raise RuntimeError("ENV SECRET_LINES_PASSWORD пустой")
    if not PG_DSN:
        raise RuntimeError("ENV PG_DSN пустой")

    export_date = dt.date.today()
    with requests.Session() as s:
        s.headers.update({"User-Agent": "Mozilla/5.0 (compatible; product-costs-snapshot/1.0)"})

        html = login_and_get_index_html(s)

        if "Выход" not in html or "table" not in html:
            raise RuntimeError("Не похоже на авторизованную страницу: нет 'Выход' или таблицы")

        rows = parse_index(html)
        n = upsert_product_costs(PG_DSN, export_date, rows)

        logger.info("OK export_date=%s rows=%s", export_date, n)


if __name__ == "__main__":
    main()
