(function () {
  "use strict";

  const PLUGIN_ID = "loupsauvage_uploader";
  const PLUGIN_VERSION = "2026.7.7";
  const STORAGE_KEYS = {
    apiBaseUrl: "loupsauvage_uploader.apiBaseUrl",
    apiToken: "loupsauvage_uploader.apiToken",
    remember: "loupsauvage_uploader.rememberSettings",
    legacy: "loupsauvage_uploader_settings",
  };

  let uploadAction = null;
  let forgetSettingsAction = null;
  let isUploading = false;

  function storageAvailable() {
    return typeof localStorage !== "undefined";
  }

  function readStoredSettings() {
    if (!storageAvailable()) {
      return {};
    }

    const settings = {
      apiBaseUrl: localStorage.getItem(STORAGE_KEYS.apiBaseUrl) || "",
      apiToken: localStorage.getItem(STORAGE_KEYS.apiToken) || "",
      rememberSettings: localStorage.getItem(STORAGE_KEYS.remember) === "1",
    };

    if (!settings.apiBaseUrl || !settings.apiToken) {
      try {
        const legacy = JSON.parse(localStorage.getItem(STORAGE_KEYS.legacy) || "{}");
        settings.apiBaseUrl = settings.apiBaseUrl || legacy.apiBaseUrl || "";
        settings.apiToken = settings.apiToken || legacy.apiToken || "";
        settings.rememberSettings = Boolean(settings.apiBaseUrl || settings.apiToken);
        localStorage.removeItem(STORAGE_KEYS.legacy);
      } catch (error) {
        return settings;
      }
    }

    return settings;
  }

  function saveStoredSettings(values) {
    if (!storageAvailable()) {
      return;
    }

    localStorage.setItem(STORAGE_KEYS.apiBaseUrl, normalizeBaseUrl(values.apiBaseUrl));
    localStorage.setItem(STORAGE_KEYS.apiToken, String(values.apiToken || "").trim());
    localStorage.setItem(STORAGE_KEYS.remember, "1");
    localStorage.removeItem(STORAGE_KEYS.legacy);
  }

  function forgetStoredSettings() {
    if (!storageAvailable()) {
      return;
    }

    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  }

  function normalizeBaseUrl(value) {
    return String(value || "").trim().replace(/\/+$/, "");
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

  function projectName() {
    return typeof Project !== "undefined" && Project && Project.name ? Project.name : "";
  }

  function getGltfCodec() {
    if (typeof Codecs !== "undefined" && Codecs && Codecs.gltf && typeof Codecs.gltf.compile === "function") {
      return Codecs.gltf;
    }

    if (typeof Codec !== "undefined" && Codec && typeof Codec.get === "function") {
      const codec = Codec.get("gltf");
      if (codec && typeof codec.compile === "function") {
        return codec;
      }
    }

    return null;
  }

  async function toArrayBuffer(value) {
    if (value instanceof ArrayBuffer) {
      return value;
    }

    if (ArrayBuffer.isView(value)) {
      return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
    }

    if (typeof Blob !== "undefined" && value instanceof Blob) {
      return value.arrayBuffer();
    }

    throw new Error("Blockbench n’a pas retourné de données GLB exploitables.");
  }

  function hasGlbSignature(buffer) {
    if (!buffer || buffer.byteLength < 20) {
      return false;
    }

    const bytes = new Uint8Array(buffer, 0, 4);

    return bytes[0] === 0x67 && bytes[1] === 0x6c && bytes[2] === 0x54 && bytes[3] === 0x46;
  }

  function childrenOf(node) {
    return node && Array.isArray(node.children) ? node.children : [];
  }

  function collectKnownOutlinerNodes() {
    const nodes = new Set();
    const constructors = ["Group", "Cube", "Mesh", "Locator", "TextureMesh"];

    constructors.forEach((name) => {
      const constructor = typeof window !== "undefined" ? window[name] : undefined;
      if (constructor && Array.isArray(constructor.all)) {
        constructor.all.forEach((node) => nodes.add(node));
      }
    });

    const walk = (node) => {
      if (!node || nodes.has(node)) {
        return;
      }

      nodes.add(node);
      childrenOf(node).forEach(walk);
    };

    if (typeof Outliner !== "undefined" && Outliner && Array.isArray(Outliner.root)) {
      Outliner.root.forEach(walk);
    }

    return Array.from(nodes);
  }

  function isHiddenThroughParents(node) {
    const visited = new Set();
    let current = node;

    while (current && typeof current === "object" && !visited.has(current)) {
      visited.add(current);

      if (current.visibility === false || current.visible === false) {
        return true;
      }

      current = current.parent && typeof current.parent === "object" ? current.parent : null;
    }

    return false;
  }

  function collectInheritedHiddenNodes() {
    const hidden = new Set();

    const walk = (node, parentHidden) => {
      if (!node || typeof node !== "object") {
        return;
      }

      const nodeHidden = parentHidden || node.visibility === false || node.visible === false;

      if (nodeHidden) {
        hidden.add(node);
      }

      childrenOf(node).forEach((child) => walk(child, nodeHidden));
    };

    if (typeof Outliner !== "undefined" && Outliner && Array.isArray(Outliner.root)) {
      Outliner.root.forEach((node) => walk(node, false));
    }

    collectKnownOutlinerNodes().forEach((node) => {
      if (isHiddenThroughParents(node)) {
        hidden.add(node);
      }
    });

    return hidden;
  }

  function applyHiddenOutlinerExportFilter() {
    const hiddenNodes = collectInheritedHiddenNodes();
    const backups = [];

    hiddenNodes.forEach((node) => {
      if (!node || typeof node !== "object") {
        return;
      }

      backups.push({
        node,
        hadOwnExport: Object.prototype.hasOwnProperty.call(node, "export"),
        exportValue: node.export,
        hadOwnVisibility: Object.prototype.hasOwnProperty.call(node, "visibility"),
        visibilityValue: node.visibility,
      });

      node.export = false;
      node.visibility = false;
    });

    return function restoreHiddenOutlinerExportFilter() {
      backups.reverse().forEach((backup) => {
        if (backup.hadOwnExport) {
          backup.node.export = backup.exportValue;
        } else {
          delete backup.node.export;
        }

        if (backup.hadOwnVisibility) {
          backup.node.visibility = backup.visibilityValue;
        } else {
          delete backup.node.visibility;
        }
      });
    };
  }

  async function exportProjectAsGlbBlob() {
    if (typeof Project === "undefined" || !Project) {
      throw new Error("Ouvre un modèle Blockbench avant de lancer l’envoi.");
    }

    const codec = getGltfCodec();
    if (!codec) {
      throw new Error("Le codec GLB natif de Blockbench est introuvable. Utilise Blockbench Desktop à jour.");
    }

    const restoreHiddenFilter = applyHiddenOutlinerExportFilter();
    let result;

    try {
      result = await codec.compile.call(codec, {
        encoding: "binary",
        embed_textures: true,
        animations: true,
      });
    } finally {
      restoreHiddenFilter();
    }

    const buffer = await toArrayBuffer(result);

    if (!hasGlbSignature(buffer)) {
      throw new Error("L’export Blockbench n’a pas produit un fichier .glb valide.");
    }

    return new Blob([buffer], { type: "model/gltf-binary" });
  }

  function validateRequired(values) {
    const requiredFields = [
      ["apiBaseUrl", "API Base URL"],
      ["apiToken", "API Token"],
      ["title", "Titre affiché"],
      ["slug", "Slug"],
      ["shortDescription", "Résumé court"],
      ["sourceContext", "Contexte de création"],
    ];

    const missing = requiredFields
      .filter(([key]) => String(values[key] || "").trim() === "")
      .map(([, label]) => label);

    if (missing.length > 0) {
      throw new Error(`Champs obligatoires manquants : ${missing.join(", ")}.`);
    }
  }

  function hasRequiredFormValues(values) {
    const apiBaseUrl = normalizeBaseUrl(values.apiBaseUrl);
    const slug = slugify(String(values.slug || "").trim() || values.title);

    return Boolean(
      apiBaseUrl &&
        String(values.apiToken || "").trim() &&
        String(values.title || "").trim() &&
        slug &&
        String(values.shortDescription || "").trim() &&
        String(values.sourceContext || "").trim()
    );
  }

  function setDialogConfirmEnabled(dialog, values) {
    if (!dialog || !dialog.object) {
      return;
    }

    const confirmButton = dialog.object.querySelector("button.confirm_btn");

    if (confirmButton) {
      confirmButton.disabled = isUploading || !hasRequiredFormValues(values || {});
    }
  }

  function creationEndpoint(apiBaseUrl) {
    try {
      return new URL("/api/integrations/blockbench/creations/", apiBaseUrl).toString();
    } catch (error) {
      throw new Error("URL API invalide. Utilise une URL complète, par exemple http://localhost:8000.");
    }
  }

  function apiErrorMessage(payload, fallback) {
    if (payload && payload.error && payload.error.message) {
      return payload.error.message;
    }

    return fallback;
  }

  async function uploadCreation(formValues, dialog) {
    if (isUploading) {
      return;
    }

    const apiBaseUrl = normalizeBaseUrl(formValues.apiBaseUrl);
    const apiToken = String(formValues.apiToken || "").trim();
    const title = String(formValues.title || "").trim();
    const slug = slugify(String(formValues.slug || "").trim() || title);
    const shortDescription = String(formValues.shortDescription || "").trim();
    const sourceContext = String(formValues.sourceContext || "personal");
    const sourceLabel = String(formValues.sourceLabel || "").trim();
    const modelViewerYawDegrees = String(formValues.modelViewerYawDegrees || "180");

    validateRequired({ apiBaseUrl, apiToken, title, slug, shortDescription, sourceContext });
    const endpoint = creationEndpoint(apiBaseUrl);

    if (formValues.rememberSettings) {
      saveStoredSettings({ apiBaseUrl, apiToken });
    } else {
      forgetStoredSettings();
    }

    isUploading = true;
    setDialogConfirmEnabled(dialog, formValues);

    try {
      Blockbench.showQuickMessage("Export du modèle en GLB…", 1800);
      const glbBlob = await exportProjectAsGlbBlob();

      if (!glbBlob || glbBlob.size <= 0) {
        throw new Error("Le fichier GLB exporté est vide.");
      }

      Blockbench.showQuickMessage("Envoi vers le portfolio…", 1800);

      const body = new FormData();
      body.append("title", title);
      body.append("slug", slug);
      body.append("shortDescription", shortDescription);
      body.append("sourceContext", sourceContext);
      body.append("sourceLabel", sourceLabel);
      body.append("modelViewerYawDegrees", modelViewerYawDegrees);
      body.append("file", glbBlob, `${slug || "model"}.glb`);

      Blockbench.showQuickMessage("Création du brouillon…", 1800);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "X-Blockbench-Token": apiToken,
        },
        body,
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload || payload.success !== true) {
        throw new Error(apiErrorMessage(payload, "L’envoi vers LoupSauvage a échoué."));
      }

      Blockbench.showQuickMessage("Création du brouillon terminée.", 1800);
      Blockbench.showMessageBox(
        {
          title: "LoupSauvage",
          message: `Création envoyée en brouillon.\n\n${payload.data.adminEditUrl || ""}`,
          buttons: payload.data.adminEditUrl ? ["Ouvrir l’admin", "OK"] : ["OK"],
        },
        (button) => {
          if (button === 0 && payload.data.adminEditUrl && typeof Blockbench.openLink === "function") {
            Blockbench.openLink(payload.data.adminEditUrl);
          }
        }
      );
    } finally {
      isUploading = false;
      setDialogConfirmEnabled(dialog, dialog && dialog.getFormResult ? dialog.getFormResult() : formValues);
    }
  }

  function openUploadDialog() {
    const settings = readStoredSettings();
    const defaultTitle = projectName();
    let slugWasEdited = false;

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
        rememberSettings: {
          label: "Se souvenir de ces paramètres",
          type: "checkbox",
          value: settings.rememberSettings !== false && Boolean(settings.apiBaseUrl || settings.apiToken),
        },
        title: {
          label: "Titre affiché",
          type: "text",
          value: defaultTitle,
        },
        slug: {
          label: "Slug / lien de page",
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
        sourceLabel: {
          label: "Label contexte personnalisé",
          type: "text",
          value: "",
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
      buttons: ["Envoyer", "Oublier les paramètres", "Annuler"],
      confirmIndex: 0,
      cancelIndex: 2,
      onFormChange(formValues) {
        const titleSlug = slugify(formValues.title);
        const currentSlug = slugify(formValues.slug);

        if (currentSlug && currentSlug !== titleSlug) {
          slugWasEdited = true;
        }

        if (!slugWasEdited && titleSlug && dialog.setFormValues) {
          dialog.setFormValues({ slug: titleSlug }, false);
          formValues.slug = titleSlug;
        }

        setDialogConfirmEnabled(dialog, formValues);
      },
      onConfirm: async function (values) {
        if (isUploading) {
          return false;
        }

        try {
          await uploadCreation(values, dialog);
          dialog.hide();
        } catch (error) {
          Blockbench.showMessageBox({
            title: "Envoi impossible",
            message: error instanceof Error ? error.message : "Erreur inconnue.",
            buttons: ["OK"],
          });
        }

        return false;
      },
      onButton(buttonIndex) {
        if (buttonIndex !== 1) {
          return;
        }

        forgetStoredSettings();

        if (dialog.setFormValues) {
          dialog.setFormValues(
            {
              apiBaseUrl: "",
              apiToken: "",
              rememberSettings: false,
            },
            false
          );
        }

        setDialogConfirmEnabled(dialog, dialog.getFormResult ? dialog.getFormResult() : {});
        Blockbench.showQuickMessage("Paramètres LoupSauvage oubliés.", 2200);

        return false;
      },
    });

    dialog.show();
    setDialogConfirmEnabled(dialog, dialog.getFormResult ? dialog.getFormResult() : {});
  }

  Plugin.register(PLUGIN_ID, {
    title: "LoupSauvage Uploader",
    author: "LoupSauvage",
    description: "Upload privé de créations GLB vers le portfolio LoupSauvage.",
    icon: "cloud_upload",
    version: PLUGIN_VERSION,
    variant: "desktop",
    onload() {
      uploadAction = new Action("loupsauvage_upload_creation", {
        name: "Envoyer sur LoupSauvage",
        description: "Créer une création brouillon avec le modèle GLB courant.",
        icon: "cloud_upload",
        click: openUploadDialog,
      });

      forgetSettingsAction = new Action("loupsauvage_forget_settings", {
        name: "Oublier les paramètres LoupSauvage",
        description: "Supprimer l’URL API et le token enregistrés localement.",
        icon: "delete",
        click() {
          forgetStoredSettings();
          Blockbench.showQuickMessage("Paramètres LoupSauvage oubliés.", 2200);
        },
      });

      MenuBar.addAction(uploadAction, "file.export");
      MenuBar.addAction(forgetSettingsAction, "file.export");
    },
    onunload() {
      if (uploadAction) {
        uploadAction.delete();
        uploadAction = null;
      }

      if (forgetSettingsAction) {
        forgetSettingsAction.delete();
        forgetSettingsAction = null;
      }
    },
  });
})();
