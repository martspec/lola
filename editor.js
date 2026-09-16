// editor.js - zvyraznovani kodu, naseptavac a prace s kurzorem
// Zvyrazneny text je v prvku pre, pres nej je pruhledny textarea.
// Pozn.: znak ampersand se v tomto souboru sklada pres String.fromCharCode(38),
// protoze prenosovy kanal maze HTML entity z literalu.

const Editor = (function () {
  'use strict';

  const ta = document.getElementById('kod');
  const pre = document.getElementById('zvyrazneni');
  const pop = document.getElementById('naseptavac');
  const obal = document.getElementById('editor-obal');

  if (!ta || !pre || !pop || !obal) {
    return {
      nastav: function () {},
      ziskej: function () { return ''; },
      priZmene: function () {},
      zamer: function () {},
      obarvi: function () {}
    };
  }

  const zrcadlo = document.createElement('div');
  zrcadlo.setAttribute('aria-hidden', 'true');
  obal.appendChild(zrcadlo);

  let RE = null;
  let nabidky = [];
  let vybrana = -1;
  let zmenaCallback = null;

  // Hodnoty, ktere se nabizeji po prikazu.
  // Kdyz napises "vzhled " (i s mezerou), nabidnou se svetly / tmavy / barevny / minimal.
  const HODNOTY_PRO = {
    'vzhled': ['svetly', 'tmavy', 'barevny', 'minimal'],
    'zarovnani': ['vlevo', 'stred', 'vpravo'],
    'font': ['maly', 'normalni', 'velky']
  };

  // Prikazy, po kterych ma smysl nabizet barvy.
  const PRIKAZY_S_BARVOU = ['barva-pozadi', 'barva-textu', 'obarvi'];

  function ochrana(s) {
    const A = String.fromCharCode(38);
    return String(s).replace(/&/g, A + 'amp;').replace(/</g, A + 'lt;').replace(/>/g, A + 'gt;');
  }

  // ------------------------------------------------------------------ zvyraznovani
  function postavRe() {
    const klice = [];
    if (typeof NAPOVEDA !== 'undefined' && NAPOVEDA) {
      (NAPOVEDA.prikazy || []).forEach(function (p) {
        if (p.klic) klice.push(p.klic);
        (p.hodnoty || []).forEach(function (h) { klice.push(h); });
      });
      if (NAPOVEDA.barevnik) Object.keys(NAPOVEDA.barevnik).forEach(function (b) { klice.push(b); });
    }
    const unikat = [];
    klice.forEach(function (k) { if (k && unikat.indexOf(k) < 0) unikat.push(k); });
    unikat.sort(function (a, b) { return b.length - a.length; });
    const utekle = unikat.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
    RE = new RegExp(
      '(\\/\\/[^\\n]*)|("(?:[^"\\\\]|\\\\.)*"?)' +
      '|(#(?:[A-Za-z0-9_-]*))|(\\$(?:[A-Za-z0-9_-]*))|(->)|(\\b\\d+(?:[.,]\\d+)?\\b)' +
      '|\\b(' + utekle.join('|') + ')\\b',
      'g'
    );
  }

  function obarvi() {
    if (!RE) postavRe();
    const kod = ta.value;
    RE.lastIndex = 0;
    let out = '';
    let posledni = 0;
    let m;
    while ((m = RE.exec(kod)) !== null) {
      if (m[0] === '') { RE.lastIndex++; continue; }
      out += ochrana(kod.slice(posledni, m.index));
      if (m[1]) out += '<span class="t-kom">' + ochrana(m[1]) + '</span>';
      else if (m[2]) out += '<span class="t-str">' + ochrana(m[2]) + '</span>';
      else if (m[3]) out += '<span class="t-id">' + ochrana(m[3]) + '</span>';
      else if (m[4]) out += '<span class="t-id">' + ochrana(m[4]) + '</span>';
      else if (m[5]) out += '<span class="t-sipka">-></span>';
      else if (m[6]) out += '<span class="t-cis">' + ochrana(m[6]) + '</span>';
      else if (m[7]) out += '<span class="t-klic">' + ochrana(m[7]) + '</span>';
      posledni = m.index + m[0].length;
    }
    out += ochrana(kod.slice(posledni));
    pre.innerHTML = out;
    pre.scrollTop = ta.scrollTop;
  }

  // ------------------------------------------------------------------ pozice kurzoru
  function souradniceKurzoru() {
    const cs = window.getComputedStyle(ta);
    const s = zrcadlo.style;
    s.position = 'absolute';
    s.top = '0';
    s.left = '0';
    s.visibility = 'hidden';
    s.whiteSpace = 'pre-wrap';
    s.overflowWrap = 'break-word';
    s.wordBreak = 'normal';
    s.boxSizing = 'border-box';
    s.border = '0';
    s.fontFamily = cs.fontFamily;
    s.fontSize = cs.fontSize;
    s.fontWeight = cs.fontWeight;
    s.fontStyle = cs.fontStyle;
    s.letterSpacing = cs.letterSpacing;
    s.lineHeight = cs.lineHeight;
    s.textTransform = cs.textTransform;
    s.tabSize = cs.tabSize;
    s.padding = cs.padding;
    s.width = ta.clientWidth + 'px';

    const poz = ta.selectionStart;
    zrcadlo.textContent = ta.value.slice(0, poz);
    const znak = document.createElement('span');
    znak.textContent = '.';
    zrcadlo.appendChild(znak);
    return { x: znak.offsetLeft, y: znak.offsetTop + znak.offsetHeight };
  }

  function umisti() {
    const souradnice = souradniceKurzoru();
    pop.hidden = false;
    let x = souradnice.x;
    let y = souradnice.y - ta.scrollTop + 4;
    const sirka = pop.offsetWidth;
    const vyska = pop.offsetHeight;
    if (x + sirka > obal.clientWidth - 8) x = Math.max(8, obal.clientWidth - sirka - 8);
    if (y + vyska > obal.clientHeight - 8) y = Math.max(8, souradnice.y - ta.scrollTop - vyska - 4);
    pop.style.left = Math.round(x) + 'px';
    pop.style.top = Math.round(y) + 'px';
  }

  function zavri() {
    pop.hidden = true;
    nabidky = [];
    vybrana = -1;
  }

  // ------------------------------------------------------------------ naseptavac
  function kontext() {
    const poz = ta.selectionStart;
    const pred = ta.value.slice(0, poz);
    const radek = pred.slice(pred.lastIndexOf('\n') + 1);
    const m = /[#A-Za-z0-9_$-]*$/.exec(radek);
    const fragment = m ? m[0] : '';
    return {
      poz: poz,
      fragment: fragment,
      zacatek: poz - fragment.length,
      pred: radek.slice(0, radek.length - fragment.length),
      celyRadek: radek
    };
  }

  // Jsme uvnitr uvozovek? Tam se nic nenabizi, pise se tam normalni text.
  function jeUvnitrTextu(k) {
    if (k.fragment.charAt(0) === '#' || k.fragment.charAt(0) === '$') return false;
    return (k.pred.split('"').length - 1) % 2 === 1;
  }

  // Stojime za prikazem, ktery ceka hodnotu? (napr. "vzhled " nebo "obarvi #x ")
  function ocekavaHodnotu(k) {
    const slova = k.pred.trim().split(/\s+/);
    const prvni = (slova[0] || '').toLowerCase();
    return !!(HODNOTY_PRO[prvni] || PRIKAZY_S_BARVOU.indexOf(prvni) >= 0);
  }

  function najdiVzorem(vzor, popisNalezu) {
    const nalezene = [];
    const re = new RegExp(vzor, 'g');
    let m;
    while ((m = re.exec(ta.value)) !== null) if (nalezene.indexOf(m[1]) < 0) nalezene.push(m[1]);
    return nalezene.map(function (n) { return { klic: n, popis: popisNalezu, vlozit: n, odKonce: 0 }; });
  }

  function vyberZeSeznamu(seznam, fragment, omez) {
    const f = fragment.toLowerCase();
    const vysledek = [];
    seznam.forEach(function (n) {
      const klic = n.klic.toLowerCase();
      const jePrefix = klic.indexOf(f) === 0;
      const obsahuje = f.length >= 3 && klic.indexOf(f) > 0;
      if (f === '' || jePrefix || obsahuje) vysledek.push({ n: n, pred: jePrefix ? 0 : 1 });
    });
    vysledek.sort(function (a, b) { return a.pred - b.pred; });
    return vysledek.map(function (x) { return x.n; }).slice(0, omez || 10);
  }

  function spoctiNabidky() {
    const k = kontext();
    const f = k.fragment;

    if (f.charAt(0) === '#') {
      const hledane = f.slice(1).toLowerCase();
      return najdiVzorem('#([A-Za-z0-9_-]+)', 'Prvek na strance').filter(function (n) {
        return n.klic !== f && n.klic.slice(1).toLowerCase().indexOf(hledane) === 0;
      }).slice(0, 10);
    }
    if (f.charAt(0) === '$') {
      const hledane = f.slice(1).toLowerCase();
      return najdiVzorem('\\$([A-Za-z0-9_-]+)', 'Promenna v kodu').filter(function (n) {
        return n.klic !== f && n.klic.slice(1).toLowerCase().indexOf(hledane) === 0;
      }).slice(0, 10);
    }

    const slova = k.pred.trim().split(/\s+/);
    const prvni = (slova[0] || '').toLowerCase();

    if (k.pred.indexOf('->') >= 0) {
      const nalezy = najdiVzorem('akce\\s+([A-Za-z0-9_-]+)', 'Akce v kodu');
      return vyberZeSeznamu(nalezy, f, 10);
    }

    if (HODNOTY_PRO[prvni]) {
      return HODNOTY_PRO[prvni].map(function (v) {
        return { klic: v, popis: 'Hodnota pro ' + prvni, vlozit: v, odKonce: 0 };
      }).filter(function (n) { return n.klic.indexOf(f.toLowerCase()) === 0; });
    }
    if (PRIKAZY_S_BARVOU.indexOf(prvni) >= 0) {
      const b = (typeof NAPOVEDA !== 'undefined' && NAPOVEDA.barevnik) ? Object.keys(NAPOVEDA.barevnik) : [];
      return b.map(function (v) {
        return { klic: v, popis: 'Barva', vlozit: v, odKonce: 0 };
      }).filter(function (n) { return n.klic.indexOf(f.toLowerCase()) === 0; });
    }

    const prikazy = ((typeof NAPOVEDA !== 'undefined' && NAPOVEDA.prikazy) || []).map(function (p) {
      return { klic: p.klic, popis: p.popis, vlozit: p.vlozit || p.klic, odKonce: p.odKonce || 0 };
    });
    if (f === '' && k.pred.trim() !== '') return [];
    return vyberZeSeznamu(prikazy, f, 10);
  }

  function vykresli() {
    if (!nabidky.length) { zavri(); return; }
    let html = '';
    nabidky.forEach(function (n, i) {
      html += '<div class="nabidka' + (i === vybrana ? ' vybrana' : '') + '" data-i="' + i + '">' +
        '<b>' + ochrana(n.klic) + '</b><span>' + ochrana(n.popis) + '</span></div>';
    });
    pop.innerHTML = html;
    umisti();
  }

  // vybratPrvni === false znamena: nabidni, ale nic nepredvyber.
  // Diky tomu Enter u prazdne nabidky udela novy radek, ne vlozeni.
  function otevri(vybratPrvni) {
    const k = kontext();
    nabidky = spoctiNabidky();
    vybrana = (vybratPrvni === false || !nabidky.length) ? -1 : 0;
    // Kdyz je napsane presne to, co nabizime, neni co vkladat - Enter ma delat novy radek.
    if (vybrana === 0 && nabidky.length === 1 && nabidky[0].klic === k.fragment) vybrana = -1;
    if (!nabidky.length) { zavri(); return; }
    vykresli();
  }

  function vloz(i) {
    const n = nabidky[i];
    if (!n) return;
    const k = kontext();
    const pred = ta.value.slice(0, k.zacatek);
    const po = ta.value.slice(k.poz);
    const text = n.vlozit;
    ta.value = pred + text + po;
    const pozice = pred.length + text.length - (n.odKonce || 0);
    ta.setSelectionRange(pozice, pozice);
    zavri();
    obarvi();
    if (zmenaCallback) zmenaCallback();
  }

  // ------------------------------------------------------------------ udalosti
  // Naseptavac se nabizi sam, ale jen kdyz to dava smysl.
  function autoNaseptavac() {
    const k = kontext();
    if (jeUvnitrTextu(k)) { if (!pop.hidden) zavri(); return; }
    if (k.fragment === '') {
      if (ocekavaHodnotu(k)) otevri(false);
      else if (!pop.hidden) zavri();
      return;
    }
    otevri(true);
  }

  function aktualizuj() {
    obarvi();
    if (zmenaCallback) zmenaCallback();
    autoNaseptavac();
  }

  function autoOdsazeni() {
    const poz = ta.selectionStart;
    if (poz !== ta.selectionEnd) { setTimeout(aktualizuj, 0); return; }
    const pred = ta.value.slice(0, poz);
    const radek = pred.slice(pred.lastIndexOf('\n') + 1);
    const m = /^[ \t]*/.exec(radek);
    const odsazeni = m ? m[0] : '';
    if (!odsazeni) { setTimeout(aktualizuj, 0); return; }
    const po = ta.value.slice(ta.selectionEnd);
    ta.value = pred + '\n' + odsazeni + po;
    const nova = poz + 1 + odsazeni.length;
    ta.setSelectionRange(nova, nova);
    aktualizuj();
  }

  function vlozOdsazeni() {
    const poz = ta.selectionStart;
    const po = ta.value.slice(ta.selectionEnd);
    ta.value = ta.value.slice(0, poz) + '  ' + po;
    ta.setSelectionRange(poz + 2, poz + 2);
    aktualizuj();
  }

  ta.addEventListener('input', aktualizuj);
  ta.addEventListener('scroll', function () {
    pre.scrollTop = ta.scrollTop;
    if (!pop.hidden) umisti();
  });
  ta.addEventListener('blur', function () { setTimeout(zavri, 120); });

  ta.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' && nabidky.length) {
      vybrana = (vybrana + 1) % nabidky.length;
      vykresli();
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowUp' && nabidky.length) {
      vybrana = (vybrana - 1 + nabidky.length) % nabidky.length;
      vykresli();
      e.preventDefault();
      return;
    }
    if ((e.key === 'Enter' || e.key === 'Tab') && nabidky.length && vybrana >= 0) {
      vloz(vybrana);
      e.preventDefault();
      return;
    }
    if (e.key === 'Escape') { zavri(); return; }
    if (e.key === ' ' && e.ctrlKey) { e.preventDefault(); otevri(); return; }
    if (e.key === 'Enter') { autoOdsazeni(); return; }
    if (e.key === 'Tab') { e.preventDefault(); vlozOdsazeni(); }
  });

  let kdyVlozeno = 0;

  function zPopupu(cil) {
    let c = cil;
    while (c && c !== pop && !(c.className && String(c.className).indexOf('nabidka') >= 0)) c = c.parentNode;
    if (!c || c === pop) return false;
    const ted = Date.now();
    if (ted - kdyVlozeno < 500) return true;
    kdyVlozeno = ted;
    vloz(Number(c.getAttribute('data-i')));
    return true;
  }

  pop.addEventListener('mousedown', function (e) {
    if (zPopupu(e.target)) e.preventDefault();
  });
  // Na dotykovem displeji prijde klepnuti jako touchstart.
  pop.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches.length !== 1) return;
    zPopupu(e.target);
  }, { passive: true });

  return {
    nastav: function (kod) {
      ta.value = kod == null ? '' : String(kod);
      zavri();
      obarvi();
      ta.scrollTop = 0;
      pre.scrollTop = 0;
    },
    ziskej: function () { return ta.value; },
    priZmene: function (fn) { zmenaCallback = fn; },
    zamer: function () { ta.focus(); },
    obarvi: obarvi
  };
})();
