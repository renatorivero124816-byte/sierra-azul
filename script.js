const ADMIN_PASSWORD = "sierrazul";
const STORAGE_KEY = "sierraAzulPortal";

const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const adminLaunch = document.querySelector(".admin-launch");
const adminPanel = document.querySelector(".admin-panel");
const adminClose = document.querySelector(".admin-close");
const adminLogin = document.querySelector(".admin-login");
const adminTools = document.querySelector(".admin-tools");
const adminMessage = document.querySelector(".admin-message");
const adminLogout = document.querySelector(".admin-logout");
const adminToolList = document.querySelector(".admin-tool-list");
const accessGate = document.querySelector(".access-gate");
const accessForm = document.querySelector(".access-card");
const accessMessage = document.querySelector(".access-message");

const state = loadState();
const todayKey = new Date().toISOString().slice(0, 10);

if (sessionStorage.getItem("sierraAzulAccessDate") === todayKey) {
  unlockSite();
}

if (window.lucide) {
  window.lucide.createIcons();
}

menuButton?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

adminLaunch?.addEventListener("click", openAdminPanel);
adminClose?.addEventListener("click", closeAdminPanel);
adminLogout?.addEventListener("click", () => setAdminMode(false));

adminLogin?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = new FormData(adminLogin).get("password");
  const cloudLogin = window.SierraAzulCloud?.signIn;

  if ((cloudLogin && await cloudLogin(password)) || (!cloudLogin && password === ADMIN_PASSWORD)) {
    setAdminMode(true);
    adminLogin.reset();
    return;
  }

  adminMessage.textContent = "Contraseña incorrecta.";
});

accessForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(accessForm);
  const username = String(form.get("username") || "").trim().toUpperCase();
  const password = String(form.get("password") || "").trim().toUpperCase();

  if (username === "PSIERRAZUL" && password === "SIERRAZUL") {
    sessionStorage.setItem("sierraAzulAccessDate", todayKey);
    unlockSite();
    accessForm.reset();
    return;
  }

  accessMessage.textContent = "Usuario o contraseña incorrectos.";
});

document.querySelectorAll("[data-edit-image]").forEach((image, index) => {
  image.dataset.imageKey = image.dataset.imageKey || `image-${index}`;
});

renderSavedProjects();
buildProjectSliders();
buildInlinePersonEditors();
restoreSavedChanges();
buildAdminPanelTools();
wireImageReplacement();
wireProjectPhotoUploads();
wireInlinePersonEditors();
wireAmenityTools();
initMaintenance3DScene();
window.SierraAzulMotionFallback = initPageWideAnimations;

function openAdminPanel() {
  adminPanel.classList.add("open");
  adminPanel.setAttribute("aria-hidden", "false");
  document.body.classList.add("panel-open");
}

function unlockSite() {
  document.body.classList.remove("site-locked");
  accessGate?.setAttribute("aria-hidden", "true");
}

function closeAdminPanel() {
  adminPanel.classList.remove("open");
  adminPanel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("panel-open");
}

function setAdminMode(isActive) {
  document.body.classList.toggle("admin-mode", isActive);
  adminLogin.hidden = isActive;
  adminTools.hidden = !isActive;
  adminMessage.textContent = isActive ? "Modo administrador activo." : "";
}

function initMaintenance3DScene() {
  const canvas = document.querySelector("#maintenanceScene");
  const container = canvas?.closest(".maintenance-3d-scene");
  const THREE = window.THREE;
  const sceneProfile = getMaintenanceSceneProfile();

  if (!canvas || !container) return;
  if (!THREE) {
    showMaintenanceSceneFallback(container);
    return;
  }

  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: sceneProfile.antialias,
      alpha: true,
      powerPreference: sceneProfile.lowPower ? "low-power" : "high-performance",
    });
  } catch {
    showMaintenanceSceneFallback(container);
    return;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060908, 0.045);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
  const clock = new THREE.Clock();
  const pointer = { x: 0, y: 0 };

  camera.position.set(0, 3.8, 9.2);
  camera.lookAt(0, 0.65, 0);

  renderer.setPixelRatio(sceneProfile.pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene.add(new THREE.HemisphereLight(0xdce9ed, 0x060908, 1.8));

  const keyLight = new THREE.DirectionalLight(0xffd3ad, 2.9);
  keyLight.position.set(4, 7, 6);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x5dc1c0, 2.4);
  rimLight.position.set(-5, 4, -5);
  scene.add(rimLight);

  const pulseLight = new THREE.PointLight(0xf1b684, 8, 14);
  pulseLight.position.set(0, 1.4, 0);
  scene.add(pulseLight);

  const root = new THREE.Group();
  scene.add(root);

  const platformMaterial = new THREE.MeshStandardMaterial({
    color: 0x13241f,
    metalness: 0.5,
    roughness: 0.38,
  });
  const copperMaterial = new THREE.MeshStandardMaterial({
    color: 0xf1a466,
    metalness: 0.42,
    roughness: 0.28,
    emissive: 0x3a1407,
    emissiveIntensity: 0.45,
  });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xdce9ed,
    metalness: 0.05,
    roughness: 0.18,
    transmission: 0.22,
    transparent: true,
    opacity: 0.56,
  });
  const cyanMaterial = new THREE.MeshBasicMaterial({
    color: 0x7fe7e3,
    transparent: true,
    opacity: 0.72,
  });
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x07100d,
    metalness: 0.44,
    roughness: 0.45,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.45, 3.9, 0.22, 6), platformMaterial);
  base.position.y = -0.18;
  base.rotation.y = Math.PI / 6;
  root.add(base);

  const gridMaterial = new THREE.LineBasicMaterial({ color: 0x7fe7e3, transparent: true, opacity: 0.18 });
  for (let index = -sceneProfile.gridLimit; index <= sceneProfile.gridLimit; index += sceneProfile.gridStep) {
    const horizontal = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-5.4, -0.05, index),
      new THREE.Vector3(5.4, -0.05, index),
    ]);
    const vertical = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(index, -0.05, -5.4),
      new THREE.Vector3(index, -0.05, 5.4),
    ]);
    root.add(new THREE.Line(horizontal, gridMaterial));
    root.add(new THREE.Line(vertical, gridMaterial));
  }

  const rings = (sceneProfile.lowPower ? [2.5, 3.3] : [2.5, 3.08, 3.62]).map((radius, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.018 + index * 0.004, 14, 128),
      new THREE.MeshBasicMaterial({
        color: index === 1 ? 0xf1b684 : 0x7fe7e3,
        transparent: true,
        opacity: index === 1 ? 0.76 : 0.42,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.12 + index * 0.18;
    root.add(ring);
    return ring;
  });

  const commandCore = new THREE.Group();
  root.add(commandCore);

  const coreHeights = (sceneProfile.lowPower ? [2.9, 2.05, 1.55] : [2.9, 2.2, 1.75, 2.45, 1.35]);
  coreHeights.forEach((height, index) => {
    const angle = index * ((Math.PI * 2) / coreHeights.length) + Math.PI / 5;
    const radius = index === 0 ? 0 : 1.02 + (index % 2) * 0.36;
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.48, height, 0.48), glassMaterial);
    core.position.set(Math.cos(angle) * radius, height / 2, Math.sin(angle) * radius);
    core.rotation.y = -angle + Math.PI / 4;
    commandCore.add(core);

    const top = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.62), copperMaterial);
    top.position.set(core.position.x, height + 0.05, core.position.z);
    top.rotation.y = core.rotation.y;
    commandCore.add(top);
  });

  const progressValues = [0.68, 0.42, 0.25];
  const progressArcs = [];
  progressValues.forEach((value, index) => {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(1.35 + index * 0.36, 0.035, 14, 84, Math.PI * 2 * value),
      index === 0 ? copperMaterial : cyanMaterial
    );
    arc.rotation.x = Math.PI / 2;
    arc.rotation.z = index * 1.8;
    arc.position.y = 2.55 + index * 0.34;
    commandCore.add(arc);
    progressArcs.push(arc);
  });

  const evidenceGroup = new THREE.Group();
  root.add(evidenceGroup);

  for (let index = 0; index < sceneProfile.evidenceCount; index += 1) {
    const angle = index * ((Math.PI * 2) / sceneProfile.evidenceCount);
    const tile = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.028), index % 3 === 0 ? copperMaterial : glassMaterial);
    tile.position.set(Math.cos(angle) * 3.05, 1.38 + Math.sin(index * 1.7) * 0.34, Math.sin(angle) * 3.05);
    tile.rotation.set(0.2, -angle + Math.PI / 2, 0.06);
    evidenceGroup.add(tile);
  }

  const pointMaterials = [
    new THREE.MeshBasicMaterial({ color: 0xf1b684 }),
    new THREE.MeshBasicMaterial({ color: 0x7fe7e3 }),
  ];
  for (let index = 0; index < sceneProfile.pointCount; index += 1) {
    const angle = index * ((Math.PI * 2) / sceneProfile.pointCount);
    const radius = 2.2 + (index % 4) * 0.48;
    const point = new THREE.Mesh(new THREE.SphereGeometry(0.028 + (index % 3) * 0.009, 10, 10), pointMaterials[index % 2]);
    point.position.set(Math.cos(angle) * radius, 0.18 + (index % 5) * 0.1, Math.sin(angle) * radius);
    root.add(point);
  }

  const resize = () => {
    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 360);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  const onPointerMove = (event) => {
    if (sceneProfile.mobile) return;
    const rect = container.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  };

  container.addEventListener("pointermove", onPointerMove, { passive: true });

  const resizeObserver = new ResizeObserver(debounce(resize, 120));
  resizeObserver.observe(container);
  resize();

  let sceneVisible = true;
  let lastRender = 0;
  let animationId = 0;
  const minFrameMs = 1000 / sceneProfile.fps;

  const visibilityObserver = new IntersectionObserver((entries) => {
    sceneVisible = entries.some((entry) => entry.isIntersecting);
    if (sceneVisible) resumeScene();
  }, { rootMargin: "160px 0px" });
  visibilityObserver.observe(container);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) resumeScene();
  });

  const animate = (time = 0) => {
    if (!sceneVisible || document.hidden || document.body.classList.contains("site-locked")) {
      animationId = 0;
      return;
    }

    animationId = requestAnimationFrame(animate);
    if (time - lastRender < minFrameMs) return;
    lastRender = time;

    const elapsed = clock.getElapsedTime();
    root.rotation.y = elapsed * 0.15 + pointer.x * 0.28;
    root.rotation.x = pointer.y * 0.1;
    commandCore.rotation.y = -elapsed * 0.18;
    evidenceGroup.rotation.y = elapsed * 0.48;
    pulseLight.intensity = 7 + Math.sin(elapsed * 2.6) * 2.8;

    rings.forEach((ring, index) => {
      ring.rotation.z = elapsed * (0.24 + index * 0.12) * (index % 2 ? -1 : 1);
      ring.position.y = 0.18 + index * 0.18 + Math.sin(elapsed * 1.2 + index) * 0.05;
    });

    progressArcs.forEach((arc, index) => {
      arc.rotation.z += 0.008 + index * 0.004;
      arc.position.y = 2.52 + index * 0.34 + Math.sin(elapsed * 1.8 + index) * 0.08;
    });

    evidenceGroup.children.forEach((tile, index) => {
      tile.position.y = 1.38 + Math.sin(elapsed * 1.65 + index) * 0.34;
      tile.rotation.z = Math.sin(elapsed + index) * 0.12;
    });

    renderer.render(scene, camera);
  };

  function resumeScene() {
    if (animationId || document.hidden || !sceneVisible || document.body.classList.contains("site-locked")) return;
    lastRender = 0;
    animationId = requestAnimationFrame(animate);
  }

  const lockObserver = new MutationObserver(resumeScene);
  lockObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  resumeScene();
}

function showMaintenanceSceneFallback(container) {
  container.innerHTML = '<div class="maintenance-3d-fallback">Vista 3D disponible al cargar el sitio publicado.</div>';
}

function getMaintenanceSceneProfile() {
  const width = window.innerWidth || 1280;
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
  const saveData = navigator.connection?.saveData;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const mobile = width <= 760 || coarse;
  const lowPower = saveData || cores <= 4 || memory <= 3 || width <= 420;

  return {
    mobile,
    lowPower,
    antialias: !lowPower,
    pixelRatio: Math.min(window.devicePixelRatio || 1, lowPower ? 1 : mobile ? 1.2 : 1.65),
    fps: lowPower ? 24 : mobile ? 30 : 48,
    gridLimit: lowPower ? 4 : 5,
    gridStep: lowPower ? 2 : 1,
    evidenceCount: lowPower ? 8 : mobile ? 12 : 18,
    pointCount: lowPower ? 18 : mobile ? 28 : 42,
  };
}

function debounce(callback, delay = 120) {
  let timeout;
  return (...args) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => callback(...args), delay);
  };
}

function initPageWideAnimations() {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  document.body.prepend(progress);
  document.body.classList.add("page-motion-ready");

  const revealTargets = [
    ".hero-content",
    ".hero-status",
    ".section-heading",
    ".metric-grid article",
    ".project-card",
    ".team-grid article",
    ".person-card",
    ".amenity-card",
    ".amenity-detail-grid",
    ".rules-panel",
    ".timeline",
    ".timeline article",
    ".footer > *",
  ];

  document.querySelectorAll(revealTargets.join(",")).forEach((element, index) => {
    element.classList.add("motion-reveal");
    element.style.setProperty("--motion-delay", `${Math.min(index % 6, 5) * 70}ms`);
  });

  document.querySelectorAll(".metric-grid article, .project-card, .team-grid article, .amenity-card").forEach((card) => {
    card.classList.add("motion-card");
    card.addEventListener("pointermove", (event) => {
      if (reduceMotion) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--tilt-x", `${(-y * 5).toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${(x * 7).toFixed(2)}deg`);
      card.style.setProperty("--shine-x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--shine-y", `${event.clientY - rect.top}px`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
    });
  });

  const progressBars = [...document.querySelectorAll(".project-card .progress span")].map((bar) => {
    const savedWidth = bar.style.width || `${bar.getBoundingClientRect().width}px`;
    bar.dataset.motionWidth = savedWidth;
    bar.style.width = "0%";
    return bar;
  });

  const animateCounters = (root) => {
    root.querySelectorAll(".progress-value, .hero-status strong, .visual-kpis strong").forEach((element) => {
      if (element.dataset.counted) return;
      const text = element.textContent.trim();
      const match = text.match(/^(\d+)(%?)(.*)$/);
      if (!match || text.includes("/")) return;
      element.dataset.counted = "true";
      const target = Number(match[1]);
      const suffix = `${match[2]}${match[3] || ""}`;
      let startTime;

      const tick = (time) => {
        startTime ??= time;
        const progressValue = Math.min((time - startTime) / 950, 1);
        const eased = 1 - Math.pow(1 - progressValue, 3);
        element.textContent = `${Math.round(target * eased)}${suffix}`;
        if (progressValue < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });
  };

  if (reduceMotion || !("IntersectionObserver" in window)) {
    document.querySelectorAll(".motion-reveal").forEach((element) => element.classList.add("is-visible"));
    progressBars.forEach((bar) => {
      bar.style.width = bar.dataset.motionWidth || "";
    });
    animateCounters(document);
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        entry.target.querySelectorAll?.(".progress span").forEach((bar) => {
          bar.style.width = bar.dataset.motionWidth || "";
        });
        animateCounters(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });

    document.querySelectorAll(".motion-reveal").forEach((element) => observer.observe(element));
  }

  const updateScrollProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const value = scrollable > 0 ? window.scrollY / scrollable : 0;
    progress.style.transform = `scaleX(${Math.min(Math.max(value, 0), 1)})`;
    document.body.style.setProperty("--page-scroll", value.toFixed(4));
  };

  updateScrollProgress();
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("resize", updateScrollProgress);
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function buildAdminPanelTools() {
  if (!adminToolList) return;
  adminToolList.innerHTML = "";

  const imageGroup = createAdminGroup("Imágenes principales");
  document.querySelectorAll("[data-edit-image]").forEach((image) => {
    imageGroup.appendChild(createImageTool(image.dataset.editImage, image.dataset.imageKey));
  });
  adminToolList.appendChild(imageGroup);

  const projectGroup = createAdminGroup("Proyectos: avance y fotografías");
  document.querySelectorAll(".project-card").forEach((card) => {
    projectGroup.appendChild(createProjectTool(card));
  });
  adminToolList.appendChild(projectGroup);

  const peopleGroup = createAdminGroup("Personal y responsables");
  document.querySelectorAll(".person-card").forEach((card) => {
    peopleGroup.appendChild(createPersonTool(card));
  });
  adminToolList.appendChild(peopleGroup);

  const amenityGroup = createAdminGroup("Amenidades: fotos, reglamento y lineamientos");
  document.querySelectorAll(".amenity-detail").forEach((section) => {
    amenityGroup.appendChild(createAmenityTool(section));
  });
  adminToolList.appendChild(amenityGroup);

  wireAdminPersonTools();
  wireAdminAmenityTools();
  wireAdminProjectTools();
}

function createAdminGroup(title) {
  const group = document.createElement("section");
  group.className = "admin-group";
  group.innerHTML = `<h3>${title}</h3>`;
  return group;
}

function createImageTool(title, imageKey) {
  const tool = document.createElement("div");
  tool.className = "admin-tool";
  tool.innerHTML = `
    <strong>${title}</strong>
    <label>Reemplazar imagen <input type="file" accept="image/*" data-replace-image="${imageKey}" /></label>
  `;
  return tool;
}

function createPersonTool(card) {
  const id = card.dataset.personId;
  const name = state[`person:${id}:name`] || card.dataset.defaultName;
  const role = state[`person:${id}:role`] || card.dataset.defaultRole;
  const tool = document.createElement("div");
  tool.className = "admin-tool";
  tool.innerHTML = `
    <strong>${name}</strong>
    <label>Nombre <input type="text" value="${escapeAttribute(name)}" data-admin-person-name="${id}" /></label>
    <label>Puesto <input type="text" value="${escapeAttribute(role)}" data-admin-person-role="${id}" /></label>
    <label>Foto <input type="file" accept="image/*" data-admin-person-photo="${id}" /></label>
  `;
  return tool;
}

function createProjectTool(card) {
  const id = card.dataset.projectId;
  const title = card.querySelector("h3")?.textContent.trim() || "Proyecto";
  const value = state[`progress:${id}`] ?? Number.parseInt(card.querySelector(".progress-value")?.textContent || "0", 10);
  const tool = document.createElement("div");
  tool.className = "admin-tool";
  tool.innerHTML = `
    <strong>${title}</strong>
    <label class="admin-slider">
      Avance del proyecto: <strong>${value}%</strong>
      <input type="range" min="0" max="100" value="${value}" data-admin-project-progress="${id}" />
    </label>
    <label>Fotos antes <input type="file" accept="image/*" multiple data-max-files="20" data-admin-project-gallery="${id}:before" /></label>
    <label>Fotos después <input type="file" accept="image/*" multiple data-max-files="20" data-admin-project-gallery="${id}:after" /></label>
  `;
  return tool;
}

function createAmenityTool(section) {
  const id = section.dataset.amenityId;
  const name = section.dataset.amenityName;
  const rules = state[`amenity:${id}:rules`] || getAmenityRulesText(section);
  const tool = document.createElement("div");
  tool.className = "admin-tool";
  tool.innerHTML = `
    <strong>${name}</strong>
    <label>Fotos de ${name} <input type="file" accept="image/*" multiple data-max-files="12" data-admin-amenity-photos="${id}" /></label>
    <label>Reglamento y lineamientos <textarea rows="8" data-admin-amenity-rules="${id}">${escapeHtml(rules)}</textarea></label>
  `;
  return tool;
}

function buildProjectSliders() {
  document.querySelectorAll(".project-card").forEach((card) => {
    const projectId = card.dataset.projectId;
    const current = Number.parseInt(card.querySelector(".progress-value")?.textContent || "0", 10);
    const saved = state[`progress:${projectId}`] ?? current;
    const container = card.querySelector(".admin-progress");

    if (!container) return;

    container.innerHTML = `
      <label class="admin-slider">
        Avance del proyecto: <strong>${saved}%</strong>
        <input type="range" min="0" max="100" value="${saved}" data-progress-slider="${projectId}" />
      </label>
    `;
  });
}

function buildInlinePersonEditors() {
  document.querySelectorAll(".person-card").forEach((card) => {
    const editor = document.createElement("div");
    editor.className = "person-admin";
    editor.innerHTML = `
      <label>Nombre <input type="text" value="${escapeAttribute(card.dataset.defaultName)}" data-person-name-input /></label>
      <label>Puesto <input type="text" value="${escapeAttribute(card.dataset.defaultRole)}" data-person-role-input /></label>
      <label>Foto <input type="file" accept="image/*" data-person-photo-input /></label>
    `;
    card.appendChild(editor);
  });
}

function restoreSavedChanges() {
  if (state.heroImage) {
    setHeroImage(state.heroImage);
  }

  document.querySelectorAll("[data-edit-image]").forEach((image) => {
    const saved = state[`image:${image.dataset.imageKey}`];
    if (saved) image.src = saved;
  });

  document.querySelectorAll(".project-card").forEach((card) => {
    const projectId = card.dataset.projectId;
    const savedProgress = state[`progress:${projectId}`];
    setProjectProgress(card, savedProgress ?? Number.parseInt(card.querySelector(".progress-value")?.textContent || "0", 10));
    renderPreview(card.querySelector('[data-gallery-preview="before"]'), state[`project:${projectId}:before`] || []);
    renderPreview(card.querySelector('[data-gallery-preview="after"]'), state[`project:${projectId}:after`] || []);
  });

  document.querySelectorAll(".person-card").forEach((card) => {
    const id = card.dataset.personId;
    const name = state[`person:${id}:name`] || card.dataset.defaultName;
    const role = state[`person:${id}:role`] || card.dataset.defaultRole;
    const photo = state[`person:${id}:photo`];
    setPerson(card, { name, role, photo });
    card.querySelector("[data-person-name-input]").value = name;
    card.querySelector("[data-person-role-input]").value = role;
  });

  document.querySelectorAll(".amenity-detail").forEach((section) => {
    const id = section.dataset.amenityId;
    const photos = state[`amenity:${id}:photos`];
    const rules = state[`amenity:${id}:rules`];
    if (photos?.length) renderAmenityGallery(section, photos);
    if (rules) setAmenityRules(section, rules);
    const editor = section.querySelector("[data-amenity-rules-editor]");
    if (editor) editor.value = getAmenityRulesText(section);
  });
}

function wireImageReplacement() {
  document.querySelector("[data-admin-bg]")?.addEventListener("change", async (event) => {
    const [image] = await filesToDataUrls(event.target.files, 1);
    if (!image) return;
    state.heroImage = image;
    setHeroImage(image);
    saveState();
  });

  document.querySelectorAll("[data-replace-image]").forEach((input) => {
    input.addEventListener("change", async () => {
      const [image] = await filesToDataUrls(input.files, 1);
      const target = document.querySelector(`[data-image-key="${input.dataset.replaceImage}"]`);
      if (!image || !target) return;
      target.src = image;
      state[`image:${input.dataset.replaceImage}`] = image;
      saveState();
    });
  });
}

function wireProjectPhotoUploads() {
  document.querySelectorAll("[data-project-gallery]").forEach((input) => {
    input.addEventListener("change", async () => {
      const maxFiles = Number(input.dataset.maxFiles || 20);
      const files = await filesToDataUrls(input.files, maxFiles);
      const card = input.closest(".project-card");
      const projectId = card.dataset.projectId;
      const type = input.dataset.projectGallery;
      updateFileNote(input, input.files.length > maxFiles ? `Máximo ${maxFiles} fotos por carga.` : `${files.length} foto(s) seleccionada(s).`);
      if (input.files.length > maxFiles) {
        input.value = "";
        return;
      }
      state[`project:${projectId}:${type}`] = files;
      renderPreview(card.querySelector(`[data-gallery-preview="${type}"]`), files);
      saveState();
    });
  });

  document.querySelectorAll("[data-progress-slider]").forEach((slider) => {
    slider.addEventListener("input", () => {
      const card = slider.closest(".project-card");
      const value = Number(slider.value);
      slider.previousElementSibling.textContent = `${value}%`;
      setProjectProgress(card, value);
      state[`progress:${card.dataset.projectId}`] = value;
      saveState();
    });
  });
}

function wireInlinePersonEditors() {
  document.querySelectorAll(".person-card").forEach((card) => {
    const id = card.dataset.personId;
    const nameInput = card.querySelector("[data-person-name-input]");
    const roleInput = card.querySelector("[data-person-role-input]");
    const photoInput = card.querySelector("[data-person-photo-input]");

    nameInput.addEventListener("input", () => updatePerson(id, { name: nameInput.value }));
    roleInput.addEventListener("input", () => updatePerson(id, { role: roleInput.value }));
    photoInput.addEventListener("change", async () => {
      const [photo] = await filesToDataUrls(photoInput.files, 1);
      if (photo) updatePerson(id, { photo });
    });
  });
}

function wireAdminPersonTools() {
  document.querySelectorAll("[data-admin-person-name]").forEach((input) => {
    input.addEventListener("input", () => updatePerson(input.dataset.adminPersonName, { name: input.value }));
  });
  document.querySelectorAll("[data-admin-person-role]").forEach((input) => {
    input.addEventListener("input", () => updatePerson(input.dataset.adminPersonRole, { role: input.value }));
  });
  document.querySelectorAll("[data-admin-person-photo]").forEach((input) => {
    input.addEventListener("change", async () => {
      const [photo] = await filesToDataUrls(input.files, 1);
      if (photo) updatePerson(input.dataset.adminPersonPhoto, { photo });
    });
  });
}

function wireAmenityTools() {
  document.querySelectorAll("[data-amenity-upload]").forEach((input) => {
    input.addEventListener("change", () => updateAmenityPhotos(input.closest(".amenity-detail"), input));
  });
  document.querySelectorAll("[data-amenity-rules-editor]").forEach((textarea) => {
    textarea.addEventListener("input", () => updateAmenityRules(textarea.closest(".amenity-detail"), textarea.value));
  });
}

function wireAdminAmenityTools() {
  document.querySelectorAll("[data-admin-amenity-photos]").forEach((input) => {
    input.addEventListener("change", () => updateAmenityPhotos(findAmenity(input.dataset.adminAmenityPhotos), input));
  });
  document.querySelectorAll("[data-admin-amenity-rules]").forEach((textarea) => {
    textarea.addEventListener("input", () => updateAmenityRules(findAmenity(textarea.dataset.adminAmenityRules), textarea.value));
  });
}

function wireAdminProjectTools() {
  document.querySelectorAll("[data-admin-project-progress]").forEach((slider) => {
    slider.addEventListener("input", () => {
      const id = slider.dataset.adminProjectProgress;
      const card = document.querySelector(`[data-project-id="${id}"]`);
      const value = Number(slider.value);
      slider.previousElementSibling.textContent = `${value}%`;
      if (!card) return;
      setProjectProgress(card, value);
      state[`progress:${id}`] = value;
      syncProjectSliders(id, value);
      saveState();
    });
  });

  document.querySelectorAll("[data-admin-project-gallery]").forEach((input) => {
    input.addEventListener("change", async () => {
      const [projectId, type] = input.dataset.adminProjectGallery.split(":");
      const card = document.querySelector(`[data-project-id="${projectId}"]`);
      const maxFiles = Number(input.dataset.maxFiles || 20);
      const files = await filesToDataUrls(input.files, maxFiles);
      updateFileNote(input, input.files.length > maxFiles ? `Máximo ${maxFiles} fotos por carga.` : `${files.length} foto(s) seleccionada(s).`);
      if (input.files.length > maxFiles) {
        input.value = "";
        return;
      }
      state[`project:${projectId}:${type}`] = files;
      renderPreview(card?.querySelector(`[data-gallery-preview="${type}"]`), files);
      saveState();
    });
  });
}

async function updateAmenityPhotos(section, input) {
  if (!section) return;
  const maxFiles = Number(input.dataset.maxFiles || 12);
  const files = await filesToDataUrls(input.files, maxFiles);
  updateFileNote(input, input.files.length > maxFiles ? `Máximo ${maxFiles} fotos.` : `${files.length} foto(s) seleccionada(s).`);
  if (input.files.length > maxFiles) {
    input.value = "";
    return;
  }
  state[`amenity:${section.dataset.amenityId}:photos`] = files;
  renderAmenityGallery(section, files);
  saveState();
}

function updateAmenityRules(section, text) {
  if (!section) return;
  state[`amenity:${section.dataset.amenityId}:rules`] = text;
  setAmenityRules(section, text);
  syncAmenityRuleInputs(section.dataset.amenityId, text);
  saveState();
}

function updatePerson(id, patch) {
  const card = document.querySelector(`[data-person-id="${id}"]`);
  if (!card) return;
  const name = patch.name ?? state[`person:${id}:name`] ?? card.dataset.defaultName;
  const role = patch.role ?? state[`person:${id}:role`] ?? card.dataset.defaultRole;
  const photo = patch.photo ?? state[`person:${id}:photo`];
  state[`person:${id}:name`] = name;
  state[`person:${id}:role`] = role;
  if (photo) state[`person:${id}:photo`] = photo;
  setPerson(card, { name, role, photo });
  syncPersonInputs(id, { name, role });
  saveState();
}

function setProjectProgress(card, value) {
  const status = card.querySelector(".project-status");
  status.dataset.original = status.dataset.original || status.textContent;
  card.querySelector(".progress span").style.width = `${value}%`;
  card.querySelector(".progress-value").textContent = `${value}%`;
  status.textContent = value >= 100 ? "Completada" : status.dataset.original;
  status.classList.toggle("complete", value >= 100);
}

function setPerson(card, { name, role, photo }) {
  const photoBox = card.querySelector(".person-photo");
  card.querySelector(".person-name").textContent = name || "Sin nombre";
  card.querySelector(".person-name + span").textContent = role || "";
  photoBox.dataset.initials = getInitials(name);
  photoBox.innerHTML = "";
  photoBox.classList.toggle("has-image", Boolean(photo));
  if (photo) {
    const image = document.createElement("img");
    image.src = photo;
    image.alt = name || "Persona";
    photoBox.appendChild(image);
  }
}

function setHeroImage(image) {
  document.querySelector(".site-header").style.setProperty("--hero-image", `url("${image}")`);
}

function renderPreview(container, images) {
  if (!container) return;
  container.innerHTML = "";
  images.forEach((src) => {
    const image = document.createElement("img");
    image.src = src;
    image.alt = "Fotografía cargada";
    container.appendChild(image);
  });
}

function renderAmenityGallery(section, images) {
  const gallery = section.querySelector("[data-amenity-gallery]");
  if (!gallery) return;
  gallery.innerHTML = "";
  images.forEach((src) => {
    const image = document.createElement("img");
    image.src = src;
    image.alt = `Fotografía de ${section.dataset.amenityName}`;
    gallery.appendChild(image);
  });
}

function setAmenityRules(section, text) {
  const panel = section.querySelector(".rules-panel");
  if (!panel) return;
  const editors = [...panel.querySelectorAll(".rules-editor")];
  panel.querySelectorAll("h3, ul").forEach((node) => node.remove());
  const title = document.createElement("h3");
  title.textContent = "Reglamento y lineamientos";
  const list = document.createElement("ul");
  text.split("\n").map((line) => line.trim()).filter(Boolean).forEach((line) => {
    const item = document.createElement("li");
    item.textContent = line.replace(/^[-•]\s*/, "");
    list.appendChild(item);
  });
  panel.prepend(list);
  panel.prepend(title);
  editors.forEach((editor) => panel.appendChild(editor));
}

function getAmenityRulesText(section) {
  return [...section.querySelectorAll(".rules-panel li")].map((li) => `- ${li.textContent.trim()}`).join("\n");
}

function findAmenity(id) {
  return document.querySelector(`[data-amenity-id="${id}"]`);
}

function syncPersonInputs(id, { name, role }) {
  document.querySelectorAll(`[data-admin-person-name="${id}"], [data-person-name-input]`).forEach((input) => {
    if (input.closest(".person-card") && input.closest(".person-card").dataset.personId !== id) return;
    if (input.value !== name) input.value = name;
  });
  document.querySelectorAll(`[data-admin-person-role="${id}"], [data-person-role-input]`).forEach((input) => {
    if (input.closest(".person-card") && input.closest(".person-card").dataset.personId !== id) return;
    if (input.value !== role) input.value = role;
  });
}

function syncAmenityRuleInputs(id, text) {
  document.querySelectorAll(`[data-admin-amenity-rules="${id}"]`).forEach((input) => {
    if (input.value !== text) input.value = text;
  });
  const section = findAmenity(id);
  const inline = section?.querySelector("[data-amenity-rules-editor]");
  if (inline && inline.value !== text) inline.value = text;
}

function syncProjectSliders(id, value) {
  document.querySelectorAll(`[data-progress-slider="${id}"], [data-admin-project-progress="${id}"]`).forEach((slider) => {
    if (Number(slider.value) !== value) slider.value = value;
    const labelValue = slider.previousElementSibling;
    if (labelValue) labelValue.textContent = `${value}%`;
  });
}

function updateFileNote(input, text) {
  const label = input.closest("label");
  const existingNote = label?.querySelector(".file-note");
  existingNote?.remove();
  const note = document.createElement("span");
  note.className = "file-note";
  note.textContent = text;
  label?.appendChild(note);
}

function filesToDataUrls(fileList, limit) {
  const files = [...fileList].slice(0, limit);
  return Promise.all(files.map((file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  })));
}

function getInitials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SA";
}

function escapeAttribute(value = "") {
  return value.replace(/"/g, "&quot;");
}

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function buildAdminPanelTools() {
  if (!adminToolList) return;
  adminToolList.innerHTML = "";

  const imageGroup = createAdminGroup("Imágenes principales");
  document.querySelectorAll("[data-edit-image]").forEach((image) => {
    imageGroup.appendChild(createImageTool(image.dataset.editImage, image.dataset.imageKey));
  });
  adminToolList.appendChild(imageGroup);

  const projectGroup = createAdminGroup("Proyectos: avance y fotografías");
  projectGroup.appendChild(createAddProjectTool());
  document.querySelectorAll(".project-card").forEach((card) => {
    projectGroup.appendChild(createProjectTool(card));
  });
  adminToolList.appendChild(projectGroup);

  const peopleGroup = createAdminGroup("Personal y responsables");
  document.querySelectorAll(".person-card").forEach((card) => {
    peopleGroup.appendChild(createPersonTool(card));
  });
  adminToolList.appendChild(peopleGroup);

  const amenityGroup = createAdminGroup("Amenidades: fotos, reglamento y lineamientos");
  document.querySelectorAll(".amenity-detail").forEach((section) => {
    amenityGroup.appendChild(createAmenityTool(section));
  });
  adminToolList.appendChild(amenityGroup);

  wireAdminPersonTools();
  wireAdminAmenityTools();
  wireAdminProjectTools();
  wireImageReplacement();
}

function restoreSavedChanges() {
  if (state.heroImage) {
    setHeroImage(state.heroImage);
  }

  document.querySelectorAll("[data-edit-image]").forEach((image) => {
    const saved = state[`image:${image.dataset.imageKey}`];
    if (saved) image.src = saved;
  });

  document.querySelectorAll(".project-card").forEach((card) => {
    const projectId = card.dataset.projectId;
    const savedName = state[`project:${projectId}:name`];
    if (savedName) setProjectName(card, savedName);
    const savedProgress = state[`progress:${projectId}`];
    setProjectProgress(card, savedProgress ?? Number.parseInt(card.querySelector(".progress-value")?.textContent || "0", 10));
    renderPreview(card.querySelector('[data-gallery-preview="before"]'), state[`project:${projectId}:before`] || []);
    renderPreview(card.querySelector('[data-gallery-preview="after"]'), state[`project:${projectId}:after`] || []);
  });

  document.querySelectorAll(".person-card").forEach((card) => {
    const id = card.dataset.personId;
    const name = state[`person:${id}:name`] || card.dataset.defaultName;
    const role = state[`person:${id}:role`] || card.dataset.defaultRole;
    const photo = state[`person:${id}:photo`];
    setPerson(card, { name, role, photo });
    const nameInput = card.querySelector("[data-person-name-input]");
    const roleInput = card.querySelector("[data-person-role-input]");
    if (nameInput) nameInput.value = name;
    if (roleInput) roleInput.value = role;
  });

  document.querySelectorAll(".amenity-detail").forEach((section) => {
    const id = section.dataset.amenityId;
    const photos = state[`amenity:${id}:photos`];
    const rules = state[`amenity:${id}:rules`];
    if (photos?.length) renderAmenityGallery(section, photos);
    if (rules) setAmenityRules(section, rules);
    const editor = section.querySelector("[data-amenity-rules-editor]");
    if (editor) editor.value = getAmenityRulesText(section);
  });

  document.querySelectorAll(".quote-card").forEach((card) => {
    setQuotePdf(card, state[`quote:${card.dataset.quoteId}:pdf`]);
  });
}

function buildAdminPanelTools() {
  if (!adminToolList) return;
  adminToolList.innerHTML = "";

  const imageGroup = createAdminGroup("Imágenes principales");
  document.querySelectorAll("[data-edit-image]").forEach((image) => {
    if (image.closest(".amenity-section, .amenity-detail")) return;
    imageGroup.appendChild(createImageTool(image.dataset.editImage, image.dataset.imageKey));
  });
  adminToolList.appendChild(imageGroup);

  const projectGroup = createAdminGroup("Proyectos: avance y fotografías");
  projectGroup.appendChild(createAddProjectTool());
  document.querySelectorAll(".project-card").forEach((card) => {
    projectGroup.appendChild(createProjectTool(card));
  });
  adminToolList.appendChild(projectGroup);

  const peopleGroup = createAdminGroup("Personal y responsables");
  document.querySelectorAll(".person-card").forEach((card) => {
    peopleGroup.appendChild(createPersonTool(card));
  });
  adminToolList.appendChild(peopleGroup);

  wireAdminPersonTools();
  wireAdminProjectTools();
  wireImageReplacement();
}

function setQuotePdf(card, quote) {
  const control = card.querySelector(".quote-download");
  const meta = card.querySelector(".quote-meta");
  if (!control || !meta) return;

  control.removeAttribute("download");
  control.removeAttribute("href");

  if (!quote?.data) {
    control.removeAttribute("data-quote-viewer");
    control.setAttribute("aria-disabled", "true");
    control.classList.add("disabled");
    control.textContent = "Sin PDF";
    meta.textContent = "PDF pendiente de carga";
    return;
  }

  control.dataset.quoteViewer = card.dataset.quoteId;
  control.removeAttribute("aria-disabled");
  control.classList.remove("disabled");
  control.textContent = "Ver PDF";
  meta.textContent = quote.name ? `Documento disponible: ${quote.name}` : "Documento disponible para visualizar";
}

(() => {
  let mobileBlurTimer;
  let longTouchTimer;
  const isAppleTouchDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isTouchPhone = navigator.maxTouchPoints > 0
    && window.matchMedia("(max-width: 1024px) and (pointer: coarse)").matches;

  function isEditableTarget(target) {
    return target?.closest?.("input, textarea, select, [contenteditable='true']");
  }

  function isPrivacyControl(target) {
    return target?.closest?.(".mobile-privacy-gate, .mobile-privacy-hold");
  }

  function createMobilePrivacyGate() {
    return;
    if (!isTouchPhone || document.querySelector(".mobile-privacy-gate")) return;
    const gate = document.createElement("div");
    gate.className = "mobile-privacy-gate";
    gate.innerHTML = `<button class="mobile-privacy-hold" type="button" aria-label="Mantener presionado para ver el contenido">Mantén presionado para ver</button>`;
    document.body.appendChild(gate);
    document.body.classList.add("mobile-privacy-enabled", "mobile-privacy-locked");

    const holdButton = gate.querySelector(".mobile-privacy-hold");
    const reveal = (event) => {
      event.preventDefault();
      document.body.classList.remove("mobile-privacy-locked", "security-mobile");
      holdButton.textContent = "Contenido visible mientras presionas";
    };
    const lock = () => {
      document.body.classList.add("mobile-privacy-locked");
      holdButton.textContent = "Mantén presionado para ver";
    };

    holdButton.addEventListener("pointerdown", reveal);
    holdButton.addEventListener("pointerup", lock);
    holdButton.addEventListener("pointercancel", lock);
    holdButton.addEventListener("pointerleave", lock);
    holdButton.addEventListener("touchstart", reveal, { passive: false });
    holdButton.addEventListener("touchend", lock);
    holdButton.addEventListener("touchcancel", lock);
  }

  function blurForMobileProtection() {
    if (document.body.classList.contains("site-locked")) return;
    document.body.classList.add("security-mobile");
    if (document.body.classList.contains("mobile-privacy-enabled")) {
      document.body.classList.add("mobile-privacy-locked");
    }
    window.clearTimeout(mobileBlurTimer);
    mobileBlurTimer = window.setTimeout(() => {
      document.body.classList.remove("security-mobile");
    }, 10000);
  }

  function clearPauseAndProtectOnReturn() {
    document.body.classList.remove("security-paused");
    if (isAppleTouchDevice) {
      blurForMobileProtection();
    }
  }

  function clearLongTouch() {
    window.clearTimeout(longTouchTimer);
  }

  document.addEventListener("touchstart", (event) => {
    if (isEditableTarget(event.target) || isPrivacyControl(event.target)) return;
    if (event.touches.length > 1) {
      event.preventDefault();
      blurForMobileProtection();
      return;
    }
    clearLongTouch();
    longTouchTimer = window.setTimeout(blurForMobileProtection, 700);
  }, { capture: true, passive: false });

  document.addEventListener("touchend", clearLongTouch, true);
  document.addEventListener("touchcancel", clearLongTouch, true);
  document.addEventListener("touchmove", (event) => {
    if (isPrivacyControl(event.target)) return;
    if (event.touches.length > 1) {
      event.preventDefault();
      blurForMobileProtection();
      return;
    }
    clearLongTouch();
  }, { capture: true, passive: false });

  document.addEventListener("gesturestart", (event) => {
    event.preventDefault();
    blurForMobileProtection();
  }, { capture: true, passive: false });

  document.addEventListener("gesturechange", (event) => {
    event.preventDefault();
    blurForMobileProtection();
  }, { capture: true, passive: false });

  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch" || isEditableTarget(event.target) || isPrivacyControl(event.target)) return;
    clearLongTouch();
    longTouchTimer = window.setTimeout(blurForMobileProtection, 700);
  }, true);

  document.addEventListener("pointerup", clearLongTouch, true);
  document.addEventListener("pointercancel", clearLongTouch, true);

  document.addEventListener("selectstart", (event) => {
    if (isEditableTarget(event.target) || isPrivacyControl(event.target)) return;
    event.preventDefault();
  }, true);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      document.body.classList.add("security-paused");
      return;
    }
    clearPauseAndProtectOnReturn();
  });

  window.addEventListener("pagehide", () => {
    document.body.classList.add("security-paused");
  });

  window.addEventListener("pageshow", clearPauseAndProtectOnReturn);

  window.addEventListener("focus", () => {
    if (isAppleTouchDevice) {
      blurForMobileProtection();
    }
  });

  window.addEventListener("orientationchange", blurForMobileProtection);

  createMobilePrivacyGate();
})();

(() => {
  const shieldText = "Contenido privado de SIERRAZUL. Capturas, impresión y descarga no autorizada están restringidas.";
  let shieldTimer;
  let captureBlurTimer;

  function createSecurityLayer() {
    document.querySelector(".security-watermark")?.remove();

    if (!document.querySelector(".security-shield")) {
      const shield = document.createElement("div");
      shield.className = "security-shield";
      shield.setAttribute("aria-live", "polite");
      shield.innerHTML = `<div><strong>SIERRAZUL</strong><span>${shieldText}</span></div>`;
      document.body.appendChild(shield);
    }
  }

  function showSecurityShield(message = shieldText) {
    const shield = document.querySelector(".security-shield span");
    if (shield) shield.textContent = message;
    document.body.classList.add("security-alert");
    window.clearTimeout(shieldTimer);
    shieldTimer = window.setTimeout(() => {
      document.body.classList.remove("security-alert");
      if (shield) shield.textContent = shieldText;
    }, 2200);
  }

  function blurForCapture() {
    document.body.classList.add("security-capture");
    window.clearTimeout(captureBlurTimer);
    captureBlurTimer = window.setTimeout(() => {
      document.body.classList.remove("security-capture");
    }, 10000);
  }

  function isEditableTarget(target) {
    return target?.closest?.("input, textarea, select, [contenteditable='true']");
  }

  function protectKeyboard(event) {
    const key = event.key.toLowerCase();
    const withControl = event.ctrlKey || event.metaKey;
    const blockedCombo = withControl && ["p", "s", "u"].includes(key);
    const blockedDevTools = key === "f12" || (withControl && event.shiftKey && ["i", "j", "c"].includes(key));
    const blockedAppleScreenshot = event.metaKey && event.shiftKey && ["3", "4", "5"].includes(key);

    if (event.key === "PrintScreen" || blockedAppleScreenshot) {
      event.preventDefault();
      navigator.clipboard?.writeText("Captura restringida por SIERRAZUL.").catch(() => {});
      blurForCapture();
      return;
    }

    if (blockedCombo || blockedDevTools) {
      event.preventDefault();
      showSecurityShield("Acción restringida. Este contenido es privado de SIERRAZUL.");
    }
  }

  createSecurityLayer();

  document.addEventListener("keydown", protectKeyboard, true);
  document.addEventListener("keyup", (event) => {
    if (event.key === "PrintScreen") {
      navigator.clipboard?.writeText("Captura restringida por SIERRAZUL.").catch(() => {});
      blurForCapture();
    }
  }, true);

  document.addEventListener("contextmenu", (event) => {
    if (isEditableTarget(event.target)) return;
    event.preventDefault();
    showSecurityShield("Clic derecho desactivado para proteger la información.");
  }, true);

  document.addEventListener("dragstart", (event) => {
    event.preventDefault();
  }, true);

  document.addEventListener("copy", (event) => {
    if (isEditableTarget(event.target)) return;
    event.preventDefault();
    showSecurityShield("Copiar contenido está restringido.");
  }, true);

  window.addEventListener("blur", () => {
    if (!document.body.classList.contains("site-locked")) {
      document.body.classList.add("security-paused");
    }
  });

  window.addEventListener("focus", () => {
    document.body.classList.remove("security-paused");
  });

  window.addEventListener("beforeprint", () => {
    document.body.classList.add("security-printing");
    showSecurityShield("Impresión restringida. Documento privado de SIERRAZUL.");
  });

  window.addEventListener("afterprint", () => {
    document.body.classList.remove("security-printing");
  });
})();

async function loadPdfLibrary() {
  if (window.pdfjsLib) return window.pdfjsLib;
  const library = await import("./assets/pdf.min.js");
  window.pdfjsLib = library;
  return library;
}

async function openPdfViewer(card, quote) {
  const modal = document.querySelector(".pdf-modal");
  const title = document.querySelector("[data-pdf-title]");
  const message = document.querySelector("[data-pdf-message]");
  const canvas = document.querySelector("[data-pdf-canvas]");
  if (!modal) return;

  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("panel-open");
  title.textContent = `${card.dataset.category || "Cotización"} · ${card.dataset.provider || "Proveedor"}`;
  message.textContent = "Cargando documento...";
  canvas.hidden = true;

  try {
    const pdfjsLib = await loadPdfLibrary();
    pdfjsLib.GlobalWorkerOptions.workerSrc = "./assets/pdf.worker.min.js";
    const data = dataUrlToUint8Array(quote.data);
    activePdfDocument = await pdfjsLib.getDocument({ data }).promise;
    activePdfPage = 1;
    await renderPdfPage(1);
  } catch {
    activePdfDocument = null;
    message.textContent = "No se pudo visualizar este PDF. Intenta cargarlo nuevamente desde el administrador.";
  }
}

async function loadPdfLibrary() {
  if (window.pdfjsLib) return window.pdfjsLib;
  const library = await import("./assets/pdf.min.js");
  window.pdfjsLib = library;
  return library;
}

async function openPdfViewer(card, quote) {
  const modal = document.querySelector(".pdf-modal");
  const title = document.querySelector("[data-pdf-title]");
  const message = document.querySelector("[data-pdf-message]");
  const canvas = document.querySelector("[data-pdf-canvas]");
  if (!modal) return;

  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("panel-open");
  title.textContent = `${card.dataset.category || "Cotización"} · ${card.dataset.provider || "Proveedor"}`;
  message.textContent = "Cargando documento...";
  canvas.hidden = true;

  try {
    const pdfjsLib = await loadPdfLibrary();
    pdfjsLib.GlobalWorkerOptions.workerSrc = "./assets/pdf.worker.min.js";
    const data = dataUrlToUint8Array(quote.data);
    activePdfDocument = await pdfjsLib.getDocument({ data }).promise;
    activePdfPage = 1;
    await renderPdfPage(1);
  } catch {
    activePdfDocument = null;
    message.textContent = "No se pudo visualizar este PDF. Intenta cargarlo nuevamente desde el administrador.";
  }
}

function wireQuoteViewer() {
  document.querySelectorAll(".quote-download").forEach((control) => {
    control.addEventListener("click", (event) => {
      event.preventDefault();
      const id = control.dataset.quoteViewer;
      if (!id) return;
      const card = document.querySelector(`[data-quote-id="${id}"]`);
      const quote = state[`quote:${id}:pdf`];
      if (quote?.data && card) openPdfViewer(card, quote);
    });
  });

  document.querySelector(".pdf-close")?.addEventListener("click", closePdfViewer);
  document.querySelector("[data-pdf-prev]")?.addEventListener("click", () => renderPdfPage(activePdfPage - 1));
  document.querySelector("[data-pdf-next]")?.addEventListener("click", () => renderPdfPage(activePdfPage + 1));
}

async function openPdfViewer(card, quote) {
  const modal = document.querySelector(".pdf-modal");
  const title = document.querySelector("[data-pdf-title]");
  const message = document.querySelector("[data-pdf-message]");
  const canvas = document.querySelector("[data-pdf-canvas]");
  if (!modal || !window.pdfjsLib) {
    alert("El visualizador PDF no está disponible en este momento.");
    return;
  }

  window.pdfjsLib.GlobalWorkerOptions.workerSrc = "./assets/pdf.worker.min.js";
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("panel-open");
  title.textContent = `${card.dataset.category || "Cotización"} · ${card.dataset.provider || "Proveedor"}`;
  message.textContent = "Cargando documento...";
  canvas.hidden = true;

  try {
    const data = dataUrlToUint8Array(quote.data);
    activePdfDocument = await window.pdfjsLib.getDocument({ data }).promise;
    activePdfPage = 1;
    await renderPdfPage(1);
  } catch {
    activePdfDocument = null;
    message.textContent = "No se pudo visualizar este PDF. Intenta cargarlo nuevamente desde el administrador.";
  }
}

function closePdfViewer() {
  const modal = document.querySelector(".pdf-modal");
  const canvas = document.querySelector("[data-pdf-canvas]");
  const message = document.querySelector("[data-pdf-message]");
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("panel-open");
  activePdfDocument = null;
  activePdfPage = 1;
  if (canvas) canvas.hidden = true;
  if (message) message.textContent = "";
}

async function renderPdfPage(pageNumber) {
  if (!activePdfDocument) return;
  const nextPage = Math.min(Math.max(pageNumber, 1), activePdfDocument.numPages);
  const page = await activePdfDocument.getPage(nextPage);
  const canvas = document.querySelector("[data-pdf-canvas]");
  const message = document.querySelector("[data-pdf-message]");
  const pageLabel = document.querySelector("[data-pdf-pages]");
  const prevButton = document.querySelector("[data-pdf-prev]");
  const nextButton = document.querySelector("[data-pdf-next]");
  const context = canvas.getContext("2d");
  const viewport = page.getViewport({ scale: Math.min(1.35, Math.max(0.8, (window.innerWidth - 80) / 760)) });

  activePdfPage = nextPage;
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.hidden = false;
  message.textContent = "";
  await page.render({ canvasContext: context, viewport }).promise;

  pageLabel.textContent = `Página ${activePdfPage} de ${activePdfDocument.numPages}`;
  prevButton.disabled = activePdfPage <= 1;
  nextButton.disabled = activePdfPage >= activePdfDocument.numPages;
}

function dataUrlToUint8Array(dataUrl) {
  const base64 = String(dataUrl).split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

let activePdfDocument = null;
let activePdfPage = 1;

function setQuotePdf(card, quote) {
  const control = card.querySelector(".quote-download");
  const meta = card.querySelector(".quote-meta");
  if (!control || !meta) return;

  control.removeAttribute("download");
  control.removeAttribute("href");

  if (!quote?.data) {
    control.removeAttribute("data-quote-viewer");
    control.setAttribute("aria-disabled", "true");
    control.classList.add("disabled");
    control.textContent = "Sin PDF";
    meta.textContent = "PDF pendiente de carga";
    return;
  }

  control.dataset.quoteViewer = card.dataset.quoteId;
  control.removeAttribute("aria-disabled");
  control.classList.remove("disabled");
  control.textContent = "Ver PDF";
  meta.textContent = quote.name ? `Documento disponible: ${quote.name}` : "Documento disponible para visualizar";
}

function wireQuoteViewer() {
  document.querySelectorAll(".quote-download").forEach((control) => {
    control.addEventListener("click", (event) => {
      event.preventDefault();
      const id = control.dataset.quoteViewer;
      if (!id) return;
      const card = document.querySelector(`[data-quote-id="${id}"]`);
      const quote = state[`quote:${id}:pdf`];
      if (quote?.data && card) openPdfViewer(card, quote);
    });
  });

  document.querySelector(".pdf-close")?.addEventListener("click", closePdfViewer);
  document.querySelector("[data-pdf-prev]")?.addEventListener("click", () => renderPdfPage(activePdfPage - 1));
  document.querySelector("[data-pdf-next]")?.addEventListener("click", () => renderPdfPage(activePdfPage + 1));
}

async function openPdfViewer(card, quote) {
  const modal = document.querySelector(".pdf-modal");
  const title = document.querySelector("[data-pdf-title]");
  const message = document.querySelector("[data-pdf-message]");
  const canvas = document.querySelector("[data-pdf-canvas]");
  if (!modal || !window.pdfjsLib) {
    alert("El visualizador PDF no está disponible en este momento.");
    return;
  }

  window.pdfjsLib.GlobalWorkerOptions.workerSrc = "./assets/pdf.worker.min.js";
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("panel-open");
  title.textContent = `${card.dataset.category || "Cotización"} · ${card.dataset.provider || "Proveedor"}`;
  message.textContent = "Cargando documento...";
  canvas.hidden = true;

  try {
    const data = dataUrlToUint8Array(quote.data);
    activePdfDocument = await window.pdfjsLib.getDocument({ data }).promise;
    activePdfPage = 1;
    await renderPdfPage(1);
  } catch {
    activePdfDocument = null;
    message.textContent = "No se pudo visualizar este PDF. Intenta cargarlo nuevamente desde el administrador.";
  }
}

function closePdfViewer() {
  const modal = document.querySelector(".pdf-modal");
  const canvas = document.querySelector("[data-pdf-canvas]");
  const message = document.querySelector("[data-pdf-message]");
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("panel-open");
  activePdfDocument = null;
  activePdfPage = 1;
  if (canvas) canvas.hidden = true;
  if (message) message.textContent = "";
}

async function renderPdfPage(pageNumber) {
  if (!activePdfDocument) return;
  const nextPage = Math.min(Math.max(pageNumber, 1), activePdfDocument.numPages);
  const page = await activePdfDocument.getPage(nextPage);
  const canvas = document.querySelector("[data-pdf-canvas]");
  const message = document.querySelector("[data-pdf-message]");
  const pageLabel = document.querySelector("[data-pdf-pages]");
  const prevButton = document.querySelector("[data-pdf-prev]");
  const nextButton = document.querySelector("[data-pdf-next]");
  const context = canvas.getContext("2d");
  const viewport = page.getViewport({ scale: Math.min(1.35, Math.max(0.8, (window.innerWidth - 80) / 760)) });

  activePdfPage = nextPage;
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.hidden = false;
  message.textContent = "";
  await page.render({ canvasContext: context, viewport }).promise;

  pageLabel.textContent = `Página ${activePdfPage} de ${activePdfDocument.numPages}`;
  prevButton.disabled = activePdfPage <= 1;
  nextButton.disabled = activePdfPage >= activePdfDocument.numPages;
}

function dataUrlToUint8Array(dataUrl) {
  const base64 = String(dataUrl).split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

wireQuoteViewer();

function createQuoteTool(card) {
  const id = card.dataset.quoteId;
  const provider = card.dataset.provider || "Proveedor";
  const category = card.dataset.category || "Cotización";
  const savedQuote = state[`quote:${id}:pdf`];
  const tool = document.createElement("div");
  tool.className = "admin-tool";
  tool.innerHTML = `
    <strong>${escapeHtml(category)} · ${escapeHtml(provider)}</strong>
    <label>Archivo PDF <input type="file" accept="application/pdf,.pdf" data-admin-quote-pdf="${id}" /></label>
    <span class="file-note">${savedQuote?.name ? `Archivo actual: ${escapeHtml(savedQuote.name)}` : "Sin PDF cargado"}</span>
  `;
  return tool;
}

function wireAdminQuoteTools() {
  document.querySelectorAll("[data-admin-quote-pdf]").forEach((input) => {
    input.addEventListener("change", async () => {
      const id = input.dataset.adminQuotePdf;
      const card = document.querySelector(`[data-quote-id="${id}"]`);
      const file = input.files?.[0];
      if (!file || !card) return;
      if (file.type && file.type !== "application/pdf") {
        updateFileNote(input, "Selecciona un archivo PDF.");
        input.value = "";
        return;
      }
      const quote = {
        name: file.name,
        data: await fileToDataUrl(file),
        updatedAt: new Date().toISOString(),
      };
      state[`quote:${id}:pdf`] = quote;
      setQuotePdf(card, quote);
      updateFileNote(input, `PDF cargado: ${file.name}`);
      saveState();
    });
  });
}

function setQuotePdf(card, quote) {
  const link = card.querySelector(".quote-download");
  const meta = card.querySelector(".quote-meta");
  const provider = card.dataset.provider || "cotizacion";
  if (!link || !meta) return;

  if (!quote?.data) {
    link.removeAttribute("href");
    link.removeAttribute("download");
    link.setAttribute("aria-disabled", "true");
    link.classList.add("disabled");
    link.textContent = "Sin PDF";
    meta.textContent = "PDF pendiente de carga";
    return;
  }

  link.href = quote.data;
  link.download = quote.name || `${provider}.pdf`;
  link.removeAttribute("aria-disabled");
  link.classList.remove("disabled");
  link.textContent = "Descargar PDF";
  meta.textContent = quote.name ? `Archivo: ${quote.name}` : "PDF disponible";
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function restoreSavedChanges() {
  if (state.heroImage) {
    setHeroImage(state.heroImage);
  }

  document.querySelectorAll("[data-edit-image]").forEach((image) => {
    const saved = state[`image:${image.dataset.imageKey}`];
    if (saved) image.src = saved;
  });

  document.querySelectorAll(".project-card").forEach((card) => {
    const projectId = card.dataset.projectId;
    const savedName = state[`project:${projectId}:name`];
    if (savedName) setProjectName(card, savedName);
    const savedProgress = state[`progress:${projectId}`];
    setProjectProgress(card, savedProgress ?? Number.parseInt(card.querySelector(".progress-value")?.textContent || "0", 10));
    renderPreview(card.querySelector('[data-gallery-preview="before"]'), state[`project:${projectId}:before`] || []);
    renderPreview(card.querySelector('[data-gallery-preview="after"]'), state[`project:${projectId}:after`] || []);
  });

  document.querySelectorAll(".person-card").forEach((card) => {
    const id = card.dataset.personId;
    const name = state[`person:${id}:name`] || card.dataset.defaultName;
    const role = state[`person:${id}:role`] || card.dataset.defaultRole;
    const photo = state[`person:${id}:photo`];
    setPerson(card, { name, role, photo });
    const nameInput = card.querySelector("[data-person-name-input]");
    const roleInput = card.querySelector("[data-person-role-input]");
    if (nameInput) nameInput.value = name;
    if (roleInput) roleInput.value = role;
  });

  document.querySelectorAll(".amenity-detail").forEach((section) => {
    const id = section.dataset.amenityId;
    const photos = state[`amenity:${id}:photos`];
    const rules = state[`amenity:${id}:rules`];
    if (photos?.length) renderAmenityGallery(section, photos);
    if (rules) setAmenityRules(section, rules);
    const editor = section.querySelector("[data-amenity-rules-editor]");
    if (editor) editor.value = getAmenityRulesText(section);
  });

  document.querySelectorAll(".quote-card").forEach((card) => {
    setQuotePdf(card, state[`quote:${card.dataset.quoteId}:pdf`]);
  });
}

function buildAdminPanelTools() {
  if (!adminToolList) return;
  adminToolList.innerHTML = "";

  const imageGroup = createAdminGroup("Imágenes principales");
  document.querySelectorAll("[data-edit-image]").forEach((image) => {
    if (image.closest(".amenity-section, .amenity-detail")) return;
    imageGroup.appendChild(createImageTool(image.dataset.editImage, image.dataset.imageKey));
  });
  adminToolList.appendChild(imageGroup);

  const projectGroup = createAdminGroup("Proyectos: avance y fotografías");
  projectGroup.appendChild(createAddProjectTool());
  document.querySelectorAll(".project-card").forEach((card) => {
    projectGroup.appendChild(createProjectTool(card));
  });
  adminToolList.appendChild(projectGroup);

  const quoteGroup = createAdminGroup("Cotizaciones: PDF por proveedor");
  document.querySelectorAll(".quote-card").forEach((card) => {
    quoteGroup.appendChild(createQuoteTool(card));
  });
  adminToolList.appendChild(quoteGroup);

  const peopleGroup = createAdminGroup("Personal y responsables");
  document.querySelectorAll(".person-card").forEach((card) => {
    peopleGroup.appendChild(createPersonTool(card));
  });
  adminToolList.appendChild(peopleGroup);

  wireAdminPersonTools();
  wireAdminProjectTools();
  wireAdminQuoteTools();
  wireImageReplacement();
}

function createAddProjectTool() {
  const tool = document.createElement("div");
  tool.className = "admin-tool";
  tool.innerHTML = `
    <strong>Agregar nuevo proyecto</strong>
    <label>Nombre del proyecto <input type="text" data-new-project-name placeholder="Ej. Cambio de luminarias" /></label>
    <button class="admin-inline-button" type="button" data-add-project>Sumar proyecto</button>
  `;
  return tool;
}

function createProjectTool(card) {
  const id = card.dataset.projectId;
  const title = card.querySelector("h3")?.textContent.trim() || "Proyecto";
  const value = state[`progress:${id}`] ?? Number.parseInt(card.querySelector(".progress-value")?.textContent || "0", 10);
  const tool = document.createElement("div");
  tool.className = "admin-tool";
  tool.innerHTML = `
    <strong>${title}</strong>
    <label>Nombre del proyecto <input type="text" value="${escapeAttribute(title)}" data-admin-project-name="${id}" /></label>
    <label class="admin-slider">
      Avance del proyecto: <strong>${value}%</strong>
      <input type="range" min="0" max="100" value="${value}" data-admin-project-progress="${id}" />
    </label>
    <label>Fotos antes <input type="file" accept="image/*" multiple data-max-files="20" data-admin-project-gallery="${id}:before" /></label>
    <label>Fotos después <input type="file" accept="image/*" multiple data-max-files="20" data-admin-project-gallery="${id}:after" /></label>
  `;
  return tool;
}

function restoreSavedChanges() {
  if (state.heroImage) {
    setHeroImage(state.heroImage);
  }

  document.querySelectorAll("[data-edit-image]").forEach((image) => {
    const saved = state[`image:${image.dataset.imageKey}`];
    if (saved) image.src = saved;
  });

  document.querySelectorAll(".project-card").forEach((card) => {
    const projectId = card.dataset.projectId;
    const savedName = state[`project:${projectId}:name`];
    if (savedName) setProjectName(card, savedName);
    const savedProgress = state[`progress:${projectId}`];
    setProjectProgress(card, savedProgress ?? Number.parseInt(card.querySelector(".progress-value")?.textContent || "0", 10));
    renderPreview(card.querySelector('[data-gallery-preview="before"]'), state[`project:${projectId}:before`] || []);
    renderPreview(card.querySelector('[data-gallery-preview="after"]'), state[`project:${projectId}:after`] || []);
  });

  document.querySelectorAll(".person-card").forEach((card) => {
    const id = card.dataset.personId;
    const name = state[`person:${id}:name`] || card.dataset.defaultName;
    const role = state[`person:${id}:role`] || card.dataset.defaultRole;
    const photo = state[`person:${id}:photo`];
    setPerson(card, { name, role, photo });
    card.querySelector("[data-person-name-input]").value = name;
    card.querySelector("[data-person-role-input]").value = role;
  });

  document.querySelectorAll(".amenity-detail").forEach((section) => {
    const id = section.dataset.amenityId;
    const photos = state[`amenity:${id}:photos`];
    const rules = state[`amenity:${id}:rules`];
    if (photos?.length) renderAmenityGallery(section, photos);
    if (rules) setAmenityRules(section, rules);
    const editor = section.querySelector("[data-amenity-rules-editor]");
    if (editor) editor.value = getAmenityRulesText(section);
  });

  document.querySelectorAll(".quote-card").forEach((card) => {
    setQuotePdf(card, state[`quote:${card.dataset.quoteId}:pdf`]);
  });
}

function wireAdminProjectTools() {
  document.querySelector("[data-add-project]")?.addEventListener("click", () => {
    const input = document.querySelector("[data-new-project-name]");
    const name = input?.value.trim() || "Nuevo proyecto";
    addProject(name);
    if (input) input.value = "";
  });

  document.querySelectorAll("[data-admin-project-name]").forEach((input) => {
    input.addEventListener("input", () => {
      const id = input.dataset.adminProjectName;
      const card = document.querySelector(`[data-project-id="${id}"]`);
      if (!card) return;
      setProjectName(card, input.value);
      state[`project:${id}:name`] = input.value;
      saveState();
    });
  });

  document.querySelectorAll("[data-admin-project-progress]").forEach((slider) => {
    slider.addEventListener("input", () => {
      const id = slider.dataset.adminProjectProgress;
      const card = document.querySelector(`[data-project-id="${id}"]`);
      const value = Number(slider.value);
      slider.previousElementSibling.textContent = `${value}%`;
      if (!card) return;
      setProjectProgress(card, value);
      state[`progress:${id}`] = value;
      syncProjectSliders(id, value);
      saveState();
    });
  });

  document.querySelectorAll("[data-admin-project-gallery]").forEach((input) => {
    input.addEventListener("change", async () => {
      const [projectId, type] = input.dataset.adminProjectGallery.split(":");
      const card = document.querySelector(`[data-project-id="${projectId}"]`);
      const maxFiles = Number(input.dataset.maxFiles || 20);
      const files = await filesToDataUrls(input.files, maxFiles);
      updateFileNote(input, input.files.length > maxFiles ? `Máximo ${maxFiles} fotos por carga.` : `${files.length} foto(s) seleccionada(s).`);
      if (input.files.length > maxFiles) {
        input.value = "";
        return;
      }
      state[`project:${projectId}:${type}`] = files;
      renderPreview(card?.querySelector(`[data-gallery-preview="${type}"]`), files);
      saveState();
    });
  });
}

function renderSavedProjects() {
  (state.projects || []).forEach((project) => {
    if (!document.querySelector(`[data-project-id="${project.id}"]`)) {
      appendProjectCard(project);
    }
  });
}

function addProject(name) {
  const project = {
    id: `custom-${Date.now()}`,
    name,
  };
  state.projects = [...(state.projects || []), project];
  state[`project:${project.id}:name`] = name;
  state[`progress:${project.id}`] = 0;
  appendProjectCard(project);
  buildProjectSliders();
  buildAdminPanelTools();
  wireProjectPhotoUploads();
  saveState();
}

function appendProjectCard(project) {
  const board = document.querySelector(".project-board");
  if (!board) return;
  const card = document.createElement("article");
  card.className = "project-card";
  card.dataset.projectId = project.id;
  card.innerHTML = `
    <span class="status project-status">Programado</span>
    <h3>${escapeHtml(project.name)}</h3>
    <p>Proyecto agregado desde el panel de administración.</p>
    <div class="progress"><span style="width: 0%"></span></div>
    <footer><span class="progress-value">0%</span><span>Nuevo</span></footer>
    <div class="admin-progress" data-admin-only></div>
    <div class="upload-pair">
      <label>Antes <input type="file" accept="image/*" multiple data-max-files="20" data-project-gallery="before" /></label>
      <label>Después <input type="file" accept="image/*" multiple data-max-files="20" data-project-gallery="after" /></label>
    </div>
    <div class="project-photo-preview" data-gallery-preview="before"></div>
    <div class="project-photo-preview" data-gallery-preview="after"></div>
  `;
  board.appendChild(card);
  setProjectProgress(card, state[`progress:${project.id}`] ?? 0);
}

function setProjectName(card, name) {
  card.querySelector("h3").textContent = name || "Proyecto sin nombre";
}

function buildAdminPanelTools() {
  if (!adminToolList) return;
  adminToolList.innerHTML = "";

  const imageGroup = createAdminGroup("Imágenes principales");
  document.querySelectorAll("[data-edit-image]").forEach((image) => {
    if (image.closest(".amenity-section, .amenity-detail")) return;
    imageGroup.appendChild(createImageTool(image.dataset.editImage, image.dataset.imageKey));
  });
  adminToolList.appendChild(imageGroup);

  const projectGroup = createAdminGroup("Proyectos: avance y fotografías");
  projectGroup.appendChild(createAddProjectTool());
  document.querySelectorAll(".project-card").forEach((card) => {
    projectGroup.appendChild(createProjectTool(card));
  });
  adminToolList.appendChild(projectGroup);

  const quoteGroup = createAdminGroup("Cotizaciones: PDF por proveedor");
  document.querySelectorAll(".quote-card").forEach((card) => {
    quoteGroup.appendChild(createQuoteTool(card));
  });
  adminToolList.appendChild(quoteGroup);

  const peopleGroup = createAdminGroup("Personal y responsables");
  document.querySelectorAll(".person-card").forEach((card) => {
    peopleGroup.appendChild(createPersonTool(card));
  });
  adminToolList.appendChild(peopleGroup);

  wireAdminPersonTools();
  wireAdminProjectTools();
  wireAdminQuoteTools();
  wireImageReplacement();
}

async function loadPdfLibrary() {
  if (window.pdfjsLib) return window.pdfjsLib;
  const library = await import("./assets/pdf.min.js");
  window.pdfjsLib = library;
  return library;
}

async function openPdfViewer(card, quote) {
  const modal = document.querySelector(".pdf-modal");
  const title = document.querySelector("[data-pdf-title]");
  const message = document.querySelector("[data-pdf-message]");
  const canvas = document.querySelector("[data-pdf-canvas]");
  if (!modal) return;

  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("panel-open");
  title.textContent = `${card.dataset.category || "Cotización"} · ${card.dataset.provider || "Proveedor"}`;
  message.textContent = "Cargando documento...";
  canvas.hidden = true;

  try {
    const pdfjsLib = await loadPdfLibrary();
    pdfjsLib.GlobalWorkerOptions.workerSrc = "./assets/pdf.worker.min.js";
    const data = dataUrlToUint8Array(quote.data);
    activePdfDocument = await pdfjsLib.getDocument({ data }).promise;
    activePdfPage = 1;
    await renderPdfPage(1);
  } catch {
    activePdfDocument = null;
    message.textContent = "No se pudo visualizar este PDF. Intenta cargarlo nuevamente desde el administrador.";
  }
}

function setQuotePdf(card, quote) {
  const control = card.querySelector(".quote-download");
  const meta = card.querySelector(".quote-meta");
  if (!control || !meta) return;

  control.removeAttribute("download");
  control.removeAttribute("href");

  if (!quote?.data) {
    control.removeAttribute("data-quote-viewer");
    control.setAttribute("aria-disabled", "true");
    control.classList.add("disabled");
    control.textContent = "Sin PDF";
    meta.textContent = "PDF pendiente de carga";
    return;
  }

  control.dataset.quoteViewer = card.dataset.quoteId;
  control.removeAttribute("aria-disabled");
  control.classList.remove("disabled");
  control.textContent = "Ver PDF";
  meta.textContent = quote.name ? `Documento disponible: ${quote.name}` : "Documento disponible para visualizar";
}
