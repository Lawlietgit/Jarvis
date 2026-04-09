import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { loadPropertyManagerWorkspace } from '../apps/propertyManager/loadWorkspace.js';
import { renderPropertyManagerDashboard } from '../apps/propertyManager/renderDashboard.js';
import { renderJarvisShell } from '../apps/shell/renderJarvisShell.js';

const defaultPort = Number(process.env.PORT ?? '4310');
const defaultHost = process.env.HOST ?? '127.0.0.1';
const workspacePath = resolve('data/property-manager/demo/workspace.yaml');

function renderPlaceholderPage(title: string, description: string, activeHref: string): string {
  return renderJarvisShell({
    title,
    subtitle: description,
    eyebrow: 'Jarvis Product',
    activeHref,
    navItems: [
      { href: '/apps/property-manager', label: 'Property Manager', state: 'live' },
      { href: '/apps/job-hunter', label: 'Job Hunter', state: 'planning' },
      { href: '/apps/consulting', label: 'Consulting Pipeline', state: 'planning' }
    ],
    content: `<section class="panel" style="padding: 24px 26px;">
      <h3 style="margin-top: 0; font-family: Georgia, 'Iowan Old Style', serif;">Not wired yet</h3>
      <p style="max-width: 64ch; color: #66666e; line-height: 1.6;">${description}</p>
    </section>`
  });
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

  if (url.pathname === '/api/property-manager/workspace') {
    const workspace = await loadPropertyManagerWorkspace(workspacePath);
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(workspace, null, 2));
    return;
  }

  if (url.pathname === '/' || url.pathname === '/apps/property-manager') {
    const workspace = await loadPropertyManagerWorkspace(workspacePath);
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(renderPropertyManagerDashboard(workspace, new Date()));
    return;
  }

  if (url.pathname === '/apps/job-hunter') {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(
      renderPlaceholderPage(
        'Job Hunter',
        'This will scan LinkedIn and Indeed, track your applications, and use the same Jarvis shell once the property workflow is stable.',
        '/apps/job-hunter'
      )
    );
    return;
  }

  if (url.pathname === '/apps/consulting') {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(
      renderPlaceholderPage(
        'Consulting Pipeline',
        'This will track Guidepoint-style expert requests, profile updates, and response workflows inside the same shell.',
        '/apps/consulting'
      )
    );
    return;
  }

  response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  response.end('Not found');
});

server.listen(defaultPort, defaultHost, () => {
  console.log(`Jarvis web shell running at http://${defaultHost}:${defaultPort}`);
});
