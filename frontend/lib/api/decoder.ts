import { api, ApiRequestError } from "./client";
import type { components } from "./schema";

export type DecodedDesignation = components["schemas"]["DecodedDesignation"];
export type Segment = components["schemas"]["DesignationSegment"];

// Browser call (the decoder page decodes as you type): GET /api/v1/catalog/decode
export async function decodeDesignation(designation: string, signal?: AbortSignal): Promise<DecodedDesignation> {
  const { data, response } = await api.GET("/api/v1/catalog/decode", { params: { query: { designation } }, signal });
  if (!data) throw new ApiRequestError(response.status, "/catalog/decode");
  return data;
}
