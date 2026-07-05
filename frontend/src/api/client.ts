export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  public readonly code: string;
  public readonly fields: Record<string, string>;

  public constructor(code: string, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.fields = fields;
  }
}

export interface ApiClientOptions {
  baseUrl?: string;
}

const defaultBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ApiClientOptions = {},
): Promise<T> {
  const baseUrl = options.baseUrl ?? defaultBaseUrl;
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (payload && !payload.success) {
    throw new ApiError(payload.error.code, payload.error.message, payload.error.fields);
  }

  if (!response.ok || !payload) {
    throw new ApiError("HTTP_ERROR", `Request failed with status ${response.status}`);
  }

  return payload.data;
}
