export type Basket = {
  id: string;
  items: BasketItem[];
};

export type BasketItem = {
  id: string;
  catalogId: string;
  price: number;
  quantity: number;
};
