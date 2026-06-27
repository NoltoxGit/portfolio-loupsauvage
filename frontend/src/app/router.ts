export type AppRoute =
  | { name: "home" }
  | { name: "creations" }
  | { name: "creationDetail"; slug: string }
  | { name: "marketplace" }
  | { name: "pricing" }
  | { name: "adminLogin" }
  | { name: "adminDashboard" }
  | { name: "notFound" };

export function routeForPath(pathname: string): AppRoute {
  const path = pathname.replace(/\/+$/, "") || "/";

  if (path === "/" || path === "/index.html") return { name: "home" };
  if (path === "/creations") return { name: "creations" };
  if (path === "/marketplace") return { name: "marketplace" };
  if (path === "/pricing") return { name: "pricing" };
  if (path === "/admin/login") return { name: "adminLogin" };
  if (path === "/admin") return { name: "adminDashboard" };

  const creationMatch = path.match(/^\/creations\/([^/]+)$/);
  if (creationMatch) {
    return { name: "creationDetail", slug: decodeURIComponent(creationMatch[1]) };
  }

  return { name: "notFound" };
}
