(function () {
  "use strict";

  const PLUGIN_ID = "loupsauvage_uploader";
  const PLUGIN_VERSION = "0.1.0";
  const STORAGE_KEY = "loupsauvage_uploader_settings";

  let uploadAction = null;

  function readSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  }

  function saveSettings(values) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        apiBaseUrl: values.apiBaseUrl || "",
        apiToken: values.apiToken || "",
      })
    );
  }

  function normalizeBaseUrl(value) {
    return String(value || "").replace(/\/+$/, "");
  }

  function slugify(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-");
  }

  async function exportProjectAsGlbBlob() {
    // TODO: brancher ici l’export GLB natif Blockbench quand l’API exacte est figée.
    // La fonction reste isolée pour éviter d’inventer une API Blockbench fragile.
    throw new Error("L’export GLB automatique doit encore être branché dans Blockbench.");
  }

  async function uploadCreation(formValues) {
    const apiBaseUrl = normalizeBaseUrl(formValues.apiBaseUrl);
    const apiToken = String(formValues.apiToken || "").trim();
    const title = String(formValues.title || "").trim();
    const shortDescription = String(formValues.shortDescription || "").trim();
    const sourceContext = String(formValues.sourceContext || "personal");
    const modelViewerYawDegrees = String(formValues.modelViewerYawDegrees || "180");
    const slug = String(formValues.slug || "").trim() || slugify(title);

    if (!apiBaseUrl || !apiToken || !title || !shortDescription) {
      Blockbench.showQuickMessage("Renseigne l’URL API, le token, le titre et le résumé.", 3000);
      return;
    }

    const glbBlob = await exportProjectAsGlbBlob();
    const body = new FormData();
    body.append("title", title);
    body.append("slug", slug);
    body.append("shortDescription", shortDescription);
    body.append("sourceContext", sourceContext);
    body.append("modelViewerYawDegrees", modelViewerYawDegrees);
    body.append("file", glbBlob, `${slug || "model"}.glb`);

    const response = await fetch(`${apiBaseUrl}/api/integrations/blockbench/creations/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload || payload.success !== true) {
      const message = payload && payload.error && payload.error.message
        ? payload.error.message
        : "L’envoi vers LoupSauvage a échoué.";
      throw new Error(message);
    }

    saveSettings({ apiBaseUrl, apiToken });
    Blockbench.showMessageBox({
      title: "LoupSauvage",
      message: `Création envoyée en brouillon : ${payload.data.title}`,
      buttons: ["OK"],
    });
  }

  function openUploadDialog() {
    const settings = readSettings();
    const defaultTitle = typeof Project !== "undefined" && Project && Project.name ? Project.name : "";

    const dialog = new Dialog({
      id: "loupsauvage_uploader_dialog",
      title: "Envoyer sur LoupSauvage",
      form: {
        apiBaseUrl: {
          label: "API Base URL",
          type: "text",
          value: settings.apiBaseUrl || "",
          placeholder: "https://loupsauvage.fr",
        },
        apiToken: {
          label: "API Token",
          type: "password",
          value: settings.apiToken || "",
        },
        title: {
          label: "Titre affiché",
          type: "text",
          value: defaultTitle,
        },
        slug: {
          label: "Slug",
          type: "text",
          value: slugify(defaultTitle),
        },
        shortDescription: {
          label: "Résumé court",
          type: "textarea",
          value: "",
        },
        sourceContext: {
          label: "Contexte de création",
          type: "select",
          options: {
            personal: "Création personnelle",
            private_commission: "Commission privée",
            other: "Autre",
          },
          value: "personal",
        },
        modelViewerYawDegrees: {
          label: "Orientation",
          type: "select",
          options: {
            0: "0°",
            90: "90°",
            180: "180°",
            270: "270°",
          },
          value: "180",
        },
      },
      onConfirm: async function (values) {
        try {
          await uploadCreation(values);
          dialog.hide();
        } catch (error) {
          Blockbench.showMessageBox({
            title: "Envoi impossible",
            message: error instanceof Error ? error.message : "Erreur inconnue.",
            buttons: ["OK"],
          });
        }
      },
    });

    dialog.show();
  }

  Plugin.register(PLUGIN_ID, {
    title: "LoupSauvage Uploader",
    author: "LoupSauvage",
    description: "Upload privé de créations GLB vers le portfolio LoupSauvage.",
    icon: "cloud_upload",
    version: PLUGIN_VERSION,
    variant: "both",
    onload() {
      uploadAction = new Action("loupsauvage_upload_creation", {
        name: "Envoyer sur LoupSauvage",
        description: "Créer une création brouillon avec le modèle GLB courant.",
        icon: "cloud_upload",
        click: openUploadDialog,
      });

      MenuBar.addAction(uploadAction, "file.export");
    },
    onunload() {
      if (uploadAction) {
        uploadAction.delete();
        uploadAction = null;
      }
    },
  });
})();
