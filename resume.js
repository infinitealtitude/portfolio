import { setupCelestialMotion } from './celestial-motion.js';

const menu = document.querySelector('#menu');
const navigation = document.querySelector('#navigation');
const compact = window.matchMedia('(max-width: 49rem)');

function syncMenu(expanded = false) {
  menu.hidden = !compact.matches;
  menu.setAttribute('aria-expanded', String(expanded));
  navigation.hidden = compact.matches && !expanded;
}

syncMenu();
compact.addEventListener('change', () => syncMenu());
menu.addEventListener('click', () => syncMenu(navigation.hidden));
navigation.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link || !compact.matches) return;
  const target = document.querySelector(link.hash);
  if (target) {
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }
  syncMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && compact.matches && !navigation.hidden) {
    syncMenu();
    menu.focus();
  }
});

const sky = document.querySelector('.sky-scene');
const themeLines = [...sky.querySelectorAll('[data-sky-line]')];
const themePanels = [...sky.querySelectorAll('[data-sky-panel]')];
const themeControls = [...sky.querySelectorAll('[data-sky-theme]')].map(link => {
  const button = document.createElement('button');
  for (const { name, value } of link.attributes) {
    if (name !== 'href') button.setAttribute(name, value);
  }
  button.type = 'button';
  button.replaceChildren(...link.childNodes);
  link.replaceWith(button);
  return button;
});

function previewTheme(name) {
  themeControls.forEach(button => {
    const active = button.dataset.skyTheme === name;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  themeLines.forEach(line => line.classList.toggle('active', line.dataset.skyLine === name));
  themePanels.forEach(panel => { panel.hidden = panel.dataset.skyPanel !== name; });
}

themeControls.forEach(button => {
  button.addEventListener('click', () => previewTheme(button.dataset.skyTheme));
});
previewTheme(themeControls[0].dataset.skyTheme);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
setupCelestialMotion({ sky, compact, reducedMotion });

const pathway = document.querySelector('.pathway');
const stages = [...pathway.querySelectorAll('details')];
const stageControls = document.createElement('div');
stageControls.className = 'stage-controls';
stageControls.setAttribute('role', 'group');
stageControls.setAttribute('aria-label', 'Advisory stages');
const stagePanel = document.createElement('div');
stagePanel.className = 'stage-panel';
stagePanel.id = 'advisory-stage';
stagePanel.setAttribute('aria-live', 'polite');
const stageButtons = stages.map((stage, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = stage.querySelector('summary').textContent;
  button.setAttribute('aria-controls', stagePanel.id);
  button.addEventListener('click', () => selectStage(index));
  stageControls.append(button);
  return button;
});

function selectStage(index) {
  stageButtons.forEach((button, position) => button.setAttribute('aria-pressed', String(index === position)));
  stagePanel.replaceChildren(...Array.from(stages[index].querySelector('div').children, child => child.cloneNode(true)));
}

pathway.classList.add('pathway-enhanced');
pathway.replaceChildren(stageControls, stagePanel);
selectStage(0);

function openLinkedCase() {
  const target = document.getElementById(window.location.hash.slice(1));
  const details = target?.matches('.case') ? target.querySelector('details') : null;
  if (details) details.open = true;
}
window.addEventListener('hashchange', openLinkedCase);
openLinkedCase();

const gallery = document.querySelector('.photo-gallery');
const galleryTrack = gallery.querySelector('.gallery-track');
const gallerySlides = [...gallery.querySelectorAll('.gallery-slide')];
const galleryToggle = document.querySelector('#gallery-toggle');
const galleryStatus = document.querySelector('#gallery-status');
let photoIndex = 0;
let playing = !reducedMotion.matches;
let galleryVisible = false;
let rotation;

function nextPhoto(announce = false) {
  photoIndex = (photoIndex + 1) % gallerySlides.length;
  galleryTrack.style.setProperty('--gallery-offset', `-${photoIndex * 100}%`);
  gallerySlides.forEach((slide, index) => slide.setAttribute('aria-hidden', String(index !== photoIndex)));
  if (announce) {
    const caption = gallerySlides[photoIndex].querySelector('figcaption').textContent;
    galleryStatus.textContent = `Photo ${photoIndex + 1} of ${gallerySlides.length}. ${caption}`;
  }
}

function syncRotation() {
  window.clearInterval(rotation);
  galleryToggle.textContent = playing ? 'Pause' : 'Play';
  if (playing && galleryVisible && !document.hidden) {
    rotation = window.setInterval(nextPhoto, 6500);
  }
}

gallery.classList.add('gallery-ready');
gallerySlides.slice(1).forEach(slide => slide.setAttribute('aria-hidden', 'true'));
gallery.querySelector('.gallery-controls').hidden = false;
galleryToggle.addEventListener('click', () => {
  playing = !playing;
  syncRotation();
});
document.querySelector('#gallery-next').addEventListener('click', () => {
  playing = false;
  nextPhoto(true);
  syncRotation();
});
reducedMotion.addEventListener('change', event => {
  if (event.matches) playing = false;
  syncRotation();
});
document.addEventListener('visibilitychange', syncRotation);
if ('IntersectionObserver' in window) {
  const galleryObserver = new IntersectionObserver(([entry]) => {
    galleryVisible = entry.isIntersecting;
    if (galleryVisible && !gallery.classList.contains('gallery-seen')) {
      gallery.classList.add('gallery-seen');
      if (!reducedMotion.matches) {
        gallery.querySelector('.gallery-window').animate?.(
          [{ clipPath: 'inset(0 0 8% 0)', opacity: .76 }, { clipPath: 'inset(0)', opacity: 1 }],
          { duration: 650, easing: 'ease-out' },
        );
      }
    }
    syncRotation();
  }, { threshold: 0.25 });
  galleryObserver.observe(gallery);
} else {
  galleryVisible = true;
}
syncRotation();
