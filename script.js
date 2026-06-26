(() => {
  const legacyScripts = ["assets/js/data.js", "assets/js/i18n.js", "assets/js/script.js"];

  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", () => reject(new Error(`Unable to load ${src}`)), { once: true });
      document.head.appendChild(script);
    });

  legacyScripts
    .reduce((chain, src) => chain.then(() => loadScript(src)), Promise.resolve())
    .catch((error) => {
      console.error("Impossible de charger les assets du site.", error);
    });
})();
