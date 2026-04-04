const SUPPORTED_LANGUAGES = new Set(["en", "de"]);
const DEFAULT_LANGUAGE = "en";
const APP_ROOT = document.getElementById("app");
const STORAGE_THEME_KEY = "cv-theme";

function getRequestedLanguage() {
  const params = new URLSearchParams(window.location.search);
  const candidate = params.get("lang");
  return SUPPORTED_LANGUAGES.has(candidate) ? candidate : DEFAULT_LANGUAGE;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function renderLinks(items) {
  return items
    .map((item) => `<a href="${escapeAttribute(item.href)}">${escapeHtml(item.label)}</a>`)
    .join("");
}

function renderBullets(items) {
  if (!items.length) {
    return "";
  }

  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderItem(item, sectionId) {
  const dateText =
    sectionId === "education" && typeof item.startDate === "string" && typeof item.endDate === "string"
      ? `${item.startDate} - ${item.endDate}`
      : item.date;
  const projectLinks =
    sectionId === "projects" && Array.isArray(item.links) && item.links.length > 0
      ? `
          <div class="project-links">
            ${item.links
              .map(
                (link) =>
                  `<a class="project-link" href="${escapeAttribute(link.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`,
              )
              .join("")}
          </div>
        `
      : "";

  return `
    <div class="item">
      <div class="item-head">
        <div>
          <h3 class="item-title">${escapeHtml(item.title)}</h3>
          <p class="item-subtitle">${escapeHtml(item.subtitle)}</p>
          ${projectLinks}
        </div>
        <div class="item-date">${escapeHtml(dateText || "")}</div>
      </div>
      ${renderBullets(item.bullets)}
    </div>
  `;
}

function renderSection(sectionId, section) {
  return `
    <section id="${escapeAttribute(sectionId)}">
      <h2 class="section-title">${escapeHtml(section.title)}</h2>
      ${section.items.map((item) => renderItem(item, sectionId)).join("")}
    </section>
  `;
}

function renderSkillGroups(groups) {
  return groups
    .map(
      (group) => `
        <div class="skill-group">
          <div class="label">${escapeHtml(group.label)}</div>
          <div class="chips">
            ${group.chips.map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`).join("")}
          </div>
        </div>
      `,
    )
    .join("");
}

function renderLanguageToggle(data, lang) {
  const nextLang = data.meta.alternateLang || (lang === "de" ? "en" : "de");
  const url = new URL(window.location.href);
  url.searchParams.set("lang", nextLang);
  url.hash = window.location.hash;

  return `
    <a class="btn" id="language-toggle" href="${escapeAttribute(url.pathname + url.search + url.hash)}" aria-label="${escapeAttribute(data.toolbar.languageButtonAriaLabel)}">
      ${escapeHtml(data.toolbar.languageButtonLabel)}
    </a>
  `;
}

function renderToolbar(data, lang) {
  return `
    <div class="toolbar">
      <div class="toolbar-inner">
        <div class="toolbar-left">
          <div class="brand">${escapeHtml(data.toolbar.brand)}</div>
          <div class="toolbar-nav">
            ${data.toolbar.links
              .map((link) => `<a class="btn" href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a>`)
              .join("")}
          </div>
        </div>

        <div class="toolbar-actions">
          ${renderLanguageToggle(data, lang)}
          <button id="theme-toggle" class="btn" type="button" aria-label="${escapeAttribute(data.toolbar.themeLabels.dark)}">${escapeHtml(data.toolbar.themeLabels.dark)}</button>
          <button id="print-button" class="btn primary" type="button">${escapeHtml(data.toolbar.downloadLabel)}</button>
        </div>
      </div>
    </div>
  `;
}

function renderContact(data) {
  return `
    <aside class="contact-card">
      <h2>${escapeHtml(data.contact.title)}</h2>
      <div class="contact-list">
        <div>${escapeHtml(data.contact.location)}</div>
        ${renderLinks(data.contact.links)}
      </div>
    </aside>
  `;
}

function renderSidebar(data) {
  const references = data.sidebar.references;
  const referencesSection = references
    ? `
      <section>
        <h2 class="section-title">${escapeHtml(references.title)}</h2>
        <div class="references-list">
          ${references.items
            .map(
              (item) => {
                const contactValue = item.email || item.contact || "";
                const contactHtml =
                  item.email
                    ? `<a class="reference-contact" href="mailto:${escapeAttribute(item.email)}">${escapeHtml(item.email)}</a>`
                    : contactValue
                      ? `<div class="reference-contact">${escapeHtml(contactValue)}</div>`
                      : "";

                return `
                <div class="reference-item">
                  <div class="reference-name">${escapeHtml(item.name || "")}</div>
                  ${item.role ? `<div class="reference-role">${escapeHtml(item.role)}</div>` : ""}
                  ${contactHtml}
                </div>
              `;
              },
            )
            .join("")}
        </div>
      </section>
    `
    : "";

  return `
    <aside class="side-col">
      <section>
        <h2 class="section-title">${escapeHtml(data.sidebar.technicalSkills.title)}</h2>
        ${renderSkillGroups(data.sidebar.technicalSkills.groups)}
      </section>

      <section>
        <h2 class="section-title">${escapeHtml(data.sidebar.highlights.title)}</h2>
        <p class="small">${escapeHtml(data.sidebar.highlights.text)}</p>
      </section>

      <section>
        <h2 class="section-title">${escapeHtml(data.sidebar.languages.title)}</h2>
        <div class="chips">
          ${data.sidebar.languages.chips.map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`).join("")}
        </div>
      </section>

      ${referencesSection}
    </aside>
  `;
}

function setTheme(theme, themeLabels) {
  document.documentElement.setAttribute("data-theme", theme);
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? themeLabels.light : themeLabels.dark;
    themeToggle.setAttribute("aria-label", theme === "dark" ? themeLabels.light : themeLabels.dark);
  }
}

function initTheme(themeLabels) {
  const storedTheme = localStorage.getItem(STORAGE_THEME_KEY);
  const preferredTheme = storedTheme === "dark" || storedTheme === "light"
    ? storedTheme
    : window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  setTheme(preferredTheme, themeLabels);

  const themeToggle = document.getElementById("theme-toggle");
  themeToggle?.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_THEME_KEY, nextTheme);
    setTheme(nextTheme, themeLabels);
  });
}

function renderApp(data, lang) {
  document.documentElement.lang = data.meta.lang;
  document.title = data.meta.title;

  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) {
    descriptionMeta.setAttribute("content", data.meta.description);
  }

  APP_ROOT.innerHTML = `
    ${renderToolbar(data, lang)}
    <main>
      <article class="page">
        <header class="hero">
          <div>
            <h1>${escapeHtml(data.hero.name)}</h1>
            <div class="subtitle">${escapeHtml(data.hero.subtitle)}</div>
            <p class="summary">${escapeHtml(data.hero.summary)}</p>
          </div>
          ${renderContact(data)}
        </header>

        <div class="content">
          <div class="main-col">
            ${renderSection("experience", data.sections.experience)}
            ${renderSection("projects", data.sections.projects)}
            ${renderSection("education", data.sections.education)}
          </div>
          ${renderSidebar(data)}
        </div>
      </article>
    </main>
  `;

  initTheme(data.toolbar.themeLabels);

  const printButton = document.getElementById("print-button");
  printButton?.addEventListener("click", () => window.print());
}

async function loadLanguage(lang) {
  const response = await fetch(`data/${lang}.json`, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Failed to load data/${lang}.json`);
  }
  return response.json();
}

async function main() {
  const requestedLanguage = getRequestedLanguage();

  try {
    const data = await loadLanguage(requestedLanguage);
    renderApp(data, requestedLanguage);
  } catch (error) {
    if (requestedLanguage !== DEFAULT_LANGUAGE) {
      const fallbackData = await loadLanguage(DEFAULT_LANGUAGE);
      const fallbackUrl = new URL(window.location.href);
      fallbackUrl.searchParams.set("lang", DEFAULT_LANGUAGE);
      window.history.replaceState({}, "", fallbackUrl.pathname + fallbackUrl.search + fallbackUrl.hash);
      renderApp(fallbackData, DEFAULT_LANGUAGE);
      return;
    }

    APP_ROOT.innerHTML = `
      <main>
        <article class="page">
          <div class="hero">
            <div>
              <h1>Unable to load CV data</h1>
              <p class="summary">The browser could not load the language JSON file. Please make sure the site is being served over HTTP and that the <code>data</code> directory is present.</p>
            </div>
          </div>
        </article>
      </main>
    `;
    console.error(error);
  }
}

main();
