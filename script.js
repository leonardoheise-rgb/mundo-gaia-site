const menuButton = document.querySelector("[data-menu-toggle]");
const menuLinks = document.querySelector("[data-menu]");

if (menuButton && menuLinks) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuLinks.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute(
      "aria-label",
      isOpen ? "Fechar menu" : "Abrir menu",
    );
  });
}

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
