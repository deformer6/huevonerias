function rand(a, b) { return a + Math.random() * (b - a); }
function pick(arr)  { return arr[(Math.random() * arr.length) | 0]; }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

(function initFish() {
  const term = document.getElementById("fishterm");
  if (!term) return;
  const cellW = 8, cellH = 16;
  let w = 80, h = 24;
  const fishes = [], bubbles = [];
  const frames = ["<><((('> ","<><((('>>","<><((('>.", "<><((('>>"];
  const bubbleChars = ["o","°","·","○"];
  function resize() {
    w = Math.max(40, Math.floor(window.innerWidth / cellW));
    h = Math.max(14, Math.floor(window.innerHeight / cellH));
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();
  function addFish() {
    const dir = Math.random() < 0.5 ? 1 : -1;
    fishes.push({ x: dir === 1 ? -12 : w + 12, y: (rand(2, h - 3) | 0), dir, speed: rand(8, 18), frame: (Math.random() * frames.length) | 0, wiggle: rand(2, 6), drift: rand(0.02, 0.08) });
  }
  function addBubble() {
    const source = fishes.length && Math.random() < 0.55 ? pick(fishes) : null;
    bubbles.push({ x: source ? ((source.x + rand(2, 10)) | 0) : (rand(0, w - 1) | 0), y: source ? (source.y | 0) : (h - 1), vy: rand(6, 16), ch: pick(bubbleChars), life: rand(0.9, 2.2), age: 0 });
  }
  for (let i = 0; i < 7; i++) addFish();
  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (Math.random() < 0.22) addBubble();
    for (const f of fishes) {
      f.x += f.dir * f.speed * dt;
      if (f.dir === 1 && f.x > w + 14) f.x = -14;
      if (f.dir === -1 && f.x < -14) f.x = w + 14;
      if (Math.random() < dt * f.wiggle) f.frame = (f.frame + 1) % frames.length;
      if (Math.random() < f.drift) f.y = clamp(f.y + (Math.random() < 0.5 ? -1 : 1), 1, h - 3);
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.age += dt;
      b.y -= b.vy * dt;
      if (b.y < 0 || b.age > b.life) bubbles.splice(i, 1);
    }
    const grid = Array.from({ length: h }, () => Array(w).fill(" "));
    for (const b of bubbles) {
      const bx = b.x | 0, by = b.y | 0;
      if (by >= 0 && by < h && bx >= 0 && bx < w) grid[by][bx] = b.ch;
    }
    for (const f of fishes) {
      const art = frames[f.frame];
      const s = f.dir === 1 ? art : art.split("").reverse().join("");
      const x0 = f.x | 0, y0 = f.y | 0;
      for (let i = 0; i < s.length; i++) {
        const fx = x0 + i;
        if (y0 >= 0 && y0 < h && fx >= 0 && fx < w) grid[y0][fx] = s[i];
      }
    }
    term.textContent = grid.map(r => r.join("")).join("\n");
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

(function initLightbox() {
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbCap = document.getElementById("lb-cap");
  const lbClose = document.getElementById("lb-close");
  function openLightbox(src, caption) {
    lbImg.src = src;
    lbImg.alt = caption || "art";
    lbCap.textContent = caption || "";
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
  }
  function closeLightbox() {
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    lbImg.src = "";
  }
  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => openLightbox(card.getAttribute("data-full"), card.getAttribute("data-caption")));
  });
  lbClose?.addEventListener("click", closeLightbox);
  lb?.addEventListener("click", e => { if (e.target === lb) closeLightbox(); });
  window.addEventListener("keydown", e => { if (e.key === "Escape") closeLightbox(); });
})();

function makeAsciiFrame(cols, rows) {
  cols = Math.max(8, cols);
  rows = Math.max(6, rows);
  const top = "+" + "-".repeat(cols - 2) + "+";
  const mid = "|" + " ".repeat(cols - 2) + "|";
  const bot = "+" + "-".repeat(cols - 2) + "+";
  let out = top + "\n";
  for (let r = 0; r < rows - 2; r++) out += mid + "\n";
  out += bot;
  return out;
}

function frameize() {
  document.querySelectorAll(".ascii-frame").forEach(pre => {
    const box = pre.getBoundingClientRect();
    const cols = Math.floor((box.width - 8) / 7.2);
    const rows = Math.floor((box.height - 8) / 12);
    pre.textContent = makeAsciiFrame(cols, rows);
  });
}

function wallizePrints() {
  const wall = document.getElementById("wall");
  if (!wall) return;
  const imgs = [...wall.querySelectorAll("img")];
  Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(res => {
    img.addEventListener("load", res, { once: true });
    img.addEventListener("error", res, { once: true });
  }))).then(() => {
    const wallW = wall.clientWidth;
    const widths = [90, 100, 110, 120, 130];
    const gutter = 12;
    const colW = 140;
    const cols = Math.max(3, Math.floor((wallW + gutter) / (colW + gutter)));
    const colX = Array.from({ length: cols }, (_, i) => Math.floor(i * (wallW / cols)));
    const colY = Array.from({ length: cols }, () => 0);
    let maxY = 0;
    [...wall.querySelectorAll(".card")].forEach(card => {
      const w = pick(widths);
      let c = 0;
      for (let j = 1; j < cols; j++) if (colY[j] < colY[c]) c = j;
      const img = card.querySelector("img");
      const ratio = (img && img.naturalWidth) ? (img.naturalHeight / img.naturalWidth) : 0.75;
      const h = Math.round((w * ratio) + 26);
      const x = Math.round(colX[c] + rand(-6, 6));
      const y = Math.round(colY[c] + rand(0, 8));
      card.style.width = `${w}px`;
      card.style.left = `${x}px`;
      card.style.top = `${y}px`;
      card.style.setProperty("--rot", `${rand(-2.2, 2.2).toFixed(2)}deg`);
      colY[c] = y + h + gutter;
      maxY = Math.max(maxY, colY[c]);
    });
    wall.style.height = `${maxY + 20}px`;
    requestAnimationFrame(frameize);
  });
}

window.addEventListener("load", wallizePrints);
window.addEventListener("resize", wallizePrints);
