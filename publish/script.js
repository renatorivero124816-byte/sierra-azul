const revealItems = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

revealItems.forEach((item) => observer.observe(item));

let lastScrollY = window.scrollY;
let ticking = false;

function updateHeaderMode() {
  const currentScrollY = window.scrollY;
  const scrollingDown = currentScrollY > lastScrollY;
  const pastHeroIntro = currentScrollY > 120;

  if (!pastHeroIntro || !scrollingDown) {
    document.body.classList.remove("header-compact");
  } else {
    document.body.classList.add("header-compact");
  }

  lastScrollY = Math.max(currentScrollY, 0);
  ticking = false;
}

window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeaderMode);
      ticking = true;
    }
  },
  { passive: true }
);

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const zoneData = {
  juriquilla: {
    title: "Juriquilla",
    copy:
      "Cobertura para residencias, torres, condominios y accesos privados con atención discreta.",
  },
  jurica: {
    title: "Jurica",
    copy:
      "Servicio para casas de alto perfil, accesos residenciales, cerraduras, duplicados y mantenimiento seguro.",
  },
  campanario: {
    title: "El Campanario",
    copy:
      "Atención premium para fraccionamientos privados, residencias de lujo y sistemas de acceso controlado.",
  },
  zibata: {
    title: "Zibatá",
    copy:
      "Soluciones para desarrollos modernos, condominios, llaves, NFC y cerraduras inteligentes.",
  },
  altozano: {
    title: "Altozano",
    copy:
      "Soporte discreto para hogares, casetas, administraciones y proyectos de seguridad residencial.",
  },
  cumbres: {
    title: "Cumbres del Lago",
    copy:
      "Cobertura para residencias, condominios y propiedades que requieren privacidad y respuesta profesional.",
  },
};

const zoneTitle = document.querySelector("#zone-title");
const zoneCopy = document.querySelector("#zone-copy");
const zoneControls = document.querySelectorAll("[data-zone]");

function setActiveZone(zone) {
  const data = zoneData[zone];
  if (!data || !zoneTitle || !zoneCopy) return;

  zoneTitle.textContent = data.title;
  zoneCopy.textContent = data.copy;

  zoneControls.forEach((control) => {
    control.classList.toggle("is-active", control.dataset.zone === zone);
  });
}

zoneControls.forEach((control) => {
  control.addEventListener("click", () => setActiveZone(control.dataset.zone));
  control.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveZone(control.dataset.zone);
    }
  });
});
