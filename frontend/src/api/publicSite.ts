import { apiRequest } from "./client";
import type { ContentItem, CreationBundle, CreationsArchivePayload } from "../types/content";
import type { PricingPlan } from "../types/pricing";

export interface SitePayload {
  latestCreations: ContentItem[];
  marketplace: ContentItem[];
  pricing: PricingPlan[];
}

const api = <T>(path: string) => apiRequest<T>(path, {}, { baseUrl: "" });

export const getSite = () => api<SitePayload>("/api/public/site");

export const getCreations = () => api<CreationsArchivePayload>("/api/public/creations");

export const getCreation = (slug: string) =>
  api<ContentItem>(`/api/public/creations?slug=${encodeURIComponent(slug)}`);

export const getCreationBundle = (slug: string) =>
  api<CreationBundle>(`/api/public/creation-bundles/${encodeURIComponent(slug)}/`);

export const getMarketplace = () => api<ContentItem[]>("/api/public/marketplace");

export const getPricing = () => api<PricingPlan[]>("/api/public/pricing");
