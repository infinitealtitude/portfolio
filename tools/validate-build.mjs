import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { parse } from 'parse5';
import { getSiteConfig } from '../src/lib/site-config.mjs';

const root = resolve('dist');
const { base } = getSiteConfig();
const origin = 'https://portfolio.invalid';
const prefix = base === '/' ? '/' : `${base}/`;
const errors = [];

function visit(node, callback) {
  if (node.tagName) callback(node.tagName, Object.fromEntries(node.attrs.map(({ name, value }) => [name, value])));
  node.childNodes?.forEach(child => visit(child, callback));
}

function readPage(file) {
  const ids = new Set();
  const references = [];
  const ariaTargets = [];
  const report = message => errors.push(`${relative(root, file)}: ${message}`);
  visit(parse(readFileSync(file, 'utf8')), (tag, attrs) => {
    if (Object.hasOwn(attrs, 'id')) {
      if (!attrs.id || ids.has(attrs.id)) report(`empty or duplicate ID "${attrs.id}"`);
      ids.add(attrs.id);
    }
    if (tag === 'img' && !Object.hasOwn(attrs, 'alt')) report(`"${attrs.src}" has no alt attribute`);
    for (const name of ['href', 'src']) {
      if (attrs[name]) references.push(attrs[name]);
    }
    for (const candidate of (attrs.srcset ?? '').split(',')) {
      if (candidate.trim()) references.push(candidate.trim().split(/\s+/)[0]);
    }
    for (const name of ['aria-controls', 'aria-describedby', 'aria-labelledby']) {
      if (attrs[name]?.trim()) ariaTargets.push(...attrs[name].trim().split(/\s+/));
    }
  });
  return { ids, references, ariaTargets, report };
}

if (!statSync(join(root, 'index.html'), { throwIfNoEntry: false })?.isFile()) {
  throw new Error('dist/index.html is missing. Run npm run build first.');
}

const pages = new Map(
  readdirSync(root, { recursive: true })
    .filter(name => name.endsWith('.html'))
    .map(name => {
      const file = join(root, name);
      return [file, readPage(file)];
    }),
);

for (const [file, page] of pages) {
  const pageUrl = new URL(prefix + relative(root, file).split(sep).join('/'), origin);
  for (const id of page.ariaTargets) {
    if (!page.ids.has(id)) page.report(`missing ARIA target "${id}"`);
  }
  for (const reference of page.references) {
    try {
      const url = new URL(reference, pageUrl);
      if (url.origin !== origin) continue;
      const path = decodeURIComponent(url.pathname);
      if (!path.startsWith(prefix)) {
        page.report(`reference outside the site base "${reference}"`);
        continue;
      }

      let target = resolve(root, path.slice(prefix.length));
      const stats = statSync(target, { throwIfNoEntry: false });
      if (stats?.isDirectory()) target = join(target, 'index.html');
      if ((target !== root && !target.startsWith(root + sep)) ||
        !statSync(target, { throwIfNoEntry: false })?.isFile()) {
        page.report(`invalid local reference "${reference}"`);
      } else if (url.hash && pages.has(target) && !pages.get(target).ids.has(decodeURIComponent(url.hash.slice(1)))) {
        page.report(`missing anchor "${reference}"`);
      }
    } catch (error) {
      page.report(`invalid local reference "${reference}" (${error.message})`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validated ${pages.size} HTML pages, local assets, anchors and ARIA references.`);
}
