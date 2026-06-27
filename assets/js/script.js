const LS_STORAGE_KEY = "loupsauvage-site-data-prod-empty-v1";
const LS_LANGUAGE_KEY = window.LS_LANGUAGE_KEY || "loupsauvage-language";
const LS_IMAGE_DB_NAME = "loupsauvage-site-images";
const LS_IMAGE_STORE = "images";
const LS_IMAGE_PREFIX = "ls-image:";

const supportedLanguages = Object.keys(window.LS_I18N || { fr: {} });

const getInitialLanguage = () => {
  const urlLanguage = new URLSearchParams(window.location.search).get("lang");
  const storedLanguage = localStorage.getItem(LS_LANGUAGE_KEY);
  const candidate = urlLanguage || storedLanguage || "fr";
  const language = supportedLanguages.includes(candidate) ? candidate : "fr";
  localStorage.setItem(LS_LANGUAGE_KEY, language);
  return language;
};

const currentLanguage = getInitialLanguage();
const currentTranslations = window.LS_I18N?.[currentLanguage] || window.LS_I18N?.fr || {};

const cloneData = (value) => JSON.parse(JSON.stringify(value));
const defaultSiteData = cloneData(window.LS_SITE_DATA || {});

const siteRoutes = {
  homeTop: "index.html#top",
  homeCreations: "index.html#creations",
  homeDiscord: "index.html#discord",
  creations: "creations.html",
  creationDetail: "creation.html",
};

const currentPageHref = (id, fallback) => (document.getElementById(id) ? `#${id}` : fallback);

const routeTargets = {
  creations: currentPageHref("creations", siteRoutes.homeCreations),
  discord: currentPageHref("discord", siteRoutes.homeDiscord),
};

const defaultButtonSettings = {
  navDiscord: { label: "Discord", url: routeTargets.discord },
  heroPrimary: { label: "Me contacter sur Discord", url: routeTargets.discord },
  heroSecondary: { label: "Voir mes creations", url: routeTargets.creations },
  creationsAll: { label: "Voir toutes les creations", url: routeTargets.creations },
  bestSellerCta: { label: "Commander un best seller", url: routeTargets.discord },
  contactDiscord: { label: "Rejoindre le Discord", url: "https://discord.gg/TtQK9rnwv3" },
  archiveOrder: { label: "Commander une creation", url: routeTargets.discord },
  archiveBack: { label: "Retour a l'accueil", url: routeTargets.homeTop },
  packOrder: { label: "Commander", url: routeTargets.discord },
  bestSellerOrder: { label: "Commander", url: routeTargets.discord },
};

const getTranslation = (path, fallback = "") =>
  path.split(".").reduce((value, key) => value?.[key], currentTranslations) ?? fallback;

const valuesMatch = (first, second) => JSON.stringify(first) === JSON.stringify(second);

const applyTranslatedFields = (item = {}, translatedItem = {}, defaultItem = {}) =>
  Object.entries(translatedItem).reduce(
    (translated, [key, value]) => ({
      ...translated,
      [key]: valuesMatch(item[key], defaultItem?.[key]) ? value : item[key],
    }),
    { ...item }
  );

const applyDataTranslations = (items = [], translatedItems = [], defaultItems = []) =>
  items.map((item, index) =>
    applyTranslatedFields(item, translatedItems[index] || {}, defaultItems[index] || {})
  );

const readStoredSiteData = () => {
  const baseData = cloneData(defaultSiteData);

  try {
    const storedData = JSON.parse(localStorage.getItem(LS_STORAGE_KEY) || "null");
    if (!storedData || typeof storedData !== "object") return baseData;

    return {
      ...baseData,
      ...storedData,
      creations: Array.isArray(storedData.creations) ? storedData.creations : baseData.creations,
      pricing: Array.isArray(storedData.pricing) ? storedData.pricing : baseData.pricing,
      packs: Array.isArray(storedData.packs) ? storedData.packs : baseData.packs,
      marketplace: Array.isArray(storedData.marketplace) ? storedData.marketplace : baseData.marketplace,
      buttons: {
        ...(baseData.buttons || {}),
        ...(storedData.buttons || {}),
      },
    };
  } catch (error) {
    console.warn("Impossible de lire les données locales.", error);
    return baseData;
  }
};

const translateSiteData = (data) => {
  const translatedData = currentTranslations.data || {};
  if (!translatedData || currentLanguage === "fr") return data;

  return {
    ...data,
    creations: applyDataTranslations(data.creations, translatedData.creations, defaultSiteData.creations),
    pricing: applyDataTranslations(data.pricing, translatedData.pricing, defaultSiteData.pricing),
    packs: applyDataTranslations(data.packs, translatedData.packs, defaultSiteData.packs),
    marketplace: applyDataTranslations(data.marketplace, translatedData.marketplace, defaultSiteData.marketplace),
  };
};

const siteData = translateSiteData(readStoredSiteData());
const discordHref = document.querySelector("#discord") ? "#discord" : "index.html#discord";

const collectionSignatureKeys = [
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

const collectionSignature = (item = {}) =>
  JSON.stringify(collectionSignatureKeys.map((key) => item[key] ?? ""));

const collectionTimestamp = (item = {}) =>
  Date.parse(item.createdAt || item.updatedAt || "") || 0;

const newestFirst = (items = [], defaultItems = []) => {
  const defaultSignatures = new Set(defaultItems.map(collectionSignature));

  return items
    .map((item, index) => ({
      item,
      index,
      timestamp: collectionTimestamp(item),
      isCustom: !defaultSignatures.has(collectionSignature(item)),
    }))
    .sort((first, second) => {
      if (first.timestamp || second.timestamp) {
        return second.timestamp - first.timestamp || second.index - first.index;
      }

      if (first.isCustom !== second.isCustom) return first.isCustom ? -1 : 1;
      if (first.isCustom && second.isCustom) return second.index - first.index;
      return first.index - second.index;
    })
    .map(({ item }) => item);
};

const slugify = (value) =>
  String(value || "creation")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "creation";

const creationIdentifier = (creation = {}, index = 0) =>
  creation.id || creation.slug || `${slugify(creation.title)}-${index + 1}`;

const creationDetailHref = (creation, index = 0) =>
  `creation.html?id=${encodeURIComponent(creationIdentifier(creation, index))}`;

const escapeHTML = (value) =>
  String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });

const isStoredImageRef = (value) => String(value || "").startsWith(LS_IMAGE_PREFIX);

const openImageDB = () =>
  new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IDB_UNAVAILABLE"));
      return;
    }

    const request = indexedDB.open(LS_IMAGE_DB_NAME, 1);
    request.addEventListener("upgradeneeded", () => {
      request.result.createObjectStore(LS_IMAGE_STORE, { keyPath: "id" });
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error || new Error("IDB_OPEN")));
  });

const loadStoredImageURL = async (reference) => {
  if (!isStoredImageRef(reference)) return "";
  const db = await openImageDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LS_IMAGE_STORE, "readonly");
    const request = transaction.objectStore(LS_IMAGE_STORE).get(reference.slice(LS_IMAGE_PREFIX.length));

    request.addEventListener("success", () => {
      const record = request.result;
      resolve(record?.blob ? URL.createObjectURL(record.blob) : "");
    });
    request.addEventListener("error", () => reject(request.error || new Error("IDB_REQUEST")));
    transaction.addEventListener("complete", () => db.close());
    transaction.addEventListener("abort", () => {
      db.close();
      reject(transaction.error || new Error("IDB_ABORT"));
    });
  });
};

const imageSource = (image) => {
  const source = String(image || "").trim();
  if (!source || isStoredImageRef(source)) return "";
  return /^(data:image\/|blob:|https?:\/\/|file:)/i.test(source) ? source : source;
};

const visualTheme = (theme) => escapeHTML(theme || "forest");

const clampNumber = (value, min, max, fallback) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
};

const imageCropValues = (item = {}) => {
  const cropX = clampNumber(item.cropX, 0, 100, 50);
  const cropY = clampNumber(item.cropY, 0, 100, 50);
  const cropZoom = clampNumber(item.cropZoom, 100, 220, 100) / 100;

  return {
    cropX,
    cropY,
    baseScale: (cropZoom * 1.01).toFixed(3),
    hoverScale: (cropZoom * 1.08).toFixed(3),
  };
};

const imageCropStyle = (item = {}) => {
  const crop = imageCropValues(item);

  return [
    `--image-focus-x: ${crop.cropX}%`,
    `--image-focus-y: ${crop.cropY}%`,
    `--image-base-scale: ${crop.baseScale}`,
    `--image-hover-scale: ${crop.hoverScale}`,
  ].join("; ");
};

const getSafeHref = (value, fallback = "#") => {
  const href = String(value || "").trim();
  if (!href) return fallback;
  if (/^(https?:\/\/|mailto:|tel:|#|\.{0,2}\/|[a-z0-9_-]+\.html(?:[?#].*)?)/i.test(href)) return href;
  return fallback;
};

const linkAttributes = (value, fallback = "#") => {
  const href = getSafeHref(value, fallback);
  const isExternal = /^https?:\/\//i.test(href);
  return `href="${escapeHTML(href)}"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ""}`;
};

const getButtonSetting = (key) => ({
  ...(defaultButtonSettings[key] || { label: "", url: "#" }),
  ...(currentTranslations.buttons?.[key] || {}),
  ...(siteData.buttons?.[key] || {}),
});

const getButtonLabel = (key) => getButtonSetting(key).label || defaultButtonSettings[key]?.label || "";
const getButtonUrl = (key, fallback = "#") => getButtonSetting(key).url || fallback;

const applyButtonHref = (element, value, fallback) => {
  const href = getSafeHref(value, fallback);
  element.setAttribute("href", href);

  if (/^https?:\/\//i.test(href)) {
    element.setAttribute("target", "_blank");
    element.setAttribute("rel", "noopener noreferrer");
    return;
  }

  element.removeAttribute("target");
  element.removeAttribute("rel");
};

const applyButtonSettings = () => {
  document.querySelectorAll("[data-button]").forEach((element) => {
    const setting = getButtonSetting(element.dataset.button);
    if (setting.label) element.textContent = setting.label;
    if (element.matches("a")) applyButtonHref(element, setting.url, element.getAttribute("href") || "#");
  });
};

const creationGridColumns = 12;
const creationTabletColumns = 6;
const homeCreationRows = 3;
const homeCreationMinSpan = 2;
const homeCreationMaxPerRow = creationGridColumns / homeCreationMinSpan;
const archiveCreationMaxPerRow = 4;
const archiveCreationTabletMaxPerRow = 2;
const creationBaseSpans = {
  standard: 3,
  wide: 5,
  "super-wide": 12,
  tall: 4,
};

const clampCreationSpan = (span, max = creationGridColumns) =>
  Math.max(1, Math.min(max, Number(span) || creationBaseSpans.standard));

const getCreationBaseSpan = (size) =>
  clampCreationSpan(creationBaseSpans[size] || creationBaseSpans.standard);

const getCreationTabletBaseSpan = (size) =>
  size === "super-wide" ? creationTabletColumns : creationTabletColumns / 2;

const getCreationFitHeight = (span) => {
  if (span >= 10) return "410px";
  if (span >= 6) return "350px";
  return "0px";
};

const splitIntoBalancedRows = (itemCount, maxRows = homeCreationRows, maxPerRow = homeCreationMaxPerRow) => {
  if (!itemCount) return [];

  const rowCount = Math.min(maxRows, Math.ceil(itemCount / maxPerRow));
  const baseRowSize = Math.floor(itemCount / rowCount);
  let remainingItems = itemCount % rowCount;

  return Array.from({ length: rowCount }, () => baseRowSize + (remainingItems-- > 0 ? 1 : 0));
};

const distributeRowSpans = (itemCount, columns = creationGridColumns) => {
  const baseSpan = Math.floor(columns / itemCount);
  let remainingColumns = columns % itemCount;

  return Array.from({ length: itemCount }, () => baseSpan + (remainingColumns-- > 0 ? 1 : 0));
};

const getBalancedSpans = (itemCount, maxPerRow, columns, maxRows = Number.POSITIVE_INFINITY) =>
  splitIntoBalancedRows(itemCount, maxRows, maxPerRow).flatMap((rowSize) =>
    distributeRowSpans(rowSize, columns)
  );

const getHomeTabletSpan = (desktopSpan) => {
  if (desktopSpan >= 10) return creationTabletColumns;
  if (desktopSpan >= 4) return 3;
  return 2;
};

const getHomeCreationHeight = (span, itemCount) => {
  if (itemCount > 12 || span <= 2) return "250px";
  if (itemCount > 9 || span <= 3) return "280px";
  if (span >= 10) return "410px";
  if (span >= 6) return "350px";
  return "310px";
};

const fitHomeCreations = (creations = []) => {
  const visibleCreations = creations.slice(0, homeCreationRows * homeCreationMaxPerRow);
  const desktopSpans = getBalancedSpans(
    visibleCreations.length,
    homeCreationMaxPerRow,
    creationGridColumns,
    homeCreationRows
  );

  return visibleCreations.map((creation, index) => {
    const layoutSpan = desktopSpans[index];

    return {
      ...creation,
      layoutSpan,
      tabletLayoutSpan: getHomeTabletSpan(layoutSpan),
      layoutHeight: getHomeCreationHeight(layoutSpan, visibleCreations.length),
      contentPadding: layoutSpan <= 2 ? "16px" : "22px",
      descriptionLines: layoutSpan <= 2 ? 2 : 3,
    };
  });
};

const getArchiveCreationHeight = (span) => {
  if (span >= 10) return "460px";
  if (span >= 6) return "420px";
  if (span >= 4) return "390px";
  return "360px";
};

const fitArchiveCreations = (creations = []) => {
  const desktopSpans = getBalancedSpans(creations.length, archiveCreationMaxPerRow, creationGridColumns);
  const tabletSpans = getBalancedSpans(
    creations.length,
    archiveCreationTabletMaxPerRow,
    creationTabletColumns
  );

  return creations.map((creation, index) => {
    const layoutSpan = desktopSpans[index];

    return {
      ...creation,
      layoutSpan,
      tabletLayoutSpan: tabletSpans[index],
      layoutHeight: getArchiveCreationHeight(layoutSpan),
      contentPadding: layoutSpan <= 3 ? "18px" : "24px",
      descriptionLines: layoutSpan <= 3 ? 2 : 3,
    };
  });
};

const creationInlineStyle = (creation) => {
  const layoutSpan = clampCreationSpan(creation.layoutSpan || getCreationBaseSpan(creation.size));
  const tabletSpan = clampCreationSpan(
    creation.tabletLayoutSpan || getCreationTabletBaseSpan(creation.size),
    creationTabletColumns
  );
  const styles = [
    `--creation-span: ${layoutSpan}`,
    `--creation-tablet-span: ${tabletSpan}`,
    `--creation-fit-height: ${getCreationFitHeight(layoutSpan)}`,
  ];

  if (creation.layoutHeight) styles.push(`--creation-min-height: ${creation.layoutHeight}`);
  if (creation.contentPadding) styles.push(`--creation-content-padding: ${creation.contentPadding}`);
  if (creation.descriptionLines) styles.push(`--creation-description-lines: ${creation.descriptionLines}`);

  return styles.join("; ");
};

const showcaseImage = (image, title, crop = {}) => {
  const source = imageSource(image);
  const imageRef = isStoredImageRef(image) ? ` data-image-ref="${escapeHTML(image)}"` : "";
  if (!source && !imageRef) return "";
  return `
  <img class="showcase-image"${source ? ` src="${escapeHTML(source)}"` : ""} alt="${escapeHTML(
    getTranslation("ui.previewAlt", "Aperçu Minecraft - {title}").replace("{title}", title)
  )}" loading="lazy" data-image-position="center" style="${imageCropStyle(crop)}"${imageRef} />
`;
};

const getCreationGallery = (creation = {}) =>
  [creation.image, ...(Array.isArray(creation.gallery) ? creation.gallery : [])]
    .map((image) => String(image || "").trim())
    .filter(Boolean)
    .filter((image, index, images) => images.indexOf(image) === index);

const sketchfabEmbedUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    if (!/(^|\.)sketchfab\.com$/i.test(url.hostname)) return "";
    const embedMatch = url.pathname.match(/\/models\/([a-z0-9]+)\/embed/i);
    if (embedMatch) return `https://sketchfab.com/models/${embedMatch[1]}/embed`;

    const modelMatch = url.pathname.match(/(?:\/3d-models\/[^/]*-|\/models\/)([a-f0-9]{24,40})/i);
    if (modelMatch) return `https://sketchfab.com/models/${modelMatch[1]}/embed`;
  } catch (error) {
    return "";
  }

  return "";
};

const CreationCard = (creation, index = 0) => `
  <a class="creation-card creation-${escapeHTML(creation.size || "standard")}" href="${escapeHTML(
    creationDetailHref(creation, index)
  )}" style="${creationInlineStyle(
    creation
  )}" aria-label="${escapeHTML(creation.title)}" tabindex="0">
    <div class="creation-visual visual-${visualTheme(creation.theme)}" aria-hidden="true">
      ${showcaseImage(creation.image, creation.title)}
    </div>
    <div class="creation-content" aria-hidden="false">
      <span class="content-tag">${escapeHTML(creation.type)}</span>
      <h3>${escapeHTML(creation.title)}</h3>
      <p>${escapeHTML(creation.description)}</p>
    </div>
  </a>
`;

const PricingCard = (item) => `
  <article class="pricing-card pricing-${escapeHTML(item.tone)}">
    <div class="pricing-card-glow" aria-hidden="true"></div>
    <div class="pricing-head">
      <div class="pricing-icon" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span class="pricing-badge">${escapeHTML(item.badge)}</span>
    </div>
    <h3>${escapeHTML(item.title)}</h3>
    <p>${escapeHTML(item.description)}</p>
    <strong>${escapeHTML(item.price)}</strong>
    <ul class="pricing-features">
      ${(item.details || []).map((detail) => `<li>${escapeHTML(detail)}</li>`).join("")}
    </ul>
  </article>
`;

const PackCard = (pack) => `
  <article class="pack-card" aria-label="${escapeHTML(pack.title)}" tabindex="0">
    <div class="pack-card-visual visual-${visualTheme(pack.theme)}" aria-hidden="true">
      ${showcaseImage(pack.image, pack.title, pack)}
    </div>
    <div class="pack-card-overlay pack-overlay">
      <h3>${escapeHTML(pack.title)}</h3>
      <p>${escapeHTML(pack.status)}</p>
      <a class="text-link card-cta" ${linkAttributes(pack.url, getButtonUrl("packOrder", discordHref))}>${escapeHTML(
        getButtonLabel("packOrder")
      )}</a>
    </div>
  </article>
`;

const MarketplaceCard = (product) => `
  <article class="product-card" tabindex="0">
    <div class="product-thumb visual-${visualTheme(product.theme)}" aria-hidden="true">
      ${showcaseImage(product.image, product.title, product)}
    </div>
    <div class="product-copy">
      <span class="content-tag">${escapeHTML(product.tag)}</span>
      <h3>${escapeHTML(product.title)}</h3>
      <p>${escapeHTML(product.meta)}</p>
      <a class="text-link card-cta" ${linkAttributes(product.url, getButtonUrl("bestSellerOrder", discordHref))}>${escapeHTML(
        getButtonLabel("bestSellerOrder")
      )}</a>
    </div>
  </article>
`;

const renderList = (selector, items, renderer) => {
  const target = document.querySelector(selector);
  if (!target) return;
  target.innerHTML = items.map(renderer).join("");
};

async function hydrateSiteImages() {
  const images = [...document.querySelectorAll("[data-image-ref]")];
  await Promise.all(
    images.map(async (image) => {
      try {
        const source = await loadStoredImageURL(image.dataset.imageRef);
        if (source) image.src = source;
      } catch (error) {
        console.warn("Impossible de charger l'image locale.", error);
      }
    })
  );
}

const detailImage = (image, title, index, className = "") => {
  const source = imageSource(image);
  const imageRef = isStoredImageRef(image) ? ` data-image-ref="${escapeHTML(image)}"` : "";
  if (!source && !imageRef) return "";

  return `<img class="${escapeHTML(className)}"${source ? ` src="${escapeHTML(source)}"` : ""} alt="${escapeHTML(
    getTranslation("ui.previewAlt", "Apercu Minecraft - {title}").replace("{title}", title)
  )}" loading="${index === 0 ? "eager" : "lazy"}" data-gallery-image="${index}"${imageRef} />`;
};

const renderCreationDetail = () => {
  const target = document.querySelector("[data-creation-detail]");
  if (!target) return false;

  const orderedCreations = newestFirst(siteData.creations, defaultSiteData.creations);
  const requestedId = new URLSearchParams(window.location.search).get("id") || "";
  const creationEntry = orderedCreations
    .map((creation, index) => ({ creation, index, id: creationIdentifier(creation, index) }))
    .find(({ id }) => id === requestedId);

  if (!creationEntry) {
    target.innerHTML = `
      <section class="creation-detail-empty">
        <p class="eyebrow">${escapeHTML(getTranslation("pages.creationDetail.emptyEyebrow", "Creation introuvable"))}</p>
        <h1>${escapeHTML(getTranslation("pages.creationDetail.emptyTitle", "Cette creation n'existe pas encore"))}</h1>
        <p>${escapeHTML(getTranslation("pages.creationDetail.emptyText", "Retourne au portfolio pour choisir une creation disponible."))}</p>
        <a class="button button-primary" href="creations.html">${escapeHTML(
          getTranslation("pages.creationDetail.back", "Retour aux creations")
        )}</a>
      </section>
    `;
    return true;
  }

  const { creation } = creationEntry;
  const gallery = getCreationGallery(creation);
  const embedUrl = sketchfabEmbedUrl(creation.sketchfab);
  const title = creation.title || getTranslation("pages.creationDetail.fallbackTitle", "Creation");

  document.title = `${title} - LoupSauvage`;

  target.innerHTML = `
    <section class="creation-detail-hero">
      <a class="text-link" href="creations.html">${escapeHTML(
        getTranslation("pages.creationDetail.back", "Retour aux creations")
      )}</a>
      <div class="creation-detail-layout">
        <div class="creation-detail-gallery">
          <div class="creation-main-media" data-gallery-main>
            ${
              gallery.length
                ? detailImage(gallery[0], title, 0, "creation-main-image")
                : `<div class="creation-media-empty">${escapeHTML(
                    getTranslation("pages.creationDetail.noImages", "Les images de cette creation arrivent bientot.")
                  )}</div>`
            }
          </div>
          ${
            gallery.length > 1
              ? `<div class="creation-thumbs" aria-label="${escapeHTML(
                  getTranslation("pages.creationDetail.gallery", "Galerie")
                )}">
                  ${gallery
                    .map(
                      (image, index) => `
                        <button class="creation-thumb ${index === 0 ? "is-active" : ""}" type="button" data-gallery-thumb="${index}">
                          ${detailImage(image, title, index, "creation-thumb-image")}
                        </button>
                      `
                    )
                    .join("")}
                </div>`
              : ""
          }
        </div>

        <div class="creation-detail-copy">
          <p class="eyebrow">${escapeHTML(creation.type || getTranslation("pages.creationDetail.eyebrow", "Creation"))}</p>
          <h1>${escapeHTML(title)}</h1>
          <p>${escapeHTML(creation.description || "")}</p>
          <div class="creation-detail-actions">
            <a class="button button-primary" ${linkAttributes(getButtonUrl("archiveOrder", discordHref), discordHref)}>${escapeHTML(
              getButtonLabel("archiveOrder")
            )}</a>
            <a class="button button-secondary" href="creations.html">${escapeHTML(
              getTranslation("pages.creationDetail.backShort", "Portfolio")
            )}</a>
          </div>
        </div>
      </div>
    </section>

    <section class="section creation-model-section" aria-labelledby="creation-model-title">
      <div class="section-inner">
        <div class="section-heading">
          <p class="eyebrow">${escapeHTML(getTranslation("pages.creationDetail.modelEyebrow", "Modele 3D"))}</p>
          <h2 id="creation-model-title">${escapeHTML(getTranslation("pages.creationDetail.modelTitle", "Apercu Sketchfab"))}</h2>
        </div>
        ${
          embedUrl
            ? `<div class="sketchfab-frame">
                <iframe
                  title="${escapeHTML(`Sketchfab - ${title}`)}"
                  src="${escapeHTML(embedUrl)}"
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  allowfullscreen
                ></iframe>
              </div>`
            : `<div class="sketchfab-empty">${escapeHTML(
                getTranslation("pages.creationDetail.noModel", "Modele 3D a venir.")
              )}</div>`
        }
      </div>
    </section>
  `;

  return true;
};

const renderSite = () => {
  if (renderCreationDetail()) {
    hydrateSiteImages();
    return;
  }

  const shouldShowAllCreations = Boolean(document.querySelector(".creations-archive-grid"));
  const orderedCreations = newestFirst(siteData.creations, defaultSiteData.creations);
  const orderedPacks = newestFirst(siteData.packs, defaultSiteData.packs);
  const orderedMarketplace = newestFirst(siteData.marketplace, defaultSiteData.marketplace);
  const creationItems = shouldShowAllCreations ? fitArchiveCreations(orderedCreations) : fitHomeCreations(orderedCreations);

  renderList("[data-creations-grid]", creationItems, CreationCard);
  renderList("[data-pricing-grid]", siteData.pricing, PricingCard);
  renderList("[data-pack-grid]", orderedPacks, PackCard);
  renderList("[data-marketplace-grid]", orderedMarketplace, MarketplaceCard);

  hydrateSiteImages();
};

const getPageKey = () => document.body.dataset.page || "home";

const applyPageTranslations = () => {
  const pageKey = getPageKey();
  const pageTitle = getTranslation(`pages.${pageKey}.title`, document.title);
  const pageDescription = getTranslation(`pages.${pageKey}.description`);

  document.documentElement.lang = currentLanguage;
  document.title = pageTitle;

  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription && pageDescription) {
    metaDescription.setAttribute("content", pageDescription);
  }

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = getTranslation(element.dataset.i18n, element.textContent.trim());
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute(
      "aria-label",
      getTranslation(element.dataset.i18nAriaLabel, element.getAttribute("aria-label") || "")
    );
  });

  document.querySelectorAll("[data-i18n-alt]").forEach((element) => {
    element.setAttribute("alt", getTranslation(element.dataset.i18nAlt, element.getAttribute("alt") || ""));
  });

  document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
    const nextLanguage = currentLanguage === "fr" ? "en" : "fr";
    button.textContent = getTranslation("ui.languageShort", nextLanguage.toUpperCase());
    button.setAttribute("aria-label", getTranslation("ui.languageToggle", "Changer la langue"));
    button.addEventListener("click", () => {
      localStorage.setItem(LS_LANGUAGE_KEY, nextLanguage);
      window.location.reload();
    });
  });
};

const setupMotion = () => {
  const motionTargets = [
    ...document.querySelectorAll(
      ".hero-copy, .hero-art, .section-heading, .process-card, .creation-card, .creation-detail-gallery, .creation-detail-copy, .creation-model-section, .pricing-card, .pack-card, .marketplace-copy, .product-card, .discord-cta, .site-footer"
    ),
  ];

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  motionTargets.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 70}ms`);
  });

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    motionTargets.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12,
    }
  );

  requestAnimationFrame(() => {
    document.documentElement.classList.add("motion-ready");
    motionTargets.forEach((element) => observer.observe(element));
  });
};

const setupNavigation = () => {
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
};

const setupCreationGallery = () => {
  document.addEventListener("click", (event) => {
    const thumb = event.target.closest("[data-gallery-thumb]");
    if (!thumb) return;

    const gallery = thumb.closest(".creation-detail-gallery");
    const main = gallery?.querySelector("[data-gallery-main]");
    const thumbImage = thumb.querySelector("img");
    const mainImage = main?.querySelector("img");
    if (!main || !thumbImage) return;

    gallery.querySelectorAll("[data-gallery-thumb]").forEach((button) => {
      button.classList.toggle("is-active", button === thumb);
    });

    if (mainImage) {
      mainImage.src = thumbImage.currentSrc || thumbImage.src;
      mainImage.alt = thumbImage.alt;
      return;
    }

    main.innerHTML = `<img class="creation-main-image" src="${escapeHTML(
      thumbImage.currentSrc || thumbImage.src
    )}" alt="${escapeHTML(thumbImage.alt)}" />`;
  });
};

applyPageTranslations();
renderSite();
applyButtonSettings();
setupNavigation();
setupCreationGallery();
setupMotion();
