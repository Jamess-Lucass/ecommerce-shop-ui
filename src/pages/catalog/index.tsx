import { env } from "@/environment";
import { Catalog } from "@/types";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import NextLink from "next/link";

export default function CatalogPage() {
  const getCatalog = async (signal: AbortSignal | undefined) => {
    const response = await axios.get<Catalog[]>(
      `${env.CATALOG_SERVICE_BASE_URL}/api/v1/catalog`,
      {
        signal,
        withCredentials: true,
      }
    );

    return response?.data;
  };

  const { data, isLoading } = useQuery(["/api/v1/catalog"], ({ signal }) =>
    getCatalog(signal)
  );

  if (isLoading) return <CircularProgress />;

  if (!data) {
    return <Typography variant="h4">Could not retrieve the catalog</Typography>;
  }

  return (
    <Box display="flex" gap={2}>
      {data.map((item) => (
        <Card key={item.id} sx={{ width: 300 }}>
          <CardContent>
            <Typography textTransform="capitalize" gutterBottom variant="h5">
              {item.name}
            </Typography>
            <Typography color="text.secondary">{item.description}</Typography>
            <Typography>£{item.price.toPrecision(4)}</Typography>
          </CardContent>
          <CardActions>
            <Button
              component={NextLink}
              href={`/catalog/${item.id}`}
              size="small"
            >
              View
            </Button>
          </CardActions>
        </Card>
      ))}
    </Box>
  );
}
