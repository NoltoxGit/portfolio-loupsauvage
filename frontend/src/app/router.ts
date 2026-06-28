export type AppRoute =
  | { name: "home" }
  | { name: "creations" }
  | { name: "creationDetail"; slug: string }
  | { name: "marketplace" }
  | { name: "pricing" }
  | { name: "adminLogin" }
  | { name: "adminDashboard" }
  | { name: "adminContentList"; contentType: "creation" | "marketplace" }
  | { name: "adminContentNew"; contentType: "creation" | "marketplace" }
  | { name: "adminContentEdit"; contentType: "creation" | "marketplace"; id: number }
  | { name: "adminContentPreview"; contentType: "creation" | "marketplace"; id: number }
  | { name: "adminPricingList" }
  | { name: "adminPricingNew" }
  | { name: "adminPricingEdit"; id: number }
  | { name: "notFound" };

export function routeForPath(pathname: string): AppRoute {
  const path = pathname.replace(/\/+$/, "") || "/";

  if (path === "/" || path === "/index.html") return { name: "home" };
  if (path === "/creations") return { name: "creations" };
  if (path === "/marketplace") return { name: "marketplace" };
  if (path === "/pricing") return { name: "pricing" };
  if (path === "/admin/login") return { name: "adminLogin" };
  if (path === "/admin") return { name: "adminDashboard" };
  if (path === "/admin/creations") return { name: "adminContentList", contentType: "creation" };
  if (path === "/admin/creations/new") return { name: "adminContentNew", contentType: "creation" };
  if (path === "/admin/marketplace") return { name: "adminContentList", contentType: "marketplace" };
  if (path === "/admin/marketplace/new") return { name: "adminContentNew", contentType: "marketplace" };
  if (path === "/admin/pricing") return { name: "adminPricingList" };
  if (path === "/admin/pricing/new") return { name: "adminPricingNew" };

  const adminContentPreviewMatch = path.match(/^\/admin\/(creations|marketplace)\/(\d+)\/preview$/);
  if (adminContentPreviewMatch) {
    return {
      name: "adminContentPreview",
      contentType: adminContentPreviewMatch[1] === "creations" ? "creation" : "marketplace",
      id: Number(adminContentPreviewMatch[2]),
    };
  }

  const adminContentMatch = path.match(/^\/admin\/(creations|marketplace)\/(\d+)$/);
  if (adminContentMatch) {
    return {
      name: "adminContentEdit",
      contentType: adminContentMatch[1] === "creations" ? "creation" : "marketplace",
      id: Number(adminContentMatch[2]),
    };
  }

  const adminPricingMatch = path.match(/^\/admin\/pricing\/(\d+)$/);
  if (adminPricingMatch) {
    return { name: "adminPricingEdit", id: Number(adminPricingMatch[1]) };
  }

  const creationMatch = path.match(/^\/creations\/([^/]+)$/);
  if (creationMatch) {
    return { name: "creationDetail", slug: decodeURIComponent(creationMatch[1]) };
  }

  return { name: "notFound" };
}
