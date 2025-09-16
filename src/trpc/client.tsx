"use client";
// ^-- to make sure we can mount the Provider from a server component
import superjson from "superjson";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, httpSubscriptionLink, splitLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import { makeQueryClient } from "./query-client";
import type { AppRouter } from "./routers/_app";

export const trpc = createTRPCReact<AppRouter>();
let browserQueryClient: QueryClient;
function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render. This may not be needed if we
  // have a suspense boundary BELOW the creation of the query client
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

function getUrl() {
  const base = (() => {
    // Add this env variable to your .env file
    // NEXT_PUBLIC_APP_URL="https://localhost:3000"
    if (typeof window !== "undefined") return "";
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  })();
  return `${base}/api/trpc`;
}

function getHeaders() {
  const headers: Record<string, string> = {};

  // Add authorization header from localStorage if available
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token"); // Match the key used in the app
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>
) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        splitLink({
          condition(op) {
            // Use subscription link for subscriptions
            return op.type === "subscription";
          },
          true: httpSubscriptionLink({
            transformer: superjson,
            url: getUrl(),
          }),
          false: httpBatchLink({
            transformer: superjson,
            url: getUrl(),
            headers: () => getHeaders(), // Make it a function so it gets called on each request
            // Custom fetch wrapper so we can react to 401 responses centrally
            fetch: async (input: URL | RequestInfo, init?: RequestInit) => {
              const res = await fetch(
                input as RequestInfo,
                init as RequestInit
              );
              if (typeof window !== "undefined" && res.status === 401) {
                try {
                  localStorage.removeItem("auth_token");
                  localStorage.removeItem("currentUser");
                } catch {}
                // Redirect to login to avoid repeat unauthenticated calls
                try {
                  window.location.href = "/auth/login";
                } catch {}
              }
              return res;
            },
          }),
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </trpc.Provider>
    </QueryClientProvider>
  );
}
