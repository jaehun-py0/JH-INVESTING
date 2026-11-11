(function () {
  // 다음 09:00 KST까지 남은 시간
  var cd = document.querySelector('[data-countdown]');
  if (cd) {
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var tick = function () {
      var now = Date.now();
      var kst = new Date(now + 9 * 3600e3);
      var target = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate(), 9) - 9 * 3600e3;
      if (target <= now) target += 86400e3;
      var s = Math.floor((target - now) / 1000);
      cd.textContent = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60);
    };
    tick(); setInterval(tick, 1000);
  }

  // 한국 시장 관례: 상승은 빨강, 하락은 파랑
  document.querySelectorAll('.post-body td').forEach(function (td) {
    var m = td.textContent.match(/\(?([+\-−])\s?[\d.,]+\s?(%|bp|원)/);
    if (m) td.classList.add(m[1] === '+' ? 'up' : 'down');
  });

  // 읽기 진행 막대
  var bar = document.querySelector('.progress');
  if (bar && document.querySelector('.post-body')) {
    var onScroll = function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  // 히어로 배경: 흐르는 시세선
  var c = document.querySelector('.signal');
  if (!c) return;
  var ctx = c.getContext('2d'), w, h, dpr = Math.min(devicePixelRatio || 1, 2);
  var lines = [0, 1, 2, 3, 4].map(function (i) {
    return { base: 0.3 + i * 0.13, amp: 0.05 + Math.random() * 0.05, f1: 1.2 + Math.random() * 2, f2: 5 + Math.random() * 6, f3: 17 + Math.random() * 12, ph: Math.random() * 100, sp: 0.02 + Math.random() * 0.03, a: 0.14 + i * 0.07 };
  });
  var resize = function () {
    w = c.clientWidth; h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  var draw = function (t) {
    ctx.clearRect(0, 0, w, h);
    lines.forEach(function (l) {
      var g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, 'rgba(124,131,255,0)');
      g.addColorStop(0.5, 'rgba(124,131,255,' + l.a + ')');
      g.addColorStop(1, 'rgba(92,225,255,' + (l.a + 0.25) + ')');
      ctx.strokeStyle = g; ctx.lineWidth = 1.25; ctx.beginPath();
      var y = 0;
      for (var x = 0; x <= w; x += 4) {
        var u = x / w + t * l.sp + l.ph;
        y = h * (l.base - (x / w) * 0.12 + l.amp * (Math.sin(u * l.f1) + 0.45 * Math.sin(u * l.f2) + 0.18 * Math.sin(u * l.f3)));
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(92,225,255,.9)'; ctx.beginPath(); ctx.arc(w - 3, y, 2.2, 0, 7); ctx.fill();
    });
  };
  resize(); addEventListener('resize', function () { resize(); draw(0); });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { draw(0); return; }
  (function loop(ms) { draw(ms / 1000); requestAnimationFrame(loop); })(0);
})();
