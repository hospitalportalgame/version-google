#!/usr/bin/env node
'use strict';

// Creates a new, explicitly requested distribution; never cleans or overwrites one.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const output = process.argv[2] && path.resolve(process.argv[2]);
const manifestName = 'manifest-public-static.json';
const allowed = {
  src: new Set(['.js']),
  styles: new Set(['.css']),
  assets: new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.mp3', '.wav', '.ogg', '.mp4', '.webm', '.woff', '.woff2'])
};
const excludedFiles = new Set([
  'assets/sprites/medica-pixel/metadata.json',
  'assets/sprites/personajes/anciano-pixellab/metadata.json',
  'assets/sprites/personajes/keivin/metadata.json',
  'assets/sprites/personajes/medico-anciano-pixellab/metadata.json',
  'assets/sprites/personajes/visitante/metadata.json',
  'assets/sprites/pacientes/sofia/sofia_subir_camilla'
]);
const includedWithoutExtension = new Set();
const skippedDirectories = new Set(['src/pruebas']);
const dangerousName = /^(?:\.env(?:\..*)?|\.git|node_modules|backups|scratch|herramientas|\.codex-remote-attachments|mcp_config\.json|.*\.(?:pem|key|p12|pfx))$/i;
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/
];
const slash = value => value.split(path.sep).join('/');
const fail = message => { throw new Error(message); };

function main() {
  if (!output || process.argv.length !== 3) fail('Uso: node scripts/build-public-static.cjs <directorio-de-salida-nuevo>');
  const relative = path.relative(root, output);
  // Pages needs an output directory in the checkout; allow only the exact new dist/.
  const projectDist = relative === 'dist';
  if (!projectDist && (!relative || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative)))) {
    fail('El directorio de salida debe estar fuera del proyecto.');
  }
  if (fs.existsSync(output)) fail('El directorio de salida ya existe; no se sobrescribe ni se elimina.');
  const parent = path.dirname(output);
  if (!fs.existsSync(parent) || !fs.statSync(parent).isDirectory()) fail('El directorio padre de salida debe existir.');
  // Resolve the parent to prevent a symlink from redirecting output into the project.
  const realRoot = fs.realpathSync(root), realParent = fs.realpathSync(parent);
  const realRelative = path.relative(realRoot, realParent);
  if (!(projectDist && realParent === realRoot) && (!realRelative || (!realRelative.startsWith('..' + path.sep) && realRelative !== '..' && !path.isAbsolute(realRelative)))) {
    fail('El destino resuelto no puede estar dentro del proyecto.');
  }

  const entries = [], skipped = [], seen = new Map();
  function add(rel) {
    rel = slash(rel);
    if (rel.split('/').some(part => dangerousName.test(part))) fail(`Nombre sensible detectado: ${rel}`);
    const absolute = path.join(root, ...rel.split('/'));
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink() || !stat.isFile()) fail(`No es un archivo regular: ${rel}`);
    // Case and Unicode collisions can fail on common web deployment platforms.
    const key = rel.normalize('NFC').toLowerCase();
    if (seen.has(key)) fail(`Colisión de rutas: ${seen.get(key)} y ${rel}`);
    seen.set(key, rel);
    if (/\.(?:js|css|html|json)$/i.test(rel)) {
      const data = fs.readFileSync(absolute, 'utf8');
      if (secretPatterns.some(pattern => pattern.test(data))) fail(`Posible secreto en: ${rel}`);
    }
    entries.push({ path: rel, bytes: stat.size, sha256: crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex') });
  }
  function walk(rel, group) {
    const absolute = path.join(root, ...rel.split('/'));
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink() || !stat.isDirectory()) fail(`Directorio inválido o enlace simbólico: ${rel}`);
    for (const item of fs.readdirSync(absolute, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const name = `${rel}/${item.name}`;
      if (dangerousName.test(item.name)) fail(`Nombre sensible detectado: ${name}`);
      if (item.isSymbolicLink()) fail(`Enlace simbólico no permitido: ${name}`);
      if (item.isDirectory()) {
        if (skippedDirectories.has(name)) { skipped.push({ path: name, reason: 'pruebas de desarrollo; no se cargan desde index.html' }); continue; }
        walk(name, group);
      } else if (item.isFile()) {
        if (excludedFiles.has(name)) { skipped.push({ path: name, reason: 'metadatos de autoría PixelLab no referenciados por el juego' }); continue; }
        if (!allowed[group].has(path.extname(name).toLowerCase()) && !includedWithoutExtension.has(name)) fail(`Archivo sin clasificar: ${name}`);
        add(name);
      } else fail(`Tipo de archivo no admitido: ${name}`);
    }
  }
  add('index.html');
  for (const group of Object.keys(allowed)) walk(group, group);
  if (seen.has(manifestName.toLowerCase())) fail('Colisión con el nombre del manifiesto.');

  const included = new Set(entries.map(entry => entry.path));
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map(match => match[1].split(/[?#]/)[0]);
  if (!scripts.length) fail('No se encontraron scripts en index.html.');
  for (const script of scripts) if (!included.has(script)) fail(`Script de index.html ausente o excluido: ${script}`);

  // Check literal project-root resource references. Dynamic template strings need runtime tests.
  const literal = /(?:["'`(=]|url\()\s*["']?((?:assets|src|styles)\/[\p{L}\p{N}_./ -]+\.(?:js|css|png|jpe?g|webp|svg|mp3|wav|ogg|mp4|webm|woff2?))(?=[?"'`)\s]|$)/gu;
  for (const entry of entries.filter(e => /\.(?:js|css|html)$/i.test(e.path))) {
    const content = fs.readFileSync(path.join(root, ...entry.path.split('/')), 'utf8');
    for (const match of content.matchAll(literal)) {
      if (!included.has(match[1])) fail(`Referencia literal ausente o excluida en ${entry.path}: ${match[1]}`);
    }
  }
  function checkRelative(reference, origin) {
    const clean = reference.trim().split(/[?#]/)[0];
    if (!clean || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference.trim())) return;
    let decoded;
    try { decoded = decodeURIComponent(clean); } catch { fail(`URL inválida en ${origin}: ${reference}`); }
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(origin), decoded));
    if (resolved.startsWith('../') || resolved.startsWith('/') || !included.has(resolved)) {
      fail(`Recurso local ausente o excluido en ${origin}: ${reference}`);
    }
  }
  for (const entry of entries.filter(e => e.path.endsWith('.css'))) {
    const css = fs.readFileSync(path.join(root, ...entry.path.split('/')), 'utf8');
    for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) checkRelative(match[1], entry.path);
  }
  for (const tag of html.matchAll(/<(?:script|link|img|video|audio|source)\b[^>]*>/gi)) {
    for (const attr of tag[0].matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) checkRelative(attr[1], 'index.html');
  }
  const bytes = entries.reduce((sum, entry) => sum + entry.bytes, 0);
  const manifest = { format: 'hospital-portal-public-static-v1', files: entries, totalFiles: entries.length, totalBytes: bytes, scriptsInOrder: scripts, excluded: skipped };
  fs.mkdirSync(output); // Only a previously nonexistent directory is accepted.
  for (const entry of entries) {
    const source = path.join(root, ...entry.path.split('/'));
    const target = path.join(output, ...entry.path.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
    const hash = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
    if (hash !== entry.sha256) fail(`Error de integridad tras copiar: ${entry.path}`);
  }
  fs.writeFileSync(path.join(output, manifestName), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  console.log(`Distribución: ${output}\nArchivos públicos: ${entries.length}\nBytes de archivos públicos: ${bytes}\nScripts clásicos: ${scripts.length}\nManifiesto: ${manifestName}`);
}

try { main(); } catch (error) { console.error(`Error de empaquetado: ${error.message}`); process.exitCode = 1; }
