export const LEONARDO_BASE_URL = "https://cloud.leonardo.ai/api/rest/v1";

export interface LeonardoUser {
  id?: string | null;
  username?: string | null;
}

export interface LeonardoUserDetails {
  apiPaidTokens?: number | null;
  apiSubscriptionTokens?: number;
  subscriptionTokens?: number;
  user?: LeonardoUser | null;
}

export interface LeonardoMeResponse {
  user_details?: LeonardoUserDetails[];
}

export interface LeonardoGeneratedImage {
  id?: string | null;
  imageToVideo?: boolean | null;
  motion?: boolean | null;
  url?: string;
}

export type LeonardoJobStatus = "PENDING" | "COMPLETE" | "FAILED" | (string & {});

export interface LeonardoGeneration {
  id?: string | null;
  createdAt?: string;
  generated_images?: LeonardoGeneratedImage[];
  modelId?: string | null;
  status?: LeonardoJobStatus;
}

export interface LeonardoGenerationsResponse {
  generations?: LeonardoGeneration[];
}

export interface LeonardoClient {
  me(): Promise<LeonardoMeResponse>;
  generations(args: { userId: string; limit: number; offset: number }): Promise<LeonardoGenerationsResponse>;
}

export function createFixtureClient(
  me: LeonardoMeResponse,
  allGenerations: LeonardoGeneration[],
): LeonardoClient {
  return {
    async me() {
      return me;
    },
    async generations({ limit, offset }) {
      return { generations: allGenerations.slice(offset, offset + limit) };
    },
  };
}

export interface LeonardoHttpOpts {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export function createHttpClient(opts: LeonardoHttpOpts): LeonardoClient {
  const apiKey = opts.apiKey?.trim();
  if (!apiKey) {
    throw new Error(
      "Leonardo.ai Production API key required. Create one at " +
        "https://app.leonardo.ai/api-access and pass it to createHttpClient({ apiKey }).",
    );
  }
  const baseUrl = (opts.baseUrl ?? LEONARDO_BASE_URL).replace(/\/+$/, "");
  const doFetch = opts.fetchImpl ?? fetch;
  if (typeof doFetch !== "function") {
    throw new Error("Leonardo.ai adapter: global fetch unavailable; pass fetchImpl.");
  }
  const headers = { Authorization: `Bearer ${apiKey}`, Accept: "application/json" };

  async function request<T>(path: string): Promise<T> {
    const res = await doFetch(`${baseUrl}${path}`, { headers });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 500);
      throw new Error(
        `Leonardo.ai GET ${path} failed: ${res.status} ${res.statusText}` +
          (detail ? ` - ${detail}` : ""),
      );
    }
    return (await res.json()) as T;
  }

  return {
    me() {
      return request<LeonardoMeResponse>("/me");
    },
    generations({ userId, limit, offset }) {
      const path = `/generations/user/${encodeURIComponent(userId)}` +
        `?limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}`;
      return request<LeonardoGenerationsResponse>(path);
    },
  };
}
