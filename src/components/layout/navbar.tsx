import axios from "axios";
import { env } from "@/environment";
import { Basket } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useBasketIdStore } from "@/stores";
import { useAuth } from "@/contexts/auth-context";
import {
  Menu,
  Button,
  Avatar,
  Header,
  Image,
  Flex,
  Group,
  Text,
  useMantineColorScheme,
  ActionIcon,
  Indicator,
  Box,
} from "@mantine/core";
import Link from "next/link";
import {
  FiChevronDown,
  FiLogOut,
  FiMoon,
  FiPackage,
  FiShoppingCart,
  FiSun,
} from "react-icons/fi";
import { useStoreWrapper } from "@/hooks";

const routes = [{ name: "Catalog", to: "/catalog" }];

export default function Navbar() {
  const { user, signIn, signOut } = useAuth();
  const basketId = useStoreWrapper(useBasketIdStore, (state) => state.basketId);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

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

  const { data } = useQuery(
    ["/api/v1/baskets", basketId],
    ({ signal }) => getBasket(signal),
    {
      enabled: !!basketId,
    }
  );

  return (
    <Header height={60}>
      <Flex align="center" h="100%" justify="space-between" mx={16}>
        <Flex gap={12}>
          <Link href="/">
            <Image src="./logo.png" alt="Logo" width={32} />
          </Link>

          <Group>
            {routes.map(({ name, to }) => (
              <Link key={to} href={to}>
                {name}
              </Link>
            ))}
          </Group>
        </Flex>

        <Flex align="center" gap={12}>
          <ActionIcon component="a" href={`/basket/${basketId}`}>
            <Indicator
              inline={true}
              label={data?.items.length}
              size={16}
              disabled={!basketId || !data || data?.items.length === 0}
            >
              <FiShoppingCart />
            </Indicator>
          </ActionIcon>

          {user ? (
            <Menu
              width={200}
              position="bottom-end"
              transitionProps={{ transition: "pop-top-right" }}
              withinPortal
            >
              <Menu.Target>
                <Button variant="subtle" px={8}>
                  <Group spacing={3}>
                    <Avatar
                      src={user.avatarUrl}
                      alt={user.firstName}
                      radius="xl"
                      size={24}
                      imageProps={{ referrerPolicy: "no-referrer" }}
                    />
                    <Text weight={500} size="sm" sx={{ lineHeight: 1 }} mr={3}>
                      {user.firstName} {user.lastName}
                    </Text>
                    <FiChevronDown />
                  </Group>
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item icon={<FiPackage />} component="a" href="/orders">
                  Orders
                </Menu.Item>

                <Menu.Divider />

                <Menu.Item
                  icon={dark ? <FiSun /> : <FiMoon />}
                  onClick={() => toggleColorScheme()}
                >
                  Toggle Theme
                </Menu.Item>
                <Menu.Item color="red" icon={<FiLogOut />} onClick={signOut}>
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Button variant="subtle" onClick={signIn}>
              Login
            </Button>
          )}
        </Flex>
      </Flex>
    </Header>
  );
}
