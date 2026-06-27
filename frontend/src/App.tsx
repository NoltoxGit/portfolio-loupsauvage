import { routeForPath } from "./app/router";
import { AdminGuard } from "./components/admin/AdminGuard";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { LoginPage } from "./pages/admin/LoginPage";
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
  if (route.name === "adminLogin") return <AdminGuard>{(auth) => <LoginPage auth={auth} />}</AdminGuard>;
  if (route.name === "adminDashboard") {
    return <AdminGuard>{(auth) => auth.session && <DashboardPage session={auth.session} />}</AdminGuard>;
  }

  return <NotFoundPage />;
}
