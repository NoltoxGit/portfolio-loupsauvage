export interface PricingPlan {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  priceLabel: string;
  description: string | null;
  features: string[];
  sortOrder: number;
  isActive?: boolean;
}
