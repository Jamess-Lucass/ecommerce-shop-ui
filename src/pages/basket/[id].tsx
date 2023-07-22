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
  Flex,
  Loader,
  TextInput,
  Text,
  Title,
  Anchor,
  Breadcrumbs,
} from "@mantine/core";
import { formatPrice } from "@/utils/format-price";
import BasketItem from "@/components/basket/basket-item";

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
    register,
    handleSubmit,
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

  const filters = basket?.items
    .map((item) => `id eq '${item.catalogId}'`)
    .join(" or ");

  const getCatalogItems = async (signal: AbortSignal | undefined) => {
    const response = await axios.get<APIResponse<Catalog>>(
      `${env.CATALOG_SERVICE_BASE_URL}/api/v1/catalog?filter=${filters}`,
      {
        signal,
        withCredentials: true,
      }
    );

    return response?.data;
  };

  const { data: catalogItems } = useQuery(
    ["/api/v1/catalog", filters],
    ({ signal }) => getCatalogItems(signal),
    {
      enabled: !!basket?.id,
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

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    checkoutBasketMutation.mutate(data);
  };

  const totalPrice = basket.items.reduce(
    (prev, item) => prev + item.price * item.quantity,
    0
  );

  return (
    <Box px={{ base: 0, lg: 48 }}>
      <Breadcrumbs mb={22} separator=">">
        <Anchor href="/">Home</Anchor>
        <Anchor href="/catalog">Catalog</Anchor>
        <Text>Basket</Text>
      </Breadcrumbs>

      <Flex direction={{ base: "column", lg: "row" }} gap={24}>
        <Flex direction="column" justify="space-between" w="100%">
          <Box maw="350px">
            <Title transform="capitalize" order={4} my={8}>
              My Basket
            </Title>

            <Flex gap={24} direction="column">
              {basket.items.map((item) => {
                const catalogItem = catalogItems?.value?.find(
                  (x) => x.id == item.catalogId
                );

                return (
                  <BasketItem
                    key={item.id}
                    item={item}
                    catalogItem={catalogItem}
                    basket={basket}
                    updateBasketMutation={updateBasketMutation}
                  />
                );
              })}
            </Flex>
          </Box>

          <Box>
            <Title transform="capitalize" order={4} my={8}>
              Delivery Information
            </Title>

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
          </Box>
        </Flex>

        <Box miw="300px">
          <Title transform="capitalize" order={4} mb={2}>
            Summary
          </Title>

          <Flex align="center" justify="space-between" my={6}>
            <Text>Total</Text>
            <Text>£{formatPrice(totalPrice)}</Text>
          </Flex>

          <Button
            fullWidth
            disabled={basket.items.length === 0}
            type="submit"
            form="basket-checkout"
          >
            Checkout (£{formatPrice(totalPrice)})
          </Button>
        </Box>
      </Flex>
    </Box>
  );
}
