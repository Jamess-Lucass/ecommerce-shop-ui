import { env } from "@/environment";
import { APIResponse, Catalog } from "@/types";
import { formatPrice } from "@/utils/format-price";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader,
  Title,
  Box,
  Card,
  Button,
  Text,
  Grid,
  Flex,
  Image,
  Group,
  Input,
  Highlight,
  Pagination,
  TextInput,
  Center,
  Anchor,
  Breadcrumbs,
  Drawer,
  ActionIcon,
  MediaQuery,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { ChangeEvent, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiFilter,
  FiSearch,
} from "react-icons/fi";
import { z } from "zod";

export const schema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

type Inputs = z.infer<typeof schema>;

export default function CatalogPage() {
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  });

  const [queryString, setQueryString] = useState<URLSearchParams>(
    new URLSearchParams("top=12&count=true")
  );

  const getCatalog = async (signal: AbortSignal | undefined) => {
    const response = await axios.get<APIResponse<Catalog>>(
      `${
        env.CATALOG_SERVICE_BASE_URL
      }/api/v1/catalog?${queryString.toString()}`,
      {
        signal,
        withCredentials: true,
      }
    );

    return response?.data;
  };

  const { data, isLoading } = useQuery(
    ["/api/v1/catalog", queryString.toString()],
    ({ signal }) => getCatalog(signal),
    {
      placeholderData: { value: [] },
      onError: () => {
        queryClient.setQueryData(["/api/v1/catalog", queryString.toString()], { value: [] })
      }
    }
  );

  const handleSearchInputOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTimeout(() => {
      const params = new URLSearchParams(queryString);
      params.set("search", event.target.value);
      setQueryString(params);
    }, 500);
  };

  const handlePageOnChange = (page: number) => {
    const params = new URLSearchParams(queryString);

    const top = Number(params.get("top"));
    const skip = (page - 1) * top;

    params.set("skip", skip.toString());

    setQueryString(params);
  };

  const handleResetFiltersOnClick = () => {
    reset();
    close();
    handleSubmit(onSubmit)();
  };

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    const params = new URLSearchParams(queryString);

    const filters = Object.entries(data)
      .filter(([, value]) => !!value)
      .map(([key, value]) => `${key} contains '${value}'`);

    if (filters.length > 0) {
      params.set("filter", filters.join(" and "));
    } else {
      params.delete("filter");
    }

    setQueryString(params);
    close();
  };

  const page =
    Number(queryString.get("skip") ?? 0) / Number(queryString.get("top") ?? 1) +
    1;
  const totalPages =
    Math.ceil((data?.count || 1) / Number(queryString.get("top"))) ?? 1;
  const searchTerm = queryString.get("search") ?? "";

  const FilterFormComponent = () => (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" gap={12}>
        <TextInput
          {...register("name")}
          label="Name"
          error={errors.name?.message}
          placeholder="T-Shirt"
        />

        <TextInput
          {...register("description")}
          label="Description"
          error={errors.description?.message}
          placeholder="A very cool T-Shirt"
        />

        <Flex justify="space-between" mt={16}>
          <Button color="red" onClick={handleResetFiltersOnClick}>
            Reset
          </Button>
          <Button type="submit">Apply</Button>
        </Flex>
      </Flex>
    </form>
  );

  return (
    <>
      <Breadcrumbs mb={22} separator=">" px={{ base: 0, lg: 48 }}>
        <Anchor href="/">Home</Anchor>
        <Text>Catalog</Text>
      </Breadcrumbs>

      <Flex gap={20}>
        <MediaQuery smallerThan="md" styles={{ display: "none" }}>
          <Card w="20%" h="fit-content">
            <Center mb={4}>Filters</Center>
            <FilterFormComponent />
          </Card>
        </MediaQuery>

        <Drawer opened={opened} onClose={close} title="Filters">
          <FilterFormComponent />
        </Drawer>

        <Flex sx={{ flex: 1 }} direction="column" gap={18}>
          <Flex align="center" gap={12}>
            <MediaQuery largerThan="md" styles={{ display: "none" }}>
              <ActionIcon onClick={open}>
                <FiFilter />
              </ActionIcon>
            </MediaQuery>

            <Input
              icon={<FiSearch />}
              placeholder="Search by name or description"
              onChange={handleSearchInputOnChange}
              sx={{ flex: 1 }}
            />
          </Flex>

          {data?.value.length === 0 && <Text>No results found.</Text>}

          {isLoading ? (
            <Loader />
          ) : (
            <Grid>
              {data.value.map((item) => (
                <Grid.Col key={item.id} sm={6} md={4} lg={3}>
                  <Card shadow="sm" radius="md" withBorder padding={12}>
                    <Card.Section>
                      <Image
                        src={item.images[0].url}
                        alt={item.name}
                      />
                    </Card.Section>

                    <Text weight={500} mt="md" mb="xs">
                      <Highlight highlight={searchTerm}>{item.name}</Highlight>
                    </Text>

                    <Text
                      size="sm"
                      color="dimmed"
                      lineClamp={2}
                      sx={{ minHeight: "3rem" }}
                    >
                      <Highlight highlight={searchTerm}>
                        {item.description}
                      </Highlight>
                    </Text>

                    <Group position="apart" mt="md">
                      <Text size="lg">£{formatPrice(item.price)}</Text>
                      <Link href={`/catalog/${item.id}`}>
                        <Button variant="light" color="blue" radius="md">
                          View
                        </Button>
                      </Link>
                    </Group>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          )}

          <Pagination.Root
            total={totalPages}
            onNextPage={() => handlePageOnChange(page + 1)}
            onPreviousPage={() => handlePageOnChange(page - 1)}
            onChange={(page) => handlePageOnChange(page)}
          >
            <Group spacing={7} position="center">
              <Pagination.First icon={FiChevronsLeft} />
              <Pagination.Previous icon={FiChevronLeft} />
              <Pagination.Items />
              <Pagination.Next icon={FiChevronRight} />
              <Pagination.Last icon={FiChevronsRight} />
            </Group>
          </Pagination.Root>
        </Flex>
      </Flex>
    </>
  );
}
