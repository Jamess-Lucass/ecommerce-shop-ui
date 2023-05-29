import { env } from "@/environment";
import { useBasketIdStore } from "@/stores";
import { Basket, BasketItem, Catalog } from "@/types";
import { Box, Button, Loader, Title, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import { useRouter } from "next/router";
import { FiPlus } from "react-icons/fi";

type Params = {
  id: string;
};

type CreateBasketRequest = {
  items: CreateBasketItemRequest[];
};

type CreateBasketItemRequest = {
  catalogId: string;
  quantity: number;
};

type UpdateBasketRequest = {
  id: string;
  items: UpdateBasketItemRequest[];
};

type UpdateBasketItemRequest = {
  id?: string;
  catalogId: string;
  quantity: number;
};

export default function CatalogDetails() {
  const { query, isReady } = useRouter();
  const queryClient = useQueryClient();
  const { basketId, setBasketId } = useBasketIdStore((state) => state);
  const { id } = query as Params;

  const getCatalogItem = async (signal: AbortSignal | undefined) => {
    const response = await axios.get<Catalog>(
      `${env.CATALOG_SERVICE_BASE_URL}/api/v1/catalog/${id}`,
      {
        signal,
        withCredentials: true,
      }
    );

    return response?.data;
  };

  const { data, isLoading } = useQuery(
    ["/api/v1/catalog", id],
    ({ signal }) => getCatalogItem(signal),
    { enabled: isReady }
  );

  const createBasketMutation = useMutation(
    (body: CreateBasketRequest) =>
      axios.post(`${env.BASKET_SERVICE_BASE_URL}/api/v1/baskets`, body, {
        withCredentials: true,
      }),
    {
      onSuccess: (response: AxiosResponse<Basket>) => {
        queryClient.setQueryData<Basket>(
          ["/api/v1/baskets", response.data.id],
          () => response.data
        );

        setBasketId(response.data.id);
        notifications.show({
          title: "Success",
          message: "Item added to your basket!",
          color: "green",
        });
      },
    }
  );

  const updateBasketMutation = useMutation(
    (body: UpdateBasketRequest) =>
      axios.put(
        `${env.BASKET_SERVICE_BASE_URL}/api/v1/baskets/${basketId}`,
        body,
        {
          withCredentials: true,
        }
      ),
    {
      onSuccess: (response: AxiosResponse<Basket>) => {
        queryClient.setQueryData<Basket>(
          ["/api/v1/baskets", response.data.id],
          () => response.data
        );

        setBasketId(response.data.id);
        notifications.show({
          title: "Success",
          message: "Item added to your basket!",
          color: "green",
        });
      },
    }
  );

  if (isLoading) return <Loader />;

  if (!data) {
    return <Title order={4}>Could not retrieve the catalog item</Title>;
  }

  const handleAddToBasketClick = (): void => {
    const basket = queryClient.getQueryData<Basket>([
      "/api/v1/baskets",
      basketId,
    ]);

    if (!basket) {
      return createBasketMutation.mutate({
        items: [
          {
            catalogId: data.id,
            quantity: 1,
          },
        ],
      } satisfies CreateBasketRequest);
    }

    let basketItem = basket.items.find((x) => x.catalogId == data.id);

    if (basketItem) {
      basketItem.quantity++;
    } else {
      basket.items.push({
        catalogId: data.id,
        quantity: 1,
      } as BasketItem);
    }

    return updateBasketMutation.mutate(basket);
  };

  return (
    <Box>
      <Title order={5} transform="capitalize">
        {data.name}
      </Title>
      <Text color="text.secondary">{data.description}</Text>
      <Text>£{data.price.toPrecision(4)}</Text>

      <Button
        onClick={handleAddToBasketClick}
        leftIcon={<FiPlus size="1rem" />}
        loading={
          createBasketMutation.isLoading || updateBasketMutation.isLoading
        }
      >
        Add to Basket
      </Button>
    </Box>
  );
}
