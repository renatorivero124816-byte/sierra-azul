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
