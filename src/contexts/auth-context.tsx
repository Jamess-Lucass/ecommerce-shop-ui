import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { env } from "../environment";
import { User } from "../types";
import { LDContext, useLDClient } from "launchdarkly-react-client-sdk";

type AuthContextType = {
  user: User | undefined;
  signOut: () => void;
  signIn: () => void;
};

const AuthContext = createContext({} as AuthContextType);

type Props = {
  children: ReactNode;
};

export function AuthProvider({ children }: Props) {
  const ldClient = useLDClient();

  const getUser = async (signal?: AbortSignal) => {
    const response = await axios.get<User>(
      `${env.IDENTITY_SERVICE_BASE_URL}/api/v1/oauth/me`,
      {
        signal,
        withCredentials: true,
      }
    );

    return response?.data;
  };

  const { data: user } = useQuery<User>(["me"], ({ signal }) =>
    getUser(signal)
  );

  const signoutMutation = useMutation(
    () =>
      axios.post(
        `${env.IDENTITY_SERVICE_BASE_URL}/api/v1/oauth/signout`,
        {},
        {
          withCredentials: true,
        }
      ),
    {
      onSuccess: () => {
        window.location.href = `${env.LOGIN_UI_BASE_URL}?redirect_uri=${window.location.href}`;
      },
    }
  );

  const signIn = () => {
    window.location.href = `${env.LOGIN_UI_BASE_URL}?redirect_uri=${window.location.href}`;
  };

  const handleSignout = useCallback(() => {
    signoutMutation.mutate();
  }, [signoutMutation]);

  useEffect(() => {
    if (ldClient && user) {
      const context: LDContext = {
        kind: "user",
        key: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      };

      console.log("context", context);

      ldClient.identify(context);
    }
  }, [user, ldClient]);

  const value = useMemo(
    () => ({
      signOut: handleSignout,
      user: user,
      signIn,
    }),
    [user, handleSignout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => useContext(AuthContext);
