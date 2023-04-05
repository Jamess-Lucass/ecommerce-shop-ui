import { env } from "@/environment";
import { useBasketIdStore } from "@/stores";
import { Basket, BasketItem, Catalog } from "@/types";
import { LoadingButton } from "@mui/lab";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";

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
  const { enqueueSnackbar } = useSnackbar();
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
        enqueueSnackbar("Item added to your basket!", { variant: "success" });
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
        enqueueSnackbar("Item added to your basket!", { variant: "success" });
      },
    }
  );

  if (isLoading) return <CircularProgress />;

  if (!data) {
    return (
      <Typography variant="h4">Could not retrieve the catalog item</Typography>
    );
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
      <Typography textTransform="capitalize" gutterBottom variant="h5">
        {data.name}
      </Typography>
      <Typography color="text.secondary">{data.description}</Typography>
      <Typography>£{data.price.toPrecision(4)}</Typography>

      <LoadingButton
        onClick={handleAddToBasketClick}
        loading={
          createBasketMutation.isLoading || updateBasketMutation.isLoading
        }
        variant="outlined"
      >
        Add to Basket
      </LoadingButton>
    </Box>
  );
}
