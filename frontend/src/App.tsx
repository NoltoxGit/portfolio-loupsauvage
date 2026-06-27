import { routeForPath } from "./app/router";
import { CreationDetailPage } from "./pages/public/CreationDetailPage";
import { CreationsPage } from "./pages/public/CreationsPage";
import { HomePage } from "./pages/public/HomePage";
import { MarketplacePage } from "./pages/public/MarketplacePage";
import { NotFoundPage } from "./pages/public/NotFoundPage";
import { PricingPage } from "./pages/public/PricingPage";

export function App() {
  const route = routeForPath(window.location.pathname);

  if (route.name === "home") return <HomePage />;
  if (route.name === "creations") return <CreationsPage />;
  if (route.name === "creationDetail") return <CreationDetailPage slug={route.slug} />;
  if (route.name === "marketplace") return <MarketplacePage />;
  if (route.name === "pricing") return <PricingPage />;

  return <NotFoundPage />;
}
