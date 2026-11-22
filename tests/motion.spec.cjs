const { expect, test } = require('@playwright/test');

async function recordMeteors(page) {
  await page.addInitScript(() => {
    Math.random = () => 0.5;
    window.meteorFlights = [];
    const animate = HTMLElement.prototype.animate;
    HTMLElement.prototype.animate = function (...args) {
      if (this.matches('.celestial-meteor')) {
        window.meteorFlights.push(this.parentElement.dataset.meteor);
      }
      return animate.apply(this, args);
    };
  });
  await page.clock.install();
}

function flights(page) {
  return page.evaluate(() => window.meteorFlights);
}

async function enterZone(zone) {
  await zone.scrollIntoViewIfNeeded();
  // Wait for actual intersection delivery before advancing the scheduler clock.
  await zone.evaluate(element => new Promise(resolve => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio < 0.65) return;
      observer.disconnect();
      resolve();
    }, { threshold: 0.65 });
    observer.observe(element);
  }));
}

test('one shared schedule plays the sky and Lab streaks at different intervals', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await recordMeteors(page);
  await page.goto('./#about');
  const sky = page.locator('.sky-scene');
  await enterZone(page.locator('.sky-flight'));
  await expect(sky).toHaveClass(/sky-playing/);
  await page.clock.fastForward(26_000);
  expect(await flights(page)).toEqual([]);
  await page.clock.fastForward(2_000);
  expect(await flights(page)).toEqual(['sky']);

  const pause = page.getByRole('button', { name: 'Pause sky motion' });
  await pause.click();
  await expect(sky).not.toHaveClass(/sky-playing/);
  await expect(page.locator('.sky-flight .celestial-meteor')).toHaveCSS('opacity', '0');
  await page.clock.fastForward(90_000);
  expect(await flights(page)).toEqual(['sky']);
  await page.getByRole('button', { name: 'Resume sky motion' }).click();

  const lab = page.locator('#lab [data-meteor]');
  await enterZone(lab);
  await expect(sky).not.toHaveClass(/sky-playing/);
  await page.clock.fastForward(60_000);
  expect(await flights(page)).toEqual(['sky']);
  await page.clock.fastForward(16_000);
  expect(await flights(page)).toEqual(['sky', 'accent']);

  await page.locator('#writing h2').scrollIntoViewIfNeeded();
  await expect(lab).not.toBeInViewport();
  await page.clock.fastForward(120_000);
  expect(await flights(page)).toEqual(['sky', 'accent']);
});

test('reduced motion and page lifecycle suspend decorative work', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await recordMeteors(page);
  await page.goto('./#about');
  const sky = page.locator('.sky-scene');
  await enterZone(page.locator('.sky-flight'));
  await expect(sky.locator('.sky-motion')).toBeHidden();
  await expect(sky).not.toHaveClass(/sky-playing/);
  await page.clock.fastForward(40_000);
  expect(await flights(page)).toEqual([]);
  await expect(page.locator('#gallery-toggle')).toHaveText('Play');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(sky).toHaveClass(/sky-playing/);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await expect(sky).not.toHaveClass(/sky-playing/);
  await page.clock.fastForward(40_000);
  expect(await flights(page)).toEqual([]);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect(sky).toHaveClass(/sky-playing/);
  await page.clock.fastForward(35_000);
  expect(await flights(page)).toEqual(['sky']);

  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await expect(sky.locator('.sky-motion')).toBeHidden();
  await expect(sky).not.toHaveClass(/sky-playing/);
  await page.clock.fastForward(40_000);
  expect(await flights(page)).toEqual(['sky']);
});
