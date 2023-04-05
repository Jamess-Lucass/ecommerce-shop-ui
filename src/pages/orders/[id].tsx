import { useAuth } from "@/contexts/auth-context";
import { env } from "@/environment";
import { Catalog, Order } from "@/types";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/router";

type Params = {
  id: string;
};

export default function OrderDetails() {
  const { query, isReady } = useRouter();
  const { user } = useAuth();
  const { id } = query as Params;

  const getOrder = async (signal: AbortSignal | undefined) => {
    const response = await axios.get<Order>(
      `${env.ORDER_SERVICE_BASE_URL}/api/v1/orders/${id}`,
      {
        signal,
        withCredentials: true,
      }
    );

    return response?.data;
  };

  const { data: order, isLoading } = useQuery(
    ["/api/v1/orders", id],
    ({ signal }) => getOrder(signal),
    { enabled: isReady }
  );

  const getCatalogItem = async (signal: AbortSignal | undefined) => {
    const response = await axios.get<Catalog[]>(
      `${env.CATALOG_SERVICE_BASE_URL}/api/v1/catalog`,
      {
        signal,
        withCredentials: true,
      }
    );

    return response?.data;
  };

  const { data: catalogItem } = useQuery(
    ["/api/v1/catalog"],
    ({ signal }) => getCatalogItem(signal),
    {
      enabled: !!order?.id,
      select: (data) =>
        data.filter((x) =>
          order?.items.map((item) => item.catalogId).includes(x.id)
        ),
    }
  );

  if (isLoading) return <CircularProgress />;

  if (!order) {
    return <Typography variant="h4">Could not retrieve order</Typography>;
  }

  return (
    <>
      <Typography variant="h4">Order Id: {order.id}</Typography>
      <Typography variant="body1">Address: {order.address}</Typography>
      <Typography variant="body1">
        Email: {order.email || user?.email}
      </Typography>
      <Typography variant="body1">Phone Number: {order.phoneNumber}</Typography>
      <Typography variant="body1">
        Total price: £
        {Number(
          order.items.reduce((a, b) => a + b.price * b.quantity, 0)
        ).toPrecision(4)}
      </Typography>

      <Box mt={4}>
        {order.items.map((item) => (
          <Card key={item.id} sx={{ width: 400, marginBottom: 2 }}>
            <CardContent>
              <Typography gutterBottom>Id: {item.id}</Typography>
              <Typography textTransform="capitalize" gutterBottom>
                Price: £{item.price.toPrecision(4)}
              </Typography>
              <Typography textTransform="capitalize" gutterBottom>
                Quantity: {item.quantity}
              </Typography>
              <Typography textTransform="capitalize" gutterBottom>
                {catalogItem?.find((x) => x.id == item.catalogId)?.name}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </>
  );
}
