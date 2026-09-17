// app.js - ovladani cele aplikace: spousteni, nahled, ukladani, export do ZIP
(function () {
  'use strict';

  const KLIC_KOD = 'ceskyweb.kod';

  const $ = function (id) { return document.getElementById(id); };
  const btnNovy = $('btn-novy');
  const btnZip = $('btn-zip');
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
    '// Zde pises svuj web. Tlacitkem Napoveda najdes vsechny prikazy.',
    '',
    'stranka "Muj web"'
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
    if (chyb) {
      html = '<div class="uvod">Tyto bloky se vynechaly, zbytek stranky funguje:</div>' + html;
    }
    hlasky.innerHTML = html;
    hlasky.className = chyb ? 'hlasky chyba' : 'hlasky';
    return chyb === 0;
  }

  // ------------------------------------------------------------------ spousteni
  // Kazdy blok kodu je samostatny. Kdyz se jeden nepovede, prekladac ho vynecha
  // a zbytek stranky se vykresli normalne.
  function spustit() {
    const vysledek = PREKLADAC.preved(Editor.ziskej());
    const bezChyb = ukazChyby(vysledek.chyby);
    let html = vysledek.html;
    // Pomocny skript se do nahledu vklada vzdy - obstarava vyber prvku i
    // prijimani bloku z palety. Do stazeneho webu se nedostane: stahuje se
    // porad jen cisty vysledek prekladace.
    if (typeof NahladEdit !== 'undefined' && NahladEdit.vlozPomocnika) {
      html = NahladEdit.vlozPomocnika(html);
    }
    nahlad.srcdoc = html;
    nastavStav(bezChyb ? 'v poradku' : 'nektere bloky vynechany', !bezChyb);
    return bezChyb;
  }

  // ------------------------------------------------------------------ ukladani
  function uloz() {
    try {
      window.localStorage.setItem(KLIC_KOD, Editor.ziskej());
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
    // Stahuje se vzdy. Chybne bloky jsou ve stazenem webu proste vynechane.
    const bezChyb = ukazChyby(vysledek.chyby);
    const soubory = [
      { nazev: 'index.html', obsah: vysledek.html },
      { nazev: 'zdroj.cesky', obsah: Editor.ziskej() },
      { nazev: 'navod.txt', obsah: NAVOD }
    ];
    ZIP.stahni(ZIP.vytvor(soubory), 'web.zip');
    nastavStav(bezChyb ? 'ZIP je stazeny' : 'ZIP je stazeny, nektere bloky chybi', !bezChyb);
  }

  // ------------------------------------------------------------------ napoveda
  function vykresliNapovedu() {
    if (typeof NAPOVEDA === 'undefined') return;
    let html = '<div class="napoveda-obsah">';
    html += '<h3>Jak psat</h3>';
    html += '<p>Stiskni nahore <code>Novy kod</code> - editor se vymaze a zacnes psat vlastni stranku od nuly.</p>';
    html += '<p>Vlastni kod vlozis prikazy <code>javascript</code>, <code>html</code> a <code>css</code>. ' +
      'Vsechno mezi nim a prikazem <code>konec</code> se vlozi do stranky presne tak, jak to napises - ' +
      'muzes vlozit i cely hotovy JavaScript. Kazdy blok je samostatny, takze kdyz jeden selze, ostatni jedou dal. ' +
      'Prvek <code>#jmeno</code> ma ve vysledne strance <code>id="cw-jmeno"</code>, takze na nej vlastni ' +
      'JavaScript dosahne pres <code>document.getElementById("cw-jmeno")</code>.</p>';
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
    // Napoveda ma vlastni hlavicku s krizkem, obsah se plni do jejiho tela.
    const teloNapovedy = document.getElementById('napoveda-obsah');
    if (teloNapovedy) teloNapovedy.innerHTML = html;
    else napoveda.innerHTML = html;
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
      const blokyPanel = document.getElementById('bloky');
      if (blokyPanel && !blokyPanel.hasAttribute('hidden')) {
        blokyPanel.setAttribute('hidden', '');
        const btnBloky = document.getElementById('btn-bloky');
        if (btnBloky) btnBloky.textContent = 'Bloky';
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
  btnZip.addEventListener('click', stahniZip);
  btnNapoveda.addEventListener('click', prepniNapovedu);

  // Krizek v panelu udela to same jako kliknuti na prislusne tlacitko v horni liste.
  function napojZavrit(idTlacitka, idPanelu, idPrepinace) {
    const tl = document.getElementById(idTlacitka);
    if (!tl) return;
    tl.addEventListener('click', function () {
      const panel = document.getElementById(idPanelu);
      if (panel && panel.hasAttribute('hidden')) return;
      const btn = document.getElementById(idPrepinace);
      if (btn) btn.click();
    });
  }
  napojZavrit('zavrit-napoveda', 'napoveda', 'btn-napoveda');
  napojZavrit('zavrit-ai', 'ai', 'btn-ai');
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
    spustit();
    uloz();
    nastavStav('prazdna stranka', false);
  }

  btnNovy.addEventListener('click', function () {
    const ted = Editor.ziskej();
    if (ted && ted !== PRAZDNY_KOD && !window.confirm('Vymazat kod a zacit od nuly?')) return;
    zacniPrazdno();
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
  // Zadne ukazky ani sablony. Vzdy se zacina cistym kodem.
  const ulozenyKod = nacti();
  if (ulozenyKod && ulozenyKod.length) Editor.nastav(ulozenyKod);
  else Editor.nastav(PRAZDNY_KOD);

  vykresliNapovedu();
  spustit();

  // Ostatni casti programu potrebuji vedet, kdy prekreslit nahled.
  window.CeskyWeb = { spustit: spustit, uloz: uloz };
})();
