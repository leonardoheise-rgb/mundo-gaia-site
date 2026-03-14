const menuButton = document.querySelector("[data-menu-toggle]");
const menuLinks = document.querySelector("[data-menu]");
const header = document.querySelector(".site-header");
const internalLinks = document.querySelectorAll("a[href]");
const mobileMenuBreakpoint = window.matchMedia("(max-width: 980px)");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const scrollResetKey = "gaia-scroll-reset";

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

  if (url.origin !== window.location.origin) {
    return;
  }

  link.addEventListener("click", (event) => {
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

const audioPlayer = document.querySelector("[data-audio]");
const audioButton = document.querySelector("[data-audio-toggle]");
const audioStatus = document.querySelector("[data-audio-status]");
const audioProgress = document.querySelector("[data-audio-progress]");
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

function updateAudioStatus() {
  if (!audioPlayer || !audioButton || !audioStatus || !audioProgress) {
    return;
  }

  const duration = formatDuration(audioPlayer.duration);
  const currentTime = formatDuration(audioPlayer.currentTime);
  const progressRatio = audioPlayer.duration
    ? (audioPlayer.currentTime / audioPlayer.duration) * 100
    : 0;

  audioProgress.style.width = `${progressRatio}%`;
  audioStatus.textContent = audioPlayer.paused
    ? `Prévia pausada. Duração total: ${duration}.`
    : `Reproduzindo agora: ${currentTime} de ${duration}.`;

  audioButton.querySelector("[data-audio-label]").textContent = audioPlayer.paused
    ? "Ouvir a prévia"
    : "Pausar a prévia";

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

  audioPlayer.addEventListener("loadedmetadata", updateAudioStatus);
  audioPlayer.addEventListener("timeupdate", updateAudioStatus);
  audioPlayer.addEventListener("pause", updateAudioStatus);
  audioPlayer.addEventListener("play", updateAudioStatus);
  audioPlayer.addEventListener("ended", updateAudioStatus);
  updateAudioStatus();
}
