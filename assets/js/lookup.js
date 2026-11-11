(function () {
  var area = document.querySelector('.post-body');
  if (!area) return;
  var list = (window.GLOSSARY || []).filter(function (g) { return g && g.term && g.desc; });
  var byKey = {};
  var keys = [];
  list.forEach(function (g) {
    [g.term].concat(g.aliases || []).forEach(function (k) { byKey[k.toLowerCase()] = g; keys.push(k); });
  });
  keys.sort(function (a, b) { return b.length - a.length; });

  // 1) 본문에서 용어 자동 표시 (문단마다 용어당 첫 번째만)
  var esc = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
  if (keys.length) {
    var re = new RegExp('(' + keys.map(esc).join('|') + ')', 'i');
    var isWord = function (ch) { return ch && /[A-Za-z0-9]/.test(ch); };
    area.querySelectorAll('p, li, td, h2, h3').forEach(function (block) {
      var seen = {};
      var walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          return n.parentElement.closest('a, code, .term') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        }
      });
      var nodes = [], n;
      while ((n = walker.nextNode())) nodes.push(n);
      nodes.forEach(function (node) {
        var guard = 0;
        while (node && guard++ < 20) {
          var m = re.exec(node.nodeValue);
          if (!m) break;
          var g = byKey[m[1].toLowerCase()];
          var before = node.nodeValue[m.index - 1], after = node.nodeValue[m.index + m[1].length];
          var latin = /^[A-Za-z]/.test(m[1]);
          var rest = node.splitText(m.index);
          var tail = rest.splitText(m[1].length);
          if (!seen[g.term] && !(latin && (isWord(before) || isWord(after)))) {
            seen[g.term] = 1;
            var span = document.createElement('span');
            span.className = 'term'; span.tabIndex = 0; span.dataset.term = g.term;
            span.setAttribute('role', 'button');
            rest.parentNode.replaceChild(span, rest); span.appendChild(rest);
          }
          node = tail;
        }
      });
    });
  }

  // 안내 문구
  var tip = document.createElement('p');
  tip.className = 'tip';
  tip.innerHTML = '<span>점선 밑줄</span>이 있는 용어를 누르면 설명이 나옵니다. 다른 단어는 드래그해서 바로 검색할 수 있습니다.';
  area.insertBefore(tip, area.firstChild);

  // 2) 설명 팝업
  var pop = document.createElement('div');
  pop.className = 'lookup'; pop.hidden = true; pop.setAttribute('role', 'dialog');
  document.body.appendChild(pop);

  var find = function (text) {
    var t = text.trim().toLowerCase();
    if (byKey[t]) return byKey[t];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i].toLowerCase();
      if (k.length >= 2 && t.indexOf(k) !== -1 && t.length <= k.length + 6) return byKey[k];
    }
    return null;
  };
  var show = function (text, rect) {
    var g = find(text), q = encodeURIComponent(text.trim());
    pop.textContent = '';
    var b = document.createElement('b'); b.textContent = g ? g.term : text.trim();
    var p = document.createElement('p');
    if (g) p.textContent = g.desc; else { p.textContent = '용어집에 아직 없는 표현입니다. 아래에서 바로 검색해 보세요.'; p.className = 'none'; }
    var d = document.createElement('div');
    [['네이버에서 뜻 검색', 'https://search.naver.com/search.naver?query=' + q + '%20%EB%9C%BB'],
     ['구글 검색', 'https://www.google.com/search?q=' + q + '%20%EB%9C%BB'],
     ['최신 뉴스', 'https://search.naver.com/search.naver?where=news&query=' + q]].forEach(function (l) {
      var a = document.createElement('a'); a.textContent = l[0]; a.href = l[1]; a.target = '_blank'; a.rel = 'noopener'; d.appendChild(a);
    });
    pop.append(b, p, d);
    pop.hidden = false;
    var pw = pop.offsetWidth, ph = pop.offsetHeight;
    var left = Math.max(16, Math.min(rect.left + rect.width / 2 - pw / 2, innerWidth - pw - 16));
    var top = rect.bottom + 10;
    if (top + ph > innerHeight - 10 && rect.top - ph - 10 > 0) top = rect.top - ph - 10;
    pop.style.left = left + scrollX + 'px';
    pop.style.top = top + scrollY + 'px';
  };
  var hide = function () { pop.hidden = true; };

  area.addEventListener('click', function (e) {
    var t = e.target.closest('.term');
    if (t && String(getSelection()).trim() === '') { show(t.dataset.term, t.getBoundingClientRect()); e.stopPropagation(); }
  });
  area.addEventListener('keydown', function (e) {
    var t = e.target.closest && e.target.closest('.term');
    if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); show(t.dataset.term, t.getBoundingClientRect()); }
  });

  // 3) 드래그(선택)하면 자동으로 팝업
  var timer;
  var onSelect = function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var sel = getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;
      var text = String(sel).replace(/\s+/g, ' ').trim();
      if (text.length < 2 || text.length > 40) return;
      var range = sel.getRangeAt(0);
      if (!area.contains(range.commonAncestorContainer)) return;
      show(text, range.getBoundingClientRect());
    }, 250);
  };
  document.addEventListener('mouseup', function (e) { if (!pop.contains(e.target)) onSelect(); });
  document.addEventListener('touchend', function (e) { if (!pop.contains(e.target)) onSelect(); });
  document.addEventListener('keyup', function (e) { if (e.shiftKey) onSelect(); });
  document.addEventListener('mousedown', function (e) { if (!pop.contains(e.target)) hide(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
})();
