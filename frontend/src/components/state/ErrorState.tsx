import { useI18n } from "../../i18n/useI18n";

export function ErrorState({ label }: { label?: string }) {
  const { t } = useI18n();

  return (
    <div className="error-state" role="alert">
      {label ?? t("state.error")}
    </div>
  );
}
