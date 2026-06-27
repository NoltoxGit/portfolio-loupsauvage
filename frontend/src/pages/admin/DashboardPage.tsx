import type { AuthSession } from "../../types/auth";

export function DashboardPage({ session }: { session: AuthSession }) {
  return (
    <>
      <div className="admin-panel-heading">
        <p className="eyebrow">Dashboard</p>
        <h2>Session owner active</h2>
        <p>La base d'authentification est prete. Les CRUD admin arriveront en Phase 4B/4C.</p>
      </div>
      <div className="admin-list">
        <article className="admin-list-item admin-list-item-single">
          <div className="admin-list-icon">ID</div>
          <div className="admin-list-copy">
            <span>Owner connecte</span>
            <h3>{session.user.username}</h3>
            <p>{session.user.email}</p>
          </div>
        </article>
      </div>
    </>
  );
}
