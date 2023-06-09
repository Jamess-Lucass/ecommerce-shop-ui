import { env } from "@/environment";
import { useBasketIdStore } from "@/stores";
import { Basket, BasketItem, Catalog } from "@/types";
import { formatPrice } from "@/utils/format-price";
import { zodResolver } from "@hookform/resolvers/zod";
import { Carousel } from "@mantine/carousel";
import {
  Box,
  Button,
  Loader,
  Title,
  Text,
  Anchor,
  Breadcrumbs,
  Image,
  Flex,
  Card,
  Group,
  ActionIcon,
  NumberInput,
  rem,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import { useRouter } from "next/router";
import { useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { FiShoppingCart } from "react-icons/fi";
import { z } from "zod";

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
  items: UpdateBasketItemRequest[];
};

type UpdateBasketItemRequest = {
  catalogId: string;
  quantity: number;
};

const schema = z.object({
  quantity: z.number().min(1),
});

type Inputs = z.infer<typeof schema>;

export default function CatalogDetails() {
  const { query, isReady } = useRouter();
  const queryClient = useQueryClient();
  const { basketId, setBasketId } = useBasketIdStore((state) => state);
  const [mainImageUrl, setMainImageUrl] = useState<string>();
  const { id } = query as Params;

  const {
    control,
    setValue,
    getValues,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1 },
  });

  const quantity = watch("quantity");

  console.log(getValues());

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
    {
      enabled: isReady,
      onSuccess: (data) => {
        const image = data.images[0];
        setMainImageUrl(`${image.url}?random=${image.id}`);
      },
    }
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

  const onSubmit: SubmitHandler<Inputs> = (values) => {
    const basket = queryClient.getQueryData<Basket>([
      "/api/v1/baskets",
      basketId,
    ]);

    if (!basket) {
      return createBasketMutation.mutate({
        items: [
          {
            catalogId: data.id,
            quantity: values.quantity,
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
    <Box px={48}>
      <Breadcrumbs mb={22} separator=">">
        <Anchor href="/">Home</Anchor>
        <Anchor href="/catalog">Catalog</Anchor>
        <Text>{data.name}</Text>
      </Breadcrumbs>

      <Flex gap={48}>
        <Flex direction="column" gap={24} maw={500}>
          <Image
            src={`${mainImageUrl}?random=${data.images[0].id}`}
            alt={data.name}
            radius="md"
          />

          <Carousel
            withIndicators
            w="full"
            slideSize="25%"
            slideGap="xl"
            loop
            align="start"
            slidesToScroll={3}
          >
            {data.images.map((image, index) => (
              <Carousel.Slide key={image.id}>
                <Button
                  variant="subtle"
                  h="100%"
                  p={0}
                  onClick={() =>
                    setMainImageUrl(`${image.url}?random=${image.id}`)
                  }
                >
                  <Image
                    src={`${image.url}?random=${image.id}`}
                    alt={`${data.name}-${index}`}
                    radius="sm"
                    sx={{ objectFit: "cover" }}
                    styles={(theme) => ({
                      root: {
                        border:
                          mainImageUrl === `${image.url}?random=${image.id}`
                            ? theme.colorScheme === "dark"
                              ? `2px solid ${theme.colors["gray"][5]}`
                              : `2px solid ${theme.colors["gray"][7]}`
                            : "",
                        borderRadius: "0.4rem",
                      },
                    })}
                  />
                </Button>
              </Carousel.Slide>
            ))}
          </Carousel>
        </Flex>

        <Box sx={{ flex: 1 }}>
          <Title weight={500} transform="capitalize" mb={12}>
            {data.name}
          </Title>
          <Title weight={400} order={3}>
            £{formatPrice(data.price)}
          </Title>

          <Title weight={400} order={3} mt={24}>
            Description
          </Title>
          <Text>{data.description}</Text>
        </Box>

        <Card shadow="sm" radius="md" withBorder padding={12} w={300} h={256}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ height: "100%" }}>
            <Flex
              direction="column"
              justify="space-between"
              align="center"
              h="100%"
            >
              <Box w="100%">
                <Flex justify="space-between">
                  <Text>Quantity</Text>
                  <Group spacing={5}>
                    <ActionIcon
                      size={36}
                      variant="default"
                      onClick={() =>
                        setValue("quantity", getValues("quantity") - 1)
                      }
                    >
                      –
                    </ActionIcon>

                    <Controller
                      control={control}
                      name="quantity"
                      render={({ field: { onChange, ...rest } }) => (
                        <NumberInput
                          onChange={(val) => onChange(Number(val))}
                          hideControls
                          styles={{
                            input: { width: rem(54), textAlign: "center" },
                          }}
                          {...rest}
                        />
                      )}
                    />

                    <ActionIcon
                      size={36}
                      variant="default"
                      onClick={() =>
                        setValue("quantity", getValues("quantity") + 1)
                      }
                    >
                      +
                    </ActionIcon>
                  </Group>
                </Flex>
                <Text color="red" size="sm" my={8}>
                  {errors.quantity?.message}
                </Text>

                <Flex justify="space-between">
                  <Text>Total Price</Text>
                  <Text size="lg">
                    £{formatPrice(Math.max(data.price * quantity, 0))}
                  </Text>
                </Flex>
              </Box>

              <Button
                type="submit"
                fullWidth
                leftIcon={<FiShoppingCart size="1rem" />}
                loading={
                  createBasketMutation.isLoading ||
                  updateBasketMutation.isLoading
                }
              >
                Add to Basket
              </Button>
            </Flex>
          </form>
        </Card>
      </Flex>
    </Box>
  );
}
