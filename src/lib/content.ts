import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseTree, printParseErrorCode, type Node, type ParseError } from 'jsonc-parser';
import { z } from 'zod';
import portfolioSource from '../../content/portfolio.json?raw';
import studySource from '../../content/case-studies.json?raw';
import skySource from '../../content/sky.json?raw';

const text = z.string().refine(value => value.trim().length > 0, 'Expected non-empty text');
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const coordinate = z.number().min(0).max(480);
const positiveInteger = z.number().int().positive();
const textList = z.array(text).nonempty();
const blocks = z.array(z.tuple([text, text])).nonempty();
const links = z.array(z.strictObject({
  label: text,
  href: z.string().regex(/^(?:#[a-z0-9-]+|projects\/[a-z0-9-]+\.html)$/),
}));
const screenshot = z.strictObject({
  file: z.string().regex(/^[\w-]+\.(?:png|jpe?g|webp|avif)$/i),
  alt: text, caption: text, width: positiveInteger, height: positiveInteger, label: text.optional(),
});
const portfolioSchema = z.strictObject({
  work: z.array(z.strictObject({
    id: slug, category: text, title: text, summary: text, outcome: text, type: text,
    challenge: text, role: text, approach: text, diagram: textList,
  })).nonempty(),
  expertise: z.array(z.strictObject({
    category: text, capabilities: textList, evidence: links, tools: textList.optional(),
  })).nonempty(),
  journey: z.array(z.strictObject({
    dates: text, company: text, role: text, region: text, scope: text, contribution: text,
    background: text.optional(), related_work: links.optional(),
  })).nonempty(),
  advisory: z.array(z.strictObject({ stage: text, title: text, copy: text, output: text })).nonempty(),
  lab: z.array(z.strictObject({
    id: slug, name: text, status: text, category: text, built: text, summary: text, note: text,
    screenshot, flow: textList,
  })).nonempty(),
  perspectives: z.array(z.strictObject({ title: text, copy: text })).nonempty(),
  sky_themes: z.array(z.strictObject({
    id: slug, target: slug, name: text, evidence: text, copy: text, x: coordinate, y: coordinate,
  })).nonempty(),
  writing: z.array(z.strictObject({
    id: slug, title: text, category: text, summary: text, source: text,
    date: z.iso.date(), url: z.url({ protocol: /^https$/ }),
  })).nonempty(),
});
const studiesSchema = z.record(slug, z.strictObject({
  category: text, status: text, intro: text, technologies: text, focus: text,
  architecture_label: text, boundary: text, outcome: text, challenge: textList,
  solution: blocks, architecture: blocks, capabilities: blocks, decisions: blocks, model: blocks.optional(),
}));
const starsSchema = z.array(z.strictObject({
  hip: positiveInteger, mag: z.number(), x: coordinate, y: coordinate,
})).nonempty();

export type Portfolio = z.infer<typeof portfolioSchema>;
export type LabProject = Portfolio['lab'][number];
export type CaseStudy = z.infer<typeof studiesSchema>[string];
export type Star = z.infer<typeof starsSchema>[number];

function assertUniqueKeys(node: Node, path: string) {
  if (node.type === 'array') {
    node.children?.forEach((child, index) => assertUniqueKeys(child, `${path}[${index}]`));
  }
  if (node.type === 'object') {
    const keys = new Set<string>();
    for (const property of node.children ?? []) {
      const [name, value] = property.children!;
      const key = String(name.value);
      if (keys.has(key)) throw new Error(`${path}: duplicate JSON key "${key}"`);
      keys.add(key);
      assertUniqueKeys(value, `${path}.${key}`);
    }
  }
}

function load<T>(filename: string, source: string, schema: z.ZodType<T>): T {
  const errors: ParseError[] = [];
  const tree = parseTree(source, errors, { disallowComments: true });
  if (errors.length || !tree) {
    const error = errors[0];
    throw new Error(`${filename}: ${error ? `${printParseErrorCode(error.error)} at character ${error.offset}` : 'Empty JSON'}`);
  }
  assertUniqueKeys(tree, filename);

  const result = schema.safeParse(JSON.parse(source));
  if (!result.success) {
    const details = result.error.issues.map(issue => `${filename}${issue.path.length ? `.${issue.path.join('.')}` : ''}: ${issue.message}`);
    throw new Error(details.join('\n'));
  }
  return result.data;
}

function unique<K extends string, V extends string | number>(rows: readonly Record<K, V>[], key: K, path: string) {
  const values = new Set<V>();
  for (const [index, row] of rows.entries()) {
    const value = row[key];
    if (values.has(value)) throw new Error(`${path}[${index}].${String(key)}: duplicate value "${value}"`);
    values.add(value);
  }
  return values;
}

export const portfolio = load('portfolio.json', portfolioSource, portfolioSchema);
export const studies = load('case-studies.json', studySource, studiesSchema);
export const stars = load('sky.json', skySource, starsSchema);

unique(stars, 'hip', 'sky.json');
for (const section of ['work', 'writing', 'sky_themes'] as const) {
  unique(portfolio[section], 'id', `portfolio.json.${section}`);
}
const projectIds = unique(portfolio.lab, 'id', 'portfolio.json.lab');
const studyIds = Object.keys(studies);
const missing = [...projectIds].filter(id => !Object.hasOwn(studies, id));
const extra = studyIds.filter(id => !projectIds.has(id));
if (missing.length || extra.length) {
  throw new Error(`case-studies.json: IDs must match the Lab (missing: ${missing.join(', ')}, extra: ${extra.join(', ')})`);
}

for (const [id, study] of Object.entries(studies)) {
  study.intro.split('\n\n').forEach((paragraph, index) => {
    if (!paragraph.trim()) throw new Error(`case-studies.json.${id}.intro: paragraph ${index + 1} is empty`);
  });
}
for (const [index, project] of portfolio.lab.entries()) {
  const { file } = project.screenshot;
  if (!statSync(resolve('public/assets', file), { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`portfolio.json.lab[${index}].screenshot.file: missing asset "${file}"`);
  }
}
