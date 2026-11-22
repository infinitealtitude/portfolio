// @ts-check

/** @typedef {'sky' | 'accent'} MeteorKind */
/** @typedef {{ element: HTMLElement, trail: HTMLElement, kind: MeteorKind }} FlightZone */

const meteorIntervals = { sky: [20, 35], accent: [60, 90] };

/**
 * Start the shared decorative motion controller. The chart and work themes are independent.
 * @param {{ sky: Element, compact: MediaQueryList, reducedMotion: MediaQueryList }} options
 * @returns {(() => void) | undefined} Cleanup for callers that remove the scene.
 */
export function setupCelestialMotion({ sky, compact, reducedMotion }) {
  const page = sky.ownerDocument;
  const ambientNode = sky.querySelector('.sky-ambient');
  const buttonNode = sky.querySelector('.sky-motion');
  if (!(ambientNode instanceof HTMLElement) || !(buttonNode instanceof HTMLButtonElement) ||
      !('IntersectionObserver' in window)) return;
  const ambient = ambientNode;
  const motionButton = buttonNode;

  /** @type {Map<Element, FlightZone>} */
  const zones = new Map();
  for (const element of page.querySelectorAll('[data-meteor]')) {
    if (!(element instanceof HTMLElement)) continue;
    const kind = element.dataset.meteor;
    const trail = element.querySelector('.celestial-meteor');
    if ((kind === 'sky' || kind === 'accent') && trail instanceof HTMLElement) {
      zones.set(element, { element, trail, kind });
    }
  }
  /** @type {Set<FlightZone>} */
  const visibleZones = new Set();
  /** @type {Map<MeteorKind, number>} */
  const remaining = new Map();
  const listeners = new AbortController();
  const { signal } = listeners;

  let paused = false;
  let skyVisible = false;
  let suspended = false;
  /** @type {FlightZone | undefined} */
  let activeZone;
  /** @type {number | undefined} */
  let timer;
  /** @type {Animation | undefined} */
  let flight;
  let nextMeteorAt = 0;

  function motionEnabled() {
    return !suspended && !page.hidden && !reducedMotion.matches && !paused;
  }

  /** @param {FlightZone} zone */
  function flyMeteor({ element, trail, kind }) {
    const main = kind === 'sky';
    const width = element.clientWidth;
    const height = element.clientHeight;
    const distance = Math.min(main ? 145 : 65, width * .23);
    const fall = Math.min(height * .46, distance * (.33 + Math.random() * .22));
    const angle = Math.atan2(fall, distance) * 180 / Math.PI;
    const x = width * (main ? .1 + Math.random() * .43 : .45 + Math.random() * .28);
    const y = height * (.12 + Math.random() * .22);
    const animation = trail.animate?.([
      { transform: `translate(${x}px, ${y}px) rotate(${angle}deg)`, opacity: 0 },
      { opacity: main ? .57 : .3, offset: .22 },
      { transform: `translate(${x + distance}px, ${y + fall}px) rotate(${angle}deg)`, opacity: 0 },
    ], { duration: main ? 840 : 680, easing: 'ease-out' });
    flight = animation;
    if (animation) animation.onfinish = () => { if (flight === animation) flight = undefined; };
  }

  /** @param {FlightZone} zone */
  function scheduleMeteor(zone) {
    const { kind } = zone;
    const [min, max] = meteorIntervals[kind];
    const delay = remaining.get(kind) ?? (min + Math.random() * (max - min)) * 1000;
    nextMeteorAt = performance.now() + delay;
    timer = window.setTimeout(() => {
      timer = undefined;
      remaining.delete(kind);
      if (!motionEnabled() || !visibleZones.has(zone)) return;
      flyMeteor(zone);
      scheduleMeteor(zone);
    }, delay);
  }

  function stopMeteor() {
    if (timer !== undefined) window.clearTimeout(timer);
    timer = undefined;
    flight?.cancel();
    flight = undefined;
  }

  function syncMeteor() {
    // A single zone owns the schedule and flight. The main chart takes priority.
    const eligible = motionEnabled() ? [...zones.values()].filter(zone =>
      visibleZones.has(zone) && (zone.kind === 'sky' || !compact.matches)) : [];
    const nextZone = eligible.find(zone => zone.kind === 'sky') ?? eligible[0];
    if (activeZone === nextZone) return;
    if (activeZone && timer !== undefined) {
      remaining.set(activeZone.kind, Math.max(0, nextMeteorAt - performance.now()));
    }
    stopMeteor();
    activeZone = nextZone;
    if (activeZone) scheduleMeteor(activeZone);
  }

  function resetDepth() {
    ambient.style.removeProperty('--depth-x');
    ambient.style.removeProperty('--depth-y');
  }

  function syncSkyMotion() {
    const active = skyVisible && motionEnabled();
    motionButton.hidden = reducedMotion.matches;
    motionButton.textContent = paused ? 'Resume sky motion' : 'Pause sky motion';
    sky.classList.toggle('sky-playing', active);
    if (active) sky.classList.add('sky-reveal');
    else resetDepth();
    syncMeteor();
  }

  const skyObserver = new IntersectionObserver(([entry]) => {
    skyVisible = entry.isIntersecting;
    syncSkyMotion();
  });
  const flightObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const zone = zones.get(entry.target);
      if (!zone) continue;
      if (entry.intersectionRatio >= .65) visibleZones.add(zone);
      else visibleZones.delete(zone);
    }
    syncMeteor();
  }, { threshold: .65 });
  skyObserver.observe(sky);
  zones.forEach(({ element }) => flightObserver.observe(element));

  sky.addEventListener('pointermove', event => {
    if (!(event instanceof PointerEvent) || event.pointerType !== 'mouse' ||
        !sky.classList.contains('sky-playing')) return;
    ambient.style.setProperty('--depth-x', `${(event.clientX / window.innerWidth - .5) * 5}px`);
    ambient.style.setProperty('--depth-y', `${(event.clientY / window.innerHeight - .5) * 4}px`);
  }, { passive: true, signal });
  sky.addEventListener('pointerleave', resetDepth, { signal });
  motionButton.addEventListener('click', () => {
    paused = !paused;
    if (paused) sky.classList.add('sky-settled');
    syncSkyMotion();
  }, { signal });
  page.addEventListener('visibilitychange', syncSkyMotion, { signal });
  reducedMotion.addEventListener('change', syncSkyMotion, { signal });
  compact.addEventListener('change', syncMeteor, { signal });
  window.addEventListener('pagehide', event => {
    if (event.persisted) {
      suspended = true;
      syncSkyMotion();
    } else {
      dispose();
    }
  }, { signal });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    suspended = false;
    syncSkyMotion();
  }, { signal });
  syncSkyMotion();

  function dispose() {
    listeners.abort();
    skyObserver.disconnect();
    flightObserver.disconnect();
    stopMeteor();
    sky.classList.remove('sky-playing');
    resetDepth();
    motionButton.hidden = true;
  }

  return dispose;
}
