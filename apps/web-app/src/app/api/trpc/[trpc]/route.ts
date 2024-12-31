import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@acme/api";

export const runtime = "edge";

/**
 * Configure basic CORS headers
 * You should extend this to match your needs
 */
const setCorsHeaders = (response: Response) => {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Request-Method", "*");
  response.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  response.headers.set("Access-Control-Allow-Headers", "*");
};

export const OPTIONS = () => {
  const response = new Response(null, {
    status: 204,
  });
  setCorsHeaders(response);
  return response;
};

const handler = async (request: Request) => {
  const response = await fetchRequestHandler({
    createContext: () =>
      createTRPCContext({
        headers: request.headers,
      }),
    endpoint: "/api/trpc",
    onError({ error, path }) {
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
    req: request,
    router: appRouter,
  });

  setCorsHeaders(response);
  return response;
};

export { handler as GET, handler as POST };
