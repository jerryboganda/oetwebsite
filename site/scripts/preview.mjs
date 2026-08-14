// Preview the built site: serves the repo root (webroot) via the existing
// static dev server. Run `npm run build` first so root pages are up to date.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const child = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
  cwd: ROOT,
  stdio: 'inherit',
});
child.on('exit', (code) => process.exit(code ?? 0));
