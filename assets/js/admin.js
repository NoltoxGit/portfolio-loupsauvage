const ADMIN_STORAGE_KEY = "loupsauvage-site-data-prod-empty-v1";
const ADMIN_IMAGE_DB_NAME = "loupsauvage-site-images";
const ADMIN_IMAGE_STORE = "images";
const ADMIN_IMAGE_PREFIX = "ls-image:";
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const defaultAdminButtonSettings = {
  navDiscord: {
    title: "Navigation Discord",
    help: "Bouton Discord dans le menu.",
    label: "Discord",
    url: "index.html#discord",
  },
  heroPrimary: {
    title: "Hero - bouton principal",
    help: "Premier bouton dans le header de la page d'accueil.",
    label: "Me contacter sur Discord",
    url: "#discord",
  },
  heroSecondary: {
    title: "Hero - bouton secondaire",
    help: "Deuxieme bouton dans le header de la page d'accueil.",
    label: "Voir mes créations",
    url: "#creations",
  },
  creationsAll: {
    title: "Portfolio - voir tout",
    help: "Bouton sous les creations de la page d'accueil.",
    label: "Voir toutes les créations",
    url: "creations.html",
  },
  bestSellerCta: {
    title: "Best sellers - CTA section",
    help: "Bouton principal dans la section best sellers.",
    label: "Commander un best seller",
    url: "#discord",
  },
  contactDiscord: {
    title: "Contact - Discord",
    help: "Bouton de la section contact en bas de page.",
    label: "Rejoindre le Discord",
    url: "https://discord.gg/TtQK9rnwv3",
  },
  archiveOrder: {
    title: "Page creations - commander",
    help: "Bouton de commande sur la page toutes les creations.",
    label: "Commander une création",
    url: "index.html#discord",
  },
  archiveBack: {
    title: "Page creations - retour",
    help: "Bouton retour sur la page toutes les creations.",
    label: "Retour à l'accueil",
    url: "index.html#top",
  },
  packOrder: {
    title: "Cartes derniers packs",
    help: "Texte des boutons sur les cartes derniers packs. Le lien sert de fallback si aucun lien de pack n'est renseigne.",
    label: "Commander",
    url: "#discord",
  },
  bestSellerOrder: {
    title: "Cartes best seller",
    help: "Texte des boutons sur les cartes best seller. Le lien sert de fallback si aucun lien de best seller n'est renseigne.",
    label: "Commander",
    url: "#discord",
  },
};

const adminEscapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });

const cloneAdminData = (value) => JSON.parse(JSON.stringify(value));

const isDirectImageSource = (value) =>
  /^(data:image\/|blob:|https?:\/\/|file:)/i.test(String(value || ""));

const isStoredImageRef = (value) => String(value || "").startsWith(ADMIN_IMAGE_PREFIX);

const ADMIN_ASSET_PREFIX = document.body?.dataset.assetPrefix || "";

const adminAssetPath = (source) => {
  if (/^(\.{0,2}\/)?assets\//i.test(source)) {
    return source.startsWith("assets/") ? `${ADMIN_ASSET_PREFIX}${source}` : source;
  }

  return `${ADMIN_ASSET_PREFIX}assets/${source}`;
};

const adminImageSource = (image) => {
  const source = String(image || "").trim();
  if (!source) return "";
  if (isStoredImageRef(source)) return "";
  return isDirectImageSource(source) ? source : adminAssetPath(source);
};

const clampAdminNumber = (value, min, max, fallback) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
};

const adminCropValues = (item = {}) => ({
  cropX: clampAdminNumber(item.cropX, 0, 100, 50),
  cropY: clampAdminNumber(item.cropY, 0, 100, 50),
  cropZoom: clampAdminNumber(item.cropZoom, 100, 220, 100),
});

const adminCropStyle = (item = {}) => {
  const crop = adminCropValues(item);
  return `--crop-x: ${crop.cropX}%; --crop-y: ${crop.cropY}%; --crop-zoom: ${(crop.cropZoom / 100).toFixed(2)};`;
};

const openImageDB = () =>
  new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IDB_UNAVAILABLE"));
      return;
    }

    const request = indexedDB.open(ADMIN_IMAGE_DB_NAME, 1);
    request.addEventListener("upgradeneeded", () => {
      request.result.createObjectStore(ADMIN_IMAGE_STORE, { keyPath: "id" });
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error || new Error("IDB_OPEN")));
  });

const transactImageStore = async (mode, callback) => {
  const db = await openImageDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ADMIN_IMAGE_STORE, mode);
    const store = transaction.objectStore(ADMIN_IMAGE_STORE);
    const request = callback(store);

    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error || new Error("IDB_REQUEST")));
    transaction.addEventListener("complete", () => db.close());
    transaction.addEventListener("abort", () => {
      db.close();
      reject(transaction.error || new Error("IDB_ABORT"));
    });
  });
};

const storeUploadedImage = async (file) => {
  const id = `${Date.now()}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
  await transactImageStore("readwrite", (store) =>
    store.put({
      id,
      blob: file,
      name: file.name,
      type: file.type,
      size: file.size,
      updatedAt: new Date().toISOString(),
    })
  );
  return `${ADMIN_IMAGE_PREFIX}${id}`;
};

const loadStoredImageURL = async (reference) => {
  if (!isStoredImageRef(reference)) return adminImageSource(reference);
  const id = reference.slice(ADMIN_IMAGE_PREFIX.length);
  const record = await transactImageStore("readonly", (store) => store.get(id));
  return record?.blob ? URL.createObjectURL(record.blob) : "";
};

const readUploadedImage = (file) =>
  new Promise((resolve, reject) => {
    if (!file?.type?.startsWith("image/")) {
      reject(new Error("IMAGE_TYPE"));
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error("IMAGE_TOO_LARGE"));
      return;
    }

    storeUploadedImage(file).then(resolve).catch(() => reject(new Error("IMAGE_STORE")));
  });

const readUploadedImages = async (files = []) => {
  const imageFiles = Array.from(files).filter((file) => file?.size > 0);
  return Promise.all(imageFiles.map(readUploadedImage));
};

const sectionConfigs = {
  creations: {
    eyebrow: "Portfolio",
    title: "Créations",
    description: "Ajoute, modifie ou supprime les cartes affichées dans les créations.",
    type: "collection",
    dataKey: "creations",
    addLabel: "Ajouter la création",
    updateLabel: "Enregistrer la création",
    emptyLabel: "Aucune création pour le moment.",
    fields: [
      { key: "title", label: "Titre", required: true },
      { key: "type", label: "Type", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      { key: "cta", label: "Texte du CTA", placeholder: "Voir / commander" },
      { key: "image", label: "Image", type: "image" },
      { key: "gallery", label: "Galerie photos", type: "gallery" },
      { key: "sketchfab", label: "Lien Sketchfab", type: "url", placeholder: "https://sketchfab.com/3d-models/..." },
      {
        key: "size",
        label: "Format",
        type: "select",
        options: [
          ["standard", "Standard"],
          ["wide", "Large"],
          ["super-wide", "Super large"],
          ["tall", "Haute"],
        ],
      },
    ],
    defaults: {
      title: "",
      type: "Modèle",
      description: "",
      cta: "Voir / commander",
      image: "",
      gallery: [],
      sketchfab: "",
      size: "standard",
    },
  },
  pricing: {
    eyebrow: "Commandes",
    title: "Tarifs",
    description: "Gère les offres, les prix et les points inclus dans chaque carte.",
    type: "collection",
    dataKey: "pricing",
    addLabel: "Ajouter le tarif",
    updateLabel: "Enregistrer le tarif",
    emptyLabel: "Aucun tarif pour le moment.",
    fields: [
      { key: "title", label: "Titre", required: true },
      { key: "badge", label: "Badge", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      { key: "price", label: "Prix", required: true },
      { key: "details", label: "Points inclus", type: "list", required: true },
      {
        key: "tone",
        label: "Style",
        type: "select",
        options: [
          ["soft", "Doux"],
          ["featured", "Mis en avant"],
          ["warm", "Chaud"],
        ],
      },
    ],
    defaults: {
      title: "",
      badge: "Starter",
      description: "",
      price: "Sur devis",
      details: ["Texture incluse"],
      tone: "soft",
    },
  },
  featurePack: {
    disabled: true,
    eyebrow: "Nouveautés",
    title: "Pack mis en avant",
    description: "Modifie le grand pack affiché en tête de la section derniers packs.",
    type: "single",
    dataKey: "featurePack",
    addLabel: "Enregistrer le pack mis en avant",
    fields: [
      { key: "title", label: "Titre", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      { key: "badge", label: "Badge", required: true },
      { key: "cta", label: "Texte du CTA", required: true },
      { key: "status", label: "Statut", required: true },
      { key: "url", label: "Lien du pack", type: "url", placeholder: "https://..." },
      { key: "image", label: "Image", type: "image" },
      { key: "imageCrop", label: "Recadrage miniature", type: "crop", preview: "feature" },
    ],
    defaults: {
      title: "",
      description: "",
      badge: "Nouveau",
      cta: "Voir le pack",
      status: "Disponible",
      url: "",
      image: "",
      cropX: 50,
      cropY: 50,
      cropZoom: 100,
    },
  },
  packs: {
    eyebrow: "Nouveautés",
    title: "Derniers packs sortis",
    description: "Ajoute, retire ou modifie les packs secondaires de la section nouveautés.",
    type: "collection",
    dataKey: "packs",
    addLabel: "Ajouter le pack",
    updateLabel: "Enregistrer le pack",
    emptyLabel: "Aucun pack récent pour le moment.",
    fields: [
      { key: "title", label: "Titre", required: true },
      { key: "status", label: "Statut", required: true },
      { key: "url", label: "Lien du pack", type: "url", placeholder: "https://..." },
      { key: "image", label: "Image", type: "image" },
      { key: "imageCrop", label: "Recadrage miniature", type: "crop", preview: "pack" },
    ],
    defaults: {
      title: "",
      status: "Disponible",
      url: "",
      image: "",
      cropX: 50,
      cropY: 50,
      cropZoom: 100,
    },
  },
  marketplace: {
    eyebrow: "Best sellers",
    title: "Best sellers",
    description: "Gère les cartes de la section best sellers.",
    type: "collection",
    dataKey: "marketplace",
    addLabel: "Ajouter le best seller",
    updateLabel: "Enregistrer le best seller",
    emptyLabel: "Aucun best seller pour le moment.",
    fields: [
      { key: "title", label: "Titre", required: true },
      { key: "meta", label: "Info courte", required: true },
      { key: "tag", label: "Tag", required: true },
      { key: "url", label: "Lien du best seller", type: "url", placeholder: "https://..." },
      { key: "image", label: "Image", type: "image" },
      { key: "imageCrop", label: "Recadrage miniature", type: "crop", preview: "thumb" },
    ],
    defaults: {
      title: "",
      meta: "Favori serveurs",
      tag: "Top",
      url: "",
      image: "",
      cropX: 50,
      cropY: 50,
      cropZoom: 100,
    },
  },
  buttons: {
    eyebrow: "Reglages",
    title: "Boutons",
    description: "Modifie le texte et la redirection des boutons principaux du site.",
    type: "buttons",
    dataKey: "buttons",
    addLabel: "Enregistrer les boutons",
    emptyLabel: "Aucun bouton configure.",
  },
};

let adminState = loadAdminData();
let activeSection = "creations";
let editingIndex = null;

const createAdminId = (prefix = "item") =>
  `${prefix}-${Date.now()}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;

function normalizeAdminButtons(buttons = {}) {
  return Object.fromEntries(
    Object.entries(defaultAdminButtonSettings).map(([key, defaults]) => [
      key,
      {
        label: buttons?.[key]?.label ?? defaults.label,
        url: buttons?.[key]?.url ?? defaults.url,
      },
    ])
  );
}

function normalizeAdminData(data) {
  const base = cloneAdminData(window.LS_SITE_DATA || {});

  return {
    ...base,
    ...data,
    creations: Array.isArray(data?.creations) ? data.creations : base.creations || [],
    pricing: Array.isArray(data?.pricing) ? data.pricing : base.pricing || [],
    featurePack: {
      ...(base.featurePack || {}),
      ...(data?.featurePack || {}),
    },
    packs: Array.isArray(data?.packs) ? data.packs : base.packs || [],
    marketplace: Array.isArray(data?.marketplace) ? data.marketplace : base.marketplace || [],
    buttons: normalizeAdminButtons({
      ...(base.buttons || {}),
      ...(data?.buttons || {}),
    }),
  };
}

function loadAdminData() {
  try {
    const stored = JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY) || "null");
    return normalizeAdminData(stored || window.LS_SITE_DATA);
  } catch (error) {
    console.warn("Impossible de charger les données admin.", error);
    return normalizeAdminData(window.LS_SITE_DATA);
  }
}

function saveAdminData(message = "Modifications sauvegardées.") {
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminState));
    showStatus(message);
    return true;
  } catch (error) {
    console.error("Impossible de sauvegarder les données admin.", error);
    showStatus("Impossible de sauvegarder les données locales.");
    return false;
  }
}

function showStatus(message) {
  const target = document.querySelector("[data-admin-status]");
  if (!target) return;
  target.textContent = message;
  target.classList.add("is-visible");
  window.clearTimeout(showStatus.timeout);
  showStatus.timeout = window.setTimeout(() => target.classList.remove("is-visible"), 2200);
}

function getCurrentConfig() {
  return sectionConfigs[activeSection];
}

function getBlankItem(config) {
  return cloneAdminData(config.defaults || {});
}

function getFormItem(config) {
  if (config.type === "single") return { ...getBlankItem(config), ...(adminState[config.dataKey] || {}) };
  if (editingIndex === null) return getBlankItem(config);
  return { ...getBlankItem(config), ...(adminState[config.dataKey]?.[editingIndex] || {}) };
}

function fieldValue(item, field) {
  if (field.type === "list") return Array.isArray(item[field.key]) ? item[field.key].join("\n") : "";
  return item[field.key] ?? "";
}

function renderCropField(item, field) {
  const crop = adminCropValues(item);
  const previewSource = adminImageSource(item.image);
  const imageRef = isStoredImageRef(item.image) ? ` data-admin-image-ref="${adminEscapeHTML(item.image)}"` : "";
  const previewMedia =
    previewSource || imageRef
      ? `<img${
          previewSource ? ` src="${adminEscapeHTML(previewSource)}"` : ""
        } alt="" loading="lazy" data-admin-crop-preview-image${imageRef} />`
      : '<span class="admin-crop-placeholder">Ajoute une image pour previsualiser le recadrage.</span>';

  return `
    <div class="admin-field admin-crop-field" data-admin-crop-field>
      <span>${adminEscapeHTML(field.label)}</span>
      <div class="admin-crop-workspace">
        <div class="admin-crop-preview admin-crop-preview-${adminEscapeHTML(field.preview || "feature")}" style="${adminCropStyle(item)}">
          ${previewMedia}
        </div>
        <div class="admin-crop-controls">
          <label class="admin-range-field" for="admin-${activeSection}-crop-x">
            <span>Horizontal <strong data-crop-value="cropX">${crop.cropX}%</strong></span>
            <input
              id="admin-${activeSection}-crop-x"
              name="cropX"
              type="range"
              min="0"
              max="100"
              step="1"
              value="${crop.cropX}"
              data-admin-crop-control
            />
          </label>
          <label class="admin-range-field" for="admin-${activeSection}-crop-y">
            <span>Vertical <strong data-crop-value="cropY">${crop.cropY}%</strong></span>
            <input
              id="admin-${activeSection}-crop-y"
              name="cropY"
              type="range"
              min="0"
              max="100"
              step="1"
              value="${crop.cropY}"
              data-admin-crop-control
            />
          </label>
          <label class="admin-range-field" for="admin-${activeSection}-crop-zoom">
            <span>Zoom <strong data-crop-value="cropZoom">${crop.cropZoom}%</strong></span>
            <input
              id="admin-${activeSection}-crop-zoom"
              name="cropZoom"
              type="range"
              min="100"
              max="220"
              step="5"
              value="${crop.cropZoom}"
              data-admin-crop-control
            />
          </label>
        </div>
      </div>
      <small>Recadre la miniature sans modifier le fichier original.</small>
    </div>
  `;
}

function renderGalleryField(item, field) {
  const id = `admin-${activeSection}-${field.key}`;
  const images = Array.isArray(item[field.key]) ? item[field.key] : [];

  return `
    <div class="admin-field admin-gallery-field">
      <label for="${id}">
        <span>${adminEscapeHTML(field.label)}</span>
      </label>
      <input type="hidden" name="${adminEscapeHTML(field.key)}" value="${adminEscapeHTML(JSON.stringify(images))}" />
      <input
        id="${id}"
        name="${adminEscapeHTML(field.key)}Files"
        type="file"
        accept="image/*"
        multiple
      />
      ${
        images.length
          ? `<div class="admin-gallery-preview">
              ${images
                .map((image) => {
                  const source = adminImageSource(image);
                  const imageRef = isStoredImageRef(image)
                    ? ` data-admin-image-ref="${adminEscapeHTML(image)}"`
                    : "";
                  return `<span class="admin-gallery-thumb"><img${
                    source ? ` src="${adminEscapeHTML(source)}"` : ""
                  } alt="" loading="lazy"${imageRef} /></span>`;
                })
                .join("")}
            </div>
            <label class="admin-check-field">
              <input type="checkbox" name="${adminEscapeHTML(field.key)}Clear" value="1" />
              <span>Vider la galerie actuelle</span>
            </label>`
          : ""
      }
      <small>Ajoute plusieurs images pour la page detail. Les nouveaux fichiers sont ajoutes a la galerie existante.</small>
    </div>
  `;
}

function renderField(item, field) {
  const id = `admin-${activeSection}-${field.key}`;
  const value = fieldValue(item, field);
  const required = field.required ? "required" : "";

  if (field.type === "textarea" || field.type === "list") {
    return `
      <label class="admin-field" for="${id}">
        <span>${adminEscapeHTML(field.label)}</span>
        <textarea id="${id}" name="${adminEscapeHTML(field.key)}" rows="${field.type === "list" ? 4 : 3}" ${required}>${adminEscapeHTML(value)}</textarea>
        ${field.type === "list" ? '<small>Un point par ligne.</small>' : ""}
      </label>
    `;
  }

  if (field.type === "image") {
    const helperText = value
      ? "Image actuelle conservée si aucun nouveau fichier n'est choisi. Nouveau fichier max 50 Mo."
      : "Upload un PNG, JPG, WebP ou GIF, jusqu'à 50 Mo. Elle sera centrée automatiquement.";

    return `
      <div class="admin-field admin-image-field">
        <label for="${id}">
          <span>${adminEscapeHTML(field.label)}</span>
        </label>
        <input type="hidden" name="${adminEscapeHTML(field.key)}" value="${adminEscapeHTML(value)}" />
        <input
          id="${id}"
          name="${adminEscapeHTML(field.key)}File"
          type="file"
          accept="image/*"
          data-admin-image-input
        />
        <small>${adminEscapeHTML(helperText)}</small>
      </div>
    `;
  }

  if (field.type === "gallery") {
    return renderGalleryField(item, field);
  }

  if (field.type === "crop") {
    return renderCropField(item, field);
  }

  if (field.type === "select") {
    return `
      <label class="admin-field" for="${id}">
        <span>${adminEscapeHTML(field.label)}</span>
        <select id="${id}" name="${adminEscapeHTML(field.key)}" ${required}>
          ${(field.options || [])
            .map(
              ([optionValue, optionLabel]) => `
                <option value="${adminEscapeHTML(optionValue)}" ${String(value) === String(optionValue) ? "selected" : ""}>
                  ${adminEscapeHTML(optionLabel)}
                </option>
              `
            )
            .join("")}
        </select>
      </label>
    `;
  }

  return `
    <label class="admin-field" for="${id}">
      <span>${adminEscapeHTML(field.label)}</span>
      <input
        id="${id}"
        name="${adminEscapeHTML(field.key)}"
        type="${field.type === "url" ? "url" : "text"}"
        value="${adminEscapeHTML(value)}"
        placeholder="${adminEscapeHTML(field.placeholder || "")}"
        ${required}
      />
    </label>
  `;
}

function getAdminButtonItems() {
  return normalizeAdminButtons(adminState.buttons || {});
}

function renderButtonSettingsForm(config) {
  const buttons = getAdminButtonItems();

  return `
    <div class="admin-button-settings">
      ${Object.entries(defaultAdminButtonSettings)
        .map(([key, defaults]) => {
          const item = buttons[key] || defaults;
          return `
            <fieldset class="admin-button-group">
              <legend>${adminEscapeHTML(defaults.title)}</legend>
              <p>${adminEscapeHTML(defaults.help)}</p>
              <label class="admin-field" for="admin-button-${adminEscapeHTML(key)}-label">
                <span>Texte du bouton</span>
                <input
                  id="admin-button-${adminEscapeHTML(key)}-label"
                  name="${adminEscapeHTML(key)}__label"
                  type="text"
                  value="${adminEscapeHTML(item.label)}"
                  required
                />
              </label>
              <label class="admin-field" for="admin-button-${adminEscapeHTML(key)}-url">
                <span>Redirection</span>
                <input
                  id="admin-button-${adminEscapeHTML(key)}-url"
                  name="${adminEscapeHTML(key)}__url"
                  type="text"
                  value="${adminEscapeHTML(item.url)}"
                  placeholder="#discord, creations.html ou https://..."
                  required
                />
              </label>
            </fieldset>
          `;
        })
        .join("")}
    </div>
    <div class="admin-form-actions">
      <button class="button button-primary" type="submit">${adminEscapeHTML(config.addLabel)}</button>
    </div>
  `;
}

function renderTabs() {
  const tabs = document.querySelector("[data-admin-tabs]");
  if (!tabs) return;

  tabs.innerHTML = Object.entries(sectionConfigs)
    .filter(([, config]) => !config.disabled)
    .map(
      ([key, config]) => `
        <button class="admin-tab ${key === activeSection ? "is-active" : ""}" type="button" data-section="${key}">
          <span>${adminEscapeHTML(config.eyebrow)}</span>
          ${adminEscapeHTML(config.title)}
        </button>
      `
    )
    .join("");
}

function renderPanelHeading() {
  const config = getCurrentConfig();
  document.querySelector("[data-admin-eyebrow]").textContent = config.eyebrow;
  document.querySelector("[data-admin-title]").textContent = config.title;
  document.querySelector("[data-admin-description]").textContent = config.description;
}

function renderForm() {
  const config = getCurrentConfig();
  const form = document.querySelector("[data-admin-form]");
  if (!form) return;

  const item = getFormItem(config);
  const submitLabel =
    config.type === "collection" && editingIndex !== null ? config.updateLabel : config.addLabel;

  if (config.type === "buttons") {
    form.innerHTML = renderButtonSettingsForm(config);
    return;
  }

  form.innerHTML = `
    <div class="admin-form-grid">
      ${config.fields.map((field) => renderField(item, field)).join("")}
    </div>
    <div class="admin-form-actions">
      <button class="button button-primary" type="submit">${adminEscapeHTML(submitLabel)}</button>
      ${
        config.type === "collection" && editingIndex !== null
          ? '<button class="button button-secondary" type="button" data-admin-cancel>Annuler</button>'
          : ""
      }
    </div>
  `;
}

function updateCropPreview(field) {
  if (!field) return;
  const crop = {
    cropX: clampAdminNumber(field.querySelector('[name="cropX"]')?.value, 0, 100, 50),
    cropY: clampAdminNumber(field.querySelector('[name="cropY"]')?.value, 0, 100, 50),
    cropZoom: clampAdminNumber(field.querySelector('[name="cropZoom"]')?.value, 100, 220, 100),
  };
  const preview = field.querySelector(".admin-crop-preview");

  if (preview) {
    preview.style.setProperty("--crop-x", `${crop.cropX}%`);
    preview.style.setProperty("--crop-y", `${crop.cropY}%`);
    preview.style.setProperty("--crop-zoom", (crop.cropZoom / 100).toFixed(2));
  }

  const cropXLabel = field.querySelector('[data-crop-value="cropX"]');
  const cropYLabel = field.querySelector('[data-crop-value="cropY"]');
  const cropZoomLabel = field.querySelector('[data-crop-value="cropZoom"]');
  if (cropXLabel) cropXLabel.textContent = `${crop.cropX}%`;
  if (cropYLabel) cropYLabel.textContent = `${crop.cropY}%`;
  if (cropZoomLabel) cropZoomLabel.textContent = `${crop.cropZoom}%`;
}

function updateCropPreviews(root = document) {
  root.querySelectorAll("[data-admin-crop-field]").forEach(updateCropPreview);
}

function refreshAdminMedia(root = document) {
  updateCropPreviews(root || document);
  hydrateAdminImages();
}

function itemSummary(item, config) {
  if (config.dataKey === "pricing") return item.price || item.badge || "Tarif";
  if (config.dataKey === "packs") return item.status || "Pack";
  if (config.dataKey === "marketplace") return `${item.tag || "Best seller"} - ${item.meta || ""}`;
  if (config.dataKey === "featurePack") return `${item.badge || "Pack"} - ${item.status || ""}`;
  return item.type || "Création";
}

function itemDescription(item, config) {
  if (config.dataKey === "pricing") return item.description || (item.details || []).join(", ");
  if (config.dataKey === "marketplace") return item.meta || "";
  return item.description || item.status || "";
}

const adminCollectionSignatureKeys = [
  "id",
  "title",
  "type",
  "description",
  "cta",
  "sketchfab",
  "gallery",
  "status",
  "url",
  "meta",
  "tag",
  "badge",
  "price",
  "cropX",
  "cropY",
  "cropZoom",
];

const adminCollectionSignature = (item = {}) =>
  JSON.stringify(adminCollectionSignatureKeys.map((key) => item[key] ?? ""));

const adminCollectionTimestamp = (item = {}) =>
  Date.parse(item.createdAt || item.updatedAt || "") || 0;

function getOrderedCollectionItems(items = [], config) {
  const defaultItems = Array.isArray(window.LS_SITE_DATA?.[config.dataKey])
    ? window.LS_SITE_DATA[config.dataKey]
    : [];
  const defaultSignatures = new Set(defaultItems.map(adminCollectionSignature));

  return items
    .map((item, index) => ({
      item,
      index,
      timestamp: adminCollectionTimestamp(item),
      isCustom: !defaultSignatures.has(adminCollectionSignature(item)),
    }))
    .sort((first, second) => {
      if (first.timestamp || second.timestamp) {
        return second.timestamp - first.timestamp || second.index - first.index;
      }

      if (first.isCustom !== second.isCustom) return first.isCustom ? -1 : 1;
      if (first.isCustom && second.isCustom) return second.index - first.index;
      return first.index - second.index;
    });
}

function renderAdminThumb(item, config) {
  const previewImage = item.image || (Array.isArray(item.gallery) ? item.gallery[0] : "");
  if (!item.image && config.dataKey === "pricing") return '<div class="admin-list-icon">€</div>';
  if (!previewImage) return '<div class="admin-list-icon">LS</div>';
  const source = adminImageSource(previewImage);
  const imageRef = isStoredImageRef(previewImage) ? ` data-admin-image-ref="${adminEscapeHTML(previewImage)}"` : "";

  return `
    <div class="admin-list-thumb" style="${adminCropStyle(item)}">
      <img${source ? ` src="${adminEscapeHTML(source)}"` : ""} alt="" loading="lazy"${imageRef} />
    </div>
  `;
}

async function hydrateAdminImages() {
  const images = [...document.querySelectorAll("[data-admin-image-ref]")];
  await Promise.all(
    images.map(async (image) => {
      try {
        const source = await loadStoredImageURL(image.dataset.adminImageRef);
        if (source) image.src = source;
      } catch (error) {
        console.warn("Impossible de charger l'image locale.", error);
      }
    })
  );
}

function renderListItem(item, config, index) {
  return `
    <article class="admin-list-item">
      ${renderAdminThumb(item, config)}
      <div class="admin-list-copy">
        <span>${adminEscapeHTML(itemSummary(item, config))}</span>
        <h3>${adminEscapeHTML(item.title || "Sans titre")}</h3>
        <p>${adminEscapeHTML(itemDescription(item, config))}</p>
      </div>
      <div class="admin-list-actions">
        <button class="admin-mini-button" type="button" data-admin-edit="${index}">Modifier</button>
        <button class="admin-mini-button admin-danger" type="button" data-admin-delete="${index}">Supprimer</button>
      </div>
    </article>
  `;
}

function renderList() {
  const config = getCurrentConfig();
  const list = document.querySelector("[data-admin-list]");
  if (!list) return;

  if (config.type === "buttons") {
    const buttons = getAdminButtonItems();
    list.innerHTML = Object.entries(defaultAdminButtonSettings)
      .map(([key, defaults]) => {
        const item = buttons[key] || defaults;
        return `
          <article class="admin-list-item admin-list-item-button">
            <div class="admin-list-icon">CTA</div>
            <div class="admin-list-copy">
              <span>${adminEscapeHTML(defaults.title)}</span>
              <h3>${adminEscapeHTML(item.label || "Sans texte")}</h3>
              <p>${adminEscapeHTML(item.url || "Aucune redirection")}</p>
            </div>
          </article>
        `;
      })
      .join("");
    return;
  }

  if (config.type === "single") {
    const item = adminState[config.dataKey] || {};
    list.innerHTML = `
      <article class="admin-list-item admin-list-item-single">
        ${renderAdminThumb(item, config)}
        <div class="admin-list-copy">
          <span>${adminEscapeHTML(itemSummary(item, config))}</span>
          <h3>${adminEscapeHTML(item.title || "Pack mis en avant")}</h3>
          <p>${adminEscapeHTML(itemDescription(item, config))}</p>
        </div>
      </article>
    `;
    return;
  }

  const items = adminState[config.dataKey] || [];
  const orderedItems = getOrderedCollectionItems(items, config);
  list.innerHTML = orderedItems.length
    ? orderedItems.map(({ item, index }) => renderListItem(item, config, index)).join("")
    : `<p class="admin-empty">${adminEscapeHTML(config.emptyLabel)}</p>`;
}

async function buildItemFromForm(form, config) {
  const formData = new FormData(form);

  if (config.type === "buttons") {
    return Object.fromEntries(
      Object.keys(defaultAdminButtonSettings).map((key) => [
        key,
        {
          label: String(formData.get(`${key}__label`) || "").trim(),
          url: String(formData.get(`${key}__url`) || "").trim(),
        },
      ])
    );
  }

  const item = {};
  for (const field of config.fields) {
    if (field.type === "image") {
      const uploadedFile = formData.get(`${field.key}File`);
      const currentImage = String(formData.get(field.key) || "").trim();

      if (typeof File !== "undefined" && uploadedFile instanceof File && uploadedFile.size > 0) {
        item[field.key] = await readUploadedImage(uploadedFile);
        continue;
      }

      item[field.key] = currentImage;
      continue;
    }

    if (field.type === "gallery") {
      const currentGallery = (() => {
        try {
          const parsed = JSON.parse(String(formData.get(field.key) || "[]"));
          return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch (error) {
          return [];
        }
      })();
      const uploadedGallery = await readUploadedImages(formData.getAll(`${field.key}Files`));
      item[field.key] = [
        ...(formData.get(`${field.key}Clear`) ? [] : currentGallery),
        ...uploadedGallery,
      ];
      continue;
    }

    if (field.type === "crop") {
      item.cropX = clampAdminNumber(formData.get("cropX"), 0, 100, 50);
      item.cropY = clampAdminNumber(formData.get("cropY"), 0, 100, 50);
      item.cropZoom = clampAdminNumber(formData.get("cropZoom"), 100, 220, 100);
      continue;
    }

    const value = String(formData.get(field.key) || "").trim();
    item[field.key] =
      field.type === "list" ? value.split("\n").map((line) => line.trim()).filter(Boolean) : value;
  }

  return item;
}

function renderAdmin() {
  renderTabs();
  renderPanelHeading();
  renderForm();
  renderList();
  refreshAdminMedia();
}

document.addEventListener("input", (event) => {
  const cropControl = event.target.closest("[data-admin-crop-control]");
  if (!cropControl) return;
  updateCropPreview(cropControl.closest("[data-admin-crop-field]"));
});

document.addEventListener("change", (event) => {
  const imageInput = event.target.closest("[data-admin-image-input]");
  if (!imageInput) return;
  const file = imageInput.files?.[0];
  if (!file?.type?.startsWith("image/")) return;

  const form = imageInput.closest("[data-admin-form]");
  const previewImage = form?.querySelector("[data-admin-crop-preview-image]");
  if (!previewImage) return;

  if (previewImage.dataset.previewUrl) URL.revokeObjectURL(previewImage.dataset.previewUrl);
  const previewUrl = URL.createObjectURL(file);
  previewImage.dataset.previewUrl = previewUrl;
  previewImage.removeAttribute("data-admin-image-ref");
  previewImage.src = previewUrl;
});

document.addEventListener("click", (event) => {
  const sectionButton = event.target.closest("[data-section]");
  if (sectionButton) {
    activeSection = sectionButton.dataset.section;
    editingIndex = null;
    renderAdmin();
    return;
  }

  const editButton = event.target.closest("[data-admin-edit]");
  if (editButton) {
    editingIndex = Number(editButton.dataset.adminEdit);
    renderForm();
    refreshAdminMedia(document.querySelector("[data-admin-form]"));
    document.querySelector("[data-admin-form]")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const deleteButton = event.target.closest("[data-admin-delete]");
  if (deleteButton) {
    const config = getCurrentConfig();
    const index = Number(deleteButton.dataset.adminDelete);
    const item = adminState[config.dataKey]?.[index];
    if (!item || !window.confirm(`Supprimer "${item.title || "cet élément"}" ?`)) return;

    adminState[config.dataKey].splice(index, 1);
    editingIndex = null;
    saveAdminData("Élément supprimé.");
    renderAdmin();
    return;
  }

  if (event.target.closest("[data-admin-cancel]")) {
    editingIndex = null;
    renderForm();
    refreshAdminMedia(document.querySelector("[data-admin-form]"));
    return;
  }

  if (event.target.closest("[data-admin-reset]")) {
    if (!window.confirm("Réinitialiser toutes les données admin et revenir au contenu de base ?")) return;
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    adminState = loadAdminData();
    editingIndex = null;
    renderAdmin();
    showStatus("Données réinitialisées.");
    return;
  }

  if (event.target.closest("[data-admin-export]")) {
    const blob = new Blob([JSON.stringify(adminState, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "loupsauvage-site-data.json";
    link.click();
    URL.revokeObjectURL(link.href);
    showStatus("Export JSON généré.");
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-admin-form]");
  if (!form) return;
  event.preventDefault();

  const config = getCurrentConfig();
  let item;

  try {
    item = await buildItemFromForm(form, config);
  } catch (error) {
    console.error("Impossible de lire l'image uploadée.", error);
    showStatus(
      error.message === "IMAGE_TYPE"
        ? "Choisis un fichier image valide."
        : error.message === "IMAGE_TOO_LARGE"
          ? "Image trop lourde : limite 50 Mo."
          : "Impossible de lire cette image."
    );
    return;
  }

  if (config.type === "single") {
    adminState[config.dataKey] = item;
    saveAdminData("Pack mis en avant sauvegardé.");
    renderAdmin();
    return;
  }

  if (config.type === "buttons") {
    adminState[config.dataKey] = normalizeAdminButtons(item);
    saveAdminData("Boutons sauvegardes.");
    renderAdmin();
    return;
  }

  if (!Array.isArray(adminState[config.dataKey])) adminState[config.dataKey] = [];

  if (editingIndex === null) {
    const now = new Date().toISOString();
    adminState[config.dataKey].unshift({
      ...item,
      id: config.dataKey === "creations" ? item.id || createAdminId("creation") : item.id,
      createdAt: now,
      updatedAt: now,
    });
    saveAdminData("Élément ajouté.");
  } else {
    const previousItem = adminState[config.dataKey][editingIndex] || {};
    adminState[config.dataKey][editingIndex] = {
      ...previousItem,
      ...item,
      id: previousItem.id || (config.dataKey === "creations" ? createAdminId("creation") : item.id),
      createdAt: previousItem.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveAdminData("Élément modifié.");
  }

  editingIndex = null;
  renderAdmin();
});

function setupAdminNavigation() {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector("[data-menu]");
  if (!toggle || !menu) return;

  const setOpen = (isOpen) => {
    toggle.setAttribute("aria-expanded", String(isOpen));
    menu.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("nav-open", isOpen);
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  const onScroll = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

renderAdmin();
setupAdminNavigation();
