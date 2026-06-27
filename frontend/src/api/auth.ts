import { apiRequest } from "./client";
import type { AuthSession, LoginPayload } from "../types/auth";

export const getAuthSession = () => apiRequest<AuthSession>("/auth/me");

export const loginOwner = (payload: LoginPayload) =>
  apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const logoutOwner = (csrfToken: string) =>
  apiRequest<{ loggedOut: boolean }>("/auth/logout", {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken,
    },
  });
