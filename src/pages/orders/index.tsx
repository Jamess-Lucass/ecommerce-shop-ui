import { useAuth } from "@/contexts/auth-context";
import { env } from "@/environment";
import { Order } from "@/types";
import { formatPrice } from "@/utils/format-price";
import { withTransaction } from "@elastic/apm-rum-react";
import { Loader, Table, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";

function Orders() {
  const { user } = useAuth();

  const getOrders = async (signal: AbortSignal | undefined) => {
    const response = await axios.get<Order[]>(
      `${env.ORDER_SERVICE_BASE_URL}/api/v1/orders`,
      {
        signal,
        withCredentials: true,
      }
    );

    return response?.data;
  };

  const { data, isLoading } = useQuery(["/api/v1/orders"], ({ signal }) =>
    getOrders(signal)
  );

  if (isLoading) return <Loader />;

  if (!data) {
    return <Title order={4}>Could not retrieve any orders</Title>;
  }

  return (
    <Table sx={{ minWidth: 650 }} aria-label="simple table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Address</th>
          <th>Email</th>
          <th>Price</th>
          <th>Created By</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id}>
            <td>
              <Link href={`/orders/${row.id}`}>{row.id}</Link>
            </td>
            <td>{row.address}</td>
            <td>{row.email || user?.email}</td>
            <td>
              £
              {formatPrice(
                row.items.reduce((a, b) => a + b.price * b.quantity, 0)
              )}
            </td>
            <td>{row.name || `${user?.firstName} ${user?.lastName}`}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default withTransaction("Orders", "component")(Orders);