export const NAME = 'Anand Elangovan';
export const SITE_TITLE = `${NAME} | Enterprise AI Architect, Technology Strategist & Startup Advisor`;
export const DESCRIPTION = 'Explore the work, ideas and experience of Anand Elangovan, connecting enterprise AI, technology strategy and startup go-to-market.';
export const LINKEDIN = 'https://www.linkedin.com/in/andy-elangovan-76a68b31/';
export const INSTAGRAM = 'https://www.instagram.com/inf_altitude/';

export function localHref(path: string) {
  if (path.startsWith('#')) return path;
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path}`;
}

export function asset(file: string) {
  return localHref(`assets/${file}`);
}

export function projectHref(id: string) {
  return localHref(`projects/${id}.html`);
}
