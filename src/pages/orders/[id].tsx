import { useAuth } from "@/contexts/auth-context";
import { env } from "@/environment";
import { APIResponse, Catalog, Order } from "@/types";
import { formatPrice } from "@/utils/format-price";
import { Loader, Title, Text, Box, Card } from "@mantine/core";
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
    const response = await axios.get<APIResponse<Catalog>>(
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
        data.value.filter((x) =>
          order?.items.map((item) => item.catalogId).includes(x.id)
        ),
    }
  );

  if (isLoading) return <Loader />;

  if (!order) {
    return <Title order={4}>Could not retrieve order</Title>;
  }

  return (
    <>
      <Title variant="h4">Order Id: {order.id}</Title>
      <Text>Address: {order.address}</Text>
      <Text>Email: {order.email || user?.email}</Text>
      <Text>Phone Number: {order.phoneNumber}</Text>
      <Text>
        Total price: £
        {formatPrice(order.items.reduce((a, b) => a + b.price * b.quantity, 0))}
      </Text>

      <Box mt={4}>
        {order.items.map((item) => (
          <Card key={item.id} sx={{ width: 400, marginBottom: 2 }}>
            <Text>Id: {item.id}</Text>
            <Text transform="capitalize">
              Price: £{item.price.toPrecision(4)}
            </Text>
            <Text transform="capitalize">Quantity: {item.quantity}</Text>
            <Text transform="capitalize">
              {catalogItem?.find((x) => x.id == item.catalogId)?.name}
            </Text>
          </Card>
        ))}
      </Box>
    </>
  );
}
