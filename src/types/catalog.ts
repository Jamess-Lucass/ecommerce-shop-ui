export type Catalog = {
  id: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  name: string;
  description: string;
  price: number;
  isLiked: boolean;
  images: Image[];
};

type Image = {
  id: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  url: string;
};
