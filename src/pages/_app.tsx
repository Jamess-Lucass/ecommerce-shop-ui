import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import Layout from "@/components/layout";
import Head from "next/head";
import {
  ColorScheme,
  ColorSchemeProvider,
  MantineProvider,
  MediaQuery,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { useLocalStorage } from "@mantine/hooks";

const inter = Inter({ subsets: ["latin"], weight: "400" });

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: "mantine-color-scheme",
    defaultValue: "light",
    getInitialValueInEffect: true,
  });

  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));

  return (
    <ColorSchemeProvider
      colorScheme={colorScheme}
      toggleColorScheme={toggleColorScheme}
    >
      <MantineProvider
        theme={{
          colorScheme,
          globalStyles: (theme) => ({
            body: {
              backgroundColor:
                theme.colorScheme === "dark"
                  ? theme.colors.dark[7]
                  : theme.colors.gray[0],
            },
          }),
        }}
        withCSSVariables
        withGlobalStyles
        withNormalizeCSS
      >
        <Head>
          <title>Shop</title>
        </Head>
        <main className={inter.className}>
          <Layout>
            <MediaQuery largerThan="lg" styles={{ display: "none" }}>
              <Notifications position="top-right" />
            </MediaQuery>
            <MediaQuery smallerThan="lg" styles={{ display: "none" }}>
              <Notifications position="bottom-right" />
            </MediaQuery>
            <Component {...pageProps} />
          </Layout>
        </main>
      </MantineProvider>
    </ColorSchemeProvider>
  );
}
