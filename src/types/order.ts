export type Order = {
  id: string;
  address: string;
  email: string;
  name: string;
  phoneNumber: string;
  items: OrderItem[];
};

export type OrderItem = {
  id: string;
  catalogId: string;
  price: number;
  quantity: number;
};
