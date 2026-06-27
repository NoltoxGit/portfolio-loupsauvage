import type { ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";
import { LoginPage } from "../../pages/admin/LoginPage";
import { LoadingState } from "../state/LoadingState";
import { AdminLayout } from "./AdminLayout";

export function AdminGuard({ children }: { children: (auth: ReturnType<typeof useAuth>) => ReactNode }) {
  const auth = useAuth();

  if (auth.loading) {
    return <LoadingState label="Verification de la session admin..." />;
  }

  if (!auth.session) {
    return <LoginPage auth={auth} />;
  }

  return (
    <AdminLayout session={auth.session} onLogout={auth.logout}>
      {children(auth)}
    </AdminLayout>
  );
}
