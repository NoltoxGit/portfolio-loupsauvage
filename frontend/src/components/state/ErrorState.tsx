import { useI18n } from "../../i18n/useI18n";

export function ErrorState({ label = "Impossible de charger les donnees." }: { label?: string }) {
  const { t } = useI18n();

  return (
    <div className="error-state" role="alert">
      {label === "Impossible de charger les donnees." ? t("state.error") : label}
    </div>
  );
}
