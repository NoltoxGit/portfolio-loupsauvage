(function () {
  "use strict";

  const PLUGIN_ID = "loupsauvage_uploader";
  const PLUGIN_VERSION = "2026.7.8";
  const STORAGE_KEYS = {
    apiBaseUrl: "loupsauvage_uploader.apiBaseUrl",
    apiToken: "loupsauvage_uploader.apiToken",
    remember: "loupsauvage_uploader.rememberSettings",
    legacy: "loupsauvage_uploader_settings",
  };

  let uploadAction = null;
  let forgetSettingsAction = null;
  let isUploading = false;
  let dialogStylesInjected = false;

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
    const replacements = {
      ß: "ss",
      æ: "ae",
      Æ: "AE",
      œ: "oe",
      Œ: "OE",
      ø: "o",
      Ø: "O",
      ł: "l",
      Ł: "L",
      đ: "d",
      Đ: "D",
      þ: "th",
      Þ: "TH",
      ð: "d",
      Ð: "D",
    };

    return String(value || "")
      .replace(/[ßæÆœŒøØłŁđĐþÞðÐ]/g, (char) => replacements[char] || "")
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

    return Boolean(
      apiBaseUrl &&
        String(values.apiToken || "").trim() &&
        String(values.title || "").trim() &&
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

  function bundlesEndpoint(apiBaseUrl, id) {
    try {
      const url = new URL("/api/integrations/blockbench/creation-bundles/", apiBaseUrl);

      if (id) {
        url.searchParams.set("id", String(id));
      }

      return url.toString();
    } catch (error) {
      throw new Error("URL API invalide. Utilise une URL complète, par exemple http://localhost:8000.");
    }
  }

  async function apiJson(url, apiToken, options) {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "X-Blockbench-Token": apiToken,
        ...(options && options.headers ? options.headers : {}),
      },
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload || payload.success !== true) {
      throw new Error(apiErrorMessage(payload, "La requête API LoupSauvage a échoué."));
    }

    return payload.data;
  }

  async function fetchBundles(apiBaseUrl, apiToken) {
    if (!apiBaseUrl || !apiToken) {
      return [];
    }

    return apiJson(bundlesEndpoint(apiBaseUrl), apiToken, { method: "GET" });
  }

  function selectedBundleIds(values, bundles) {
    return bundles
      .filter((bundle) => Boolean(values[`bundle_${bundle.id}`]))
      .map((bundle) => bundle.id);
  }

  function bundleOptions(bundles) {
    const options = {};

    bundles.forEach((bundle) => {
      options[bundle.id] = `${bundle.name} (${bundle.visibility === "unlisted" ? "non listé" : "public"})`;
    });

    return options;
  }

  function injectDialogStyles() {
    if (dialogStylesInjected || typeof document === "undefined") {
      return;
    }

    const style = document.createElement("style");
    style.id = "loupsauvage-uploader-dialog-style";
    style.textContent = `
      #loupsauvage_uploader_dialog .lsbb-section {
        border-top: 1px solid var(--color-border, rgba(255,255,255,.12));
        margin: 14px 0 8px;
        padding-top: 12px;
      }
      #loupsauvage_uploader_dialog .lsbb-section:first-child {
        border-top: 0;
        margin-top: 0;
        padding-top: 0;
      }
      #loupsauvage_uploader_dialog .lsbb-section-title {
        align-items: center;
        color: var(--color-accent, #7ecf86);
        display: flex;
        font-size: 12px;
        font-weight: 700;
        gap: 7px;
        letter-spacing: .02em;
        text-transform: uppercase;
      }
      #loupsauvage_uploader_dialog .lsbb-section-title::before,
      #loupsauvage_uploader_dialog button[data-lsbb-icon]::before {
        content: attr(data-lsbb-icon);
        direction: ltr;
        display: inline-block;
        font-family: 'Material Icons', 'Material Icons Outlined', sans-serif;
        font-feature-settings: 'liga';
        font-size: 18px;
        font-style: normal;
        font-weight: normal;
        line-height: 1;
        text-transform: none;
        vertical-align: -3px;
      }
      #loupsauvage_uploader_dialog .lsbb-section-help {
        color: var(--color-subtle_text, rgba(255,255,255,.62));
        font-size: 12px;
        line-height: 1.35;
        margin-top: 4px;
      }
      #loupsauvage_uploader_dialog .lsbb-field {
        border-radius: 6px;
      }
      #loupsauvage_uploader_dialog button[data-lsbb-icon] {
        align-items: center;
        display: inline-flex;
        gap: 6px;
        justify-content: center;
      }
    `;
    document.head.appendChild(style);
    dialogStylesInjected = true;
  }

  function findDialogField(dialog, key) {
    if (!dialog || !dialog.object) {
      return null;
    }

    return (
      dialog.object.querySelector(`[name="${key}"]`) ||
      dialog.object.querySelector(`#${key}`) ||
      dialog.object.querySelector(`[data-key="${key}"]`)
    );
  }

  function findDialogFieldRow(dialog, key) {
    const field = findDialogField(dialog, key);

    if (!field) {
      return null;
    }

    return (
      field.closest(".form_bar") ||
      field.closest(".form_field") ||
      field.closest(".dialog_form > *") ||
      field.closest("label") ||
      field.parentElement
    );
  }

  function insertDialogSection(dialog, beforeKey, title, help, icon) {
    const row = findDialogFieldRow(dialog, beforeKey);

    if (!row || !row.parentElement || row.previousElementSibling?.classList?.contains("lsbb-section")) {
      return;
    }

    const section = document.createElement("div");
    section.className = "lsbb-section";
    section.innerHTML = `
      <div class="lsbb-section-title" data-lsbb-icon="${icon}">${title}</div>
      <div class="lsbb-section-help">${help}</div>
    `;
    row.parentElement.insertBefore(section, row);
  }

  function markDialogFields(dialog, keys) {
    keys.forEach((key) => {
      const row = findDialogFieldRow(dialog, key);
      if (row) {
        row.classList.add("lsbb-field");
      }
    });
  }

  function iconizeDialogButtons(dialog) {
    if (!dialog || !dialog.object) {
      return;
    }

    const icons = {
      Envoyer: "cloud_upload",
      "Nouveau bundle": "add_circle",
      Renommer: "edit",
      Supprimer: "delete",
      Oublier: "lock_reset",
      Annuler: "close",
    };

    dialog.object.querySelectorAll("button").forEach((button) => {
      const label = String(button.textContent || "").trim();
      const icon = icons[label];

      if (icon) {
        button.dataset.lsbbIcon = icon;
      }
    });
  }

  function enhanceUploadDialog(dialog, bundles) {
    if (!dialog || !dialog.object || typeof document === "undefined") {
      return;
    }

    injectDialogStyles();

    dialog.object.classList.add("lsbb-dialog");
    insertDialogSection(
      dialog,
      "apiBaseUrl",
      "Connexion",
      "URL du site et token local. Le token n’est jamais affiche dans les logs.",
      "vpn_key"
    );
    insertDialogSection(
      dialog,
      "title",
      "Creation",
      "Le modele courant sera envoye en brouillon, avec un slug genere automatiquement cote site.",
      "deployed_code"
    );
    insertDialogSection(
      dialog,
      bundles.length > 0 ? `bundle_${bundles[0].id}` : "newBundleName",
      "Bundles",
      "Associe la creation a un ou plusieurs bundles, ou cree un nouveau bundle avant l’envoi.",
      "folder_special"
    );

    if (bundles.length > 0) {
      insertDialogSection(
        dialog,
        "manageBundleId",
        "Gestion rapide",
        "Renomme ou supprime un bundle sans quitter Blockbench.",
        "tune"
      );
    }

    markDialogFields(dialog, [
      "apiBaseUrl",
      "apiToken",
      "rememberSettings",
      "title",
      "shortDescription",
      "sourceContext",
      "sourceLabel",
      "modelViewerYawDegrees",
      "newBundleName",
      "newBundleVisibility",
      "manageBundleId",
      "manageBundleName",
      "manageBundleVisibility",
      ...bundles.map((bundle) => `bundle_${bundle.id}`),
    ]);
    iconizeDialogButtons(dialog);
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
    const slug = slugify(title);
    const shortDescription = String(formValues.shortDescription || "").trim();
    const sourceContext = String(formValues.sourceContext || "personal");
    const sourceLabel = String(formValues.sourceLabel || "").trim();
    const modelViewerYawDegrees = String(formValues.modelViewerYawDegrees || "180");

    validateRequired({ apiBaseUrl, apiToken, title, shortDescription, sourceContext });
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
      body.append("shortDescription", shortDescription);
      body.append("sourceContext", sourceContext);
      body.append("sourceLabel", sourceLabel);
      body.append("modelViewerYawDegrees", modelViewerYawDegrees);
      selectedBundleIds(formValues, formValues.__bundles || []).forEach((bundleId) => {
        body.append("bundleIds[]", String(bundleId));
      });
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

  async function openUploadDialog(preset) {
    const settings = {
      ...readStoredSettings(),
      ...(preset || {}),
    };
    const apiBaseUrl = normalizeBaseUrl(settings.apiBaseUrl || "");
    const apiToken = String(settings.apiToken || "").trim();
    const defaultTitle = projectName();
    let bundles = [];

    if (apiBaseUrl && apiToken) {
      try {
        bundles = await fetchBundles(apiBaseUrl, apiToken);
      } catch (error) {
        Blockbench.showQuickMessage("Bundles indisponibles avec ces paramètres.", 2600);
      }
    }

    const bundleFields = {};
    bundles.forEach((bundle) => {
      bundleFields[`bundle_${bundle.id}`] = {
        label: bundle.name,
        type: "checkbox",
        value: Array.isArray(settings.bundleIds) && settings.bundleIds.includes(bundle.id),
      };
    });

    const managementFields =
      bundles.length > 0
        ? {
            manageBundleId: {
              label: "Bundle à gérer",
              type: "select",
              options: bundleOptions(bundles),
              value: String(bundles[0].id),
            },
            manageBundleName: {
              label: "Nouveau nom",
              type: "text",
              value: "",
            },
            manageBundleVisibility: {
              label: "Nouvelle visibilité",
              type: "select",
              options: {
                public: "Public",
                unlisted: "Non listé",
              },
              value: "public",
            },
          }
        : {};

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
          value: settings.title || defaultTitle,
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
        ...bundleFields,
        newBundleName: {
          label: "Créer un bundle",
          type: "text",
          value: "",
          placeholder: "Pack dragons",
        },
        newBundleVisibility: {
          label: "Visibilité nouveau bundle",
          type: "select",
          options: {
            public: "Public",
            unlisted: "Non listé",
          },
          value: "public",
        },
        ...managementFields,
      },
      buttons: ["Envoyer", "Nouveau bundle", "Renommer", "Supprimer", "Oublier", "Annuler"],
      confirmIndex: 0,
      cancelIndex: 5,
      onFormChange(formValues) {
        setDialogConfirmEnabled(dialog, formValues);
      },
      onConfirm: async function (values) {
        if (isUploading) {
          return false;
        }

        try {
          values.__bundles = bundles;
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
        if (![1, 2, 3, 4].includes(buttonIndex)) {
          return;
        }

        const values = dialog.getFormResult ? dialog.getFormResult() : {};
        const nextPreset = {
          apiBaseUrl: values.apiBaseUrl,
          apiToken: values.apiToken,
          rememberSettings: values.rememberSettings,
          title: values.title,
          bundleIds: selectedBundleIds(values, bundles),
        };

        if (buttonIndex === 1) {
          void (async () => {
            const name = String(values.newBundleName || "").trim();

            if (!name) {
              Blockbench.showQuickMessage("Nom de bundle requis.", 2200);
              return;
            }

            try {
              await apiJson(bundlesEndpoint(normalizeBaseUrl(values.apiBaseUrl), String(values.apiToken || "").trim()), String(values.apiToken || "").trim(), {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  name,
                  visibility: values.newBundleVisibility || "public",
                }),
              });
              Blockbench.showQuickMessage("Bundle créé.", 2200);
              dialog.hide();
              void openUploadDialog(nextPreset);
            } catch (error) {
              Blockbench.showMessageBox({
                title: "Bundle impossible",
                message: error instanceof Error ? error.message : "Erreur inconnue.",
                buttons: ["OK"],
              });
            }
          })();
          return false;
        }

        if (buttonIndex === 2) {
          void (async () => {
            const id = Number(values.manageBundleId || 0);
            const name = String(values.manageBundleName || "").trim();

            if (!id || !name) {
              Blockbench.showQuickMessage("Choisis un bundle et un nouveau nom.", 2400);
              return;
            }

            try {
              await apiJson(bundlesEndpoint(normalizeBaseUrl(values.apiBaseUrl), id), String(values.apiToken || "").trim(), {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  name,
                  visibility: values.manageBundleVisibility || "public",
                }),
              });
              Blockbench.showQuickMessage("Bundle renommé.", 2200);
              dialog.hide();
              void openUploadDialog(nextPreset);
            } catch (error) {
              Blockbench.showMessageBox({
                title: "Bundle impossible",
                message: error instanceof Error ? error.message : "Erreur inconnue.",
                buttons: ["OK"],
              });
            }
          })();
          return false;
        }

        if (buttonIndex === 3) {
          void (async () => {
            const id = Number(values.manageBundleId || 0);

            if (!id) {
              return;
            }

            try {
              await apiJson(bundlesEndpoint(normalizeBaseUrl(values.apiBaseUrl), id), String(values.apiToken || "").trim(), {
                method: "DELETE",
              });
              Blockbench.showQuickMessage("Bundle supprimé.", 2200);
              dialog.hide();
              void openUploadDialog({
                ...nextPreset,
                bundleIds: nextPreset.bundleIds.filter((bundleId) => bundleId !== id),
              });
            } catch (error) {
              Blockbench.showMessageBox({
                title: "Suppression impossible",
                message: error instanceof Error ? error.message : "Erreur inconnue.",
                buttons: ["OK"],
              });
            }
          })();
          return false;
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
    enhanceUploadDialog(dialog, bundles);
    setTimeout(() => enhanceUploadDialog(dialog, bundles), 0);
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
        click() {
          void openUploadDialog();
        },
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
