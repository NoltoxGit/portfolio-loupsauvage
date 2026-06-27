# 05 - Migration front-end

## Objectif

Porter le site public existant vers React/Vite/TypeScript en conservant le rendu visuel.

## Principe

Le HTML/CSS/JS actuel sert de référence visuelle. Il ne faut pas reconstruire le design librement.

## Pages publiques cible

```txt
/
/creations
/creations/:slug
/marketplace
/pricing
```

Fallback possible si les rewrites posent problème :

```txt
/index.html
/creations.html
/creation.html?slug=...
/marketplace.html
/pricing.html
```

## Découpage composants recommandé

```txt
components/layout/Header.tsx
components/layout/Footer.tsx
components/layout/PageShell.tsx

components/content/ContentCard.tsx
components/content/ContentGrid.tsx
components/content/ContentDetail.tsx
components/content/SketchfabEmbed.tsx
components/content/MediaGallery.tsx

components/pricing/PricingCard.tsx
components/pricing/PricingGrid.tsx

pages/public/HomePage.tsx
pages/public/CreationsPage.tsx
pages/public/CreationDetailPage.tsx
pages/public/MarketplacePage.tsx
pages/public/PricingPage.tsx
```

## Types front-end

Créer `frontend/src/types/content.ts` :

```ts
export type ContentType = 'creation' | 'marketplace';
export type ContentStatus = 'draft' | 'published' | 'archived';
export type ExternalPlatform = 'builtbybit' | 'mcmodels' | 'sketchfab' | 'other';

export interface ContentMedia {
  id: number;
  kind: 'cover' | 'gallery' | 'render' | 'thumbnail';
  path: string;
  alt: string | null;
  sortOrder: number;
}

export interface ContentItem {
  id: number;
  type: ContentType;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  sketchfabUrl: string | null;
  externalUrl: string | null;
  externalPlatform: ExternalPlatform | null;
  priceLabel: string | null;
  publishedAt: string | null;
  media: ContentMedia[];
}
```

Créer `frontend/src/types/pricing.ts` :

```ts
export interface PricingPlan {
  id: number;
  title: string;
  subtitle: string | null;
  priceLabel: string;
  description: string | null;
  features: string[];
  sortOrder: number;
}
```

## API client

Créer `frontend/src/api/client.ts` avec :

- base URL configurable ;
- gestion JSON ;
- gestion erreurs ;
- `credentials: 'include'` pour l'admin.

## CSS

Stratégie initiale :

1. importer le CSS existant dans React ;
2. vérifier que le rendu correspond ;
3. découper progressivement si nécessaire.

Ne pas convertir immédiatement en Tailwind ou CSS-in-JS. Cela augmenterait le risque de dérive visuelle.

## Checklist visuelle

Avant migration, capturer l'ancien site :

- home desktop 1920x1080 ;
- home desktop 1366x768 ;
- home mobile 390px ;
- créations desktop ;
- détail création desktop ;
- détail création mobile.

Après migration, comparer les écrans.

Critère d'acceptation : le site doit sembler identique pour un visiteur normal.
