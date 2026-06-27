import { useEffect, useState } from "react";
import { routeForPath } from "./app/router";
import { AdminGuard } from "./components/admin/AdminGuard";
import { navigateTo } from "./app/navigation";
import { AdminContentEditPage } from "./pages/admin/AdminContentEditPage";
import { AdminContentListPage } from "./pages/admin/AdminContentListPage";
import { AdminPricingEditPage } from "./pages/admin/AdminPricingEditPage";
import { AdminPricingListPage } from "./pages/admin/AdminPricingListPage";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { LoginPage } from "./pages/admin/LoginPage";
import { CreationDetailPage } from "./pages/public/CreationDetailPage";
import { CreationsPage } from "./pages/public/CreationsPage";
import { HomePage } from "./pages/public/HomePage";
import { MarketplacePage } from "./pages/public/MarketplacePage";
import { NotFoundPage } from "./pages/public/NotFoundPage";
import { PricingPage } from "./pages/public/PricingPage";

export function App() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const updateRoute = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", updateRoute);

    return () => window.removeEventListener("popstate", updateRoute);
  }, []);

  const route = routeForPath(pathname);
  const onUnauthenticated = () => navigateTo("/admin/login");

  if (route.name === "home") return <HomePage />;
  if (route.name === "creations") return <CreationsPage />;
  if (route.name === "creationDetail") return <CreationDetailPage slug={route.slug} />;
  if (route.name === "marketplace") return <MarketplacePage />;
  if (route.name === "pricing") return <PricingPage />;
  if (route.name === "adminLogin") return <AdminGuard>{(auth) => <LoginPage auth={auth} />}</AdminGuard>;
  if (route.name === "adminDashboard") {
    return (
      <AdminGuard>
        {(auth) => auth.session && <DashboardPage session={auth.session} onUnauthenticated={onUnauthenticated} />}
      </AdminGuard>
    );
  }
  if (route.name === "adminContentList") {
    return (
      <AdminGuard>
        {(auth) =>
          auth.session && (
            <AdminContentListPage
              contentType={route.contentType}
              csrfToken={auth.session.csrfToken}
              onUnauthenticated={onUnauthenticated}
            />
          )
        }
      </AdminGuard>
    );
  }
  if (route.name === "adminContentNew") {
    return (
      <AdminGuard>
        {(auth) =>
          auth.session && (
            <AdminContentEditPage
              contentType={route.contentType}
              csrfToken={auth.session.csrfToken}
              onUnauthenticated={onUnauthenticated}
            />
          )
        }
      </AdminGuard>
    );
  }
  if (route.name === "adminContentEdit") {
    return (
      <AdminGuard>
        {(auth) =>
          auth.session && (
            <AdminContentEditPage
              contentType={route.contentType}
              id={route.id}
              csrfToken={auth.session.csrfToken}
              onUnauthenticated={onUnauthenticated}
            />
          )
        }
      </AdminGuard>
    );
  }
  if (route.name === "adminPricingList") {
    return (
      <AdminGuard>
        {(auth) =>
          auth.session && (
            <AdminPricingListPage csrfToken={auth.session.csrfToken} onUnauthenticated={onUnauthenticated} />
          )
        }
      </AdminGuard>
    );
  }
  if (route.name === "adminPricingNew") {
    return (
      <AdminGuard>
        {(auth) =>
          auth.session && (
            <AdminPricingEditPage csrfToken={auth.session.csrfToken} onUnauthenticated={onUnauthenticated} />
          )
        }
      </AdminGuard>
    );
  }
  if (route.name === "adminPricingEdit") {
    return (
      <AdminGuard>
        {(auth) =>
          auth.session && (
            <AdminPricingEditPage
              id={route.id}
              csrfToken={auth.session.csrfToken}
              onUnauthenticated={onUnauthenticated}
            />
          )
        }
      </AdminGuard>
    );
  }

  return <NotFoundPage />;
}
