// app.js - ovladani cele aplikace: spousteni, nahled, ukladani, export do ZIP
(function () {
  'use strict';

  const KLIC_KOD = 'ceskyweb.kod';
  const KLIC_PRIKLAD = 'ceskyweb.priklad';

  const $ = function (id) { return document.getElementById(id); };
  const vyberPrikladu = $('vyber-prikladu');
  const btnNovy = $('btn-novy');
  const btnSpustit = $('btn-spustit');
  const btnZip = $('btn-zip');
  const btnUlozit = $('btn-ulozit');
  const btnNahrat = $('btn-nahrat');
  const vstupSoubor = $('vstup-soubor');
  const btnNapoveda = $('btn-napoveda');
  const nahlad = $('nahlad');
  const hlasky = $('hlasky');
  const stav = $('stav');
  const napoveda = $('napoveda');
  const main = document.querySelector('main');

  const NAVOD = [
    'HOTOVY WEB Z CESKYWEB',
    '',
    '1. Soubor index.html je cela tvoje stranka. Nic dalsiho nepotrebuje.',
    '2. Nahraj ho na hosting: na FTP pretahni index.html do slozky www nebo public_html.',
    '   Funguje to i na Netlify, Vercel, GitHub Pages - staci pretahnout soubor.',
    '3. Nebo ho jen otevri dvojklikem v prohlizeci. Funguje take bez internetu.',
    '',
    'Soubor zdroj.cesky je tva puvodni zapis v jazyce CeskyWeb.',
    'Muzes ho nahrat zpet do editoru a pokracovat v praci.',
    '',
    'Preji hodne zabavy!'
  ].join('\n');

  // Prazdna stranka - pro zacatek od nuly, bez ukazkoveho programu.
  const PRAZDNY_KOD = [
    '// Tady pises svuj vlastni web.',
    '// Radky zacinajici // jsou jen poznamky pro tebe.',
    '// Tlacitkem Napoveda vpravo nahore najdes vsechny prikazy.',
    '',
    'stranka "Muj web"',
    'vzhled svetly',
    '',
    'nadpis Muj web',
    'text Tady zacni psat.'
  ].join('\n');

  function esc(s) {
    const A = String.fromCharCode(38);
    return String(s).replace(/&/g, A + 'amp;').replace(/</g, A + 'lt;').replace(/>/g, A + 'gt;');
  }

  // ------------------------------------------------------------------ stav a hlasky
  function nastavStav(text, jeChyba) {
    stav.textContent = text;
    stav.className = jeChyba ? 'stav chyba' : 'stav';
  }

  function ukazChyby(chyby) {
    if (!chyby || !chyby.length) {
      hlasky.className = 'hlasky';
      hlasky.textContent = 'Zadne chyby. Stranka je hotova a muzes ji stahnout.';
      return true;
    }
    let chyb = 0;
    let html = '';
    chyby.forEach(function (c) {
      const varovani = c.vaznost === 'varovani';
      if (!varovani) chyb++;
      html += '<div class="' + (varovani ? 'varovani' : '') + '">' +
        '<span class="cislo">Radek ' + c.radek + ':</span> ' + esc(c.text) + '</div>';
    });
    hlasky.innerHTML = html;
    hlasky.className = chyb ? 'hlasky chyba' : 'hlasky';
    return chyb === 0;
  }

  // ------------------------------------------------------------------ spousteni
  function spustit() {
    const vysledek = PREKLADAC.preved(Editor.ziskej());
    if (!ukazChyby(vysledek.chyby)) {
      nastavStav('chyba v kodu', true);
      return false;
    }
    nahlad.srcdoc = vysledek.html;
    nastavStav('v poradku', false);
    return true;
  }

  // ------------------------------------------------------------------ ukladani
  function uloz() {
    try {
      window.localStorage.setItem(KLIC_KOD, Editor.ziskej());
      window.localStorage.setItem(KLIC_PRIKLAD, vyberPrikladu.value);
    } catch (e) {
      /* prohlizec muze ukladani blokovat - kod pak zustane jen v okne */
    }
  }

  function nacti() {
    try {
      return window.localStorage.getItem(KLIC_KOD);
    } catch (e) {
      return null;
    }
  }

  // ------------------------------------------------------------------ export do ZIP
  function stahniZip() {
    const vysledek = PREKLADAC.preved(Editor.ziskej());
    if (!ukazChyby(vysledek.chyby)) {
      nastavStav('chyba v kodu', true);
      return;
    }
    const soubory = [
      { nazev: 'index.html', obsah: vysledek.html },
      { nazev: 'zdroj.cesky', obsah: Editor.ziskej() },
      { nazev: 'navod.txt', obsah: NAVOD }
    ];
    ZIP.stahni(ZIP.vytvor(soubory), 'web.zip');
    nastavStav('ZIP je stazeny', false);
  }

  // ------------------------------------------------------------------ napoveda
  function vykresliNapovedu() {
    if (typeof NAPOVEDA === 'undefined') return;
    let html = '<div class="napoveda-obsah">';
    html += '<h3>Jak psat</h3>';
    html += '<p>Chces zacit od nuly? Stiskni nahore <code>Novy kod</code> - editor se vymaze ' +
      'a pises vlastni stranku. Ukazkove programy mas v rozbalovacim seznamu vlevo.</p>';
    html += '<p>Kazdy radek zacina prikazem. U nazvu, textu a odrazek uvozovky psat nemusis. ' +
      'Znak <code>#</code> znamena prvek na strance, <code>$</code> je promenna.</p>';
    html += '<p>Jak pises, naseptavac se sam nabizi - prikazy, barvy i hodnoty. ' +
      'Sipkami nahoru a dolu vyber, <code>Enter</code> nebo <code>Tab</code> vlozi, ' +
      '<code>Escape</code> zavre. Rucne ho vyvolas pres <code>Ctrl+Space</code>.</p>';

    const skupiny = [];
    NAPOVEDA.prikazy.forEach(function (p) {
      if (skupiny.indexOf(p.skupina) < 0) skupiny.push(p.skupina);
    });
    skupiny.forEach(function (skupina) {
      html += '<h3>' + esc(skupina) + '</h3><table>';
      NAPOVEDA.prikazy.forEach(function (p) {
        if (p.skupina !== skupina) return;
        const zapis = p.klic + (p.hodnoty ? ' ' + p.hodnoty.join('|') : '');
        html += '<tr><td><code>' + esc(zapis) + '</code></td><td>' + esc(p.popis) + '</td></tr>';
        html += '<tr class="ukazka"><td></td><td><code>' + esc(p.ukazka) + '</code></td></tr>';
      });
      html += '</table>';
    });

    html += '<h3>Barvy</h3><div class="barvy">';
    if (NAPOVEDA.barevnik) {
      Object.keys(NAPOVEDA.barevnik).forEach(function (b) {
        html += '<code>' + esc(b) + '</code>';
      });
    }
    html += '<code>#2f6fed</code>';
    html += '</div><p>Muzes pouzit nazev barvy nebo vlastni zapis jako <code>#ff8800</code>.</p>';

    html += '<h3>Klavesy</h3><table>' +
      '<tr><td><code>Ctrl+Enter</code></td><td>Spusti stranku</td></tr>' +
      '<tr><td><code>Ctrl+Space</code></td><td>Otevre naseptavac</td></tr>' +
      '<tr><td><code>Ctrl+S</code></td><td>Ulozi kod do prohlizece</td></tr>' +
      '<tr><td><code>sipky</code></td><td>Vyberou nabidku v naseptavaci</td></tr>' +
      '<tr><td><code>Enter</code></td><td>Vlozi vybranou nabidku</td></tr>' +
      '<tr><td><code>Escape</code></td><td>Zavre naseptavac</td></tr>' +
      '<tr><td><code>Tab</code></td><td>Vlozi nabidku, jinak odsadi radek</td></tr>' +
      '</table>';
    html += '</div>';
    napoveda.innerHTML = html;
  }

  function prepniNapovedu() {
    const jeSkryta = napoveda.hasAttribute('hidden');
    if (jeSkryta) {
      // AI panel a napoveda se nevesly vedle sebe - jeden vzdy ustoupi.
      const ai = document.getElementById('ai');
      if (ai && !ai.hasAttribute('hidden')) {
        ai.setAttribute('hidden', '');
        const btnAi = document.getElementById('btn-ai');
        if (btnAi) btnAi.textContent = 'AI';
      }
      napoveda.removeAttribute('hidden');
      main.classList.add('s-panelem');
      btnNapoveda.textContent = 'Zavrit napovedu';
    } else {
      napoveda.setAttribute('hidden', '');
      main.classList.remove('s-panelem');
      btnNapoveda.textContent = 'Napoveda';
    }
  }

  // ------------------------------------------------------------------ udalosti
  btnSpustit.addEventListener('click', spustit);
  btnZip.addEventListener('click', stahniZip);
  btnUlozit.addEventListener('click', function () {
    uloz();
    nastavStav('ulozeno', false);
  });
  btnNapoveda.addEventListener('click', prepniNapovedu);
  btnNahrat.addEventListener('click', function () { vstupSoubor.click(); });

  vstupSoubor.addEventListener('change', function () {
    const soubor = vstupSoubor.files && vstupSoubor.files[0];
    if (!soubor) return;
    const ctecka = new FileReader();
    ctecka.onload = function () {
      Editor.nastav(String(ctecka.result));
      spustit();
      uloz();
      nastavStav('soubor nacten', false);
    };
    ctecka.readAsText(soubor, 'utf-8');
    vstupSoubor.value = '';
  });

  // Naplni editor prazdnou strankou a necha cloveka psat od nuly.
  function zacniPrazdno() {
    Editor.nastav(PRAZDNY_KOD);
    vyberPrikladu.value = '';
    spustit();
    uloz();
    nastavStav('prazdna stranka', false);
  }

  btnNovy.addEventListener('click', function () {
    const ted = Editor.ziskej();
    if (ted && ted !== PRAZDNY_KOD && !window.confirm('Vymazat kod a zacit od nuly?')) return;
    zacniPrazdno();
  });

  vyberPrikladu.addEventListener('change', function () {
    const volba = vyberPrikladu.value;
    if (volba === '') { zacniPrazdno(); return; }
    const priklad = NAPOVEDA.priklady[Number(volba)];
    if (!priklad) return;
    Editor.nastav(priklad.kod);
    spustit();
    uloz();
  });

  // ------------------------------------------- prepinac Kod / Nahled (jen na mobilu)
  const prepinac = $('prepinac');
  if (prepinac && main) {
    prepinac.addEventListener('click', function (e) {
      let c = e.target;
      while (c && c !== prepinac && !(c.classList && c.classList.contains('prepinac-tl'))) c = c.parentNode;
      if (!c || c === prepinac) return;
      const cil = c.getAttribute('data-cil');
      if (!cil) return;
      main.setAttribute('data-mobil', cil);
      const tlacitka = prepinac.querySelectorAll('.prepinac-tl');
      for (let i = 0; i < tlacitka.length; i++) {
        tlacitka[i].classList.toggle('vybrany', tlacitka[i].getAttribute('data-cil') === cil);
      }
      // Pri prepnuti na nahled se stranka vzdy znovu vykresli.
      if (cil === 'nahlad') spustit();
    });
  }

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); spustit(); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); uloz(); nastavStav('ulozeno', false); }
  });

  let casovac = null;
  Editor.priZmene(function () {
    window.clearTimeout(casovac);
    casovac = window.setTimeout(function () { spustit(); uloz(); }, 800);
  });

  // ------------------------------------------------------------------ start
  const prazdnaVolba = document.createElement('option');
  prazdnaVolba.value = '';
  prazdnaVolba.textContent = 'Nova prazdna stranka';
  vyberPrikladu.appendChild(prazdnaVolba);

  if (typeof NAPOVEDA !== 'undefined' && NAPOVEDA.priklady) {
    NAPOVEDA.priklady.forEach(function (p, i) {
      const volba = document.createElement('option');
      volba.value = String(i);
      volba.textContent = p.nazev;
      vyberPrikladu.appendChild(volba);
    });
  }

  const ulozenyKod = nacti();
  if (ulozenyKod && ulozenyKod.length) {
    Editor.nastav(ulozenyKod);
    let ulozenyPriklad = '0';
    try { ulozenyPriklad = window.localStorage.getItem(KLIC_PRIKLAD) || '0'; } catch (e) { ulozenyPriklad = '0'; }
    vyberPrikladu.value = ulozenyPriklad;
  } else if (typeof NAPOVEDA !== 'undefined' && NAPOVEDA.priklady && NAPOVEDA.priklady.length) {
    Editor.nastav(NAPOVEDA.priklady[0].kod);
    vyberPrikladu.value = '0';
  }

  vykresliNapovedu();
  spustit();
})();
