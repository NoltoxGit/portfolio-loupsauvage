export function ErrorState({ label = "Impossible de charger les donnees." }: { label?: string }) {
  return (
    <div className="error-state" role="alert">
      {label}
    </div>
  );
}
