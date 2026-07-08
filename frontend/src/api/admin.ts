import { apiRequest } from "./client";
import type {
  AdminContentFilters,
  AdminContentItem,
  AdminContentPayload,
  AdminContentStatusPayload,
  AdminCreationBundle,
  AdminCreationBundlePayload,
  AdminCreationBundleSyncPayload,
  AdminDashboardSummary,
  AdminMediaDeleteResult,
  AdminMediaItem,
  AdminMediaUpdatePayload,
  AdminMediaUploadPayload,
  AdminModelDeleteResult,
  AdminModelInfo,
  AdminModelPreviewPayload,
  AdminModelSettingsPayload,
  AdminModelUploadPayload,
  AdminPasswordPayload,
  AdminProfile,
  AdminBlockbenchTokenCreatePayload,
  AdminBlockbenchTokenCreateResult,
  AdminPricingActivePayload,
  AdminPricingPayload,
  AdminPricingPlan,
  BuiltByBitPreview,
  BuiltByBitPreviewPayload,
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

export const getAdminDashboard = () => apiRequest<AdminDashboardSummary>("/admin/dashboard/");

export const listAdminContent = (filters: AdminContentFilters = {}) =>
  apiRequest<AdminContentItem[]>(
    `/admin/content/${queryString({
      type: filters.type,
      status: filters.status,
    })}`,
  );

export const getAdminContent = (id: number) => apiRequest<AdminContentItem>(`/admin/content/${queryString({ id })}`);

export const createAdminContent = (payload: AdminContentPayload, csrfToken: string) =>
  apiRequest<AdminContentItem>("/admin/content/", {
    method: "POST",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const updateAdminContent = (id: number, payload: AdminContentPayload, csrfToken: string) =>
  apiRequest<AdminContentItem>(`/admin/content/${queryString({ id })}`, {
    method: "PUT",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const updateAdminContentStatus = (id: number, payload: AdminContentStatusPayload, csrfToken: string) =>
  apiRequest<AdminContentItem>(`/admin/content/status/${queryString({ id })}`, {
    method: "PATCH",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const archiveAdminContent = (id: number, csrfToken: string) =>
  apiRequest<AdminContentItem>(`/admin/content/${queryString({ id })}`, {
    method: "DELETE",
    headers: csrfHeaders(csrfToken),
  });

export const listAdminCreationBundles = () => apiRequest<AdminCreationBundle[]>("/admin/creation-bundles/");

export const getAdminCreationBundle = (id: number) =>
  apiRequest<AdminCreationBundle>(`/admin/creation-bundles/${queryString({ id })}`);

export const createAdminCreationBundle = (payload: AdminCreationBundlePayload, csrfToken: string) =>
  apiRequest<AdminCreationBundle>("/admin/creation-bundles/", {
    method: "POST",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const updateAdminCreationBundle = (id: number, payload: AdminCreationBundlePayload, csrfToken: string) =>
  apiRequest<AdminCreationBundle>(`/admin/creation-bundles/${queryString({ id })}`, {
    method: "PATCH",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const deleteAdminCreationBundle = (id: number, csrfToken: string) =>
  apiRequest<{ deleted: boolean }>(`/admin/creation-bundles/${queryString({ id })}`, {
    method: "DELETE",
    headers: csrfHeaders(csrfToken),
  });

export const syncAdminContentBundles = (
  contentId: number,
  payload: AdminCreationBundleSyncPayload,
  csrfToken: string,
) =>
  apiRequest<{ contentItemId: number; bundles: AdminCreationBundle[] }>(
    `/admin/creation-bundles/content/${queryString({ contentId })}`,
    {
      method: "POST",
      headers: csrfHeaders(csrfToken),
      body: JSON.stringify(payload),
    },
  );

export const listAdminPricing = () => apiRequest<AdminPricingPlan[]>("/admin/pricing/");

export const getAdminPricing = (id: number) => apiRequest<AdminPricingPlan>(`/admin/pricing/${queryString({ id })}`);

export const createAdminPricing = (payload: AdminPricingPayload, csrfToken: string) =>
  apiRequest<AdminPricingPlan>("/admin/pricing/", {
    method: "POST",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const updateAdminPricing = (id: number, payload: AdminPricingPayload, csrfToken: string) =>
  apiRequest<AdminPricingPlan>(`/admin/pricing/${queryString({ id })}`, {
    method: "PUT",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const updateAdminPricingActive = (id: number, payload: AdminPricingActivePayload, csrfToken: string) =>
  apiRequest<AdminPricingPlan>(`/admin/pricing/active/${queryString({ id })}`, {
    method: "PATCH",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const listAdminMedia = (contentId: number) =>
  apiRequest<AdminMediaItem[]>(`/admin/media/${queryString({ contentId })}`);

export const uploadAdminMedia = (payload: AdminMediaUploadPayload, csrfToken: string) => {
  const body = new FormData();
  body.set("contentItemId", String(payload.contentItemId));
  body.set("kind", payload.kind);

  if (payload.alt !== undefined && payload.alt !== null) {
    body.set("alt", payload.alt);
  }

  if (payload.sortOrder !== undefined) {
    body.set("sortOrder", String(payload.sortOrder));
  }

  body.set("file", payload.file);

  return apiRequest<AdminMediaItem>("/admin/media/upload/", {
    method: "POST",
    headers: csrfHeaders(csrfToken),
    body,
  });
};

export const updateAdminMedia = (id: number, payload: AdminMediaUpdatePayload, csrfToken: string) =>
  apiRequest<AdminMediaItem>(`/admin/media/${queryString({ id })}`, {
    method: "PUT",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const deleteAdminMedia = (id: number, csrfToken: string) =>
  apiRequest<AdminMediaDeleteResult>(`/admin/media/${queryString({ id })}`, {
    method: "DELETE",
    headers: csrfHeaders(csrfToken),
  });

export const uploadAdminModel = (payload: AdminModelUploadPayload, csrfToken: string) => {
  const body = new FormData();
  body.set("contentItemId", String(payload.contentItemId));
  body.set("file", payload.file);

  return apiRequest<AdminModelInfo>("/admin/model/", {
    method: "POST",
    headers: csrfHeaders(csrfToken),
    body,
  });
};

export const saveAdminModelPreview = (payload: AdminModelPreviewPayload, csrfToken: string) =>
  apiRequest<AdminModelInfo>("/admin/model/preview/", {
    method: "POST",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const updateAdminModelSettings = (payload: AdminModelSettingsPayload, csrfToken: string) =>
  apiRequest<AdminModelInfo>("/admin/model/", {
    method: "PUT",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const deleteAdminModel = (contentId: number, csrfToken: string) =>
  apiRequest<AdminModelDeleteResult>(`/admin/model/${queryString({ contentId })}`, {
    method: "DELETE",
    headers: csrfHeaders(csrfToken),
  });

export const previewBuiltByBitResource = (payload: BuiltByBitPreviewPayload, csrfToken: string) =>
  apiRequest<BuiltByBitPreview>("/admin/integrations/builtbybit/preview/", {
    method: "POST",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const getAdminProfile = () => apiRequest<AdminProfile>("/admin/profile/");

export const updateAdminPassword = (payload: AdminPasswordPayload, csrfToken: string) =>
  apiRequest<{ changed: boolean }>("/admin/profile/password/", {
    method: "POST",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const createAdminBlockbenchToken = (payload: AdminBlockbenchTokenCreatePayload, csrfToken: string) =>
  apiRequest<AdminBlockbenchTokenCreateResult>("/admin/profile/blockbench-tokens/", {
    method: "POST",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify(payload),
  });

export const revokeAdminBlockbenchToken = (id: number, csrfToken: string) =>
  apiRequest<{ revoked: boolean }>("/admin/profile/blockbench-tokens/revoke/", {
    method: "POST",
    headers: csrfHeaders(csrfToken),
    body: JSON.stringify({ id }),
  });
