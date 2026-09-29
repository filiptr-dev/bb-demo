import "server-only";
import { cache } from "react";
import { api } from "./client";
import { cachedFetch, DAY, required, whenApi } from "./server";

// SKF grease selection chart + compatibility matrix; static data, changes only with an API deploy
export const getGreaseGuide = cache(async () => {
  await whenApi();
  const { data, response } = await api.GET("/api/v1/catalog/greases", { fetch: cachedFetch(DAY, ["catalog"]) });
  return required(data, response, "/catalog/greases");
});

// the response type (openapi-fetch reads the tempC tuple as number[])
export type GreaseGuide = Awaited<ReturnType<typeof getGreaseGuide>>;
