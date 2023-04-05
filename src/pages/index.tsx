import { Link, Typography } from "@mui/material";
import NextLink from "next/link";

export default function Home() {
  return (
    <Typography variant="h5">
      Welcome to the ecommerce shop, to start shopping please visit our{" "}
      <Link component={NextLink} href="/catalog">
        catalog
      </Link>
    </Typography>
  );
}
