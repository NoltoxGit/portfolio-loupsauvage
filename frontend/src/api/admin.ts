import { apiRequest } from "./client";
import type {
  AdminContentFilters,
  AdminContentItem,
  AdminContentPayload,
  AdminContentStatusPayload,
  AdminDashboardSummary,
  AdminPricingActivePayload,
  AdminPricingPayload,
  AdminPricingPlan,
} from "../types/admin";

const csrfHeaders = (csrfToken: string) => ({
  "X-CSRF-Token": csrfToken,
});

const queryString = (params: Record<string, string | number | boolean | undefined>) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  });

  const query = search.toString();

  return query === "" ? "" : `?${query}`;
};

export const getAdminDashboard = () => apiRequest<AdminDashboardSummary>("/admin/dashboard");

export const listAdminContent = (filters: AdminContentFilters = {}) =>
  apiRequest<AdminContentItem[]>(
    `/admin/content${queryString({
      type: filters.type,
      status: filters.status,
    })}`,
  );

export const getAdminContent = (id: number) => apiRequest<AdminContentItem>(`/admin/content${queryString({ id })}`);

export const createAdminContent = (payload: AdminContentPayload, csrfToken: string) =>
  apiRequest<AdminContentItem>("/admin/content", {
    method: "POST",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const updateAdminContent = (id: number, payload: AdminContentPayload, csrfToken: string) =>
  apiRequest<AdminContentItem>(`/admin/content${queryString({ id })}`, {
    method: "PUT",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const updateAdminContentStatus = (id: number, payload: AdminContentStatusPayload, csrfToken: string) =>
  apiRequest<AdminContentItem>(`/admin/content/status${queryString({ id })}`, {
    method: "PATCH",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const archiveAdminContent = (id: number, csrfToken: string) =>
  apiRequest<AdminContentItem>(`/admin/content${queryString({ id })}`, {
    method: "DELETE",
    headers: csrfHeaders(csrfToken),
  });

export const listAdminPricing = () => apiRequest<AdminPricingPlan[]>("/admin/pricing");

export const getAdminPricing = (id: number) => apiRequest<AdminPricingPlan>(`/admin/pricing${queryString({ id })}`);

export const createAdminPricing = (payload: AdminPricingPayload, csrfToken: string) =>
  apiRequest<AdminPricingPlan>("/admin/pricing", {
    method: "POST",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const updateAdminPricing = (id: number, payload: AdminPricingPayload, csrfToken: string) =>
  apiRequest<AdminPricingPlan>(`/admin/pricing${queryString({ id })}`, {
    method: "PUT",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const updateAdminPricingActive = (id: number, payload: AdminPricingActivePayload, csrfToken: string) =>
  apiRequest<AdminPricingPlan>(`/admin/pricing/active${queryString({ id })}`, {
    method: "PATCH",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });
