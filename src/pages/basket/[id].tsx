import { env } from "@/environment";
import { useBasketIdStore } from "@/stores";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import { APIResponse, Basket, Catalog } from "@/types";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { z } from "zod";
import { notifications } from "@mantine/notifications";
import {
  Box,
  Button,
  Card,
  Flex,
  Loader,
  TextInput,
  Text,
  Title,
} from "@mantine/core";
import { useStoreWrapper } from "@/hooks";

export const schema = z.object({
  name: z.string().min(1).max(256),
  email: z.string().email(),
  phoneNumber: z.string().min(8),
  address: z.string().min(3).max(512),
});

export type Inputs = z.infer<typeof schema>;

type Params = {
  id: string;
};

export default function BasketDetails() {
  const { query, isReady } = useRouter();
  const { id } = query as Params;
  const { setBasketId } = useBasketIdStore((state) => state);
  const queryClient = useQueryClient();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
  });
  const { push } = useRouter();

  const getBasket = async (signal: AbortSignal | undefined) => {
    const response = await axios.get<Basket>(
      `${env.BASKET_SERVICE_BASE_URL}/api/v1/baskets/${id}`,
      {
        signal,
        withCredentials: true,
      }
    );

    return response?.data;
  };

  const { data: basket, isLoading } = useQuery(
    ["/api/v1/baskets", id],
    ({ signal }) => getBasket(signal),
    { enabled: isReady }
  );

  const getCatalogItems = async (signal: AbortSignal | undefined) => {
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
    ({ signal }) => getCatalogItems(signal),
    {
      enabled: !!basket?.id,
      select: (data) =>
        data.value.filter((x) =>
          basket?.items.map((item) => item.catalogId).includes(x.id)
        ),
    }
  );

  const updateBasketMutation = useMutation(
    (body: Basket) =>
      axios.put(
        `${env.BASKET_SERVICE_BASE_URL}/api/v1/baskets/${basket?.id}`,
        body,
        {
          withCredentials: true,
        }
      ),
    {
      onSuccess: (response: AxiosResponse<Basket>) => {
        queryClient.setQueryData<Basket>(
          ["/api/v1/baskets", basket?.id],
          () => response.data
        );
      },
    }
  );

  const deleteBasketMutation = useMutation(
    () =>
      axios.delete(
        `${env.BASKET_SERVICE_BASE_URL}/api/v1/baskets/${basket?.id}`,
        {
          withCredentials: true,
        }
      ),
    {
      onSuccess: () => {
        setBasketId(undefined);
        queryClient.removeQueries(["/api/v1/baskets", basket?.id]);

        push("/catalog");
      },
    }
  );

  const checkoutBasketMutation = useMutation(
    (body: Inputs) =>
      axios.post(
        `${env.BASKET_SERVICE_BASE_URL}/api/v1/baskets/${basket?.id}/checkout`,
        body,
        {
          withCredentials: true,
        }
      ),
    {
      onSuccess: () => {
        setBasketId(undefined);
        queryClient.removeQueries(["/api/v1/baskets", basket?.id]);

        push("/catalog");
        notifications.show({
          title: "Success",
          message: "Your ordering is being processed!",
          color: "green",
        });
      },
    }
  );

  if (isLoading) return <Loader />;

  if (!basket) {
    return <Title order={4}>No basket found.</Title>;
  }

  const handleRemoveAllClick = () => {
    deleteBasketMutation.mutate();
  };

  const handleRemoveBasketItemClick = (id: string) => {
    updateBasketMutation.mutate({
      ...basket,
      items: basket.items.filter((x) => x.id !== id),
    });
  };

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    checkoutBasketMutation.mutate(data);
  };

  return (
    <Box>
      <Flex gap={2}>
        <Title
          sx={{ flex: 1 }}
          transform="capitalize"
          // gutterBottom
          order={5}
        >
          Basket Id: {basket?.id}
        </Title>

        <Flex gap={8}>
          <Button color="success" type="submit" form="basket-checkout">
            Checkout
          </Button>

          <Button color="red" onClick={handleRemoveAllClick}>
            Remove All
          </Button>
        </Flex>
      </Flex>

      <Flex gap={4}>
        <Box sx={{ flex: 1 }}>
          <Title transform="capitalize" order={6} mb={2}>
            Delivery Information
          </Title>

          <Card radius="sm" padding={12}>
            <form id="basket-checkout" onSubmit={handleSubmit(onSubmit)}>
              <Flex direction="column" gap={8}>
                <Flex gap={12}>
                  <TextInput
                    label="Name"
                    {...register("name")}
                    error={errors.name?.message}
                    w="50%"
                  />

                  <TextInput
                    label="Email Address"
                    type="email"
                    {...register("email")}
                    error={errors.name?.message}
                    w="50%"
                  />
                </Flex>

                <Flex gap={12}>
                  <TextInput
                    label="Phone Number"
                    {...register("phoneNumber")}
                    error={errors.name?.message}
                    w="50%"
                  />

                  <TextInput
                    label="Address"
                    {...register("address")}
                    error={errors.name?.message}
                    w="50%"
                  />
                </Flex>
              </Flex>
            </form>
          </Card>
        </Box>

        <Flex direction="column">
          <Title transform="capitalize" order={6} mb={2}>
            Order summary
          </Title>

          <Flex direction="column" gap={4}>
            {basket?.items.map((item) => (
              <Card key={item.id} radius="sm" w={400}>
                <Text>Id: {item.id}</Text>
                <Text transform="capitalize">
                  Price: £{item.price.toPrecision(4)}
                </Text>
                <Text transform="capitalize">Quantity: {item.quantity}</Text>
                <Text transform="capitalize">
                  {catalogItem?.find((x) => x.id == item.catalogId)?.name}
                </Text>

                <Flex mt={12}>
                  <Button
                    color="red"
                    onClick={() => handleRemoveBasketItemClick(item.id)}
                  >
                    Remove
                  </Button>
                </Flex>
              </Card>
            ))}
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}
