export interface ClientType {
  id: number;
  phone: number;
  last_name: string;
  name: string;
  second_name: string;
  discount: number;
  represes: {
    p: number;
    f: string;
  }[];
  search: string;
  type?: string;
  comment?: string;
  deposit?: number;
  error?: string;
}

export interface TimeLineType {
  createdAt: string;
  event: string;
  userId: number;
  selected?: boolean;
}

export interface OrderItemServiceType {
  id: number;
  itemId: number;
  code: string;
  group: string;
  label: string;
  price: number;
  masterId: number;
  orderId: number;
  status: number;
  desiredAt?: string;
  createdAt: string;
  materials: any[];
  suppliers: any[];
  addNow?: boolean;
}

export interface OrderItemType {
  id: number;
  orderId: number;
  group: string;
  type: string;
  material: string;
  color: string;
  status: string;
  createdAt: string;
  desiredAt: string;
  closedAt?: string;
  comment: string;
  warehouse?: string;
  sex: string;
  wear?: string;
  services: OrderItemServiceType[];
}
export interface OrderType {
  id: number;
  createdAt: string;
  statuses: number[];
  client: ClientType;
  logs: TimeLineType[];
  items: OrderItemType[];
  desiredAt: string;
  services: any[];
  materials: any[];
  totalSum: number;
  payedSum: number;
  discount: number;
  comment: string;
  skip_steps: number[];
}

export interface MastersType {
  id: number;
  roles: any[];
  fio: string;
  active: boolean;
  class: string;
}
