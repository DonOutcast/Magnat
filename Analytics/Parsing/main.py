import os
import logging
import datetime as dt
from decimal import Decimal, InvalidOperation


import psycopg
import requests
from bs4 import BeautifulSoup
from psycopg2.extras import execute_values

logger = logging.getLogger(__name__)

BASE = "https://secretlines.ru/ozon_analytics"
INDEX_URL = f"{BASE}/index.php"
LOGIN_URL = f"{BASE}/index.php"
PASSWORD = os.getenv("SECRET_LINES_PASSWORD", "")
PG_DSN = os.getenv("PG_DSN", "")

UPSERT_SQL = """
INSERT INTO product_costs (
    export_date,
    article,

    calculated_price,
    purchase_price,
    pack_quantity,
    packing_work_cost,
    acquiring_percent,

    warehouse_unloading,
    withdraw_from_sale,
    testing_status,
    testing_success,
    hidden,
    stop_shipments,

    embedded_ads_rules,
    ozon_commission_markup_rules,
    logistics_markup_rules
)
VALUES %s
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
    stop_shipments = EXCLUDED.stop_shipments,

    embedded_ads_rules = EXCLUDED.embedded_ads_rules,
    ozon_commission_markup_rules = EXCLUDED.ozon_commission_markup_rules,
    logistics_markup_rules = EXCLUDED.logistics_markup_rules
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

    rows = []
    for tr in table.select("tbody tr.table-data"):
        tds = tr.find_all("td")
        if len(tds) < 12:
            continue

        article = tds[0].get_text(strip=True)

        def get_input_value(td_idx: int) -> str | None:
            inp = tds[td_idx].find("input")
            if not inp:
                return None
            return (inp.get("value") or "").strip()

        def get_checkbox(td_idx: int) -> bool:
            inp = tds[td_idx].find("input", {"type": "checkbox"})
            if not inp:
                return False
            return inp.has_attr("checked")

        item = {
            "article": article,

            "calculated_price": to_decimal(get_input_value(1)),  # "rasschetnaya-cena_*"
            "purchase_price": to_decimal(get_input_value(2)),  # "cena-zakupa_*"
            "pack_quantity": to_int(get_input_value(3)),  # "fasovka-sht_*"
            "packing_work_cost": to_decimal(get_input_value(4)),  # "rabota-po-upakovke_*"
            "acquiring_percent": to_decimal(get_input_value(5)),  # "ekvayring_*"

            "warehouse_unloading": get_checkbox(6),  # "razgruzka-skladov_*"
            "withdraw_from_sale": get_checkbox(7),  # "vyvodim_*"
            "testing_status": get_input_value(8) or None,  # "testirovanie_*"
            "testing_success": get_checkbox(9),  # "uspeh_*"
            "hidden": get_checkbox(10),  # "skrytye_*"
            "stop_shipments": get_checkbox(11),  # "stop_*"
        }

        raw = {"article": article}
        for i, td in enumerate(tds[1:], start=1):
            inp = td.find("input")
            if not inp:
                continue
            name = inp.get("name") or f"col_{i}"
            if inp.get("type") == "checkbox":
                raw[name] = inp.has_attr("checked")
            else:
                raw[name] = (inp.get("value") or "").strip()
        item["raw_row_json"] = raw

        rows.append(item)

    return rows


def upsert_product_costs(pg_dsn: str, export_date: dt.date, rows: list[dict]):
    values = []
    for r in rows:
        values.append((
            export_date,
            r["article"],

            r.get("calculated_price"),
            r.get("purchase_price"),
            r.get("pack_quantity"),
            r.get("packing_work_cost"),
            r.get("acquiring_percent"),

            r.get("warehouse_unloading"),
            r.get("withdraw_from_sale"),
            r.get("testing_status"),
            r.get("testing_success"),
            r.get("hidden"),
            r.get("stop_shipments"),

            r.get("embedded_ads_rules"),
            r.get("ozon_commission_markup_rules"),
            r.get("logistics_markup_rules"),
        ))

    with psycopg2.connect(pg_dsn) as conn, conn.cursor() as cur:
        execute_values(cur, UPSERT_SQL, values, page_size=500)
        conn.commit()


def main():
    export_date = dt.date.today()

    with requests.Session() as s:
        s.headers.update({
            "User-Agent": "Mozilla/5.0 (compatible; inner-product-data/1.0)"
        })

        html = login_and_get_index_html(s)
        if "Выход" not in html and "table" not in html:
            raise RuntimeError("Не похоже на авторизованную страницу, проверь pass/cookie.")
        rows = parse_index(html)

        upsert_product_costs(PG_DSN, export_date, rows)
        logger.info(f"OK export_date={export_date} rows={len(rows)}")


if __name__ == "__main__":
    main()
