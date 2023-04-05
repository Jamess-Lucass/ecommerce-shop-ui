import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import {
  createTheme,
  CssBaseline,
  ThemeProvider,
  useMediaQuery,
} from "@mui/material";
import { useMemo } from "react";
import Layout from "@/components/layout";
import { SnackbarProvider } from "notistack";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"], weight: "400" });

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
        },
      }),
    [prefersDarkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider maxSnack={3}>
        <CssBaseline />
        <Head>
          <title>Shop</title>
        </Head>
        <main className={inter.className}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </main>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
