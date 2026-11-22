const screenshots = document.querySelectorAll('.lab-screenshot');
const lightbox = document.createElement('dialog');

if (typeof lightbox.showModal === 'function' && screenshots.length) {
  lightbox.className = 'lab-image-preview';
  lightbox.setAttribute('aria-label', 'Project screenshot');
  lightbox.innerHTML = `
    <div class="preview-controls">
      <button type="button" autofocus>Close preview</button>
      <a>Open original image</a>
    </div>
    <img alt="">
    <p></p>`;
  document.body.append(lightbox);
  const image = lightbox.querySelector('img');
  const original = lightbox.querySelector('a');
  const caption = lightbox.querySelector('p');

  lightbox.querySelector('button').addEventListener('click', () => lightbox.close());
  screenshots.forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      image.alt = link.querySelector('img').alt;
      image.src = link.href;
      original.href = link.href;
      caption.textContent = link.dataset.caption;
      lightbox.showModal();
    });
  });
}
