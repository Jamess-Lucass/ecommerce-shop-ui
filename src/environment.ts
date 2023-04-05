import { z } from "zod";

const schema = z.object({
  IDENTITY_SERVICE_BASE_URL: z.string().url(),
  LOGIN_UI_BASE_URL: z.string().url(),
  CATALOG_SERVICE_BASE_URL: z.string().url().optional(),
  BASKET_SERVICE_BASE_URL: z.string().url().optional(),
  ORDER_SERVICE_BASE_URL: z.string().url().optional(),
});

const data = {
  IDENTITY_SERVICE_BASE_URL: process.env.NEXT_PUBLIC_IDENTITY_SERVICE_BASE_URL,
  LOGIN_UI_BASE_URL: process.env.NEXT_PUBLIC_LOGIN_UI_BASE_URL,
  CATALOG_SERVICE_BASE_URL: process.env.NEXT_PUBLIC_CATALOG_SERVICE_BASE_URL,
  BASKET_SERVICE_BASE_URL: process.env.NEXT_PUBLIC_BASKET_SERVICE_BASE_URL,
  ORDER_SERVICE_BASE_URL: process.env.NEXT_PUBLIC_ORDER_SERVICE_BASE_URL,
};

export const env = schema.parse(data);
