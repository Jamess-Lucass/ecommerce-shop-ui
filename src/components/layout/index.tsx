import { AuthProvider } from "@/contexts/auth-context";
import { ErrorResponse } from "@/types";
import {
  QueryClient,
  MutationCache,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AxiosError } from "axios";
import { PropsWithChildren, useState } from "react";
import Navbar from "./navbar";
import { notifications } from "@mantine/notifications";
import { AppShell, MediaQuery } from "@mantine/core";

export default function Layout({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
        },
      },
      mutationCache: new MutationCache({
        onError: (error) => {
          const err = error as AxiosError<ErrorResponse>;

          notifications.show({
            message: err.response?.data.message ?? "Unknown error has occured",
            color: "red",
          });
        },
      }),
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell header={<Navbar />}>{children}</AppShell>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
