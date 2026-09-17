// blocks.js - paleta bloku: nakreslene dlazdice, ktere se tahaji do nahledu.
// Kod je porad hlavni zdroj. Kazde vlozeni se hned zapise do kodu, takze
// stazeny web vypada stejne jako nahled. Soubor je samostatny: kdyz se
// nepodari nacist, zbytek editoru funguje dal.

const Bloky = (function () {
  'use strict';

  const $ = function (id) { return document.getElementById(id); };

  const btn = $('btn-bloky');
  const panel = $('bloky');
  const paleta = $('bloky-paleta');
  const nahlad = $('nahlad');

  if (!btn || !panel || !paleta) {
    return {
      obnov: function () {},
      otevri: function () {},
      zavri: function () {},
      rozdel: function () { return []; }
    };
  }

  // Prikazy, ktere oteviraji blok ukonceny prikazem konec.
  const OTEVRACI = [
    'akce', 'kdyz', 'karta', 'blok', 'seznam', 'vyber',
    'krat', 'dokud', 'pro-kazdou', 'komponenta', 'podstranka'
  ];
  // Bloky, ve kterych je cizi jazyk - v nich se prikazy nehledaji.
  const SYROVE = ['javascript', 'html', 'css'];

  // Lidske nazvy dlazdic.
  const NAZVY = {
    stranka: 'Nazev stranky', vzhled: 'Vzhled', 'barva-pozadi': 'Barva pozadi',
    'barva-textu': 'Barva textu', zarovnani: 'Zarovnani', font: 'Velikost pisma',
    nadpis: 'Nadpis', podnadpis: 'Podnadpis', text: 'Odstavec', pridej: 'Odstavec s hodnotou',
    tlacitko: 'Tlacitko', odkaz: 'Odkaz', obrazek: 'Obrazek', vstup: 'Policko',
    cislo: 'Policko pro cislo', zaskrtavatko: 'Zaskrtavatko', vyber: 'Rozbalovaci seznam',
    moznost: 'Volba v seznamu', mezera: 'Mezera', platno: 'Kreslici platno',
    oddelovac: 'Oddelovac', karta: 'Karta', blok: 'Blok', seznam: 'Seznam',
    polozka: 'Odrazka', konec: 'Konec', komponenta: 'Komponenta', vloz: 'Vlozit dil',
    podstranka: 'Podstranka', menu: 'Menu', 'jdi-na': 'Prechod na stranku',
    akce: 'Akce', kdyz: 'Podminka', jinak: 'Jinak', promenna: 'Promenna',
    nastav: 'Nastavit', 'pridej-do': 'Pridat k textu', skryj: 'Skryt', zobraz: 'Zobrazit',
    obarvi: 'Barva textu', okno: 'Hlaska', prejdi: 'Prejit na adresu', posun: 'Posunout',
    velikost: 'Sirka prvku', zapis: 'Ulozit do prohlizece', nacti: 'Nacist z prohlizece',
    opakuj: 'Opakovat v case', klavesa: 'Po stisku klavesy',
    'pri-stisku': 'Po klepnuti', 'pri-najeti': 'Po najeti', 'pri-zmene': 'Po zmene',
    smaz: 'Smazat prvek', pozadi: 'Barva prvku', ohranic: 'Ramecek', zaobli: 'Zakulaceni',
    pruhlednost: 'Pruhlednost', otoc: 'Otoceni', cekej: 'Cekani', prehraj: 'Zvuk',
    vycisti: 'Vycistit platno', obdelnik: 'Obdelnik', kruh: 'Kruh', cara: 'Cara',
    'text-platno': 'Text na platno', 'barva-platna': 'Barva kresleni', tloustka: 'Tloustka cary',
    krat: 'Opakovat', dokud: 'Opakovat dokud', 'pro-kazdou': 'Pro kazdou hodnotu',
    prerus: 'Prerusit cyklus', pokracuj: 'Preskocit opakovani',
    'pridej-do-pole': 'Pridat do seznamu', 'vycisti-pole': 'Vycistit seznam',
    serad: 'Seradit seznam', odstran: 'Odstranit ze seznamu',
    komentar: 'Poznamka', javascript: 'Vlastni JavaScript', html: 'Vlastni HTML', css: 'Vlastni CSS'
  };

  // Nakreslene ukazky. Klic je nazev prikazu, hodnota je hotove HTML ukazky.
  // Diky tomu clovek vidi, jak blok vypada, a nemusi si ho predstavovat.
  const VZORKY = {
    nadpis: '<span class="vz-nadpis">Nadpis</span>',
    podnadpis: '<span class="vz-podnadpis">Podnadpis</span>',
    text: '<span class="vz-text">Odstavec textu, ktery se zalamuje.</span>',
    pridej: '<span class="vz-text">Hodnota: <b>42</b></span>',
    tlacitko: '<span class="vz-tlacitko">Tlacitko</span>',
    odkaz: '<span class="vz-odkaz">Odkaz</span>',
    obrazek: '<span class="vz-obrazek"></span>',
    vstup: '<span class="vz-pole">Text...</span>',
    cislo: '<span class="vz-pole">123</span>',
    zaskrtavatko: '<span class="vz-volba"><i></i>Souhlasim</span>',
    vyber: '<span class="vz-pole vz-sipka">Vyber</span>',
    seznam: '<span class="vz-seznam"><i></i><i></i><i></i></span>',
    karta: '<span class="vz-karta"></span>',
    blok: '<span class="vz-blok"></span>',
    platno: '<span class="vz-platno"></span>',
    menu: '<span class="vz-menu"><i></i><i></i><i></i></span>',
    podstranka: '<span class="vz-zalozka"></span>',
    oddelovac: '<span class="vz-linka"></span>',
    mezera: '<span class="vz-mezera"></span>',
    javascript: '<span class="vz-kod">JS</span>',
    html: '<span class="vz-kod">HTML</span>',
    css: '<span class="vz-kod">CSS</span>',
    komponenta: '<span class="vz-kod">Dil</span>',
    vloz: '<span class="vz-kod">Vlozit</span>',
    akce: '<span class="vz-kod">Akce</span>',
    kdyz: '<span class="vz-kod">Kdyz</span>',
    jinak: '<span class="vz-kod">Jinak</span>',
    krat: '<span class="vz-kod">5x</span>',
    dokud: '<span class="vz-kod">Dokud</span>',
    'pro-kazdou': '<span class="vz-kod">Pro kazdou</span>',
    promenna: '<span class="vz-kod">$x = 1</span>',
    nastav: '<span class="vz-kod">Nastavit</span>',
    'pridej-do': '<span class="vz-kod">Pridat</span>',
    obarvi: '<span class="vz-kod">Barva</span>',
    skryj: '<span class="vz-kod">Skryt</span>',
    zobraz: '<span class="vz-kod">Zobrazit</span>',
    okno: '<span class="vz-kod">Hlaska</span>',
    zapis: '<span class="vz-kod">Ulozit</span>',
    nacti: '<span class="vz-kod">Nacist</span>',
    cekej: '<span class="vz-kod">Cekat</span>',
    prehraj: '<span class="vz-kod">Zvuk</span>',
    klavesa: '<span class="vz-kod">Klavesa</span>',
    stranka: '<span class="vz-kod">Nazev</span>',
    vzhled: '<span class="vz-kod">Vzhled</span>',
    konec: '<span class="vz-kod">Konec</span>',
    'jdi-na': '<span class="vz-zalozka"></span>'
  };

  const DLAZDICE = [];
  let kusy = [];
  let tahany = null;

  function esc(s) {
    const A = String.fromCharCode(38);
    return String(s).replace(/&/g, A + 'amp;').replace(/</g, A + 'lt;').replace(/>/g, A + 'gt;');
  }

  function prvniSlovo(radek) {
    return (String(radek).trim().split(/\s+/)[0] || '').toLowerCase();
  }

  function maTridu(el, trida) {
    return !!(el && el.classList && el.classList.contains(trida));
  }

  function nejblizsi(cil, trida, zastav) {
    let c = cil;
    while (c && c !== zastav) {
      if (maTridu(c, trida)) return c;
      c = c.parentNode;
    }
    return null;
  }

  // ------------------------------------------------------------------ deleni kodu
  // Rozdeli kod na nejvyssi kusy. Kazdy kus je samostatny blok.
  // radek = skutecne cislo prvniho radku kusu v editoru (vcetne prazdnych radku).
  // Podle nej se hleda kus, na ktery clovek klikl nebo pretahl v nahledu.
  function rozdel(kod) {
    const radky = String(kod == null ? '' : kod).split('\n');
    const vysledek = [];
    let i = 0;
    while (i < radky.length) {
      if (radky[i].trim() === '') { i++; continue; }
      const kus = { radky: [radky[i]], radek: i + 1 };
      const slovo = prvniSlovo(radky[i]);
      i++;
      if (OTEVRACI.indexOf(slovo) >= 0 || SYROVE.indexOf(slovo) >= 0) {
        const syrovy = SYROVE.indexOf(slovo) >= 0;
        let hloubka = 1;
        while (i < radky.length && hloubka > 0) {
          const r = radky[i];
          kus.radky.push(r);
          i++;
          if (syrovy) {
            if (r.trim().toLowerCase() === 'konec') hloubka = 0;
          } else {
            const s = prvniSlovo(r);
            if (r.trim().toLowerCase() === 'konec') hloubka--;
            else if (s !== 'jinak' && (OTEVRACI.indexOf(s) >= 0 || SYROVE.indexOf(s) >= 0)) hloubka++;
          }
        }
      }
      vysledek.push(kus);
    }
    return vysledek;
  }

  function sestav(noveKusy) {
    const dily = [];
    for (let i = 0; i < noveKusy.length; i++) dily.push(noveKusy[i].radky.join('\n'));
    return dily.join('\n');
  }

  function delkaKusu(kus) {
    return kus.radky.join('\n').length;
  }

  // ------------------------------------------------------------------ zapis do editoru
  function zapis(noveKusy) {
    kusy = noveKusy;
    Editor.nastav(sestav(noveKusy));
    const ta = $('kod');
    if (ta) ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // Presune kurzor do daneho kusu. Kdyz je zadano odKonce, postavi ho dovnitr bloku.
  function skocNaKus(i, odKonce) {
    const ta = $('kod');
    if (!ta || i < 0 || i >= kusy.length) return;
    let poz = 0;
    let radek = 0;
    for (let k = 0; k < i; k++) { poz += delkaKusu(kusy[k]) + 1; radek += kusy[k].radky.length; }
    const delka = delkaKusu(kusy[i]);
    let od = poz;
    let kon = poz + delka;
    if (typeof odKonce === 'number') {
      const cil = poz + delka - odKonce;
      od = kon = Math.min(Math.max(cil, poz), kon);
    }
    ta.focus();
    ta.setSelectionRange(od, kon);
    const lh = parseFloat(window.getComputedStyle(ta).lineHeight);
    const vyska = isNaN(lh) ? 22 : lh;
    ta.scrollTop = Math.max(0, radek * vyska - ta.clientHeight / 3);
    const pre = $('zvyrazneni');
    if (pre) pre.scrollTop = ta.scrollTop;
  }

  function oznamZmenu() {
    if (window.CeskyWeb && window.CeskyWeb.spustit) window.CeskyWeb.spustit();
  }

  // ------------------------------------------------------------------ paleta
  function vzorekPro(p) {
    if (VZORKY[p.klic]) return VZORKY[p.klic];
    return '<span class="vz-kod">' + esc(p.klic) + '</span>';
  }

  function vykresliPaletu() {
    if (typeof NAPOVEDA === 'undefined' || !NAPOVEDA.prikazy) return;
    if (DLAZDICE.length) return;
    const skupiny = [];
    NAPOVEDA.prikazy.forEach(function (p) {
      if (p.skupina === 'Funkce') return;
      if (skupiny.indexOf(p.skupina) < 0) skupiny.push(p.skupina);
    });
    let html = '';
    skupiny.forEach(function (s) {
      html += '<div class="paleta-skupina">' + esc(s) + '</div><div class="paleta-rada">';
      NAPOVEDA.prikazy.forEach(function (p) {
        if (p.skupina !== s || p.skupina === 'Funkce') return;
        const nazev = NAZVY[p.klic] || p.klic;
        html += '<div class="paleta-dlazdice" draggable="true" data-klic="' + esc(p.klic) +
          '" title="' + esc(p.popis + ' - pretahni do nahledu') + '">' +
          '<span class="vzorek">' + vzorekPro(p) + '</span>' +
          '<span class="paleta-nazev">' + esc(nazev) + '</span>' +
          '</div>';
        DLAZDICE.push({ klic: p.klic, vlozit: p.vlozit || p.klic, odKonce: p.odKonce || 0 });
      });
      html += '</div>';
    });
    paleta.innerHTML = html;
  }

  function najdiDlazdici(klic) {
    if (!klic) return null;
    for (let i = 0; i < DLAZDICE.length; i++) if (DLAZDICE[i].klic === klic) return DLAZDICE[i];
    return null;
  }

  // ------------------------------------------------------------------ vkladani do kodu
  // Vlozi blok tak, aby v kodu skoncil na miste, kam clovek v nahledu ukazal.
  function vlozNa(radekCil, nad) {
    const dlazdice = najdiDlazdici(tahany);
    if (!dlazdice) return;
    const nove = rozdel(dlazdice.vlozit);
    if (!nove.length) return;
    const sez = rozdel(Editor.ziskej());
    let na = sez.length;
    if (radekCil) {
      for (let i = 0; i < sez.length; i++) {
        const k = sez[i];
        const pocet = k.radky.length;
        if (radekCil >= k.radek && radekCil <= k.radek + pocet - 1) { na = nad ? i : i + 1; break; }
      }
    }
    const spojene = sez.slice(0, na).concat(nove, sez.slice(na));
    zapis(spojene);
    skocNaKus(na, dlazdice.odKonce);
    oznamZmenu();
    tahany = null;
  }

  // Klepnuti na dlazdici vlozi blok na konec stranky.
  function vlozNaKonec(klic) {
    const dlazdice = najdiDlazdici(klic);
    if (!dlazdice) return;
    const nove = rozdel(dlazdice.vlozit);
    if (!nove.length) return;
    const sez = rozdel(Editor.ziskej());
    const spojene = sez.concat(nove);
    zapis(spojene);
    skocNaKus(sez.length, dlazdice.odKonce);
    oznamZmenu();
  }

  // ------------------------------------------------------------------ tazeni do nahledu
  // Pouziva se nativni tazeni prohlizece, protoze jen to umi prenest blok
  // z ramecku editoru do ramecku s nahledem. Ktery blok tahame, si drzime
  // tady; nahled posle zpatky jen to, kam blok spadl.
  function posli(zprava) {
    if (!nahlad || !nahlad.contentWindow) return;
    try { nahlad.contentWindow.postMessage(zprava, '*'); } catch (e) { /* bez nahledu neni kam poslat */ }
  }

  paleta.addEventListener('dragstart', function (e) {
    const d = nejblizsi(e.target, 'paleta-dlazdice', paleta);
    if (!d) return;
    tahany = d.getAttribute('data-klic');
    d.classList.add('tahne');
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copy';
      try { e.dataTransfer.setData('text/plain', tahany); } catch (ch) { /* nektere prohlizece maji data zamcena */ }
    }
    posli({ cw: 'tahni' });
  });

  paleta.addEventListener('dragend', function (e) {
    const d = nejblizsi(e.target, 'paleta-dlazdice', paleta);
    if (d) d.classList.remove('tahne');
    tahany = null;
    posli({ cw: 'konec-tahu' });
  });

  // Kdyz tahame blok z palety, nesmi se omylem vlozit do kodu. Drop mimo
  // ramecek s nahledem proto zrusime - textarea by si jinak vzala text a
  // vlozila do kodu nazev prikazu. Do dropu v nahledu tento kod nesaha:
  // ramecek ma vlastni dokument a svuj vlastni prijem.
  document.addEventListener('drop', function (e) {
    if (!tahany) return;
    e.preventDefault();
    e.stopPropagation();
    tahany = null;
    posli({ cw: 'konec-tahu' });
  }, true);

  // Klepnuti na dlazdici vlozi blok na konec. Tazeni ho vlozi do nahledu.
  paleta.addEventListener('click', function (e) {
    const d = nejblizsi(e.target, 'paleta-dlazdice', paleta);
    if (!d) return;
    vlozNaKonec(d.getAttribute('data-klic'));
  });

  // Nahled posle zpatky, kam blok spadl. e.source overuje, ze zprava prisla
  // prave z naseho nahledu a ne odjinud.
  window.addEventListener('message', function (e) {
    if (!nahlad || e.source !== nahlad.contentWindow) return;
    const d = e.data;
    if (!d || d.cw !== 'vloz') return;
    vlozNa(Number(d.radek) || 0, !!d.nad);
  });

  // ------------------------------------------------------------------ otevirani panelu
  function zavriJine() {
    const nap = $('napoveda');
    if (nap && !nap.hasAttribute('hidden')) {
      nap.setAttribute('hidden', '');
      const bn = $('btn-napoveda');
      if (bn) bn.textContent = 'Napoveda';
    }
    const ai = $('ai');
    if (ai && !ai.hasAttribute('hidden')) {
      ai.setAttribute('hidden', '');
      const ba = $('btn-ai');
      if (ba) ba.textContent = 'AI';
    }
  }

  function otevri() {
    zavriJine();
    panel.removeAttribute('hidden');
    const main = document.querySelector('main');
    if (main) main.classList.add('s-panelem');
    btn.textContent = 'Zavrit bloky';
    vykresliPaletu();
  }

  function zavri() {
    panel.setAttribute('hidden', '');
    const main = document.querySelector('main');
    if (main) main.classList.remove('s-panelem');
    btn.textContent = 'Bloky';
  }

  btn.addEventListener('click', function () {
    if (panel.hasAttribute('hidden')) otevri();
    else zavri();
  });

  const zavritko = $('zavrit-bloky');
  if (zavritko) {
    zavritko.addEventListener('click', function () {
      if (panel.hasAttribute('hidden')) return;
      zavri();
    });
  }

  // Paleta se plni jednou pri startu, aby byla pripravena, i kdyz panel jeste neni otevren.
  vykresliPaletu();

  return {
    obnov: vykresliPaletu,
    otevri: otevri,
    zavri: zavri,
    rozdel: rozdel
  };
})();
