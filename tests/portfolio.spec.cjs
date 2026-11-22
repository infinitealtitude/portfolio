const { expect, test } = require('@playwright/test');

const projects = [
  ['Operations workflow prototypes', 'operations-workflow-prototypes'],
  ['Business value calculator', 'business-value-calculator'],
  ['Solutions engineering dashboard', 'solutions-engineering-dashboard'],
];

test('desktop navigation, linked work and CV download', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');

  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  await navigation.getByRole('link', { name: 'Selected Work' }).click();
  await expect(page).toHaveURL(/#work$/);
  await expect(page.getByRole('heading', { name: 'From problem to working solution.' })).toBeVisible();

  await page.goto('./#conversation');
  await expect(page.locator('#conversation details')).toHaveAttribute('open', '');
  await navigation.getByRole('link', { name: 'Writing', exact: true }).click();
  await expect(page).toHaveURL(/#writing$/);
  await expect(page.locator('#writing article a')).toHaveCount(3);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#home').getByRole('link', { name: 'Download CV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('anand-elangovan-cv.pdf');
  expect(await download.failure()).toBeNull();
  expect(errors).toEqual([]);
});

test('compact navigation closes on Escape and focuses section links', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(navigation).toBeHidden();
  await menu.press('Enter');
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await navigation.getByRole('link', { name: 'Lab', exact: true }).press('Escape');
  await expect(menu).toBeFocused();
  await expect(navigation).toBeHidden();

  await menu.click();
  await navigation.getByRole('link', { name: 'Lab', exact: true }).click();
  await expect(page).toHaveURL(/#lab$/);
  await expect(page.locator('#lab')).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
});

for (const [name, slug] of projects) {
  test(`${name} opens from the Lab and shows its full-size screenshot`, async ({ page }) => {
    await page.goto('./#lab');
    await page.getByRole('link', { name: `Explore Project: ${name}` }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${slug}\\.html$`));
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
    await expect(page.locator('.project-intro > p')).toHaveCount(3);
    await expect(page.getByRole('heading', { name: 'System architecture' })).toBeVisible();
    await expect(page.locator('.study-flow li')).toHaveCount(4);
    const screenshot = page.getByRole('link', { name: `Enlarge screenshot of ${name}` });
    const image = screenshot.getByRole('img');
    await expect(image).toHaveJSProperty('complete', true);
    const width = Number(await image.getAttribute('width'));
    await expect(image).toHaveJSProperty('naturalWidth', width);
    await expect(image).toHaveJSProperty('naturalHeight', Number(await image.getAttribute('height')));
    await screenshot.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Project screenshot' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close preview' })).toBeFocused();
    await expect(dialog.getByRole('img')).toHaveJSProperty('naturalWidth', width);
    await expect(dialog.getByRole('link', { name: 'Open original image' })).toHaveAttribute('href', /\/dist\/assets\//);
    if (slug === 'business-value-calculator') {
      await expect(dialog.getByText(/Illustrative demo data/)).toBeVisible();
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(screenshot).toBeFocused();
    await page.getByRole('link', { name: 'Back to Projects', exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(`index\\.html#${slug}$`));
  });
}

for (const width of [1440, 1024, 768, 390, 320]) {
  test(`homepage and project layout fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    await page.goto('./#lab');
    await expect.poll(fits).toBe(true);
    const cards = page.locator('.lab-project');
    await expect(cards).toHaveCount(projects.length);
    for (const card of await cards.all()) {
      const image = card.getByRole('img');
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveJSProperty('naturalWidth', Number(await image.getAttribute('width')));
    }
    if (width >= 1024) {
      const bottoms = await cards.locator('.lab-action').evaluateAll(links =>
        links.map(link => Math.round(link.getBoundingClientRect().bottom)));
      expect(new Set(bottoms).size).toBe(1);
    }
    for (const [, slug] of projects) {
      await page.goto(`./projects/${slug}.html`);
      await expect.poll(fits).toBe(true);
      await expect(page.locator('.project-intro > p').last()).toBeVisible();
    }
  });
}

test('sky, advisory and photo controls update their content', async ({ page }) => {
  await page.goto('./#about');
  const architecture = page.locator('.sky-links').getByRole('button', { name: /Architecture/ });
  await architecture.press('Enter');
  await expect(architecture).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.sky-reading').getByRole('link', { name: 'Agent workflows across enterprise systems' })).toBeVisible();
  await page.getByText('About this visual', { exact: true }).click();
  await expect(page.getByRole('link', { name: /HYG Star Database/ })).toBeVisible();

  await page.getByRole('button', { name: 'Adoption', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Enterprise AI readiness' })).toBeVisible();
  await page.getByRole('button', { name: 'Next photo' }).click();
  await expect(page.locator('#gallery-status')).toHaveText(/Photo [12] of 2/);
  await expect(page.locator('.gallery-slide[aria-hidden="false"] img')).toHaveJSProperty('complete', true);
  await expect(page.locator('#gallery-toggle')).toHaveText('Play');
});

test('static navigation and work links remain available without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto('./#about');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await expect(page.locator('.sky-links').getByRole('link', { name: /Architecture/ })).toHaveAttribute('href', '#workflows');
    await expect(page.getByRole('link', { name: 'Explore Project: Business value calculator' })).toBeVisible();
  } finally {
    await context.close();
  }
});
