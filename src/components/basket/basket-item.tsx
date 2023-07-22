import { Catalog, Basket } from "@/types";
import { formatPrice } from "@/utils/format-price";
import {
  NumberInputHandlers,
  Flex,
  Box,
  Group,
  ActionIcon,
  NumberInput,
  rem,
  Image,
  Text,
} from "@mantine/core";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { useState, useRef } from "react";
import { FiTrash } from "react-icons/fi";
import { BasketItem } from "@/types";

type BasketItemProps = {
  item: BasketItem;
  catalogItem: Catalog | undefined;
  basket: Basket;
  updateBasketMutation: UseMutationResult<
    AxiosResponse<Basket, any>,
    unknown,
    Basket,
    unknown
  >;
};

export default function BasketItem({
  item,
  catalogItem,
  basket,
  updateBasketMutation,
}: BasketItemProps) {
  const [quantity, setQuantity] = useState<number | "">(item.quantity);
  const handlers = useRef<NumberInputHandlers>();

  const handleQuantityOnChange = (val: number | "") => {
    setQuantity(val);

    // Update quantity for line item
    const body = {
      ...basket,
      items: basket.items.map((x) => {
        if (x.id === item.id) {
          return { ...x, quantity: val || 1 };
        }

        return x;
      }),
    };

    updateBasketMutation.mutate(body);
  };

  const handleRemoveBasketItemClick = () => {
    updateBasketMutation.mutate({
      ...basket,
      items: basket.items.filter((x) => x.id !== item.id),
    });
  };

  return (
    <Flex gap={16}>
      <Image
        src={`${catalogItem?.images[0].url}?random=${catalogItem?.images[0].id}`}
        alt={catalogItem?.name}
        height={100}
        width={100}
        radius="sm"
      />

      <Flex direction="column" justify="space-between" sx={{ flex: 1 }}>
        <Box>
          <Text>{catalogItem?.name}</Text>
          <Text>£{formatPrice(item.price * (quantity || 1))}</Text>
        </Box>

        <Flex align="center" justify="space-between">
          <Group spacing={5}>
            <ActionIcon
              size={28}
              variant="default"
              onClick={() => handlers?.current?.decrement()}
            >
              –
            </ActionIcon>

            <NumberInput
              hideControls
              value={quantity}
              onChange={handleQuantityOnChange}
              handlersRef={handlers}
              min={1}
              step={1}
              styles={{
                input: {
                  width: rem(48),
                  minHeight: 0,
                  height: rem(28),
                  textAlign: "center",
                },
              }}
            />

            <ActionIcon
              size={28}
              variant="default"
              onClick={() => handlers?.current?.increment()}
            >
              +
            </ActionIcon>
          </Group>

          <ActionIcon variant="default" onClick={handleRemoveBasketItemClick}>
            <FiTrash size="0.8rem" />
          </ActionIcon>
        </Flex>
      </Flex>
    </Flex>
  );
}
