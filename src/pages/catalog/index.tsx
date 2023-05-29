import { env } from "@/environment";
import { APIResponse, Catalog } from "@/types";
import {
  Loader,
  Title,
  Box,
  Card,
  Button,
  Text,
  Grid,
  Flex,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";

export default function CatalogPage() {
  const getCatalog = async (signal: AbortSignal | undefined) => {
    const response = await axios.get<APIResponse<Catalog>>(
      `${env.CATALOG_SERVICE_BASE_URL}/api/v1/catalog?top=10`,
      {
        signal,
        withCredentials: true,
      }
    );

    return response?.data;
  };

  const { data, isLoading } = useQuery(
    ["/api/v1/catalog", "?top=10"],
    ({ signal }) => getCatalog(signal)
  );

  if (isLoading) return <Loader />;

  if (!data) {
    return <Title order={4}>Could not retrieve the catalog</Title>;
  }

  return (
    <Grid>
      {data.value.map((item) => (
        <Grid.Col key={item.id} sm={6} md={4} lg={3}>
          <Card shadow="sm" radius="md" withBorder padding={12} h="200px">
            <Flex direction="column" h="100%">
              <Box sx={{ flex: 1 }}>
                <Title transform="capitalize" order={5}>
                  {item.name}
                </Title>

                <Text color="text.secondary" lineClamp={4}>
                  {item.description}
                </Text>
              </Box>

              <Flex>
                <Title order={3} weight="normal" sx={{ flex: 1 }}>
                  £{item.price.toPrecision(4)}
                </Title>

                <Link href={`/catalog/${item.id}`}>
                  <Button>View</Button>
                </Link>
              </Flex>
            </Flex>
          </Card>
        </Grid.Col>
      ))}
    </Grid>
  );
}
