import { AuthProvider } from "@/contexts/auth-context";
import { ErrorResponse } from "@/types";
import { Box } from "@mui/material";
import {
  QueryClient,
  MutationCache,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AxiosError } from "axios";
import { useSnackbar } from "notistack";
import { PropsWithChildren, useState } from "react";
import Navbar from "./navbar";

export default function Layout({ children }: PropsWithChildren) {
  const { enqueueSnackbar } = useSnackbar();

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

          enqueueSnackbar(
            err.response?.data.message ?? "Unknown error has occured",
            { variant: "error" }
          );
        },
      }),
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Box display="flex" flexDirection="column" minHeight="100vh">
          <Navbar />
          <Box padding={4}>{children}</Box>
        </Box>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
