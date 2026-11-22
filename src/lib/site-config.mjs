export function getSiteConfig(env = process.env) {
  const configuredUrl = env.PORTFOLIO_SITE_URL?.trim();
  const indexable = env.PORTFOLIO_INDEX === '1';
  const siteUrl = configuredUrl ? URL.parse(configuredUrl) : null;

  if (configuredUrl && (!/^https:\/\//i.test(configuredUrl) || !siteUrl || siteUrl.username ||
    siteUrl.password || /[?#]/.test(configuredUrl))) {
    throw new Error('PORTFOLIO_SITE_URL must be an absolute HTTPS homepage URL without credentials, a query or a fragment.');
  }
  if (indexable && !siteUrl) {
    throw new Error('PORTFOLIO_INDEX=1 requires PORTFOLIO_SITE_URL.');
  }

  const base = siteUrl ? siteUrl.pathname.replace(/\/+$/, '') || '/' : '/interactive-resume';
  const homepage = siteUrl ? `${siteUrl.origin}${base === '/' ? '/' : `${base}/`}` : undefined;

  return { base, homepage, indexable, origin: siteUrl?.origin };
}
