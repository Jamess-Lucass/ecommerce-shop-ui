import { useAuth } from "@/contexts/auth-context";
import { env } from "@/environment";
import { Order } from "@/types";
import {
  CircularProgress,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import NextLink from "next/link";

export default function Orders() {
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

  if (isLoading) return <CircularProgress />;

  if (!data) {
    return <Typography variant="h4">Could not retrieve any orders</Typography>;
  }

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Address</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Created By</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={row.id}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                <Link component={NextLink} href={`/orders/${row.id}`}>
                  {row.id}
                </Link>
              </TableCell>
              <TableCell>{row.address}</TableCell>
              <TableCell>{row.email || user?.email}</TableCell>
              <TableCell>
                £
                {Number(
                  row.items.reduce((a, b) => a + b.price * b.quantity, 0)
                ).toPrecision(4)}
              </TableCell>
              <TableCell>
                {row.name || `${user?.firstName} ${user?.lastName}`}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
