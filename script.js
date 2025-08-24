'use strict';

(function () {
  function tryPlay(audio) {
    if (!audio) return;
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // Autoplay likely blocked; will retry on first user gesture
      });
    }
  }

  function setupAudioOnFirstGesture(audio) {
    if (!audio) return;

    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('touchend', unlock);
      tryPlay(audio);
    };

    // Attempt immediate (desktop) and then wait for gesture (mobile)
    tryPlay(audio);

    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
    document.addEventListener('touchend', unlock, { once: true, passive: true });
  }

  function clamp(n, min, max) { return Math.max(min, Math.min(n, max)); }

  function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function placeWithinViewport(el, margin = 8, options = {}) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = el.getBoundingClientRect();
    const w = rect.width || 120;
    const h = rect.height || 44;

    // Leave a little extra space at the bottom on iPhones so it avoids the home bar
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const bottomSafe = isiOS ? 28 : 12;

    const avoidEl = options.avoidEl || null;
    const avoidDist = options.avoidDistance || 100; // center-to-center min distance

    function isFarFromAvoid(left, top) {
      if (!avoidEl) return true;
      const a = avoidEl.getBoundingClientRect();
      const cx = left + w / 2;
      const cy = top + h / 2;
      const acx = a.left + a.width / 2;
      const acy = a.top + a.height / 2;
      const dist = Math.hypot(cx - acx, cy - acy);
      // Also ensure no bounding-box overlap with a small margin
      const overlap = !(left + w < a.left - 8 || left > a.right + 8 || top + h < a.top - 8 || top > a.bottom + 8);
      return dist > avoidDist && !overlap;
    }

    const maxLeft = Math.max(margin, vw - w - margin);
    const maxTop = Math.max(margin, vh - h - (margin + bottomSafe));

    let left = randomInt(margin, maxLeft);
    let top = randomInt(margin, maxTop);

    // Try multiple times to find a spot away from the avoid element
    let tries = 0;
    while (!isFarFromAvoid(left, top) && tries < 40) {
      left = randomInt(margin, maxLeft);
      top = randomInt(margin, maxTop);
      tries++;
    }

    if (!isFarFromAvoid(left, top) && avoidEl) {
      // Fallback: push away from avoid center along the vector
      const a = avoidEl.getBoundingClientRect();
      const acx = a.left + a.width / 2;
      const acy = a.top + a.height / 2;
      const cx = left + w / 2;
      const cy = top + h / 2;
      let vx = cx - acx;
      let vy = cy - acy;
      const len = Math.hypot(vx, vy) || 1;
      vx /= len; vy /= len;
      const targetCx = acx + vx * (avoidDist + w / 2);
      const targetCy = acy + vy * (avoidDist + h / 2);
      left = clamp(Math.round(targetCx - w / 2), margin, maxLeft);
      top = clamp(Math.round(targetCy - h / 2), margin, maxTop);
    }

    el.style.left = left + 'px';
    el.style.top = top + 'px';
  }

  function setupDodgeButton(noButton) {
    if (!noButton) return;

    noButton.style.position = 'fixed';
    noButton.style.transition = 'left .75s cubic-bezier(.22,.61,.36,1), top .75s cubic-bezier(.22,.61,.36,1), transform .2s ease';

    const yesEl = document.getElementById('yes');

    // Initial random placement so it doesn't overlap other elements or the YES button
    placeWithinViewport(noButton, 16, { avoidEl: yesEl, avoidDistance: 110 });

    const threshold = 70; // px distance at which it dodges (smaller = less jumpy)
    const cooldownMs = 650; // minimum time between moves to slow it down
    let lastMove = 0;

    function moveAwayFrom(x, y) {
      const now = Date.now();
      if (now - lastMove < cooldownMs) return;

      const rect = noButton.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = cx - x;
      const dy = cy - y;
      const dist = Math.hypot(dx, dy);

      if (dist < threshold) {
        // Pick a new safe location away from the pointer and away from the YES button
        placeWithinViewport(noButton, 12, { avoidEl: yesEl, avoidDistance: 110 });
        lastMove = now;
      }
    }

    // Mouse/pointer proximity
    window.addEventListener('pointermove', (e) => {
      moveAwayFrom(e.clientX, e.clientY);
    });

    // Touch proximity: on touchstart, nudge immediately
    window.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      if (!t) return;
      moveAwayFrom(t.clientX, t.clientY);
    }, { passive: true });

    // If it ever gets focus (keyboard), dodge too :)
    noButton.addEventListener('focus', () => placeWithinViewport(noButton, 12, { avoidEl: yesEl, avoidDistance: 110 }));

    // Keep separation on resize/orientation change
    window.addEventListener('resize', () => placeWithinViewport(noButton, 16, { avoidEl: yesEl, avoidDistance: 110 }));

    // Prevent activating it by any means
    noButton.addEventListener('click', (e) => {
      e.preventDefault();
      placeWithinViewport(noButton, 12, { avoidEl: yesEl, avoidDistance: 110 });
    });
  }

  // Boot per-page
  document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('background-music');
    setupAudioOnFirstGesture(audio);

    const noBtn = document.getElementById('no');
    if (noBtn && noBtn.dataset && noBtn.dataset.dodge === 'true') {
      setupDodgeButton(noBtn);
    }
  });
})();
