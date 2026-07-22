"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useClerk, useUser } from "@clerk/nextjs";

type UserState = ReturnType<typeof useUser>;
type ClerkState = ReturnType<typeof useClerk>;

type OptionalAuthValue = {
  isLoaded: UserState["isLoaded"];
  isSignedIn: UserState["isSignedIn"];
  user: UserState["user"];
  openSignIn: ClerkState["openSignIn"];
  openSignUp: ClerkState["openSignUp"];
  signOut: ClerkState["signOut"];
};

const localOpenSignIn: ClerkState["openSignIn"] = () => undefined;
const localOpenSignUp: ClerkState["openSignUp"] = () => undefined;
const localSignOut: ClerkState["signOut"] = async () => undefined;

const localAuth: OptionalAuthValue = {
  isLoaded: true,
  isSignedIn: false,
  user: null,
  openSignIn: localOpenSignIn,
  openSignUp: localOpenSignUp,
  signOut: localSignOut
};

const OptionalAuthContext = createContext<OptionalAuthValue>(localAuth);

export function ClerkAuthBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { openSignIn, openSignUp, signOut } = useClerk();
  const value = useMemo<OptionalAuthValue>(() => ({
    isLoaded,
    isSignedIn,
    user,
    openSignIn,
    openSignUp,
    signOut
  }), [isLoaded, isSignedIn, openSignIn, openSignUp, signOut, user]);

  return <OptionalAuthContext.Provider value={value}>{children}</OptionalAuthContext.Provider>;
}

export function useOptionalAuth() {
  return useContext(OptionalAuthContext);
}
