BEGIN;

CREATE TABLE IF NOT EXISTS  products (
    -- Служебные поля
    export_date             DATE NOT NULL,                    -- Дата выгрузки (добавляем)

    -- Идентификаторы
    article                 VARCHAR(100) NOT NULL,            -- Артикул
    ozon_product_id         BIGINT,                           -- Ozon Product ID
    sku                     BIGINT,                           -- SKU
    barcode                 VARCHAR(50),                      -- Barcode (штрихкод)

    -- Описание товара
    product_name            TEXT,                             -- Название товара
    category                VARCHAR(255),                     -- Категория
    product_type            VARCHAR(100),                     -- Тип
    quantity_in_pack        INTEGER,                          -- Количество товара в кванте
    volume_liters           DECIMAL(10,4),                    -- Объём товара, л

    -- Статусы
    product_status          VARCHAR(50),                      -- Статус товара
    labels                  TEXT,                             -- Метки
    ozon_visibility         VARCHAR(50),                      -- Видимость на Ozon
    hidden_reason           TEXT,                             -- Причина скрытия

    -- Рейтинг и отзывы
    reviews_count           INTEGER,                          -- Отзывы
    rating                  DECIMAL(3,2),                     -- Рейтинг

    -- Остатки по схемам
    fbo_sales_volume        INTEGER,                          -- Объем продаж по схеме FBO, шт
    available_realfbs       INTEGER,                          -- Доступно к продаже по схеме realFBS
    reserved_my_warehouse   INTEGER,                          -- Зарезервировано на моих складах, шт
    available_fbs           INTEGER,                          -- Доступно к продаже по схеме FBS, шт

    -- Цены
    current_price           DECIMAL(12,2),                    -- Текущая цена с учетом скидки
    price_before_discount   DECIMAL(12,2),                    -- Цена до скидки (перечеркнутая цена)
    vat_percent             DECIMAL(5,2),                     -- Размер НДС, %
    ozon_offer_price        DECIMAL(12,2),                    -- Цена Ozon/Предложения

    -- Метаданные
    created_at              TIMESTAMP,                        -- Дата создания (из Ozon)

    PRIMARY KEY (export_date, article)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_ozon_id ON products(ozon_product_id);
CREATE INDEX IF NOT EXISTS idx_products_export_date ON products(export_date);



CREATE TABLE IF NOT EXISTS orders_fbo (
    -- Идентификаторы
    order_number            VARCHAR(50) PRIMARY KEY,          -- Номер заказа
    shipment_number         VARCHAR(50),                      -- Номер отправления

    -- Даты
    accepted_at             TIMESTAMP,                        -- Принят в обработку
    shipment_date           DATE,                             -- Дата отгрузки
    delivery_date           DATE,                             -- Дата доставки
    actual_dispatch_date    TIMESTAMP,                        -- Фактическая дата передачи в доставку

    -- Статус
    status                  VARCHAR(50),                      -- Статус (Доставлен, Отменён и т.д.)

    -- Финансы
    amount                  DECIMAL(12,2),                    -- Сумма
    currency_code           VARCHAR(10),                      -- Код валюты отправления

    -- Товар
    product_name            TEXT,                             -- Название товара
    sku                     BIGINT,                           -- SKU
    article                 VARCHAR(100),                     -- Артикул

    -- Цены и оплата
    seller_price            DECIMAL(12,2),                    -- Ваша цена
    seller_currency         VARCHAR(10),                      -- Код валюты (ваша цена)
    paid_by_customer        DECIMAL(12,2),                    -- Оплачено покупателем
    customer_currency       VARCHAR(10),                      -- Код валюты покупателем

    -- Количество и доставка
    quantity                INTEGER,                          -- Количество
    delivery_cost           DECIMAL(12,2),                    -- Стоимость доставки
    related_shipments       TEXT,                             -- Связанные отправления

    -- Скидки и акции
    buyout_percent          DECIMAL(5,2),                     -- Выкуп товара до %
    price_before_percent    DECIMAL(12,2),                    -- Цена товара до %
    discount_rub            DECIMAL(12,2),                    -- Скидка руб
    discount_percent        DECIMAL(5,2),                     -- Скидка %

    -- Прочее
    volumetric_weight       DECIMAL(10,4),                    -- Объёмный вес товаров
    promotions              TEXT                              -- Акции
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_orders_fbo_sku ON orders_fbo(sku);
CREATE INDEX IF NOT EXISTS idx_orders_fbo_article ON orders_fbo(article);
CREATE INDEX IF NOT EXISTS idx_orders_fbo_accepted_at ON orders_fbo(accepted_at);
CREATE INDEX IF NOT EXISTS idx_orders_fbo_status ON orders_fbo(status);
CREATE INDEX IF NOT EXISTS idx_orders_fbo_shipment_date ON orders_fbo(shipment_date);



CREATE TABLE IF NOT EXISTS search_position (
    export_date  DATE NOT NULL,
    sku          BIGINT NOT NULL,
    product_name TEXT,
    place        NUMERIC(12,6),
    PRIMARY KEY (export_date, sku)
);


-- Индексы
CREATE INDEX IF NOT EXISTS idx_search_position_sku ON search_position(sku);
CREATE INDEX IF NOT EXISTS idx_search_position_place ON search_position(place);


CREATE TABLE IF NOT EXISTS  stock (
    -- Первичный ключ
    id                      SERIAL PRIMARY KEY,               -- Синтетический ключ

    -- Служебные поля
    export_date             DATE NOT NULL,                    -- Дата выгрузки (добавляем)

    -- Идентификаторы товара
    sku                     BIGINT,                           -- SKU
    name                    TEXT,                             -- Название товара
    offer_id                VARCHAR(100),                     -- Offer ID (артикул продавца)

    -- Склад/кластер
    warehouse_id            BIGINT,                           -- ID склада
    warehouse_name          VARCHAR(255),                     -- Название склада
    cluster_id              VARCHAR(50),                      -- ID кластера
    cluster_name            VARCHAR(255),                     -- Название кластера

    -- Метки и аналитика
    item_tag                VARCHAR(100),                     -- Тег товара
    adv_days_without_sales  INTEGER,                          -- Дни без продаж (adv)
    turnover_grade          VARCHAR(50),                      -- Оборачиваемость (POPULAR, DEFICIT и т.д.)

    -- Остатки (основные)
    available_stock_count           INTEGER DEFAULT 0,        -- Доступно
    valid_stock_count               INTEGER DEFAULT 0,        -- Годный остаток
    waiting_docs_stock_count        INTEGER DEFAULT 0,        -- Ожидает документов
    expiring_stock_count            INTEGER DEFAULT 0,        -- Истекающий срок

    -- Остатки (транзит и дефицит)
    transit_stock_count             INTEGER DEFAULT 0,        -- В транзите
    transit_deficit_stock_count     INTEGER DEFAULT 0,        -- Дефицит транзита
    deficit_stock_count             INTEGER DEFAULT 0,        -- Дефицит
    excess_stock_count              INTEGER DEFAULT 0,        -- Излишки

    -- Остатки (прочие)
    other_stock_count               INTEGER DEFAULT 0,        -- Прочие
    requested_stock_count           INTEGER DEFAULT 0,        -- Запрошено
    return_from_customer_count      INTEGER DEFAULT 0,        -- Возврат от покупателя
    return_to_seller_count          INTEGER DEFAULT 0,        -- Возврат продавцу

    -- Кластерная аналитика
    id_cluster              VARCHAR(50),                      -- ID кластера (дубль?)
    adv_cluster             VARCHAR(50),                      -- Рекламный кластер
    turnover_cluster        VARCHAR(50),                      -- Кластер оборачиваемости
    days_without_sales_cluster VARCHAR(50)                    -- Кластер дней без продаж
);

-- Индексы
CREATE INDEX IF NOT EXISTS  idx_stock_export_date ON stock(export_date);
CREATE INDEX IF NOT EXISTS INDEX  idx_stock_sku ON stock(sku);
CREATE INDEX IF NOT EXISTS INDEX  idx_stock_warehouse_id ON stock(warehouse_id);
CREATE INDEX IF NOT EXISTS INDEX  idx_stock_sku_warehouse ON stock(sku, warehouse_id);
CREATE INDEX IF NOT EXISTS INDEX  idx_stock_turnover_grade ON stock(turnover_grade);




       CREATE TABLE IF NOT EXISTS ads_aggregated (
    -- Служебные поля
    export_date             DATE NOT NULL,                    -- Дата выгрузки (добавляем)

    -- Идентификаторы
    campaign_id             BIGINT NOT NULL,                  -- ID кампании
    campaign_name           TEXT,                             -- Название кампании
    article                 VARCHAR(100),                     -- Артикул

    -- Дата статистики
    stats_date              DATE,                             -- Дата (из отчёта, не выгрузки!)

    -- Метрики показов и кликов
    impressions             INTEGER DEFAULT 0,                -- Показы
    clicks                  INTEGER DEFAULT 0,                -- Клики

    -- Финансовые метрики
    spend_rub               DECIMAL(12,2),                    -- Расход, ₽
    avg_bid_rub             DECIMAL(10,2),                    -- Средняя ставка, ₽

    -- Метрики заказов
    orders_count            INTEGER DEFAULT 0,                -- Заказы, шт
    orders_rub              DECIMAL(12,2),                    -- Заказы, ₽

    PRIMARY KEY (export_date, campaign_id)
);

-- Индексы
CREATE IF NOT EXISTS INDEX idx_ads_aggregated_campaign_id ON ads_aggregated(campaign_id);
CREATE IF NOT EXISTS INDEX idx_ads_aggregated_article ON ads_aggregated(article);
CREATE IF NOT EXISTS INDEX idx_ads_aggregated_stats_date ON ads_aggregated(stats_date);


CREATE TABLE IF NOT EXISTS ads_orders (
    -- Идентификаторы
    order_id                BIGINT PRIMARY KEY,               -- ID заказа (уникальный)
    order_number            VARCHAR(50),                      -- Номер заказа

    -- Дата
    order_date              DATE,                             -- Дата заказа

    -- Товар
    sku                     BIGINT,                           -- SKU заказанного товара
    promoted_sku            BIGINT,                           -- SKU продвигаемого товара
    article                 VARCHAR(100),                     -- Артикул
    product_name            TEXT,                             -- Название товара

    -- Источник
    order_source            VARCHAR(100),                     -- Источник заказов (Кампания за клики, Оплата за заказ)

    -- Количество и суммы
    quantity                DECIMAL(10,2),                    -- Количество
    sale_amount_rub         DECIMAL(12,2),                    -- Стоимость продажи, ₽
    cost_rub                DECIMAL(12,2),                    -- Стоимость, ₽

    -- Ставки и расход
    bid_percent             DECIMAL(5,2),                     -- Ставка, %
    bid_rub                 DECIMAL(10,2),                    -- Ставка, ₽
    spend_rub               DECIMAL(10,2)                     -- Расход, ₽
);

-- Индексы
CREATE IF NOT EXISTS INDEX idx_ads_orders_order_date ON ads_orders(order_date);
CREATE IF NOT EXISTS INDEX idx_ads_orders_sku ON ads_orders(sku);
CREATE IF NOT EXISTS INDEX idx_ads_orders_promoted_sku ON ads_orders(promoted_sku);
CREATE IF NOT EXISTS INDEX idx_ads_orders_article ON ads_orders(article);
CREATE IF NOT EXISTS INDEX idx_ads_orders_order_source ON ads_orders(order_source);
CREATE IF NOT EXISTS INDEX idx_ads_orders_order_number ON ads_orders(order_number);



       CREATE TABLE IF NOT EXISTS etl_log (
    id              SERIAL PRIMARY KEY,
    table_name      VARCHAR(100),
    started_at      TIMESTAMP DEFAULT NOW(),
    finished_at     TIMESTAMP,
    rows_inserted   INTEGER,
    rows_updated    INTEGER,
    status          VARCHAR(20),  -- SUCCESS, ERROR
    error_message   TEXT
);


create table IF NOT EXISTS warehouse_cluster_map (
  warehouse_code text primary key,
  cluster_name   text not null,
  percent        numeric(5,2) not null,
  updated_at     timestamptz not null default now()
);

COMMIT;
