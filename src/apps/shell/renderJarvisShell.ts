export interface JarvisNavItem {
  href: string;
  label: string;
  state?: 'live' | 'planning';
}

export interface JarvisShellOptions {
  title: string;
  subtitle: string;
  eyebrow: string;
  navItems: JarvisNavItem[];
  activeHref: string;
  content: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderNavItem(item: JarvisNavItem, activeHref: string): string {
  const activeClass = item.href === activeHref ? 'nav-link active' : 'nav-link';
  const stateLabel = item.state === 'planning' ? '<span class="chip">Planning</span>' : '';

  return `<a class="${activeClass}" href="${escapeHtml(item.href)}">
    <span>${escapeHtml(item.label)}</span>
    ${stateLabel}
  </a>`;
}

export function renderJarvisShell(options: JarvisShellOptions): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(options.title)}</title>
    <style>
      :root {
        --bg: #f2eee6;
        --panel: rgba(255, 252, 246, 0.84);
        --ink: #1f2025;
        --muted: #66666e;
        --border: rgba(31, 32, 37, 0.1);
        --shadow: rgba(42, 30, 12, 0.08);
        --accent: #0f6b63;
        --accent-soft: rgba(15, 107, 99, 0.12);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background:
          radial-gradient(circle at top left, rgba(193, 146, 86, 0.2), transparent 28%),
          radial-gradient(circle at bottom right, rgba(15, 107, 99, 0.14), transparent 26%),
          linear-gradient(180deg, #f7f2eb 0%, var(--bg) 100%);
        color: var(--ink);
        font-family: "Avenir Next", "Segoe UI", sans-serif;
      }
      .layout {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 280px 1fr;
      }
      .sidebar {
        padding: 28px 20px;
        border-right: 1px solid var(--border);
        background: rgba(249, 245, 238, 0.72);
        backdrop-filter: blur(8px);
      }
      .brand {
        margin-bottom: 26px;
      }
      .brand p {
        margin: 0 0 8px;
        color: var(--muted);
        letter-spacing: 0.1em;
        text-transform: uppercase;
        font-size: 0.75rem;
      }
      .brand h1 {
        margin: 0;
        font-size: 2rem;
        font-family: Georgia, "Iowan Old Style", serif;
      }
      .brand .sub {
        margin-top: 12px;
        color: var(--muted);
        line-height: 1.5;
      }
      nav {
        display: grid;
        gap: 10px;
      }
      .nav-link {
        display: flex;
        justify-content: space-between;
        align-items: center;
        text-decoration: none;
        color: inherit;
        padding: 14px 16px;
        border-radius: 16px;
        border: 1px solid transparent;
        background: transparent;
      }
      .nav-link.active {
        background: var(--accent-soft);
        border-color: rgba(15, 107, 99, 0.22);
      }
      .chip {
        font-size: 0.74rem;
        color: var(--muted);
      }
      .main {
        padding: 32px 28px 44px;
      }
      .hero {
        margin-bottom: 24px;
      }
      .hero p {
        margin: 0 0 6px;
        color: var(--muted);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-size: 0.78rem;
      }
      .hero h2 {
        margin: 0 0 10px;
        font-size: clamp(2.1rem, 4vw, 3.5rem);
        font-family: Georgia, "Iowan Old Style", serif;
      }
      .hero .subtitle {
        max-width: 72ch;
        color: var(--muted);
        line-height: 1.6;
      }
      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 22px;
        box-shadow: 0 18px 36px var(--shadow);
        backdrop-filter: blur(8px);
      }
      @media (max-width: 900px) {
        .layout {
          grid-template-columns: 1fr;
        }
        .sidebar {
          border-right: 0;
          border-bottom: 1px solid var(--border);
        }
        .main {
          padding: 24px 16px 36px;
        }
      }
    </style>
  </head>
  <body>
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <p>Personal Jarvis</p>
          <h1>Jarvis</h1>
          <div class="sub">One local-first shell for the tools you use every day, before they become separate businesses.</div>
        </div>
        <nav>
          ${options.navItems.map((item) => renderNavItem(item, options.activeHref)).join('')}
        </nav>
      </aside>
      <main class="main">
        <header class="hero">
          <p>${escapeHtml(options.eyebrow)}</p>
          <h2>${escapeHtml(options.title)}</h2>
          <div class="subtitle">${escapeHtml(options.subtitle)}</div>
        </header>
        ${options.content}
      </main>
    </div>
  </body>
</html>`;
}
