import { useI18n } from "../../i18n/useI18n";

export function LoadingState({ label }: { label?: string }) {
  const { t } = useI18n();

  return (
    <div className="loading-state" role="status" aria-live="polite">
      {label ?? t("state.loading")}
    </div>
  );
}
