/* RE:SHIFT — static PNG cutout of the concept roadster.
   One photo, pre-baked in each paint finish, reused for hero, transformation, configurator and compare slider. */
(function () {
  const SRC = name => `img/cars/roadster-${name}.png`;

  // Rim artwork for the configurator swatches, centred on 0,0, radius ~40
  function rim(type) {
    let g = '';
    if (type === 'heritage') {
      g += '<circle r="41" fill="#b9bcb8"/><circle r="41" fill="url(#P-rimShade)"/>';
      for (let i = 0; i < 5; i++) {
        g += `<path transform="rotate(${i * 72})" d="M-9 -12C-12 -24 -10 -34 0 -37C10 -34 12 -24 9 -12Z" fill="#1b1e1f"/>`;
      }
      g += '<circle r="13" fill="#d9dbd6"/><circle r="5" fill="#2a2e2f"/>';
    } else if (type === 'forged') {
      g += '<circle r="41" fill="#22272a"/>';
      for (let i = 0; i < 10; i++) {
        g += `<path transform="rotate(${i * 36})" d="M-2.5 -10L-5 -39L5 -39L2.5 -10Z" fill="#5d6466"/>`;
      }
      g += '<circle r="39" fill="none" stroke="#6c7476" stroke-width="2"/><circle r="11" fill="#8A6754"/><circle r="4" fill="#101313"/>';
    } else if (type === 'multispoke') {
      g += '<circle r="41" fill="#111414"/>';
      for (let i = 0; i < 16; i++) {
        g += `<line transform="rotate(${i * 22.5})" x1="0" y1="-12" x2="0" y2="-38" stroke="#c9c3b3" stroke-width="2.2"/>`;
        g += `<line transform="rotate(${i * 22.5 + 11})" x1="-6" y1="-14" x2="6" y2="-36" stroke="#9b968a" stroke-width="1"/>`;
      }
      g += '<circle r="39" fill="none" stroke="#d8d2c2" stroke-width="3"/><circle r="12" fill="#d8d2c2"/><circle r="4" fill="#3a3a36"/>';
    }
    return g;
  }

  // data-paint = finish shown first; data-paints = every finish the slot can switch to
  function build(host) {
    const active = host.dataset.paint || 'original';
    const list = host.dataset.paints ? host.dataset.paints.split(',') : [active];
    const imgs = list.map((p, i) =>
      `<img class="car-img${p === active ? ' is-active' : ''}" data-paint="${p}" src="${SRC(p)}" alt="${i ? '' : 'Classic heritage roadster'}" width="1400" height="590" decoding="async"${p === active ? '' : ' loading="lazy"'}>`).join('');
    host.classList.add('car');
    host.insertAdjacentHTML('afterbegin', imgs);
    return host;
  }

  function setPaint(host, name) {
    host.querySelectorAll('.car-img').forEach(img => img.classList.toggle('is-active', img.dataset.paint === name));
  }

  function wheelIcon(type) {
    return `<svg viewBox="-50 -50 100 100"><defs><radialGradient id="ic-${type}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient></defs><circle r="48" fill="#0a0b0b"/>${rim(type).replace(/P-rimShade/g, 'ic-' + type)}</svg>`;
  }

  window.ReshiftCar = { build, setPaint, wheelIcon };
})();
