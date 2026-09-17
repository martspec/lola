// nahlad.js - prace s prvky primo v nahledu.
// 1) Upravy: kliknes na prvek, oznacime ho a muzes ho posunout, prepsat nebo smazat.
// 2) Vkladani: z palety bloku pretahnes blok do nahledu a on se vlozi na to misto.
// Pomocny skript se vklada jen do nahledu - do stazeneho webu se nedostane.

const NahladEdit = (function () {
  'use strict';

  const $ = function (id) { return document.getElementById(id); };
  const nahlad = $('nahlad');
  const btn = $('btn-upravy');
  const lista = $('upravy');
  const popis = $('upravy-popis');

  if (!nahlad || !btn || !lista || !popis) {
    return { zapnuto: function () { return false; }, vlozPomocnika: function (h) { return h; } };
  }

  let zapnuto = false;
  let vybranyRadek = null;

  function zapnutoFn() { return zapnuto; }

  // Rezim se do nahledu posila zpravou. Po kazdem prekresleni ramecku se musi
  // poslat znovu - novy dokument o sobe nic nevi.
  function posliRezim() {
    if (!nahlad.contentWindow) return;
    try { nahlad.contentWindow.postMessage({ cw: 'rezim', upravy: zapnuto }, '*'); } catch (e) { /* bez nahledu neni kam poslat */ }
  }

  // ---------------------------------------------------------------- pomocnik v nahledu
  // Skript se vlozi do ramecku s nahledem. Bezi uvnitr nej, takze jeho pripadna
  // chyba nemuze ovlivnit zbytek editoru.
  const POMOCNIK = [
    '(function () {',
    '  var rezim = false;',
    '  var S = document.createElement("style");',
    '  S.textContent = ".cw-prejety{outline:2px dashed #5b9bff !important;outline-offset:2px !important}" +',
    '    ".cw-vybrany{outline:2px solid #5b9bff !important;outline-offset:2px !important}" +',
    '    ".cw-cil{outline:2px dashed #7bd88f !important;outline-offset:2px !important}";',
    '  document.head.appendChild(S);',
    '  var pod = null;',
    '  var cilEl = null;',
    '  function radek(el) {',
    '    var e = el;',
    '    while (e && e.getAttribute) {',
    '      var r = e.getAttribute("data-cw-radek");',
    '      if (r) return Number(r);',
    '      e = e.parentNode;',
    '    }',
    '    return 0;',
    '  }',
    '  function prebarvi(vyber, trida, zapnout) {',
    '    var vsechny = document.querySelectorAll(vyber);',
    '    for (var i = 0; i < vsechny.length; i++) {',
    '      if (zapnout) vsechny[i].classList.add(trida); else vsechny[i].classList.remove(trida);',
    '    }',
    '  }',
    '  function oznac(el, trida, zapnout) {',
    '    if (!el || !el.classList) return;',
    '    if (zapnout) el.classList.add(trida); else el.classList.remove(trida);',
    '  }',
    '  function zhasni() { oznac(cilEl, "cw-cil", false); cilEl = null; }',
    '  document.addEventListener("mouseover", function (e) {',
    '    if (!rezim) return;',
    '    if (!radek(e.target)) return;',
    '    if (pod && pod !== e.target) pod.classList.remove("cw-prejety");',
    '    e.target.classList.add("cw-prejety");',
    '    pod = e.target;',
    '  }, true);',
    '  document.addEventListener("mouseout", function (e) {',
    '    if (e.target.classList) e.target.classList.remove("cw-prejety");',
    '    if (pod === e.target) pod = null;',
    '  }, true);',
    '  document.addEventListener("click", function (e) {',
    '    if (!rezim) return;',
    '    var r = radek(e.target);',
    '    if (!r) return;',
    '    e.preventDefault();',
    '    e.stopPropagation();',
    '    prebarvi(".cw-vybrany", "cw-vybrany", false);',
    '    e.target.classList.add("cw-vybrany");',
    '    try { parent.postMessage({ cw: "vyber", radek: r }, "*"); } catch (chyba) {}',
    '  }, true);',
    '  document.addEventListener("keydown", function (e) {',
    '    if (!rezim) return;',
    '    if (e.key !== "Escape") return;',
    '    prebarvi(".cw-vybrany", "cw-vybrany", false);',
    '    try { parent.postMessage({ cw: "zrus" }, "*"); } catch (chyba) {}',
    '  }, true);',
    '  function cilPod(x, y) {',
    '    var el = document.elementFromPoint(x, y);',
    '    var r = radek(el);',
    '    var nad = true;',
    '    if (el && el.getBoundingClientRect) {',
    '      var b = el.getBoundingClientRect();',
    '      nad = (y < b.top + b.height / 2);',
    '    }',
    '    return { el: el, radek: r, nad: nad };',
    '  }',
    '  document.addEventListener("dragover", function (e) {',
    '    e.preventDefault();',
    '    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";',
    '    var c = cilPod(e.clientX, e.clientY);',
    '    if (cilEl && cilEl !== c.el) oznac(cilEl, "cw-cil", false);',
    '    cilEl = c.el;',
    '    oznac(cilEl, "cw-cil", true);',
    '  }, true);',
    '  document.addEventListener("dragleave", function () { zhasni(); }, true);',
    '  document.addEventListener("drop", function (e) {',
    '    e.preventDefault();',
    '    var c = cilPod(e.clientX, e.clientY);',
    '    zhasni();',
    '    try { parent.postMessage({ cw: "vloz", radek: c.radek, nad: c.nad }, "*"); } catch (chyba) {}',
    '  }, true);',
    '  window.addEventListener("message", function (e) {',
    '    var d = e.data;',
    '    if (!d || !d.cw) return;',
    '    if (d.cw === "rezim") {',
    '      rezim = !!d.upravy;',
    '      if (!rezim) { prebarvi(".cw-vybrany", "cw-vybrany", false); zhasni(); }',
    '    }',
    '    if (d.cw === "konec-tahu") zhasni();',
    '  });',
    '})();'
  ].join('\n');

  function vlozPomocnika(html) {
    const skript = '<script>' + POMOCNIK + '<\/script>';
    const i = html.lastIndexOf('</body>');
    if (i < 0) return html + skript;
    return html.slice(0, i) + skript + html.slice(i);
  }

  // ---------------------------------------------------------------- prace s kusy kodu
  // Rozdeleni kodu na kusy dela paleta bloku - je to stejne pravidlo pro obe casti.
  function kusy() {
    if (typeof Bloky === 'undefined' || !Bloky.rozdel) return [];
    return Bloky.rozdel(Editor.ziskej());
  }

  function najdi() {
    if (!vybranyRadek) return null;
    const seznam = kusy();
    for (let i = 0; i < seznam.length; i++) {
      const k = seznam[i];
      const pocet = k.radky ? k.radky.length : 1;
      if (vybranyRadek >= k.radek && vybranyRadek <= k.radek + pocet - 1) {
        return { seznam: seznam, i: i, kus: k };
      }
    }
    return null;
  }

  function popisKusu(k) {
    const prvni = String(k.radky[0] || '').trim();
    const kratky = prvni.length > 46 ? prvni.slice(0, 46) + '...' : prvni;
    const pocet = k.radky.length;
    return 'Radek ' + k.radek + ': ' + kratky + (pocet > 1 ? '  (' + pocet + ' radku)' : '');
  }

  function aktualizujListu() {
    const n = najdi();
    if (!n) {
      lista.setAttribute('hidden', '');
      popis.textContent = '';
      return;
    }
    lista.removeAttribute('hidden');
    popis.textContent = popisKusu(n.kus);
  }

  // Zmeneny kod zapise do editoru a hned necha prekreslit nahled.
  function zapis(seznam) {
    const radky = [];
    for (let i = 0; i < seznam.length; i++) {
      const r = seznam[i].radky;
      for (let k = 0; k < r.length; k++) radky.push(r[k]);
    }
    Editor.nastav(radky.join('\n'));
    const ta = $('kod');
    if (ta) ta.dispatchEvent(new Event('input', { bubbles: true }));
    if (window.CeskyWeb && window.CeskyWeb.spustit) window.CeskyWeb.spustit();
  }

  function posun(smer) {
    const n = najdi();
    if (!n) return;
    const j = n.i + smer;
    if (j < 0 || j >= n.seznam.length) return;
    const t = n.seznam[n.i];
    n.seznam[n.i] = n.seznam[j];
    n.seznam[j] = t;
    zapis(n.seznam);
    // Radky se posunuly, tak si precteme cerstve a oznacime presunuty blok.
    const nove = kusy();
    vybranyRadek = nove[j] ? nove[j].radek : null;
    aktualizujListu();
  }

  function smazat() {
    const n = najdi();
    if (!n) return;
    n.seznam.splice(n.i, 1);
    vybranyRadek = null;
    zapis(n.seznam);
    aktualizujListu();
  }

  function prepsat() {
    const n = najdi();
    if (!n) return;
    const vzor = /^(\s*(?:nadpis|podnadpis|text|polozka|moznost|kapitola)\s+(?:#[A-Za-z0-9_-]+\s+)?)([\s\S]*)$/;
    const m = vzor.exec(n.kus.radky[0]);
    if (!m) {
      popis.textContent = 'Tenhle blok nema text, ktery by se dal prepsat. Pouzij tlacitka Nahoru a Dolu.';
      return;
    }
    const novy = window.prompt('Novy text:', m[2]);
    if (novy === null) return;
    n.kus.radky[0] = m[1] + novy;
    zapis(n.seznam);
    vybranyRadek = n.kus.radek;
    aktualizujListu();
  }

  // ---------------------------------------------------------------- ovladani
  function prepni() {
    zapnuto = !zapnuto;
    vybranyRadek = null;
    btn.textContent = zapnuto ? 'Ukoncit upravy' : 'Upravit v nahledu';
    if (zapnuto) btn.classList.add('zapnuty');
    else btn.classList.remove('zapnuty');
    aktualizujListu();
    if (window.CeskyWeb && window.CeskyWeb.spustit) window.CeskyWeb.spustit();
    posliRezim();
  }

  window.addEventListener('message', function (e) {
    if (e.source !== nahlad.contentWindow) return;
    const d = e.data;
    if (!d || !d.cw) return;
    if (d.cw === 'zrus') { vybranyRadek = null; aktualizujListu(); return; }
    if (d.cw === 'vyber') { vybranyRadek = Number(d.radek) || null; aktualizujListu(); }
  });

  // Po kazdem prekresleni nahledu se rezim posle znovu.
  nahlad.addEventListener('load', posliRezim);

  btn.addEventListener('click', prepni);
  const bNahoru = $('upravy-nahoru');
  const bDolu = $('upravy-dolu');
  const bText = $('upravy-text');
  const bSmazat = $('upravy-smazat');
  if (bNahoru) bNahoru.addEventListener('click', function () { posun(-1); });
  if (bDolu) bDolu.addEventListener('click', function () { posun(1); });
  if (bText) bText.addEventListener('click', prepsat);
  if (bSmazat) bSmazat.addEventListener('click', smazat);

  return {
    zapnuto: zapnutoFn,
    vlozPomocnika: vlozPomocnika
  };
})();
