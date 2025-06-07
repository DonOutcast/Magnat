// Enums
export enum MP {
  Ozon = 'ozon',
  WB = 'wb',
}

export enum ORDERBY {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum API_GO_HOSTS {
  SELLER_OZON = 'http://localhost:8090',
  SELLER_WB = 'http://localhost:8091',
  BIDS_OZON = 'http://localhost:8092',
}

export enum SETTINGS_MODULE {
  API = 'API',
  CALC = 'Calc',
}

export enum SETTINGS {
  OZON_API_KEY = 'ozonApiKey',
  OZON_CLIENT_ID = 'ozonClientId',
  WB_API_KEY = 'wbApiKey',
  SALE_CALC_DAYS = 'saleCalcDays',
  RESERVE_CALC_DAYS = 'reserveCalcDays',
}

// SYNC MAIN TYPES
export type WarehouseResponse = {
  name: string;
};

export type StockOnWarehousesResponse = {
  warehouse_name: string;
  promised_amount: number;
  free_to_sell_amount: number;
  reserved_amount: number;
};

// SYNC OZON TYPES
export type ProductAttributesResponseOzon = {
  id: number;
  height: number;
  depth: number;
  width: number;
  dimension_unit: string;
};

export type StockOnWarehousesResponseOzon = StockOnWarehousesResponse & {
  sku: number;
};

export type ProductSalesResponseOzon = {
  created_at: string;
  sku: number;
  qty: number;
  warehouse: string;
};

export type WarehouseResponseOzon = WarehouseResponse;

export type ProductInDeliveryResponseOzon = {
  sku: number;
  qty: number;
  warehouse: string;
};

// SYNC WB TYPES
export type WarehouseResponseWB = WarehouseResponse;

export type ProductsResponseWB = {
  foreignId: number;
  sku: number;
  volume: number;
  offer_id: string;
  name: string;
};

export type StockOnWarehousesResponseWB = StockOnWarehousesResponse & {
  foreignId: number;
};

export type ProductSalesResponseWB = {
  created_at: string;
  foreignId: number;
  qty: number;
  warehouse: string;
};

export enum ASSET_TYPES {
  T1 = 't1',
  T2 = 't2',
  T3 = 't3',
  T4 = 't4',
  T5 = 't5',
  T6 = 't6',
  T7 = 't7',
  T8 = 't8',
  T9 = 't9',
  T10 = 't10',
  T11 = 't11',
  T12 = 't12',
  T13 = 't13',
  T14 = 't14',
  T15 = 't15',
}
