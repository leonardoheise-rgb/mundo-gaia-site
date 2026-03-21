const menuButton = document.querySelector("[data-menu-toggle]");
const menuLinks = document.querySelector("[data-menu]");
const header = document.querySelector(".site-header");
const internalLinks = document.querySelectorAll("a[href]");
const mobileMenuBreakpoint = window.matchMedia("(max-width: 980px)");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const scrollResetKey = "gaia-scroll-reset";
const gaMeasurementId = "G-TNPDTMW094";
const localHostnames = new Set(["localhost", "127.0.0.1"]);
const isAnalyticsEnabled =
  window.location.protocol !== "file:" &&
  !localHostnames.has(window.location.hostname);
let hasTrackedPreviewPlay = false;

function initializeAnalytics() {
  if (!isAnalyticsEnabled || !gaMeasurementId) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  const analyticsScript = document.createElement("script");
  analyticsScript.async = true;
  analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
  document.head.append(analyticsScript);

  window.gtag("js", new Date());
  window.gtag("config", gaMeasurementId, {
    anonymize_ip: true,
  });
}

function trackEvent(eventName, eventParams = {}) {
  if (!isAnalyticsEnabled || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, eventParams);
}

function normalizeLinkText(link) {
  return link.textContent?.replace(/\s+/g, " ").trim() || "sem-texto";
}

function getStorePlatform(url) {
  if (url.hostname.includes("apps.apple.com")) {
    return "app_store";
  }

  if (url.hostname.includes("play.google.com")) {
    return "google_play";
  }

  return "";
}

function trackDownloadIntent(link, url) {
  const isDownloadAnchor =
    url.origin === window.location.origin &&
    url.pathname === window.location.pathname &&
    url.hash === "#download";
  const isCrossPageDownloadAnchor =
    url.origin === window.location.origin &&
    url.pathname === "/" &&
    url.hash === "#download";

  if (!isDownloadAnchor && !isCrossPageDownloadAnchor) {
    return;
  }

  trackEvent("download_cta_click", {
    destination: url.pathname + url.hash,
    link_text: normalizeLinkText(link),
    source_path: window.location.pathname,
  });
}

function trackStoreClick(link, url, onComplete) {
  const platform = getStorePlatform(url);

  if (!platform) {
    return false;
  }

  const eventParams = {
    platform,
    destination: url.hostname,
    link_text: normalizeLinkText(link),
    source_path: window.location.pathname,
  };

  if (
    typeof onComplete === "function" &&
    isAnalyticsEnabled &&
    typeof window.gtag === "function"
  ) {
    let hasCompleted = false;
    const completeNavigation = () => {
      if (hasCompleted) {
        return;
      }
      hasCompleted = true;
      onComplete();
    };

    window.gtag("event", "app_store_click", {
      ...eventParams,
      event_callback: completeNavigation,
      transport_type: "beacon",
    });

    window.setTimeout(completeNavigation, 350);
    return true;
  }

  trackEvent("app_store_click", eventParams);
  if (typeof onComplete === "function") {
    onComplete();
  }

  return true;
}

function ensureExternalLinksOpenInNewTab() {
  internalLinks.forEach((link) => {
    let url;

    try {
      url = new URL(link.href, window.location.href);
    } catch {
      return;
    }

    if (url.origin === window.location.origin) {
      return;
    }

    if (!/^https?:$/.test(url.protocol)) {
      return;
    }

    link.target = "_blank";
    const relValues = new Set((link.rel || "").split(/\s+/).filter(Boolean));
    relValues.add("noreferrer");
    relValues.add("noopener");
    link.rel = Array.from(relValues).join(" ");
  });
}

initializeAnalytics();
ensureExternalLinksOpenInNewTab();

function updateMenuAccessibility(isOpen) {
  if (!menuButton || !menuLinks) {
    return;
  }

  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
  menuLinks.setAttribute("aria-hidden", String(!isOpen && mobileMenuBreakpoint.matches));
}

function setMenuState(isOpen) {
  if (!menuButton || !menuLinks) {
    return;
  }

  const shouldOpen = mobileMenuBreakpoint.matches && isOpen;

  menuLinks.classList.toggle("is-open", shouldOpen);
  menuLinks.hidden = mobileMenuBreakpoint.matches ? !shouldOpen : false;
  if ("inert" in menuLinks) {
    menuLinks.inert = mobileMenuBreakpoint.matches ? !shouldOpen : false;
  }
  updateMenuAccessibility(shouldOpen);
}

function closeMenu() {
  setMenuState(false);
}

function syncMenuState() {
  if (!menuButton || !menuLinks) {
    return;
  }

  if (mobileMenuBreakpoint.matches) {
    const isOpen = menuLinks.classList.contains("is-open");
    menuLinks.hidden = !isOpen;
    if ("inert" in menuLinks) {
      menuLinks.inert = !isOpen;
    }
    updateMenuAccessibility(isOpen);
    return;
  }

  menuLinks.hidden = false;
  menuLinks.classList.remove("is-open");
  if ("inert" in menuLinks) {
    menuLinks.inert = false;
  }
  updateMenuAccessibility(false);
}

function getHashTarget(hash) {
  if (!hash || hash === "#") {
    return null;
  }

  const elementId = decodeURIComponent(hash.slice(1));

  return elementId ? document.getElementById(elementId) : null;
}

function scrollToHashTarget(hash, behavior = "smooth") {
  const target = getHashTarget(hash);

  if (!target) {
    return false;
  }

  const headerOffset = header ? header.getBoundingClientRect().height + 16 : 16;
  const targetTop = window.scrollY + target.getBoundingClientRect().top - headerOffset;

  window.scrollTo({
    top: Math.max(targetTop, 0),
    behavior,
  });

  return true;
}

function shouldHandleAsSamePageLink(url) {
  return (
    url.origin === window.location.origin &&
    url.pathname === window.location.pathname &&
    url.search === window.location.search &&
    Boolean(url.hash)
  );
}

if (menuButton && menuLinks) {
  menuButton.addEventListener("click", () => {
    const isOpen = !menuLinks.classList.contains("is-open");
    setMenuState(isOpen);
  });

  menuLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  const handleMenuBreakpointChange = () => {
    syncMenuState();
  };

  if (typeof mobileMenuBreakpoint.addEventListener === "function") {
    mobileMenuBreakpoint.addEventListener("change", handleMenuBreakpointChange);
  } else if (typeof mobileMenuBreakpoint.addListener === "function") {
    mobileMenuBreakpoint.addListener(handleMenuBreakpointChange);
  } else {
    window.addEventListener("resize", handleMenuBreakpointChange);
  }

  document.addEventListener("click", (event) => {
    if (
      mobileMenuBreakpoint.matches &&
      menuLinks.classList.contains("is-open") &&
      !event.target.closest(".site-nav")
    ) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  window.addEventListener("pageshow", closeMenu);
  syncMenuState();
}

internalLinks.forEach((link) => {
  const href = link.getAttribute("href");

  if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return;
  }

  let url;

  try {
    url = new URL(link.href, window.location.href);
  } catch {
    return;
  }

  link.addEventListener("click", (event) => {
    trackDownloadIntent(link, url);

    if (link.target === "_blank") {
      trackStoreClick(link, url);
      return;
    }

    if (trackStoreClick(link, url, () => {
      window.location.href = url.href;
    })) {
      event.preventDefault();
      return;
    }

    if (url.origin !== window.location.origin) {
      return;
    }

    closeMenu();

    if (shouldHandleAsSamePageLink(url)) {
      event.preventDefault();
      history.replaceState(null, "", url.hash);
      scrollToHashTarget(
        url.hash,
        prefersReducedMotion.matches ? "auto" : "smooth",
      );
      return;
    }

    if (!url.hash) {
      sessionStorage.setItem(scrollResetKey, "top");
    } else {
      sessionStorage.removeItem(scrollResetKey);
    }
  });
});

window.addEventListener("load", () => {
  const pendingScrollReset = sessionStorage.getItem(scrollResetKey);

  if (window.location.hash) {
    sessionStorage.removeItem(scrollResetKey);
    scrollToHashTarget(window.location.hash, "auto");
    return;
  }

  if (pendingScrollReset === "top") {
    sessionStorage.removeItem(scrollResetKey);
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }
});

const revealElements = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window && revealElements.length > 0) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
    },
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const blogSearchRoot = document.querySelector("[data-blog-search-root]");
const blogSearchForm = blogSearchRoot?.querySelector(".blog-search__form");
const blogSearchInput = document.querySelector("[data-blog-search-input]");
const blogSearchClearButton = document.querySelector("[data-blog-search-clear]");
const blogSearchStatus = document.querySelector("[data-blog-search-status]");
const blogSearchEmptyState = document.querySelector("[data-blog-search-empty]");
const blogSearchGrid = document.querySelector("[data-blog-search-grid]");

function normalizeSearchText(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCleanText(element) {
  return element?.textContent?.replace(/\s+/g, " ").trim() || "";
}

function getBlogSearchTokens(query) {
  return normalizeSearchText(query).split(" ").filter(Boolean);
}

function collectBlogSearchEntries(grid) {
  return Array.from(grid.querySelectorAll(".blog-card"))
    .map((card, index) => {
      const titleLink = card.querySelector(".blog-card__body h3 a");
      const title = getCleanText(titleLink);
      const excerpt = getCleanText(card.querySelector(".blog-card__body p"));
      const meta = Array.from(card.querySelectorAll(".blog-card__meta span"))
        .map((item) => getCleanText(item))
        .join(" ");

      if (!titleLink?.href || !title) {
        return null;
      }

      return {
        card,
        index,
        title,
        titleSearchText: normalizeSearchText(title),
        previewSearchText: normalizeSearchText(`${meta} ${excerpt}`),
        fullTextSearchText: "",
        url: titleLink.href,
        isHydrated: false,
      };
    })
    .filter(Boolean);
}

function extractBlogPostSearchText(documentFragment) {
  const selectors = [
    ".post-header p",
    ".post-header .post-meta span",
    ".post-header .post-author",
    ".post-body h2",
    ".post-body h3",
    ".post-body p",
    ".post-body li",
    ".post-body th",
    ".post-body td",
  ];

  return selectors
    .reduce((content, selector) => {
      const selectorText = Array.from(documentFragment.querySelectorAll(selector))
        .map((element) => getCleanText(element))
        .join(" ");

      if (selectorText) {
        content.push(selectorText);
      }

      return content;
    }, [])
    .join(" ");
}

async function hydrateBlogSearchEntry(entry) {
  if (
    entry.isHydrated ||
    !entry.url ||
    window.location.protocol === "file:"
  ) {
    return false;
  }

  try {
    const response = await fetch(entry.url, {
      credentials: "same-origin",
    });

    if (!response.ok) {
      return false;
    }

    const html = await response.text();
    const parsedDocument = new DOMParser().parseFromString(html, "text/html");
    entry.fullTextSearchText = normalizeSearchText(extractBlogPostSearchText(parsedDocument));
    entry.isHydrated = true;
    return true;
  } catch {
    return false;
  }
}

async function hydrateBlogSearchEntries(entries, onBatchComplete) {
  const batchSize = 4;

  for (let index = 0; index < entries.length; index += batchSize) {
    const batch = entries.slice(index, index + batchSize);
    const updatedEntries = await Promise.all(batch.map((entry) => hydrateBlogSearchEntry(entry)));

    if (updatedEntries.some(Boolean) && typeof onBatchComplete === "function") {
      onBatchComplete();
    }
  }
}

function getBlogSearchBodyText(entry) {
  return `${entry.previewSearchText} ${entry.fullTextSearchText}`.trim();
}

function getBlogSearchScore(entry, tokens, normalizedQuery) {
  const bodyText = getBlogSearchBodyText(entry);
  const matchesAllTokens = tokens.every(
    (token) => entry.titleSearchText.includes(token) || bodyText.includes(token),
  );

  if (!matchesAllTokens) {
    return -1;
  }

  let score = 0;

  if (normalizedQuery && entry.titleSearchText.startsWith(normalizedQuery)) {
    score += 220;
  }

  if (normalizedQuery && entry.titleSearchText.includes(normalizedQuery)) {
    score += 160;
  }

  if (normalizedQuery && bodyText.includes(normalizedQuery)) {
    score += 40;
  }

  tokens.forEach((token) => {
    if (entry.titleSearchText.includes(token)) {
      score += 50;
    }

    if (bodyText.includes(token)) {
      score += 12;
    }
  });

  return score;
}

function getBlogSearchMatches(entries, query) {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = getBlogSearchTokens(query);

  if (!tokens.length) {
    return entries.map((entry) => ({
      entry,
      score: 0,
    }));
  }

  return entries
    .map((entry) => ({
      entry,
      score: getBlogSearchScore(entry, tokens, normalizedQuery),
    }))
    .filter((result) => result.score >= 0)
    .sort((left, right) => right.score - left.score || left.entry.index - right.entry.index);
}

function setBlogSearchStatus(text) {
  if (blogSearchStatus) {
    blogSearchStatus.textContent = text;
  }
}

function renderBlogSearch(entries, query, isHydrating) {
  if (!blogSearchGrid) {
    return;
  }

  const trimmedQuery = query.trim();
  const hasQuery = Boolean(trimmedQuery);
  const matches = getBlogSearchMatches(entries, trimmedQuery);
  const matchEntries = matches.map((result) => result.entry);
  const matchedEntrySet = new Set(matchEntries);
  const orderedEntries = hasQuery
    ? matchEntries.concat(entries.filter((entry) => !matchedEntrySet.has(entry)))
    : entries;
  const fragment = document.createDocumentFragment();

  orderedEntries.forEach((entry) => {
    entry.card.hidden = hasQuery ? !matchedEntrySet.has(entry) : false;
    fragment.append(entry.card);
  });

  blogSearchGrid.append(fragment);

  if (blogSearchClearButton) {
    blogSearchClearButton.hidden = !hasQuery;
  }

  const shouldShowEmptyState = hasQuery && matches.length === 0;
  blogSearchGrid.hidden = shouldShowEmptyState;

  if (blogSearchEmptyState) {
    blogSearchEmptyState.hidden = !shouldShowEmptyState;
  }

  if (!hasQuery) {
    setBlogSearchStatus(
      `${entries.length} ${entries.length === 1 ? "artigo dispon\u00edvel" : "artigos dispon\u00edveis"} para explorar.`,
    );
    return;
  }

  const resultsLabel =
    matches.length === 1
      ? `1 artigo encontrado para "${trimmedQuery}".`
      : `${matches.length} artigos encontrados para "${trimmedQuery}".`;

  if (isHydrating && window.location.protocol !== "file:") {
    setBlogSearchStatus(`${resultsLabel} Procurando tamb\u00e9m dentro do texto completo dos artigos.`);
    return;
  }

  setBlogSearchStatus(resultsLabel);
}

function initializeBlogSearch() {
  if (!blogSearchRoot || !blogSearchInput || !blogSearchGrid) {
    return;
  }

  const entries = collectBlogSearchEntries(blogSearchGrid);

  if (!entries.length) {
    return;
  }

  let currentQuery = blogSearchInput.value || "";
  let isHydrating = window.location.protocol !== "file:";

  const renderCurrentResults = () => {
    renderBlogSearch(entries, currentQuery, isHydrating);
  };

  blogSearchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  blogSearchInput.addEventListener("input", (event) => {
    currentQuery = event.currentTarget.value;
    renderCurrentResults();
  });

  blogSearchClearButton?.addEventListener("click", () => {
    blogSearchInput.value = "";
    currentQuery = "";
    renderCurrentResults();
    blogSearchInput.focus();
  });

  renderCurrentResults();

  if (!isHydrating) {
    return;
  }

  const startHydration = () => {
    hydrateBlogSearchEntries(entries, renderCurrentResults).finally(() => {
      isHydrating = false;
      renderCurrentResults();
    });
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(startHydration, { timeout: 1200 });
    return;
  }

  window.setTimeout(startHydration, 250);
}

initializeBlogSearch();

const audioPlayer = document.querySelector("[data-audio]");
const audioButton = document.querySelector("[data-audio-toggle]");
const audioStatus = document.querySelector("[data-audio-status]");
const audioSeek = document.querySelector("[data-audio-seek]");
const audioLabel = document.querySelector("[data-audio-label]");
const audioIconPath = document.querySelector("[data-audio-icon] path");

function formatDuration(timeInSeconds) {
  if (!Number.isFinite(timeInSeconds)) {
    return "0:00";
  }

  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function hasAudioDuration() {
  return Number.isFinite(audioPlayer?.duration) && audioPlayer.duration > 0;
}

function syncAudioSeek(progressRatio) {
  if (!audioSeek) {
    return;
  }

  const normalizedProgress = Number.isFinite(progressRatio) ? progressRatio : 0;
  audioSeek.value = normalizedProgress.toString();
  audioSeek.disabled = !hasAudioDuration();
  audioSeek.style.setProperty("--audio-progress", `${normalizedProgress}%`);
}

function seekAudio(progressRatio) {
  if (!audioPlayer || !hasAudioDuration()) {
    return;
  }

  const nextProgress = Math.min(Math.max(progressRatio, 0), 100);
  audioPlayer.currentTime = (nextProgress / 100) * audioPlayer.duration;
  syncAudioSeek(nextProgress);
  updateAudioStatus();
}

function updateAudioStatus() {
  if (!audioPlayer || !audioButton || !audioStatus) {
    return;
  }

  const durationAvailable = hasAudioDuration();
  const duration = formatDuration(audioPlayer.duration);
  const currentTime = formatDuration(audioPlayer.currentTime);
  const progressRatio = durationAvailable
    ? (audioPlayer.currentTime / audioPlayer.duration) * 100
    : 0;

  syncAudioSeek(progressRatio);
  audioStatus.textContent = !durationAvailable
    ? "Preparando a prévia."
    : audioPlayer.paused
      ? `Prévia pausada em ${currentTime} de ${duration}.`
      : `Reproduzindo agora: ${currentTime} de ${duration}.`;

  if (audioLabel) {
    audioLabel.textContent = audioPlayer.paused
      ? "Ouvir a prévia"
      : "Pausar a prévia";
  }

  if (audioIconPath) {
    audioIconPath.setAttribute(
      "d",
      audioPlayer.paused ? "M8 6.5v11l9-5.5-9-5.5Z" : "M8.5 6.5h2.5v11H8.5Zm4.5 0h2.5v11H13Z",
    );
  }
}

if (audioPlayer && audioButton) {
  audioButton.addEventListener("click", async () => {
    try {
      if (audioPlayer.paused) {
        await audioPlayer.play();
        if (!hasTrackedPreviewPlay) {
          trackEvent("preview_audio_play", {
            audio_name: "Coruja Gaia e o Morango Gigante",
            source_path: window.location.pathname,
          });
          hasTrackedPreviewPlay = true;
        }
      } else {
        audioPlayer.pause();
      }
      updateAudioStatus();
    } catch (error) {
      if (audioStatus) {
        audioStatus.textContent =
          "Não foi possível iniciar o áudio agora. Tente novamente.";
      }
    }
  });

  if (audioSeek) {
    audioSeek.addEventListener("input", (event) => {
      seekAudio(Number(event.currentTarget.value));
    });
  }

  audioPlayer.addEventListener("loadedmetadata", updateAudioStatus);
  audioPlayer.addEventListener("timeupdate", updateAudioStatus);
  audioPlayer.addEventListener("pause", updateAudioStatus);
  audioPlayer.addEventListener("play", updateAudioStatus);
  audioPlayer.addEventListener("ended", updateAudioStatus);
  updateAudioStatus();
}
