import { Text, Title } from "@mantine/core";
import Link from "next/link";

export default function Home() {
  return (
    <Title order={5}>
      Welcome to the ecommerce shop, to start shopping please visit our{" "}
      <Link href="/catalog">
        <Text component="span">catalog</Text>
      </Link>
    </Title>
  );
}
