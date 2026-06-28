import { useI18n } from "../../i18n/useI18n";

export function LoadingState({ label = "Chargement..." }: { label?: string }) {
  const { t } = useI18n();

  return (
    <div className="loading-state" role="status" aria-live="polite">
      {label === "Chargement..." ? t("state.loading") : label}
    </div>
  );
}
