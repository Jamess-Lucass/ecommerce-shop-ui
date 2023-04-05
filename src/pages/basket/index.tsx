import { env } from "@/environment";
import { useBasketIdStore } from "@/stores";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";
import { Basket, Catalog } from "@/types";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Typography,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  TextField,
} from "@mui/material";
import { useRouter } from "next/router";
import { z } from "zod";
import { useSnackbar } from "notistack";

export const schema = z.object({
  name: z.string().min(1).max(256),
  email: z.string().email(),
  phoneNumber: z.string().min(8),
  address: z.string().min(3).max(512),
});

export type Inputs = z.infer<typeof schema>;

export default function BasketDetails() {
  const { basketId, setBasketId } = useBasketIdStore((state) => state);
  const queryClient = useQueryClient();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
  });
  const { push } = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const getBasket = async (signal: AbortSignal | undefined) => {
    const response = await axios.get<Basket>(
      `${env.BASKET_SERVICE_BASE_URL}/api/v1/baskets/${basketId}`,
      {
        signal,
        withCredentials: true,
      }
    );

    return response?.data;
  };

  const { data: basket, isLoading } = useQuery(
    ["/api/v1/baskets", basketId],
    ({ signal }) => getBasket(signal),
    { enabled: !!basketId }
  );

  const getCatalogItem = async (signal: AbortSignal | undefined) => {
    const response = await axios.get<Catalog[]>(
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
    ({ signal }) => getCatalogItem(signal),
    {
      enabled: !!basket?.id,
      select: (data) =>
        data.filter((x) =>
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
        enqueueSnackbar("Your ordering is being processed!", {
          variant: "success",
        });
      },
    }
  );

  if (isLoading && basketId) return <CircularProgress />;

  if (!basket) {
    return <Typography variant="h4">No basket found.</Typography>;
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
      <Box display="flex" gap={2}>
        <Typography
          flex={1}
          textTransform="capitalize"
          gutterBottom
          variant="h5"
        >
          Basket Id: {basket?.id}
        </Typography>

        <Button
          size="small"
          color="success"
          type="submit"
          form="basket-checkout"
        >
          Checkout
        </Button>

        <Button size="small" color="error" onClick={handleRemoveAllClick}>
          Remove All
        </Button>
      </Box>

      <Box display="flex" gap={4}>
        <Box flex={1}>
          <Typography textTransform="capitalize" gutterBottom variant="h6">
            Delivery Information
          </Typography>

          <Card>
            <CardContent>
              <form id="basket-checkout" onSubmit={handleSubmit(onSubmit)}>
                <Box display="flex" gap={2} mb={2}>
                  <TextField
                    fullWidth
                    label="Name"
                    size="small"
                    variant="outlined"
                    {...register("name")}
                    error={errors.name ? true : false}
                    helperText={errors.name?.message}
                  />

                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    size="small"
                    variant="outlined"
                    {...register("email")}
                    error={errors.email ? true : false}
                    helperText={errors.email?.message}
                  />
                </Box>

                <Box display="flex" gap={2}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    size="small"
                    variant="outlined"
                    {...register("phoneNumber")}
                    error={errors.phoneNumber ? true : false}
                    helperText={errors.phoneNumber?.message}
                  />

                  <TextField
                    fullWidth
                    label="Address"
                    size="small"
                    variant="outlined"
                    {...register("address")}
                    error={errors.address ? true : false}
                    helperText={errors.address?.message}
                  />
                </Box>
              </form>
            </CardContent>
          </Card>
        </Box>

        <Box display="flex" flexDirection="column">
          <Typography textTransform="capitalize" gutterBottom variant="h6">
            Order summary
          </Typography>
          {basket?.items.map((item) => (
            <Card key={item.id} sx={{ width: 400, marginBottom: 2 }}>
              <CardContent>
                <Typography gutterBottom>Id: {item.id}</Typography>
                <Typography textTransform="capitalize" gutterBottom>
                  Price: £{item.price.toPrecision(4)}
                </Typography>
                <Typography textTransform="capitalize" gutterBottom>
                  Quantity: {item.quantity}
                </Typography>
                <Typography textTransform="capitalize" gutterBottom>
                  {catalogItem?.find((x) => x.id == item.catalogId)?.name}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleRemoveBasketItemClick(item.id)}
                >
                  Remove
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
