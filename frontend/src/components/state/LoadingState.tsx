export function LoadingState({ label = "Chargement..." }: { label?: string }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      {label}
    </div>
  );
}
