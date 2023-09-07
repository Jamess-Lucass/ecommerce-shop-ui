import { Text, Title } from "@mantine/core";
import { withTransaction } from "@elastic/apm-rum-react";
import Link from "next/link";

function Home() {
  return (
    <Title order={5}>
      Welcome to the ecommerce shop, to start shopping please visit our{" "}
      <Link href="/catalog">
        <Text component="span">catalog</Text>
      </Link>
    </Title>
  );
}

export default withTransaction("Home", "component")(Home);
