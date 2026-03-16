(function () {
  const LOGO_ID = 'logoTitle';
  const MIN_WEIGHT = 200;
  const MAX_WEIGHT = 800;
  const RADIUS = 50;

  function initLogo(logo) {
    if (!logo || logo.dataset.logoEffectReady === 'true') {
      return;
    }
    logo.dataset.logoEffectReady = 'true';

    const text = logo.textContent || '';
    logo.textContent = '';

    const charsData = [];
    [...text].forEach((char) => {
      const span = document.createElement('span');
      span.className = 'logo-char';
      span.textContent = char;
      logo.appendChild(span);
      charsData.push({ element: span, x: 0, y: 0 });
    });

    function updatePositions() {
      charsData.forEach((data) => {
        const rect = data.element.getBoundingClientRect();
        data.x = rect.left + rect.width / 2;
        data.y = rect.top + rect.height / 2;
      });
    }

    function lockLogoLayout() {
      logo.style.width = 'auto';
      charsData.forEach((data) => {
        data.element.style.width = 'auto';
      });
      charsData.forEach((data) => {
        const charWidth = data.element.getBoundingClientRect().width;
        data.element.style.width = charWidth + 'px';
      });
      logo.style.width = logo.getBoundingClientRect().width + 'px';
      logo.style.flex = '0 0 auto';
    }

    function setWeight(element, weight) {
      element.style.fontVariationSettings = "'wght' " + weight;
      element.style.fontWeight = String(Math.round(weight));
    }

    function resetWeights() {
      charsData.forEach((data) => {
        setWeight(data.element, MIN_WEIGHT);
      });
    }

    let mouseX = -1000;
    let mouseY = -1000;

    function animate() {
      charsData.forEach((data) => {
        const dx = mouseX - data.x;
        const dy = mouseY - data.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= RADIUS) {
          const normalized = 1 - Math.pow(distance / RADIUS, 1.2);
          const weight = MIN_WEIGHT + normalized * (MAX_WEIGHT - MIN_WEIGHT);
          setWeight(data.element, weight);
        } else {
          setWeight(data.element, MIN_WEIGHT);
        }
      });
    }

    function onMove(event) {
      mouseX = event.clientX;
      mouseY = event.clientY;
      updatePositions();
      requestAnimationFrame(animate);
    }

    function onLeave() {
      mouseX = -1000;
      mouseY = -1000;
      requestAnimationFrame(animate);
    }

    lockLogoLayout();
    updatePositions();
    resetWeights();

    window.addEventListener('resize', function () {
      lockLogoLayout();
      updatePositions();
    });
    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
  }

  function bootstrap() {
    const logo = document.getElementById(LOGO_ID);
    if (logo) {
      initLogo(logo);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
