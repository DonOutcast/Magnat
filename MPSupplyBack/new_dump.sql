SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bids_campaing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bids_campaing (
    id integer NOT NULL,
    "campaingId" bigint,
    "paymentType" character varying(255),
    title character varying(255),
    state character varying(255),
    "advObjectType" character varying(255),
    "fromDate" character varying(255),
    "toDate" character varying(255),
    "dailyBudget" integer,
    budget integer,
    cid bigint,
    mp character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.bids_campaing OWNER TO postgres;

--
-- Name: bids_campaing_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bids_campaing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bids_campaing_id_seq OWNER TO postgres;

--
-- Name: bids_campaing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bids_campaing_id_seq OWNED BY public.bids_campaing.id;


--
-- Name: bids_search_promo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bids_search_promo (
    id integer NOT NULL,
    sku character varying(255),
    "offerId" character varying(255),
    title character varying(255),
    category character varying(255),
    promotion_status character varying(255),
    price double precision,
    bid double precision,
    "bidValue" double precision,
    orders integer,
    "ordersMoney" double precision,
    "moneySpent" double precision,
    drr double precision,
    coverage double precision,
    views integer,
    clicks integer,
    ctr double precision,
    "toCart" integer,
    cid bigint,
    mp character varying(255),
    date date
);


ALTER TABLE public.bids_search_promo OWNER TO postgres;

--
-- Name: bids_search_promo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bids_search_promo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bids_search_promo_id_seq OWNER TO postgres;

--
-- Name: bids_search_promo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bids_search_promo_id_seq OWNED BY public.bids_search_promo.id;


--
-- Name: cabinet; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cabinet (
    id integer NOT NULL,
    name character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "syncData" json DEFAULT '{}'::json NOT NULL
);


ALTER TABLE public.cabinet OWNER TO postgres;

--
-- Name: cabinet_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cabinet_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cabinet_id_seq OWNER TO postgres;

--
-- Name: cabinet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cabinet_id_seq OWNED BY public.cabinet.id;


--
-- Name: capital_asset; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.capital_asset (
    id integer NOT NULL,
    name character varying(255),
    type character varying(255),
    amount double precision,
    cid bigint,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.capital_asset OWNER TO postgres;

--
-- Name: capital_asset_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.capital_asset_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.capital_asset_id_seq OWNER TO postgres;

--
-- Name: capital_asset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.capital_asset_id_seq OWNED BY public.capital_asset.id;


--
-- Name: capital_liability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.capital_liability (
    id integer NOT NULL,
    name character varying(255),
    doc_number character varying(255),
    amount double precision,
    doc_date_start date,
    pay_main double precision,
    pay_percent double precision,
    doc_date_closest date,
    cid bigint,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    amount_init double precision DEFAULT 0
);


ALTER TABLE public.capital_liability OWNER TO postgres;

--
-- Name: capital_liability_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.capital_liability_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.capital_liability_id_seq OWNER TO postgres;

--
-- Name: capital_liability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.capital_liability_id_seq OWNED BY public.capital_liability.id;


--
-- Name: fullfill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fullfill (
    id integer NOT NULL,
    liters double precision DEFAULT '0'::double precision,
    boxes double precision DEFAULT '0'::double precision,
    pallets double precision DEFAULT '0'::double precision,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    approved boolean DEFAULT false NOT NULL,
    cid bigint,
    "inDeliveryWarehouses" jsonb,
    mp character varying(4)
);


ALTER TABLE public.fullfill OWNER TO postgres;

--
-- Name: fullfill_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fullfill_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.fullfill_id_seq OWNER TO postgres;

--
-- Name: fullfill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fullfill_id_seq OWNED BY public.fullfill.id;


--
-- Name: fullfill_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fullfill_item (
    id integer NOT NULL,
    "orderId" bigint,
    "obsItemId" bigint,
    qty integer,
    stock jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    cid bigint
);


ALTER TABLE public.fullfill_item OWNER TO postgres;

--
-- Name: fullfill_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fullfill_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.fullfill_item_id_seq OWNER TO postgres;

--
-- Name: fullfill_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fullfill_item_id_seq OWNED BY public.fullfill_item.id;


--
-- Name: order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."order" (
    id integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    ts character varying,
    cid bigint,
    approved boolean DEFAULT false NOT NULL
);


ALTER TABLE public."order" OWNER TO postgres;

--
-- Name: order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_id_seq OWNER TO postgres;

--
-- Name: order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_id_seq OWNED BY public."order".id;


--
-- Name: order_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_item (
    id integer NOT NULL,
    "orderId" bigint,
    "supplierId" bigint,
    name character varying(255),
    "minCount" integer,
    needed integer,
    additional integer,
    price double precision,
    cid bigint
);


ALTER TABLE public.order_item OWNER TO postgres;

--
-- Name: order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_item_id_seq OWNER TO postgres;

--
-- Name: order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_item_id_seq OWNED BY public.order_item.id;


--
-- Name: product_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.product_id_seq OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id bigint DEFAULT nextval('public.product_id_seq'::regclass) NOT NULL,
    name character varying(255),
    sku bigint,
    offer_id character varying(255),
    barcode character varying(255),
    volume double precision,
    "inArchive" boolean DEFAULT false NOT NULL,
    cid bigint,
    "foreignId" bigint,
    mp character varying(8)
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    slug character varying(255) NOT NULL,
    "desc" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: sale; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sale (
    id integer NOT NULL,
    created_at timestamp with time zone,
    qty integer,
    warehouse character varying(255),
    cid bigint,
    "productId" bigint
);


ALTER TABLE public.sale OWNER TO postgres;

--
-- Name: sale_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sale_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sale_id_seq OWNER TO postgres;

--
-- Name: sale_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sale_id_seq OWNED BY public.sale.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    module character varying(255),
    code character varying(255),
    value json,
    cid bigint
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.settings_id_seq OWNER TO postgres;

--
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- Name: stock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock (
    id integer NOT NULL,
    warehouse_name character varying(255),
    promised_amount integer DEFAULT 0 NOT NULL,
    free_to_sell_amount integer DEFAULT 0 NOT NULL,
    reserved_amount integer DEFAULT 0 NOT NULL,
    avg_sale double precision DEFAULT 0 NOT NULL,
    needed integer DEFAULT 0 NOT NULL,
    visible boolean DEFAULT false NOT NULL,
    cid bigint,
    "maxAmount" integer DEFAULT 0,
    "maxSale" double precision DEFAULT 0,
    "productId" bigint,
    delivering_amount integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.stock OWNER TO postgres;

--
-- Name: stock_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stock_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stock_id_seq OWNER TO postgres;

--
-- Name: stock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_id_seq OWNED BY public.stock.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying(255),
    cid bigint
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.suppliers_id_seq OWNER TO postgres;

--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: user_cabinetes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_cabinetes (
    id integer NOT NULL,
    "cabinetId" integer,
    "userId" integer
);


ALTER TABLE public.user_cabinetes OWNER TO postgres;

--
-- Name: user_cabinetes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_cabinetes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_cabinetes_id_seq OWNER TO postgres;

--
-- Name: user_cabinetes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_cabinetes_id_seq OWNED BY public.user_cabinetes.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    "roleId" integer,
    "userId" integer
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_roles_id_seq OWNER TO postgres;

--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    phone character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    fio character varying(255),
    active boolean DEFAULT true,
    class character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    cid bigint
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouses (
    id bigint NOT NULL,
    name character varying(255),
    priority integer,
    visible boolean,
    "periodStock" integer,
    "periodDelivery" integer,
    "shortName" character varying,
    cid bigint,
    mp character varying(8)
);


ALTER TABLE public.warehouses OWNER TO postgres;

--
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.warehouses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.warehouses_id_seq OWNER TO postgres;

--
-- Name: warehouses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.warehouses_id_seq OWNED BY public.warehouses.id;


--
-- Name: оbservable; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."оbservable" (
    id integer NOT NULL,
    "supplierId" integer,
    name character varying(255),
    price double precision,
    "minCount" integer,
    need integer DEFAULT 0 NOT NULL,
    needmin integer DEFAULT 0 NOT NULL,
    "inOurStock" integer DEFAULT 0 NOT NULL,
    "stockReserve" integer DEFAULT 0 NOT NULL,
    "totalNeed" integer DEFAULT 0 NOT NULL,
    cid bigint,
    "inWay" integer DEFAULT 0
);


ALTER TABLE public."оbservable" OWNER TO postgres;

--
-- Name: оbservable_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."оbservable_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."оbservable_id_seq" OWNER TO postgres;

--
-- Name: оbservable_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."оbservable_id_seq" OWNED BY public."оbservable".id;


--
-- Name: оbservable_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."оbservable_items" (
    id integer NOT NULL,
    "observableId" bigint,
    "productId" bigint,
    packing integer,
    needed integer DEFAULT 0 NOT NULL,
    "avgSale" double precision DEFAULT 0 NOT NULL,
    "barcodePath" character varying,
    "packingType" character varying,
    cid bigint
);


ALTER TABLE public."оbservable_items" OWNER TO postgres;

--
-- Name: оbservable_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."оbservable_items_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."оbservable_items_id_seq" OWNER TO postgres;

--
-- Name: оbservable_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."оbservable_items_id_seq" OWNED BY public."оbservable_items".id;


--
-- Name: bids_campaing id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids_campaing ALTER COLUMN id SET DEFAULT nextval('public.bids_campaing_id_seq'::regclass);


--
-- Name: bids_search_promo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids_search_promo ALTER COLUMN id SET DEFAULT nextval('public.bids_search_promo_id_seq'::regclass);


--
-- Name: cabinet id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cabinet ALTER COLUMN id SET DEFAULT nextval('public.cabinet_id_seq'::regclass);


--
-- Name: capital_asset id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capital_asset ALTER COLUMN id SET DEFAULT nextval('public.capital_asset_id_seq'::regclass);


--
-- Name: capital_liability id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.capital_liability ALTER COLUMN id SET DEFAULT nextval('public.capital_liability_id_seq'::regclass);


--
-- Name: fullfill id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fullfill ALTER COLUMN id SET DEFAULT nextval('public.fullfill_id_seq'::regclass);


--
-- Name: fullfill_item id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fullfill_item ALTER COLUMN id SET DEFAULT nextval('public.fullfill_item_id_seq'::regclass);


--
-- Name: order id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."order" ALTER COLUMN id SET DEFAULT nextval('public.order_id_seq'::regclass);


--
-- Name: order_item id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item ALTER COLUMN id SET DEFAULT nextval('public.order_item_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: sale id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale ALTER COLUMN id SET DEFAULT nextval('public.sale_id_seq'::regclass);


--
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- Name: stock id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock ALTER COLUMN id SET DEFAULT nextval('public.stock_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: user_cabinetes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_cabinetes ALTER COLUMN id SET DEFAULT nextval('public.user_cabinetes_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: warehouses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses ALTER COLUMN id SET DEFAULT nextval('public.warehouses_id_seq'::regclass);


--
-- Name: оbservable id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."оbservable" ALTER COLUMN id SET DEFAULT nextval('public."оbservable_id_seq"'::regclass);


--
-- Name: оbservable_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."оbservable_items" ALTER COLUMN id SET DEFAULT nextval('public."оbservable_items_id_seq"'::regclass);

