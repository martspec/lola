// prekladac.js - prekladac jazyka CeskyWeb do hotoveho HTML + CSS + JavaScriptu
// Vsechno bezi v prohlizeci. Vysledkem je jediny soubor index.html,
// ktery funguje na libovolnem hostingu i po otevreni ze souboru.

const PREKLADAC = (function () {
  'use strict';

  const ZALOZNI_BARVY = {
    bila: '#ffffff', cerna: '#101418', cervena: '#e03131', modra: '#2f6fed',
    zelena: '#2f9e44', zluta: '#f2c037', oranzova: '#f08c00', fialova: '#7048e8',
    ruzova: '#e64980', seda: '#868e96', tyrkysova: '#15aabf', hnueda: '#8a5a2b'
  };
  const VZHLEDY = ['svetly', 'tmavy', 'barevny', 'minimal'];
  const ZAROVNANI = ['vlevo', 'stred', 'vpravo'];
  const FONTY = ['maly', 'normalni', 'velky'];

  const FUNKCE = {
    'delka': { min: 1, max: 1, nahrad: function (a) { return '__delka(' + a[0] + ')'; } },
    'na-cislo': { min: 1, max: 1, nahrad: function (a) { return '__cislo(' + a[0] + ')'; } },
    'zaokrouhli': { min: 1, max: 1, nahrad: function (a) { return '__zaokrouhli(' + a[0] + ')'; } },
    'nahodne': { min: 2, max: 2, nahrad: function (a) { return '__nahodne(' + a[0] + ', ' + a[1] + ')'; } },
    'minimalne': { min: 2, max: 2, nahrad: function (a) { return 'Math.min(__cislo(' + a[0] + '), __cislo(' + a[1] + '))'; } },
    'maximalne': { min: 2, max: 2, nahrad: function (a) { return 'Math.max(__cislo(' + a[0] + '), __cislo(' + a[1] + '))'; } },
    'text': { min: 1, max: 1, nahrad: function (a) { return 'String(' + a[0] + ')'; } },
    'mocnina': { min: 2, max: 2, nahrad: function (a) { return 'Math.pow(__cislo(' + a[0] + '), __cislo(' + a[1] + '))'; } },
    'prumer': { min: 2, max: 2, nahrad: function (a) { return '((__cislo(' + a[0] + ') + __cislo(' + a[1] + ')) / 2)'; } },
    'absolutne': { min: 1, max: 1, nahrad: function (a) { return 'Math.abs(__cislo(' + a[0] + '))'; } },
    'nahodne-barva': { min: 0, max: 0, nahrad: function () { return '__nahodnaBarva()'; } },
    'velka-pismena': { min: 1, max: 1, nahrad: function (a) { return 'String(' + a[0] + ').toUpperCase()'; } },
    'mala-pismena': { min: 1, max: 1, nahrad: function (a) { return 'String(' + a[0] + ').toLowerCase()'; } },
    'obsahuje': { min: 2, max: 2, nahrad: function (a) { return '(String(' + a[0] + ').indexOf(String(' + a[1] + ')) >= 0 ? 1 : 0)'; } },
    'koren': { min: 1, max: 1, nahrad: function (a) { return 'Math.sqrt(Math.abs(__cislo(' + a[0] + ')))'; } },
    'dole': { min: 1, max: 1, nahrad: function (a) { return 'Math.floor(__cislo(' + a[0] + '))'; } },
    'nahoru': { min: 1, max: 1, nahrad: function (a) { return 'Math.ceil(__cislo(' + a[0] + '))'; } },
    'zbytek': { min: 2, max: 2, nahrad: function (a) { return '(__cislo(' + a[1] + ') === 0 ? 0 : __cislo(' + a[0] + ') % __cislo(' + a[1] + '))'; } },
    'pi': { min: 0, max: 0, nahrad: function () { return 'Math.PI'; } },
    'sinus': { min: 1, max: 1, nahrad: function (a) { return 'Math.sin(__cislo(' + a[0] + '))'; } },
    'kosinus': { min: 1, max: 1, nahrad: function (a) { return 'Math.cos(__cislo(' + a[0] + '))'; } },
    'orez': { min: 1, max: 1, nahrad: function (a) { return 'String(' + a[0] + ').trim()'; } },
    'cast': { min: 3, max: 3, nahrad: function (a) { return 'String(' + a[0] + ').substring(__cislo(' + a[1] + '), __cislo(' + a[2] + '))'; } },
    'najdi': { min: 2, max: 2, nahrad: function (a) { return 'String(' + a[0] + ').indexOf(String(' + a[1] + '))'; } },
    'nahrad': { min: 3, max: 3, nahrad: function (a) { return 'String(' + a[0] + ').split(String(' + a[1] + ')).join(String(' + a[2] + '))'; } },
    'zacina': { min: 2, max: 2, nahrad: function (a) { return '(String(' + a[0] + ').indexOf(String(' + a[1] + ')) === 0 ? 1 : 0)'; } },
    'konci': { min: 2, max: 2, nahrad: function (a) { return '(String(' + a[1] + ').length === 0 ? 1 : (String(' + a[0] + ').slice(-String(' + a[1] + ').length) === String(' + a[1] + ') ? 1 : 0))'; } },
    'opakuj-text': { min: 2, max: 2, nahrad: function (a) { return 'String(' + a[0] + ').repeat(Math.max(0, Math.round(__cislo(' + a[1] + '))))'; } },
    'zaokrouhli-na': { min: 2, max: 2, nahrad: function (a) { return '(Math.round(__cislo(' + a[0] + ') * Math.pow(10, __cislo(' + a[1] + '))) / Math.pow(10, __cislo(' + a[1] + ')))'; } },
    'tangens': { min: 1, max: 1, nahrad: function (a) { return 'Math.tan(__cislo(' + a[0] + '))'; } },
    'logaritmus': { min: 1, max: 1, nahrad: function (a) { return 'Math.log(Math.abs(__cislo(' + a[0] + ')) + 1)'; } },
    'pole': { min: 0, max: 0, nahrad: function () { return '[]'; } },
    'vezmi': { min: 2, max: 2, nahrad: function (a) { return '__vezmi(' + a[0] + ', ' + a[1] + ')'; } },
    'pocet': { min: 1, max: 1, nahrad: function (a) { return '__pocet(' + a[0] + ')'; } },
    'spoj-pole': { min: 2, max: 2, nahrad: function (a) { return '__spojPole(' + a[0] + ', ' + a[1] + ')'; } },
    'slova': { min: 1, max: 1, nahrad: function (a) { return '__slova(' + a[0] + ')'; } },
    'nahodne-z-pole': { min: 1, max: 1, nahrad: function (a) { return '__nahodneZPole(' + a[0] + ')'; } },
    'obsahuje-pole': { min: 2, max: 2, nahrad: function (a) { return '__obsahujePole(' + a[0] + ', ' + a[1] + ')'; } },
    'cislo-text': { min: 1, max: 1, nahrad: function (a) { return 'String(' + a[0] + ')'; } },
    'desetinna-cast': { min: 1, max: 1, nahrad: function (a) { return '(__cislo(' + a[0] + ') - Math.floor(__cislo(' + a[0] + ')))'; } },
    'znak': { min: 2, max: 2, nahrad: function (a) { return 'String(' + a[0] + ').charAt(Math.round(__cislo(' + a[1] + ')))'; } }
  };

  function barevnik() {
    if (typeof NAPOVEDA !== 'undefined' && NAPOVEDA && NAPOVEDA.barevnik) return NAPOVEDA.barevnik;
    return ZALOZNI_BARVY;
  }

  function ochrana(s) {
    const A = String.fromCharCode(38);
    return String(s)
      .replace(/&/g, A + 'amp;')
      .replace(/</g, A + 'lt;')
      .replace(/>/g, A + 'gt;')
      .replace(/"/g, A + 'quot;')
      .replace(/'/g, A + '#39;');
  }

  function bezpecneId(s) {
    return 'cw-' + String(s).replace(/[^A-Za-z0-9_-]/g, '_');
  }

  // ---------------------------------------------------------------- radkovy rozbor
  function rozdel(radek) {
    const t = [];
    let i = 0;
    while (i < radek.length) {
      const c = radek[i];
      if (c === ' ' || c === '\t') { i++; continue; }
      if (c === '/' && radek[i + 1] === '/') break;
      if (c === '"') {
        let s = '';
        i++;
        while (i < radek.length && radek[i] !== '"') {
          if (radek[i] === '\\' && i + 1 < radek.length) { s += radek[i + 1]; i += 2; }
          else { s += radek[i]; i++; }
        }
        if (i >= radek.length) { t.push({ typ: 'chyba', hodnota: 'Chybi ukoncovaci uvozovka.' }); return t; }
        i++;
        t.push({ typ: 'text', hodnota: s });
        continue;
      }
      if (c === '#' || c === '$') {
        let s = '';
        i++;
        while (i < radek.length && /[A-Za-z0-9_-]/.test(radek[i])) { s += radek[i]; i++; }
        if (!s) {
          t.push({ typ: 'chyba', hodnota: 'Za znakem ' + c + ' chybi nazev (napr. ' + c + 'jmeno).' });
          return t;
        }
        t.push({ typ: c === '#' ? 'id' : 'prom', hodnota: s });
        continue;
      }
      if (c === '-' && radek[i + 1] === '>') { t.push({ typ: 'sipka' }); i += 2; continue; }
      if (c === '<' && radek[i + 1] === '>') { t.push({ typ: 'op', hodnota: '<>' }); i += 2; continue; }
      if (c === '<' && radek[i + 1] === '=') { t.push({ typ: 'op', hodnota: '<=' }); i += 2; continue; }
      if (c === '>' && radek[i + 1] === '=') { t.push({ typ: 'op', hodnota: '>=' }); i += 2; continue; }
      if (c === '=' || c === '<' || c === '>' || c === '+' || c === '*' || c === '/') {
        t.push({ typ: 'op', hodnota: c });
        i++;
        continue;
      }
      if (c === '-') {
        const d = radek[i + 1];
        if (d === undefined || d === ' ' || d === '\t' || /[0-9]/.test(d) || d === '(') {
          t.push({ typ: 'op', hodnota: '-' });
          i++;
          continue;
        }
      }
      if (c === '(' || c === ')') { t.push({ typ: 'zavorka', hodnota: c }); i++; continue; }
      if (c === ',') { t.push({ typ: 'carka' }); i++; continue; }

      let s = '';
      while (i < radek.length) {
        const z = radek[i];
        if (/[\s"'#$=+*\/,()<>]/.test(z)) break;
        if (z === '-' && (radek[i + 1] === undefined || radek[i + 1] === ' ' || radek[i + 1] === '\t' ||
            /[0-9]/.test(radek[i + 1]) || radek[i + 1] === '(' || radek[i + 1] === '>' || radek[i + 1] === '/')) break;
        s += z;
        i++;
      }
      if (!s) { t.push({ typ: 'chyba', hodnota: 'Nerozumim znaku "' + c + '".' }); return t; }
      if (/^[0-9]+([.,][0-9]+)?$/.test(s)) t.push({ typ: 'cislo', hodnota: Number(s.replace(',', '.')) });
      else t.push({ typ: 'slovo', hodnota: s });
    }
    return t;
  }

  // ---------------------------------------------------------------- vyrazy
  function novyP(t, chyby, radek) { return { t: t, i: 0, chyby: chyby, radek: radek }; }
  function kouka(p) { return p.i < p.t.length ? p.t[p.i] : null; }
  function ber(p) { return p.t[p.i++]; }
  function zbyva(p) { return p.i < p.t.length; }
  function popisZbytku(p) {
    return p.t.slice(p.i).map(function (x) { return x.hodnota === undefined ? '->' : x.hodnota; }).join(' ');
  }

  function faktor(p) {
    const tok = kouka(p);
    if (!tok) { p.chyby.push({ radek: p.radek, text: 'Ve vyrazu neco chybi.', vaznost: 'chyba' }); return '""'; }
    if (tok.typ === 'cislo') { ber(p); return String(tok.hodnota); }
    if (tok.typ === 'text') { ber(p); return JSON.stringify(tok.hodnota); }
    if (tok.typ === 'id') { ber(p); return '__cti(' + JSON.stringify(tok.hodnota) + ')'; }
    if (tok.typ === 'prom') { ber(p); return '__p(' + JSON.stringify(tok.hodnota) + ')'; }
    if (tok.typ === 'zavorka' && tok.hodnota === '(') {
      ber(p);
      const v = vyraz(p);
      const k = kouka(p);
      if (k && k.typ === 'zavorka' && k.hodnota === ')') ber(p);
      else p.chyby.push({ radek: p.radek, text: 'Chybi zaviraci zavorka ).', vaznost: 'chyba' });
      return '(' + v + ')';
    }
    if (tok.typ === 'op' && tok.hodnota === '-') { ber(p); return '__od(0, ' + faktor(p) + ')'; }
    if (tok.typ === 'slovo') {
      const nazev = tok.hodnota.toLowerCase();
      const dalsi = p.t[p.i + 1];
      if (FUNKCE[nazev] && dalsi && dalsi.typ === 'zavorka' && dalsi.hodnota === '(') {
        ber(p); ber(p);
        const argumenty = [];
        if (kouka(p) && !(kouka(p).typ === 'zavorka' && kouka(p).hodnota === ')')) {
          argumenty.push(vyraz(p));
          while (kouka(p) && kouka(p).typ === 'carka') { ber(p); argumenty.push(vyraz(p)); }
        }
        const k = kouka(p);
        if (k && k.typ === 'zavorka' && k.hodnota === ')') ber(p);
        else p.chyby.push({ radek: p.radek, text: 'Chybi zaviraci zavorka u funkce ' + nazev + '.', vaznost: 'chyba' });
        const predpis = FUNKCE[nazev];
        if (argumenty.length < predpis.min || argumenty.length > predpis.max) {
          p.chyby.push({
            radek: p.radek,
            text: 'Funkce ' + nazev + ' potrebuje ' + predpis.min + ' hodnotu(y), dostala ' + argumenty.length + '.',
            vaznost: 'chyba'
          });
        }
        return predpis.nahrad(argumenty);
      }
      p.chyby.push({
        radek: p.radek,
        text: 'Nerozumim slovu "' + tok.hodnota + '" ve vyrazu. Pouzij text v uvozovkach, #prvek nebo $promennou.',
        vaznost: 'chyba'
      });
      ber(p);
      return '""';
    }
    p.chyby.push({ radek: p.radek, text: 'Nerozumim casti vyrazu: "' + (tok.hodnota === undefined ? tok.typ : tok.hodnota) + '".', vaznost: 'chyba' });
    ber(p);
    return '""';
  }

  function clen(p) {
    let v = faktor(p);
    for (;;) {
      const tok = kouka(p);
      if (tok && tok.typ === 'op' && (tok.hodnota === '*' || tok.hodnota === '/')) {
        ber(p);
        const d = faktor(p);
        v = tok.hodnota === '*' ? '__krat(' + v + ', ' + d + ')' : '__del(' + v + ', ' + d + ')';
      } else break;
    }
    return v;
  }

  function vyraz(p) {
    let v = clen(p);
    for (;;) {
      const tok = kouka(p);
      if (tok && tok.typ === 'op' && (tok.hodnota === '+' || tok.hodnota === '-')) {
        ber(p);
        const d = clen(p);
        v = tok.hodnota === '+' ? '__sec(' + v + ', ' + d + ')' : '__od(' + v + ', ' + d + ')';
      } else break;
    }
    return v;
  }

  function chyba(chyby, radek, text) { chyby.push({ radek: radek, text: text, vaznost: 'chyba' }); }
  function varovani(chyby, radek, text) { chyby.push({ radek: radek, text: text, vaznost: 'varovani' }); }

  function vyrazZeZbytku(t, od, chyby, radek) {
    const p = novyP(t.slice(od), chyby, radek);
    if (t[od] && t[od].typ === 'op' && t[od].hodnota === '=') ber(p);
    if (!zbyva(p)) { chyba(chyby, radek, 'Tady chybi hodnota.'); return '""'; }
    const v = vyraz(p);
    if (zbyva(p)) varovani(chyby, radek, 'Nerozumim zbytku radku: "' + popisZbytku(p) + '" - pouzil jsem jen prvni cast.');
    return v;
  }

  function podminkaZeZbytku(t, od, chyby, radek) {
    let idx = -1;
    for (let i = od; i < t.length; i++) {
      if (t[i].typ === 'op' && ['=', '<>', '<', '>', '<=', '>='].indexOf(t[i].hodnota) >= 0) { idx = i; break; }
    }
    if (idx < 0) {
      chyba(chyby, radek, 'Podmince chybi porovnani. Napis napr.: kdyz #skore > 10');
      return 'false';
    }
    const levy = t.slice(od, idx);
    const pravy = t.slice(idx + 1);
    if (!levy.length || !pravy.length) {
      chyba(chyby, radek, 'V podmince chybi leva nebo prava strana.');
      return 'false';
    }
    const pl = novyP(levy, chyby, radek);
    const vlevo = vyraz(pl);
    if (zbyva(pl)) varovani(chyby, radek, 'Leva strana podminky ma prebytecne znaky.');
    const pp = novyP(pravy, chyby, radek);
    const vpravo = vyraz(pp);
    if (zbyva(pp)) varovani(chyby, radek, 'Prava strana podminky ma prebytecne znaky.');
    const op = t[idx].hodnota;
    if (op === '=') return '__rovno(' + vlevo + ', ' + vpravo + ')';
    if (op === '<>') return '!__rovno(' + vlevo + ', ' + vpravo + ')';
    if (op === '>') return '__vetsi(' + vlevo + ', ' + vpravo + ')';
    if (op === '<') return '__mensi(' + vlevo + ', ' + vpravo + ')';
    if (op === '>=') return '__vetsiRovno(' + vlevo + ', ' + vpravo + ')';
    return '__mensiRovno(' + vlevo + ', ' + vpravo + ')';
  }

  // ---------------------------------------------------------------- hlavni preklad
  function preved(kod) {
    const chyby = [];
    const radky = String(kod == null ? '' : kod).split(/\r?\n/);
    const telo = [];
    const zasobnik = [];
    const akceSeznam = [];
    const startJs = [];
    const pouziteAkce = [];
    const prvky = {};
    let nazevStranky = 'Moje stranka';
    let vzhled = 'svetly';
    let pozadi = '';
    let barvaTextu = '';
    let zarovnani = 'vlevo';
    let font = 'normalni';
    let akceNyni = null;
    let citac = 0;
    let citacSmycek = 0;
    let radekNyni = '';
    const komponenty = {};
    const vlozPozadavky = [];
    const stranky = [];
    const castiHtml = [];
    const pouziteStranky = [];
    let maMenu = false;

    function pridej(html) {
      if (zasobnik.length) zasobnik[zasobnik.length - 1].html.push(html);
      else telo.push(html);
    }

    // Zbytek radku za prikazem - pro pripad, kdy clovek nepise uvozovky.
    function zbytekRadku(rezatNaSipku) {
      let s = String(radekNyni).replace(/^\s+/, '');
      const m = s.match(/^[^\s]+/);
      s = m ? s.slice(m[0].length) : '';
      s = s.replace(/^\s+/, '');
      if (rezatNaSipku) {
        const i2 = s.indexOf('->');
        if (i2 >= 0) s = s.slice(0, i2);
      }
      s = s.replace(/^#[A-Za-z0-9_-]+\s*/, '').trim();
      if (s.length >= 2 && s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') s = s.slice(1, -1);
      return s;
    }

    function textNeboZbytek(t, i) {
      const s = textNa(t, i);
      if (s !== null) return s;
      const z = zbytekRadku(false);
      return z.length ? z : null;
    }

    // Rozdeli tokeny na skupiny oddelene carkou.
    // Pouziva se u prikazu s vice hodnotami: kruh #platno 60, 60, 20, cervena
    function rozdelCarkami(t) {
      const skupiny = [[]];
      for (let i = 0; i < t.length; i++) {
        if (t[i].typ === 'carka') skupiny.push([]);
        else skupiny[skupiny.length - 1].push(t[i]);
      }
      return skupiny.filter(function (g) { return g.length > 0; });
    }

    function cisloV(g, radek, co) {
      if (g.length === 1 && g[0].typ === 'cislo') return String(g[0].hodnota);
      chyba(chyby, radek, co + ' musi byt cislo.');
      return null;
    }

    function textV(g, radek, co) {
      if (g.length === 1 && (g[0].typ === 'text' || g[0].typ === 'slovo' || g[0].typ === 'cislo')) {
        return String(g[0].hodnota);
      }
      chyba(chyby, radek, co + ' musi byt text. Vezmi ho do uvozovek, kdyz ma vic slov.');
      return null;
    }

    // Barvu bere z tokenu: nazev barvy (modra) nebo zapis #rrggbb.
    function barvaNa(t, i, radek, co) {
      const x = t[i];
      if (!x) return null;
      let s = null;
      if (x.typ === 'slovo' || x.typ === 'text') s = String(x.hodnota);
      else if (x.typ === 'id') s = '#' + String(x.hodnota);
      if (!s) { chyba(chyby, radek, 'Barva pro ' + co + ' chybi. Napr. modra nebo #2f6fed.'); return null; }
      const nazev = s.toLowerCase();
      const bn = barevnik();
      if (bn[nazev]) return bn[nazev];
      if (/^#[0-9a-fA-F]{3}$/.test(s) || /^#[0-9a-fA-F]{6}$/.test(s)) return s;
      chyba(chyby, radek, 'Barvu "' + s + '" neznam. Pouzij nazev barvy nebo #rrggbb.');
      return null;
    }
    function pridejKod(js) {
      if (akceNyni) akceNyni.telo.push(js);
      else startJs.push(js);
    }
    function dokonciAkci() {
      if (!akceNyni) return;
      akceSeznam.push({ nazev: akceNyni.nazev, telo: akceNyni.telo });
      akceNyni = null;
    }
    function zaregistruj(id, radek) {
      if (prvky[id]) varovani(chyby, radek, 'Nazev #' + id + ' je na strance dvakrat. Jeden prejmenuj.');
      prvky[id] = true;
    }
    function textNa(t, i) {
      const x = t[i];
      return x && x.typ === 'text' ? x.hodnota : null;
    }
    function slovoNa(t, i) {
      const x = t[i];
      return x && (x.typ === 'text' || x.typ === 'slovo' || x.typ === 'cislo') ? String(x.hodnota) : null;
    }
    function barvaZeZbytku(t, radek) {
      const s = slovoNa(t, 0);
      if (!s) { chyba(chyby, radek, 'Chybi nazev barvy. Napr. modra nebo #2f6fed.'); return null; }
      const nazev = s.toLowerCase();
      const bn = barevnik();
      if (bn[nazev]) return bn[nazev];
      if (/^#[0-9a-fA-F]{3}$/.test(s) || /^#[0-9a-fA-F]{6}$/.test(s)) return s;
      chyba(chyby, radek, 'Barvu "' + s + '" neznam. Pouzij ' + Object.keys(bn).join(', ') + ' nebo #rrggbb.');
      return null;
    }
    function jenVeStrance(radek) {
      if (akceNyni) {
        chyba(chyby, radek, 'Prikazy pro obsah stranky (nadpis, text, tlacitko, vstup...) patri mimo akci. V akci pouzij nastav, pridej-do, skryj, zobraz nebo obarvi.');
        return false;
      }
      return true;
    }

    // Prerus a pokracuj smi byt jen uvnitr cyklu. Jinak by ve vyslednem
    // JavaScriptu vzniklo break nebo continue mimo smycku a cela stranka by spadla.
    function jsmeVCyklu() {
      if (!akceNyni) return false;
      const cykly = ['krat', 'dokud', 'pro-kazdou'];
      for (let k = 0; k < akceNyni.vnitrni.length; k++) {
        if (cykly.indexOf(akceNyni.vnitrni[k]) >= 0) return true;
      }
      return false;
    }

    for (let cislo = 0; cislo < radky.length; cislo++) {
      const r = cislo + 1;
      radekNyni = radky[cislo];
      const t = rozdel(radekNyni);
      let spatne = null;
      for (let k = 0; k < t.length; k++) if (t[k].typ === 'chyba') { spatne = t[k]; break; }
      if (spatne) { chyba(chyby, r, spatne.hodnota); continue; }
      if (!t.length) continue;
      if (t[0].typ !== 'slovo') {
        chyba(chyby, r, 'Radek musi zacinat prikazem, napr. nadpis, text, tlacitko nebo akce.');
        continue;
      }
      const prikaz = t[0].hodnota.toLowerCase();
      const zb = t.slice(1);

      switch (prikaz) {
        case 'stranka': {
          const s = textNa(zb, 0);
          if (s === null) { chyba(chyby, r, 'Napis: stranka "Nazev stranky" - text v uvozovkach.'); break; }
          nazevStranky = s;
          break;
        }
        case 'vzhled': {
          const v = slovoNa(zb, 0);
          if (!v || VZHLEDY.indexOf(v.toLowerCase()) < 0) { chyba(chyby, r, 'Vzhled muze byt jen: ' + VZHLEDY.join(', ') + '.'); break; }
          vzhled = v.toLowerCase();
          break;
        }
        case 'zarovnani': {
          const v = slovoNa(zb, 0);
          if (!v || ZAROVNANI.indexOf(v.toLowerCase()) < 0) { chyba(chyby, r, 'Zarovnani muze byt jen: ' + ZAROVNANI.join(', ') + '.'); break; }
          zarovnani = v.toLowerCase();
          break;
        }
        case 'font': {
          const v = slovoNa(zb, 0);
          if (!v || FONTY.indexOf(v.toLowerCase()) < 0) { chyba(chyby, r, 'Font muze byt jen: ' + FONTY.join(', ') + '.'); break; }
          font = v.toLowerCase();
          break;
        }
        case 'barva-pozadi': {
          const c = barvaZeZbytku(zb, r);
          if (c) pozadi = c;
          break;
        }
        case 'barva-textu': {
          const c = barvaZeZbytku(zb, r);
          if (c) barvaTextu = c;
          break;
        }
        case 'nadpis':
        case 'podnadpis':
        case 'text': {
          if (!jenVeStrance(r)) break;
          const znacka = prikaz === 'nadpis' ? 'h1' : (prikaz === 'podnadpis' ? 'h2' : 'p');
          let i = 0;
          let id = null;
          if (zb[0] && zb[0].typ === 'id') { id = zb[0].hodnota; i = 1; }
          const s = textNeboZbytek(zb, i);
          if (s === null) { chyba(chyby, r, 'Napis, co ma na strance stat. Uvozovky jsou dobrovolne.'); break; }
          let atr = '';
          if (id) { zaregistruj(id, r); atr = ' id="' + bezpecneId(id) + '"'; }
          pridej('<' + znacka + atr + '>' + ochrana(s) + '</' + znacka + '>');
          break;
        }
        case 'pridej': {
          if (!jenVeStrance(r)) break;
          citac++;
          const id = '__v' + citac;
          const v = vyrazZeZbytku(zb, 0, chyby, r);
          pridej('<p class="cw-text" id="' + bezpecneId(id) + '"></p>');
          startJs.push('__pis(' + JSON.stringify(id) + ', ' + v + ');');
          break;
        }
        case 'tlacitko': {
          if (!jenVeStrance(r)) break;
          const s = textNa(zb, 0);
          if (s === null) { chyba(chyby, r, 'Napis: tlacitko "Text tlacitka" -> nazev-akce'); break; }
          let idx = -1;
          for (let k = 1; k < zb.length; k++) if (zb[k].typ === 'sipka') { idx = k; break; }
          const nazevAkce = idx >= 0 ? slovoNa(zb, idx + 1) : null;
          if (!nazevAkce) { chyba(chyby, r, 'Tlacitko potrebuje akci: tlacitko "Text" -> nazev-akce'); break; }
          if (!/^[A-Za-z0-9_-]+$/.test(nazevAkce)) { chyba(chyby, r, 'Nazev akce muze mit jen pismena, cislice a pomlcku.'); break; }
          pouziteAkce.push({ nazev: nazevAkce, radek: r });
          pridej('<button type="button" class="cw-tlacitko" data-cw-akce="' + ochrana(nazevAkce) + '">' + ochrana(s) + '</button>');
          break;
        }
        case 'odkaz': {
          if (!jenVeStrance(r)) break;
          const s = textNa(zb, 0);
          let idx = -1;
          for (let k = 1; k < zb.length; k++) if (zb[k].typ === 'sipka') { idx = k; break; }
          const adresa = idx >= 0 ? textNa(zb, idx + 1) : textNa(zb, 1);
          if (s === null) { chyba(chyby, r, 'Napis: odkaz "Text odkazu" -> "https://adresa"'); break; }
          if (adresa === null) { chyba(chyby, r, 'Odkazu chybi adresa. Napis: odkaz "Text" -> "https://adresa"'); break; }
          pridej('<p><a class="cw-odkaz" href="' + ochrana(adresa) + '" target="_blank" rel="noopener">' + ochrana(s) + '</a></p>');
          break;
        }
        case 'obrazek': {
          if (!jenVeStrance(r)) break;
          const adresa = textNa(zb, 0);
          const popis = textNa(zb, 1) || '';
          if (adresa === null) { chyba(chyby, r, 'Napis: obrazek "https://adresa-obrazku" "popis"'); break; }
          pridej('<img class="cw-obrazek" src="' + ochrana(adresa) + '" alt="' + ochrana(popis) + '" loading="lazy">');
          break;
        }
        case 'vstup': {
          if (!jenVeStrance(r)) break;
          let i = 0;
          let id = null;
          if (zb[0] && zb[0].typ === 'id') { id = zb[0].hodnota; i = 1; }
          if (!id) { chyba(chyby, r, 'Policko potrebuje nazev: vstup #jmeno "Popis"'); break; }
          zaregistruj(id, r);
          const popis = textNa(zb, i) || '';
          pridej('<input class="cw-vstup" id="' + bezpecneId(id) + '" type="text" placeholder="' + ochrana(popis) + '">');
          break;
        }
        case 'cislo': {
          if (!jenVeStrance(r)) break;
          let i = 0;
          let id = null;
          if (zb[0] && zb[0].typ === 'id') { id = zb[0].hodnota; i = 1; }
          if (!id) { chyba(chyby, r, 'Cislo potrebuje nazev: cislo #vek "Popis"'); break; }
          zaregistruj(id, r);
          const popisC = textNa(zb, i) || '';
          pridej('<input class="cw-vstup" id="' + bezpecneId(id) + '" type="number" placeholder="' + ochrana(popisC) + '">');
          break;
        }
        case 'zaskrtavatko': {
          if (!jenVeStrance(r)) break;
          let i = 0;
          let id = null;
          if (zb[0] && zb[0].typ === 'id') { id = zb[0].hodnota; i = 1; }
          if (!id) { chyba(chyby, r, 'Zaskrtavatko potrebuje nazev: zaskrtavatko #souhlas "Text"'); break; }
          zaregistruj(id, r);
          const popisZ = textNa(zb, i) || '';
          pridej('<label class="cw-volba"><input id="' + bezpecneId(id) + '" type="checkbox"> ' + ochrana(popisZ) + '</label>');
          break;
        }
        case 'vyber': {
          if (!jenVeStrance(r)) break;
          let i = 0;
          let id = null;
          if (zb[0] && zb[0].typ === 'id') { id = zb[0].hodnota; i = 1; }
          if (!id) { chyba(chyby, r, 'Vyber potrebuje nazev: vyber #barva'); break; }
          zaregistruj(id, r);
          zasobnik.push({
            typ: 'vyber', radek: r, html: [],
            otevreni: '<select class="cw-vyber" id="' + bezpecneId(id) + '">',
            zavirac: '</select>'
          });
          break;
        }
        case 'moznost': {
          if (!jenVeStrance(r)) break;
          const horniV = zasobnik[zasobnik.length - 1];
          if (!horniV || horniV.typ !== 'vyber') {
            chyba(chyby, r, 'Moznost muze byt jen uvnitr vyberu. Napis vyber #nazev, pak moznosti a nakonec konec.');
            break;
          }
          const s = textNa(zb, 0);
          if (s === null) { chyba(chyby, r, 'Napis: moznost "Text"'); break; }
          pridej('<option>' + ochrana(s) + '</option>');
          break;
        }
        case 'mezera': {
          if (!jenVeStrance(r)) break;
          pridej('<div class="cw-mezera"></div>');
          break;
        }
        case 'oddelovac': {
          if (!jenVeStrance(r)) break;
          pridej('<hr class="cw-linka">');
          break;
        }
        case 'karta':
        case 'blok':
        case 'seznam': {
          if (!jenVeStrance(r)) break;
          const znacky = {
            karta: ['<div class="cw-karta">', '</div>'],
            blok: ['<div class="cw-blok">', '</div>'],
            seznam: ['<ul class="cw-seznam">', '</ul>']
          }[prikaz];
          zasobnik.push({ typ: prikaz, radek: r, html: [], otevreni: znacky[0], zavirac: znacky[1] });
          break;
        }
        case 'polozka': {
          if (!jenVeStrance(r)) break;
          const horni = zasobnik[zasobnik.length - 1];
          if (!horni || horni.typ !== 'seznam') {
            chyba(chyby, r, 'Polozka muze byt jen uvnitr seznamu. Napis seznam, pak polozky a nakonec konec.');
            break;
          }
          let i = 0;
          let id = null;
          if (zb[0] && zb[0].typ === 'id') { id = zb[0].hodnota; i = 1; }
          const s = textNeboZbytek(zb, i);
          if (s === null) { chyba(chyby, r, 'Napis: polozka Text odrazky'); break; }
          let atr = '';
          if (id) { zaregistruj(id, r); atr = ' id="' + bezpecneId(id) + '"'; }
          pridej('<li' + atr + '>' + ochrana(s) + '</li>');
          break;
        }
        case 'konec': {
          if (akceNyni && akceNyni.vnitrni.length) {
            akceNyni.vnitrni.pop();
            akceNyni.telo.push('}');
            break;
          }
          if (akceNyni) { dokonciAkci(); break; }
          if (zasobnik.length) {
            const v = zasobnik.pop();
            if (v.typ === 'komponenta') {
              komponenty[v.nazev] = v.html.join('');
              break;
            }
            if (v.typ === 'podstranka') {
              castiHtml.push('<div data-cw-cast="' + v.id + '" style="display:none">' + v.html.join('') + '</div>');
              stranky.push({ id: v.id, nazev: v.nazev, radek: v.radek });
              break;
            }
            pridej(v.otevreni + v.html.join('') + v.zavirac);
            break;
          }
          chyba(chyby, r, 'Prikaz konec tu nema co ukoncit. Blok, akce ani podminka tu nezacala.');
          break;
        }
        case 'akce': {
          if (akceNyni) { chyba(chyby, r, 'Akce se nesmi vlozit do jine akce. Predchozi akci ukonci prikazem konec.'); break; }
          const n = slovoNa(zb, 0);
          if (!n || !/^[A-Za-z0-9_-]+$/.test(n)) { chyba(chyby, r, 'Napis: akce nazev-akce (jen pismena, cislice a pomlcka).'); break; }
          let uzJe = false;
          for (let k = 0; k < akceSeznam.length; k++) if (akceSeznam[k].nazev === n) uzJe = true;
          if (uzJe) varovani(chyby, r, 'Akce "' + n + '" je v kodu dvakrat. Pouzije se pozdejsi verze.');
          akceNyni = { nazev: n, telo: [], vnitrni: [], radek: r };
          break;
        }
        case 'kdyz': {
          if (!akceNyni) { chyba(chyby, r, 'Prikaz kdyz muze byt jen uvnitr akce: napis akce nazev, pod ni kdyz ... a nakonec konec.'); break; }
          const pod = podminkaZeZbytku(zb, 0, chyby, r);
          akceNyni.telo.push('if (' + pod + ') {');
          akceNyni.vnitrni.push('kdyz');
          break;
        }
        case 'jinak': {
          if (!akceNyni || !akceNyni.vnitrni.length || akceNyni.vnitrni[akceNyni.vnitrni.length - 1] !== 'kdyz') {
            chyba(chyby, r, 'Prikaz jinak musi nasledovat hned po bloku kdyz.');
            break;
          }
          akceNyni.vnitrni.pop();
          akceNyni.vnitrni.push('jinak');
          akceNyni.telo.push('} else {');
          break;
        }
        case 'promenna': {
          const prvni = zb[0];
          if (!prvni || prvni.typ !== 'prom') { chyba(chyby, r, 'Promenna musi mit jmeno se znakem $: promenna $skore = 0'); break; }
          let i = 1;
          if (zb[i] && zb[i].typ === 'op' && zb[i].hodnota === '=') i++;
          const v = vyrazZeZbytku(zb, i, chyby, r);
          pridejKod('__prom[' + JSON.stringify(prvni.hodnota) + '] = ' + v + ';');
          break;
        }
        case 'nastav': {
          const cil = zb[0];
          if (!cil || (cil.typ !== 'id' && cil.typ !== 'prom')) {
            chyba(chyby, r, 'Napis, co se ma zmenit: nastav #prvek "text" nebo nastav $promenna hodnota');
            break;
          }
          const v = vyrazZeZbytku(zb, 1, chyby, r);
          if (cil.typ === 'prom') pridejKod('__prom[' + JSON.stringify(cil.hodnota) + '] = ' + v + ';');
          else pridejKod('__pis(' + JSON.stringify(cil.hodnota) + ', ' + v + ');');
          break;
        }
        case 'pridej-do': {
          const cil = zb[0];
          if (!cil || cil.typ !== 'id') { chyba(chyby, r, 'Napis: pridej-do #prvek "text"'); break; }
          const v = vyrazZeZbytku(zb, 1, chyby, r);
          pridejKod('__pridejDo(' + JSON.stringify(cil.hodnota) + ', ' + v + ');');
          break;
        }
        case 'skryj':
        case 'zobraz': {
          const cil = zb[0];
          if (!cil || cil.typ !== 'id') { chyba(chyby, r, 'Napis: ' + prikaz + ' #prvek'); break; }
          pridejKod('__skryj(' + JSON.stringify(cil.hodnota) + ', ' + (prikaz === 'skryj' ? 'true' : 'false') + ');');
          break;
        }
        case 'obarvi': {
          const cil = zb[0];
          if (!cil || cil.typ !== 'id') { chyba(chyby, r, 'Napis: obarvi #prvek modra'); break; }
          const c = barvaZeZbytku(zb.slice(1), r);
          if (!c) break;
          pridejKod('__obarvi(' + JSON.stringify(cil.hodnota) + ', ' + JSON.stringify(c) + ');');
          break;
        }
        case 'okno': {
          const v = vyrazZeZbytku(zb, 0, chyby, r);
          pridejKod('__okno(' + v + ');');
          break;
        }
        case 'prejdi': {
          const a = textNa(zb, 0);
          if (a === null) { chyba(chyby, r, 'Napis: prejdi "https://adresa"'); break; }
          pridejKod('__prejdi(' + JSON.stringify(a) + ');');
          break;
        }
        case 'posun': {
          const cil = zb[0];
          if (!cil || cil.typ !== 'id') { chyba(chyby, r, 'Napis: posun #prvek 10, 20'); break; }
          let idx = -1;
          for (let k = 1; k < zb.length; k++) if (zb[k].typ === 'carka') { idx = k; break; }
          if (idx < 1 || idx >= zb.length - 1) {
            chyba(chyby, r, 'Napis: posun #prvek 10, 20 - dve hodnoty oddelene carkou.');
            break;
          }
          const px = novyP(zb.slice(1, idx), chyby, r);
          const dx = vyraz(px);
          const py = novyP(zb.slice(idx + 1), chyby, r);
          const dy = vyraz(py);
          pridejKod('__posun(' + JSON.stringify(cil.hodnota) + ', ' + dx + ', ' + dy + ');');
          break;
        }
        case 'velikost': {
          const cil = zb[0];
          if (!cil || cil.typ !== 'id') { chyba(chyby, r, 'Napis: velikost #prvek 200'); break; }
          const w = vyrazZeZbytku(zb, 1, chyby, r);
          pridejKod('__velikost(' + JSON.stringify(cil.hodnota) + ', ' + w + ');');
          break;
        }
        case 'zapis': {
          const klic = textNa(zb, 0);
          if (klic === null) { chyba(chyby, r, 'Napis: zapis "nazev" hodnota'); break; }
          const v = vyrazZeZbytku(zb, 1, chyby, r);
          pridejKod('__zapis(' + JSON.stringify(klic) + ', ' + v + ');');
          break;
        }
        case 'nacti': {
          const cil = zb[0];
          if (!cil || cil.typ !== 'prom') { chyba(chyby, r, 'Napis: nacti $promenna "nazev"'); break; }
          const klic = textNa(zb, 1);
          if (klic === null) { chyba(chyby, r, 'Napis: nacti $promenna "nazev"'); break; }
          pridejKod('__prom[' + JSON.stringify(cil.hodnota) + '] = __nacti(' + JSON.stringify(klic) + ');');
          break;
        }
        case 'opakuj': {
          if (!jenVeStrance(r)) break;
          const n = slovoNa(zb, 0);
          if (!n || !/^[A-Za-z0-9_-]+$/.test(n)) { chyba(chyby, r, 'Napis: opakuj nazev-akce 1000'); break; }
          const ms = vyrazZeZbytku(zb, 1, chyby, r);
          pouziteAkce.push({ nazev: n, radek: r });
          startJs.push('setInterval(function () { var f = __akce[' + JSON.stringify(n) + ']; if (f) f(); }, ' + ms + ');');
          break;
        }
        case 'klavesa': {
          if (!jenVeStrance(r)) break;
          const kl = textNa(zb, 0);
          if (kl === null) { chyba(chyby, r, 'Napis: klavesa "a" nazev-akce'); break; }
          const n = slovoNa(zb, 1);
          if (!n || !/^[A-Za-z0-9_-]+$/.test(n)) { chyba(chyby, r, 'Napis: klavesa "a" nazev-akce'); break; }
          pouziteAkce.push({ nazev: n, radek: r });
          startJs.push('document.addEventListener("keydown", function (ev) { if (String(ev.key).toLowerCase() === ' +
            JSON.stringify(kl.toLowerCase()) + ') { var f = __akce[' + JSON.stringify(n) + ']; if (f) f(); } });');
          break;
        }
        case 'platno': {
          if (!jenVeStrance(r)) break;
          let i = 0;
          let id = null;
          if (zb[0] && zb[0].typ === 'id') { id = zb[0].hodnota; i = 1; }
          if (!id) { chyba(chyby, r, 'Napis: platno #nazev 400, 300'); break; }
          zaregistruj(id, r);
          const g = rozdelCarkami(zb.slice(i));
          if (g.length < 2) { chyba(chyby, r, 'Napis: platno #nazev 400, 300 - sirka a vyska oddelene carkou.'); break; }
          const w = cisloV(g[0], r, 'Sirka platna');
          const h = cisloV(g[1], r, 'Vyska platna');
          if (w === null || h === null) break;
          pridej('<canvas class="cw-platno" id="' + bezpecneId(id) + '" width="' + w + '" height="' + h + '"></canvas>');
          break;
        }
        case 'vycisti': {
          const cil = zb[0];
          if (!cil || cil.typ !== 'id') { chyba(chyby, r, 'Napis: vycisti #platno'); break; }
          pridejKod('__vycisti(' + JSON.stringify(cil.hodnota) + ');');
          break;
        }
        case 'obdelnik':
        case 'kruh':
        case 'cara': {
          const cil = zb[0];
          if (!cil || cil.typ !== 'id') { chyba(chyby, r, 'Napis: ' + prikaz + ' #platno 10, 20, 50, 30, modra'); break; }
          const potreba = prikaz === 'kruh' ? 3 : 4;
          const g = rozdelCarkami(zb.slice(1));
          if (g.length < potreba) { chyba(chyby, r, 'Prikaz ' + prikaz + ' potrebuje ' + potreba + ' hodnoty oddelene carkou.'); break; }
          const hodnoty = [];
          for (let k = 0; k < potreba; k++) hodnoty.push(vyraz(novyP(g[k], chyby, r)));
          let barva = null;
          if (g.length > potreba) barva = barvaNa(g[potreba], 0, r, prikaz);
          const volani = prikaz === 'obdelnik' ? '__obdelnik' : (prikaz === 'kruh' ? '__kruh' : '__cara');
          pridejKod(volani + '(' + JSON.stringify(cil.hodnota) + ', ' + hodnoty.join(', ') + ', ' + (barva ? JSON.stringify(barva) : 'null') + ');');
          break;
        }
        case 'text-platno': {
          const cil = zb[0];
          if (!cil || cil.typ !== 'id') { chyba(chyby, r, 'Napis: text-platno #platno 10, 20, Ahoj'); break; }
          const g = rozdelCarkami(zb.slice(1));
          if (g.length < 3) { chyba(chyby, r, 'Napis: text-platno #platno 10, 20, Ahoj'); break; }
          const tx = vyraz(novyP(g[0], chyby, r));
          const ty = vyraz(novyP(g[1], chyby, r));
          const tt = textV(g[2], r, 'Text na platno');
          if (tt === null) break;
          let tb = null;
          if (g.length > 3) tb = barvaNa(g[3], 0, r, 'text-platno');
          pridejKod('__textPlatno(' + JSON.stringify(cil.hodnota) + ', ' + tx + ', ' + ty + ', ' + JSON.stringify(tt) + ', ' + (tb ? JSON.stringify(tb) : 'null') + ');');
          break;
        }
        case 'barva-platna': {
          const cil = zb[0];
          if (!cil || cil.typ !== 'id') { chyba(chyby, r, 'Napis: barva-platna #platno modra'); break; }
          const c = barvaNa(zb, 1, r, 'barva-platna');
          if (!c) break;
          pridejKod('__nastavBarvu(' + JSON.stringify(cil.hodnota) + ', ' + JSON.stringify(c) + ');');
          break;
        }
        case 'tloustka': {
          const cil = zb[0];
          if (!cil || cil.typ !== 'id') { chyba(chyby, r, 'Napis: tloustka #platno 4'); break; }
          const t = vyrazZeZbytku(zb, 1, chyby, r);
          pridejKod('__nastavTloustku(' + JSON.stringify(cil.hodnota) + ', ' + t + ');');
          break;
        }
        case 'pozadi': {
          const cil = zb[0];
          if (!cil || cil.typ !== 'id') { chyba(chyby, r, 'Napis: pozadi #prvek modra'); break; }
          const c = barvaNa(zb, 1, r, 'pozadi');
          if (!c) break;
          pridejKod('__pozadi(' + JSON.stringify(cil.hodnota) + ', ' + JSON.stringify(c) + ');');
          break;
        }
        case 'ohranic': {
          const cil = zb[0];
          if (!cil || cil.typ !== 'id') { chyba(chyby, r, 'Napis: ohranic #prvek cervena 3'); break; }
          const c = barvaNa(zb, 1, r, 'ohranic');
          if (!c) break;
          const t = vyrazZeZbytku(zb, 2, chyby, r);
          pridejKod('__ohranic(' + JSON.stringify(cil.hodnota) + ', ' + JSON.stringify(c) + ', ' + t + ');');
          break;
        }
        case 'zaobli': {
          const cil = zb[0];
          if (!cil || cil.typ !== 'id') { chyba(chyby, r, 'Napis: zaobli #prvek 12'); break; }
          const t = vyrazZeZbytku(zb, 1, chyby, r);
          pridejKod('__zaobli(' + JSON.stringify(cil.hodnota) + ', ' + t + ');');
          break;
        }
        case 'pruhlednost': {
          const cil = zb[0];
          if (!cil || cil.typ !== 'id') { chyba(chyby, r, 'Napis: pruhlednost #prvek 0.5'); break; }
          const t = vyrazZeZbytku(zb, 1, chyby, r);
          pridejKod('__pruhlednost(' + JSON.stringify(cil.hodnota) + ', ' + t + ');');
          break;
        }
        case 'otoc': {
          const cil = zb[0];
          if (!cil || cil.typ !== 'id') { chyba(chyby, r, 'Napis: otoc #prvek 45'); break; }
          const t = vyrazZeZbytku(zb, 1, chyby, r);
          pridejKod('__otoc(' + JSON.stringify(cil.hodnota) + ', ' + t + ');');
          break;
        }
        case 'smaz': {
          const cil = zb[0];
          if (!cil || cil.typ !== 'id') { chyba(chyby, r, 'Napis: smaz #prvek'); break; }
          pridejKod('__smaz(' + JSON.stringify(cil.hodnota) + ');');
          break;
        }
        case 'pri-stisku':
        case 'pri-najeti':
        case 'pri-zmene': {
          if (!jenVeStrance(r)) break;
          const cil = zb[0];
          if (!cil || cil.typ !== 'id') { chyba(chyby, r, 'Napis: ' + prikaz + ' #prvek nazev-akce'); break; }
          const n = slovoNa(zb, 1);
          if (!n || !/^[A-Za-z0-9_-]+$/.test(n)) { chyba(chyby, r, 'Napis: ' + prikaz + ' #prvek nazev-akce'); break; }
          pouziteAkce.push({ nazev: n, radek: r });
          const udalost = prikaz === 'pri-stisku' ? 'click' : (prikaz === 'pri-najeti' ? 'mouseenter' : 'input');
          startJs.push('__priUdalosti(' + JSON.stringify(cil.hodnota) + ', ' + JSON.stringify(udalost) + ', ' + JSON.stringify(n) + ');');
          break;
        }
        case 'krat': {
          if (!akceNyni) { chyba(chyby, r, 'Prikaz krat muze byt jen uvnitr akce.'); break; }
          const nK = vyrazZeZbytku(zb, 0, chyby, r);
          citacSmycek++;
          const iK = '__i' + citacSmycek;
          akceNyni.telo.push('for (var ' + iK + ' = 0; ' + iK + ' < Math.round(__cislo(' + nK + ')); ' + iK + '++) {');
          akceNyni.vnitrni.push('krat');
          break;
        }
        case 'dokud': {
          if (!akceNyni) { chyba(chyby, r, 'Prikaz dokud muze byt jen uvnitr akce.'); break; }
          const podD = podminkaZeZbytku(zb, 0, chyby, r);
          akceNyni.telo.push('while (' + podD + ') {');
          akceNyni.vnitrni.push('dokud');
          break;
        }
        case 'pro-kazdou': {
          if (!akceNyni) { chyba(chyby, r, 'Prikaz pro-kazdou muze byt jen uvnitr akce.'); break; }
          const cilQ = zb[0];
          if (!cilQ || cilQ.typ !== 'prom') { chyba(chyby, r, 'Napis: pro-kazdou $x v $seznam'); break; }
          let iP = 1;
          if (zb[iP] && zb[iP].typ === 'slovo' && String(zb[iP].hodnota).toLowerCase() === 'v') iP++;
          const zdrojP = vyraz(novyP(zb.slice(iP), chyby, r));
          citacSmycek++;
          const kP = '__p' + citacSmycek;
          akceNyni.telo.push('var ' + kP + 'P = __naPole(' + zdrojP + ');');
          akceNyni.telo.push('for (var ' + kP + ' = 0; ' + kP + ' < ' + kP + 'P.length; ' + kP + '++) {');
          akceNyni.telo.push('__prom[' + JSON.stringify(cilQ.hodnota) + '] = ' + kP + 'P[' + kP + '];');
          akceNyni.vnitrni.push('pro-kazdou');
          break;
        }
        case 'prerus': {
          if (!akceNyni) { chyba(chyby, r, 'Prikaz prerus muze byt jen uvnitr akce.'); break; }
          if (!jsmeVCyklu()) { chyba(chyby, r, 'Prikaz prerus muze byt jen uvnitr cyklu krat, dokud nebo pro-kazdou.'); break; }
          akceNyni.telo.push('break;');
          break;
        }
        case 'pokracuj': {
          if (!akceNyni) { chyba(chyby, r, 'Prikaz pokracuj muze byt jen uvnitr akce.'); break; }
          if (!jsmeVCyklu()) { chyba(chyby, r, 'Prikaz pokracuj muze byt jen uvnitr cyklu krat, dokud nebo pro-kazdou.'); break; }
          akceNyni.telo.push('continue;');
          break;
        }
        case 'vycisti-pole': {
          const cilW = zb[0];
          if (!cilW || cilW.typ !== 'prom') { chyba(chyby, r, 'Napis: vycisti-pole $seznam'); break; }
          pridejKod('__prom[' + JSON.stringify(cilW.hodnota) + '] = [];');
          break;
        }
        case 'pridej-do-pole': {
          const cilE = zb[0];
          if (!cilE || cilE.typ !== 'prom') { chyba(chyby, r, 'Napis: pridej-do-pole $seznam hodnota'); break; }
          const vE = vyrazZeZbytku(zb, 1, chyby, r);
          const kE = JSON.stringify(cilE.hodnota);
          pridejKod('__prom[' + kE + '] = __naPole(__prom[' + kE + ']).slice(); __prom[' + kE + '].push(' + vE + ');');
          break;
        }
        case 'serad': {
          const cilR = zb[0];
          if (!cilR || cilR.typ !== 'prom') { chyba(chyby, r, 'Napis: serad $seznam'); break; }
          const kR = JSON.stringify(cilR.hodnota);
          pridejKod('__prom[' + kR + '] = __naPole(__prom[' + kR + ']).slice().sort(function (a, b) { if (__jeCislo(a) && __jeCislo(b)) return __cislo(a) - __cislo(b); return (String(a) < String(b)) ? -1 : ((String(a) > String(b)) ? 1 : 0); });');
          break;
        }
        case 'odstran': {
          const cilT = zb[0];
          if (!cilT || cilT.typ !== 'prom') { chyba(chyby, r, 'Napis: odstran $seznam 0'); break; }
          const iT = vyrazZeZbytku(zb, 1, chyby, r);
          const kT = JSON.stringify(cilT.hodnota);
          pridejKod('__prom[' + kT + '] = __naPole(__prom[' + kT + ']).slice(); __prom[' + kT + '].splice(Math.round(__cislo(' + iT + ')), 1);');
          break;
        }
        case 'cekej': {
          if (!zb[0]) { chyba(chyby, r, 'Napis: cekej 1000 nazev-akce'); break; }
          const msC = vyraz(novyP([zb[0]], chyby, r));
          const nC = slovoNa(zb, 1);
          if (!nC || !/^[A-Za-z0-9_-]+$/.test(nC)) { chyba(chyby, r, 'Napis: cekej 1000 nazev-akce'); break; }
          pouziteAkce.push({ nazev: nC, radek: r });
          pridejKod('setTimeout(function () { var f = __akce[' + JSON.stringify(nC) + ']; if (f) f(); }, ' + msC + ');');
          break;
        }
        case 'prehraj': {
          const adrZ = textNa(zb, 0);
          if (adrZ === null) { chyba(chyby, r, 'Napis: prehraj "https://adresa-zvuku"'); break; }
          pridejKod('__prehraj(' + JSON.stringify(adrZ) + ');');
          break;
        }
        case 'komponenta': {
          if (!jenVeStrance(r)) break;
          const nKomp = slovoNa(zb, 0);
          if (!nKomp || !/^[A-Za-z0-9_-]+$/.test(nKomp)) { chyba(chyby, r, 'Napis: komponenta nazev-komponenty'); break; }
          if (komponenty[nKomp] !== undefined) varovani(chyby, r, 'Komponenta "' + nKomp + '" je v kodu dvakrat. Pouzije se pozdejsi verze.');
          zasobnik.push({ typ: 'komponenta', nazev: nKomp, radek: r, html: [] });
          break;
        }
        case 'vloz': {
          if (!jenVeStrance(r)) break;
          const nVloz = slovoNa(zb, 0);
          if (!nVloz || !/^[A-Za-z0-9_-]+$/.test(nVloz)) { chyba(chyby, r, 'Napis: vloz nazev-komponenty'); break; }
          vlozPozadavky.push({ nazev: nVloz, radek: r });
          pridej('<!--CWK:' + nVloz + '-->');
          break;
        }
        case 'podstranka': {
          if (!jenVeStrance(r)) break;
          if (zasobnik.length) { chyba(chyby, r, 'Podstranka musi byt na nejvyssi urovni - ne uvnitr karty, bloku nebo seznamu.'); break; }
          let iSt = 0;
          let idSt = null;
          if (zb[0] && zb[0].typ === 'id') { idSt = zb[0].hodnota; iSt = 1; }
          if (!idSt) { chyba(chyby, r, 'Napis: podstranka #nazev Nazev stranky'); break; }
          let uzJeSt = false;
          for (let kSt = 0; kSt < stranky.length; kSt++) if (stranky[kSt].id === idSt) uzJeSt = true;
          if (uzJeSt) { chyba(chyby, r, 'Podstranka #' + idSt + ' je v kodu dvakrat. Jednu prejmenuj.'); break; }
          const sSt = textNeboZbytek(zb, iSt);
          if (sSt === null) { chyba(chyby, r, 'Napis: podstranka #nazev Nazev stranky'); break; }
          zasobnik.push({ typ: 'podstranka', id: idSt, nazev: sSt, radek: r, html: [] });
          break;
        }
        case 'menu': {
          if (!jenVeStrance(r)) break;
          maMenu = true;
          pridej('<!--CWM-->');
          break;
        }
        case 'jdi-na': {
          const cilSt = zb[0];
          if (!cilSt || cilSt.typ !== 'id') { chyba(chyby, r, 'Napis: jdi-na #nazev-stranky, nebo jdi-na #uvod pro prvni stranku'); break; }
          // #uvod znamena prvni (domovska) stranka, ktera nema vlastni blok.
          const idStranky = cilSt.hodnota === 'uvod' ? '__uvod' : cilSt.hodnota;
          pouziteStranky.push({ id: idStranky, radek: r });
          pridejKod('__ukazCast(' + JSON.stringify(idStranky) + ');');
          break;
        }
        default:
          chyba(chyby, r, 'Prikaz "' + prikaz + '" neznam. Klikni na Napoveda a podivej se na seznam prikazu.');
      }
    }

    if (akceNyni) {
      chyba(chyby, akceNyni.radek, 'Akce "' + akceNyni.nazev + '" neni ukoncena prikazem konec.');
      dokonciAkci();
    }
    while (zasobnik.length) {
      const v = zasobnik.pop();
      chyba(chyby, v.radek, 'Blok ' + v.typ + ' z radku ' + v.radek + ' neni ukonceny prikazem konec.');
      pridej(v.otevreni + v.html.join('') + v.zavirac);
    }
    for (let k = 0; k < pouziteAkce.length; k++) {
      const pouzita = pouziteAkce[k];
      let nalezena = false;
      for (let j = 0; j < akceSeznam.length; j++) if (akceSeznam[j].nazev === pouzita.nazev) nalezena = true;
      if (!nalezena) {
        chyba(chyby, pouzita.radek, 'Tlacitko spousti akci "' + pouzita.nazev + '", ale takova akce v kodu neni.');
      }
    }

    const teloAkci = akceSeznam.map(function (a) {
      return JSON.stringify(a.nazev) + ': function () {\n' + a.telo.join('\n') + '\n}';
    });

    const skript =
      '(function () {\n' + RUNTIME.join('\n') + '\n' +
      'var __akce = {\n' + teloAkci.join(',\n') + '\n};\n' +
      startJs.join('\n') + '\n' +
      'var seznam = document.querySelectorAll("[data-cw-akce]");\n' +
      'for (var i = 0; i < seznam.length; i++) {\n' +
      '  (function (prvek) {\n' +
      '    prvek.addEventListener("click", function () {\n' +
      '      var f = __akce[prvek.getAttribute("data-cw-akce")];\n' +
      '      if (f) f();\n' +
      '    });\n' +
      '  })(seznam[i]);\n' +
      '}\n' +
      'var __odk = document.querySelectorAll("[data-cw-cast-link]");\n' +
      'for (var j = 0; j < __odk.length; j++) {\n' +
      '  (function (tl) {\n' +
      '    tl.addEventListener("click", function () {\n' +
      '      __ukazCast(tl.getAttribute("data-cw-cast-link"));\n' +
      '    });\n' +
      '  })(__odk[j]);\n' +
      '}\n' +
      '})();\n';

    // ---- sestaveni stranek, menu a komponent
    // Dela se az na konci, aby se daly veci psat v libovolnem poradi.
    for (let k = 0; k < vlozPozadavky.length; k++) {
      const pz = vlozPozadavky[k];
      if (komponenty[pz.nazev] === undefined) {
        chyba(chyby, pz.radek, 'Komponenta "' + pz.nazev + '" neni nikde definovana. Napis komponenta ' + pz.nazev + ', obsah a konec.');
      }
    }
    for (let k = 0; k < pouziteStranky.length; k++) {
      const ps = pouziteStranky[k];
      if (ps.id === '__uvod') continue;
      let znama = false;
      for (let j = 0; j < stranky.length; j++) if (stranky[j].id === ps.id) znama = true;
      if (!znama) chyba(chyby, ps.radek, 'Stranka #' + ps.id + ' neexistuje. Napis podstranka #' + ps.id + ' Nazev a obsah.');
    }
    if (stranky.length && !maMenu) {
      varovani(chyby, stranky[0].radek, 'Mas podstranky, ale nikde neni prikaz menu. Bez nej se na ne neda kliknout.');
    }

    let menuHtml = '';
    if (maMenu) {
      menuHtml = '<nav class="cw-menu">';
      menuHtml += '<button type="button" class="cw-menu-tlacitko" data-cw-cast-link="__uvod">Domu</button>';
      for (let k = 0; k < stranky.length; k++) {
        menuHtml += '<button type="button" class="cw-menu-tlacitko" data-cw-cast-link="' + ochrana(stranky[k].id) + '">' + ochrana(stranky[k].nazev) + '</button>';
      }
      menuHtml += '</nav>';
    }

    let obsahStranky = '<div class="cw-page" data-cw-cast="__uvod">\n' + telo.join('\n') + '\n</div>';
    for (let k = 0; k < castiHtml.length; k++) obsahStranky += '\n' + castiHtml[k];
    obsahStranky = obsahStranky.split('<!--CWM-->').join('');
    for (let pruchod = 0; pruchod < 10; pruchod++) {
      if (obsahStranky.indexOf('<!--CWK:') < 0) break;
      Object.keys(komponenty).forEach(function (nz) {
        obsahStranky = obsahStranky.split('<!--CWK:' + nz + '-->').join(komponenty[nz]);
      });
    }
    if (obsahStranky.indexOf('<!--CWK:') >= 0) {
      chyba(chyby, 1, 'Nektera komponenta vklada sama sebe dokola.');
    }
    obsahStranky = menuHtml + '\n' + obsahStranky;

    const trida = ['v-' + vzhled, 'f-' + font, 'z-' + zarovnani].join(' ');
    let styl = '';
    if (pozadi) styl += 'background:' + pozadi + ';';
    if (barvaTextu) styl += 'color:' + barvaTextu + ';';

    const html =
      '<!DOCTYPE html>\n<html lang="cs">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + ochrana(nazevStranky) + '</title>\n' +
      '<style>\n' + STYL.join('\n') + '\n</style>\n</head>\n' +
      '<body class="' + trida + '"' + (styl ? ' style="' + styl + '"' : '') + '>\n' +
      '<div class="cw-stranka">\n' + obsahStranky + '\n</div>\n' +
      '<script>\n' + skript + '</script>\n</body>\n</html>\n';

    return { html: html, chyby: chyby, nazev: nazevStranky, akce: akceSeznam.map(function (a) { return a.nazev; }) };
  }

  // ---------------------------------------------------------------- pomocne funkce ve vysledne strance
  const RUNTIME = [
    'var __prom = {};',
    'function __ukazCast(id) {',
    '  var casti = document.querySelectorAll("[data-cw-cast]");',
    '  for (var i = 0; i < casti.length; i++) {',
    '    casti[i].style.display = (casti[i].getAttribute("data-cw-cast") === id) ? "" : "none";',
    '  }',
    '  var odk = document.querySelectorAll("[data-cw-cast-link]");',
    '  for (var j = 0; j < odk.length; j++) {',
    '    var vybrany = odk[j].getAttribute("data-cw-cast-link") === id;',
    '    odk[j].className = vybrany ? "cw-menu-tlacitko cw-menu-vybrano" : "cw-menu-tlacitko";',
    '  }',
    '}',
    'function __prvek(n) { return document.getElementById("cw-" + n); }',
    'function __jeVstup(e) { return !!e && (e.tagName === "INPUT" || e.tagName === "TEXTAREA" || e.tagName === "SELECT"); }',
    'function __cti(n) { var e = __prvek(n); if (!e) return ""; if (e.type === "checkbox") return e.checked ? 1 : 0; return __jeVstup(e) ? e.value : e.textContent; }',
    'function __p(n) { return __prom.hasOwnProperty(n) ? __prom[n] : ""; }',
    'function __cislo(x) { var n = parseFloat(String(x).replace(",", ".")); return isNaN(n) ? 0 : n; }',
    'function __jeCislo(x) { if (x === null || x === undefined) return false; var s = String(x).replace(",", ".").trim(); return s !== "" && !isNaN(Number(s)); }',
    'function __sec(a, b) { if (__jeCislo(a) && __jeCislo(b)) return __cislo(a) + __cislo(b); return String(a) + String(b); }',
    'function __od(a, b) { return __cislo(a) - __cislo(b); }',
    'function __krat(a, b) { return __cislo(a) * __cislo(b); }',
    'function __del(a, b) { var d = __cislo(b); if (d === 0) return 0; return __cislo(a) / d; }',
    'function __rovno(a, b) { if (__jeCislo(a) && __jeCislo(b)) return __cislo(a) === __cislo(b); return String(a) === String(b); }',
    'function __vetsi(a, b) { return __cislo(a) > __cislo(b); }',
    'function __mensi(a, b) { return __cislo(a) < __cislo(b); }',
    'function __vetsiRovno(a, b) { return __cislo(a) >= __cislo(b); }',
    'function __mensiRovno(a, b) { return __cislo(a) <= __cislo(b); }',
    'function __delka(x) { return String(x).length; }',
    'function __zaokrouhli(x) { return Math.round(__cislo(x)); }',
    'function __nahodne(a, b) {',
    '  var od = Math.round(__cislo(a));',
    '  var do2 = Math.round(__cislo(b));',
    '  if (do2 < od) { var t = od; od = do2; do2 = t; }',
    '  return Math.floor(Math.random() * (do2 - od + 1)) + od;',
    '}',
    'function __pis(n, v) {',
    '  var e = __prvek(n);',
    '  if (!e) return;',
    '  if (__jeVstup(e)) e.value = v; else e.textContent = v;',
    '}',
    'function __pridejDo(n, v) {',
    '  var e = __prvek(n);',
    '  if (!e) return;',
    '  if (__jeVstup(e)) e.value = String(e.value) + String(v); else e.textContent = String(e.textContent) + String(v);',
    '}',
    'function __skryj(n, skryt) { var e = __prvek(n); if (e) e.style.display = skryt ? "none" : ""; }',
    'function __obarvi(n, b) { var e = __prvek(n); if (e) e.style.color = b; }',
    'function __okno(v) { alert(String(v)); }',
    'function __prejdi(a) { location.href = String(a); }',
    'function __posun(n, x, y) {',
    '  var e = __prvek(n);',
    '  if (!e) return;',
    '  e.style.position = "relative";',
    '  e.style.left = ((parseFloat(e.style.left) || 0) + __cislo(x)) + "px";',
    '  e.style.top = ((parseFloat(e.style.top) || 0) + __cislo(y)) + "px";',
    '}',
    'function __velikost(n, w) { var e = __prvek(n); if (e) e.style.width = __cislo(w) + "px"; }',
    'function __zapis(k, v) { try { localStorage.setItem("cw-" + k, String(v)); } catch (e) {} }',
    'function __nacti(k) { try { var v = localStorage.getItem("cw-" + k); return v === null ? "" : v; } catch (e) { return ""; } }',
    'function __naPole(x) { return (x && x.constructor === Array) ? x : []; }',
    'function __vezmi(a, i) { var p = __naPole(a); var k = Math.round(__cislo(i)); return (k >= 0 && k < p.length) ? p[k] : ""; }',
    'function __pocet(a) { return __naPole(a).length; }',
    'function __spojPole(a, o) { return __naPole(a).join(String(o)); }',
    'function __slova(x) { var s = String(x).split(" "); var v = []; for (var i = 0; i < s.length; i++) { if (s[i] !== "") v.push(s[i]); } return v; }',
    'function __nahodneZPole(a) { var p = __naPole(a); if (!p.length) return ""; return p[Math.floor(Math.random() * p.length)]; }',
    'function __obsahujePole(a, h) { var p = __naPole(a); for (var i = 0; i < p.length; i++) { if (String(p[i]) === String(h)) return 1; } return 0; }',
    'function __prehraj(a) { try { var z = new Audio(String(a)); z.play(); } catch (e) {} }',
    'function __nahodnaBarva() {',
    '  var b = ["#e03131", "#2f6fed", "#2f9e44", "#f2c037", "#f08c00", "#7048e8", "#e64980", "#15aabf", "#8a5a2b", "#868e96"];',
    '  return b[Math.floor(Math.random() * b.length)];',
    '}',
    'var __barvy = {};',
    'var __tloustky = {};',
    'function __platnoEl(n) { return document.getElementById("cw-" + n); }',
    'function __kontext(n) { var p = __platnoEl(n); if (!p || !p.getContext) return null; return p.getContext("2d"); }',
    'function __nastavBarvu(n, b) { __barvy[n] = b; }',
    'function __nastavTloustku(n, t) { __tloustky[n] = __cislo(t); }',
    'function __barvaKresleni(n) { return __barvy[n] || "#101418"; }',
    'function __tloustkaKresleni(n) { return __tloustky[n] || 2; }',
    'function __vycisti(n) { var c = __kontext(n); if (c) c.clearRect(0, 0, c.canvas.width, c.canvas.height); }',
    'function __obdelnik(n, x, y, w, h, b) { var c = __kontext(n); if (!c) return; c.fillStyle = b || __barvaKresleni(n); c.fillRect(__cislo(x), __cislo(y), __cislo(w), __cislo(h)); }',
    'function __kruh(n, x, y, r, b) { var c = __kontext(n); if (!c) return; c.fillStyle = b || __barvaKresleni(n); c.beginPath(); c.arc(__cislo(x), __cislo(y), Math.abs(__cislo(r)), 0, Math.PI * 2); c.fill(); }',
    'function __cara(n, x1, y1, x2, y2, b) { var c = __kontext(n); if (!c) return; c.strokeStyle = b || __barvaKresleni(n); c.lineWidth = __tloustkaKresleni(n); c.beginPath(); c.moveTo(__cislo(x1), __cislo(y1)); c.lineTo(__cislo(x2), __cislo(y2)); c.stroke(); }',
    'function __textPlatno(n, x, y, t, b) { var c = __kontext(n); if (!c) return; c.fillStyle = b || __barvaKresleni(n); c.font = "16px sans-serif"; c.fillText(String(t), __cislo(x), __cislo(y)); }',
    'function __pozadi(n, b) { var e = __prvek(n); if (e) e.style.background = b; }',
    'function __ohranic(n, b, t) { var e = __prvek(n); if (e) e.style.border = __cislo(t) + "px solid " + b; }',
    'function __zaobli(n, t) { var e = __prvek(n); if (e) e.style.borderRadius = __cislo(t) + "px"; }',
    'function __pruhlednost(n, o) { var e = __prvek(n); if (e) e.style.opacity = String(__cislo(o)); }',
    'function __otoc(n, s) { var e = __prvek(n); if (e) e.style.transform = "rotate(" + __cislo(s) + "deg)"; }',
    'function __smaz(n) { var e = __prvek(n); if (e && e.parentNode) e.parentNode.removeChild(e); }',
    'function __priUdalosti(n, u, a) {',
    '  var e = __prvek(n);',
    '  if (!e) return;',
    '  e.addEventListener(u, function () { var f = __akce[a]; if (f) f(); });',
    '}'
  ];

  // ---------------------------------------------------------------- vzhled vysledne stranky
  const STYL = [
    '* { box-sizing: border-box; }',
    'body { margin: 0; font-family: "Segoe UI", system-ui, -apple-system, Arial, sans-serif; font-size: 17px; line-height: 1.65; background: #f4f6fb; color: #1b2430; }',
    '.cw-stranka { max-width: 840px; margin: 0 auto; padding: 48px 22px 80px; }',
    'h1 { font-size: 34px; line-height: 1.2; margin: 0 0 14px; }',
    'h2 { font-size: 22px; line-height: 1.3; margin: 26px 0 10px; }',
    'p { margin: 0 0 14px; }',
    '.cw-karta { background: #ffffff; border: 1px solid #e2e8f2; border-radius: 14px; padding: 20px 22px; margin: 0 0 18px; box-shadow: 0 2px 12px rgba(18, 28, 45, 0.06); }',
    '.cw-blok { margin: 0 0 18px; }',
    '.cw-seznam { margin: 0 0 18px; padding-left: 22px; }',
    '.cw-seznam li { margin: 0 0 6px; }',
    '.cw-tlacitko { font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; border: 0; border-radius: 10px; padding: 11px 20px; background: #2f6fed; color: #ffffff; margin: 0 8px 10px 0; }',
    '.cw-tlacitko:hover { filter: brightness(1.08); }',
    '.cw-tlacitko:active { transform: translateY(1px); }',
    '.cw-vstup { font: inherit; font-size: 15px; padding: 10px 12px; border: 1px solid #cdd7e6; border-radius: 9px; background: #ffffff; color: inherit; margin: 0 10px 12px 0; min-width: 240px; max-width: 100%; }',
    '.cw-odkaz { color: #2f6fed; }',
    '.cw-obrazek { display: block; max-width: 100%; height: auto; border-radius: 12px; margin: 0 0 18px; }',
    '.cw-linka { border: 0; border-top: 1px solid #e2e8f2; margin: 28px 0; }',
    '.cw-mezera { height: 26px; }',
    '.cw-platno { display: block; border: 1px solid #cdd7e6; border-radius: 10px; background: #ffffff; max-width: 100%; margin: 0 0 16px; }',
    '.cw-volba { display: block; margin: 0 0 12px; cursor: pointer; }',
    '.cw-volba input { width: 18px; height: 18px; vertical-align: -3px; margin-right: 7px; }',
    '.cw-vyber { font: inherit; font-size: 15px; padding: 10px 12px; border: 1px solid #cdd7e6; border-radius: 9px; background: #ffffff; color: inherit; margin: 0 10px 12px 0; min-width: 200px; max-width: 100%; }',
    'body.v-tmavy { background: #0f141a; color: #e7eef7; }',
    'body.v-tmavy .cw-karta { background: #161d26; border-color: #253140; box-shadow: none; }',
    'body.v-tmavy .cw-vstup { background: #121821; border-color: #2b3648; color: #e7eef7; }',
    'body.v-tmavy .cw-vyber { background: #121821; border-color: #2b3648; color: #e7eef7; }',
    'body.v-tmavy .cw-linka { border-color: #253140; }',
    'body.v-barevny { background: linear-gradient(140deg, #16224a, #3b1c58); color: #f3f5ff; }',
    'body.v-barevny .cw-karta { background: rgba(255, 255, 255, 0.10); border-color: rgba(255, 255, 255, 0.18); box-shadow: none; }',
    'body.v-barevny .cw-vstup { background: rgba(255, 255, 255, 0.12); border-color: rgba(255, 255, 255, 0.25); color: #ffffff; }',
    'body.v-barevny .cw-vyber { background: rgba(255, 255, 255, 0.12); border-color: rgba(255, 255, 255, 0.25); color: #ffffff; }',
    'body.v-barevny .cw-tlacitko { background: #ffd166; color: #20160a; }',
    'body.v-barevny .cw-linka { border-color: rgba(255, 255, 255, 0.2); }',
    'body.v-minimal { background: #ffffff; color: #111111; }',
    'body.v-minimal .cw-karta { border-color: #e8e8e8; border-radius: 0; box-shadow: none; }',
    'body.f-maly { font-size: 15px; }',
    'body.f-velky { font-size: 20px; }',
    'body.z-stred .cw-stranka { text-align: center; }',
    'body.z-stred .cw-seznam { display: inline-block; text-align: left; }',
    'body.z-vpravo .cw-stranka { text-align: right; }',
    '.cw-menu { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 26px; padding-bottom: 14px; border-bottom: 1px solid #e2e8f2; }',
    '.cw-menu-tlacitko { font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid transparent; background: transparent; color: #2f6fed; padding: 7px 13px; border-radius: 8px; }',
    '.cw-menu-tlacitko:hover { background: #eef3fd; }',
    '.cw-menu-vybrano { color: #1b2430; background: #eef3fd; }',
    'body.v-tmavy .cw-menu { border-color: #253140; }',
    'body.v-tmavy .cw-menu-tlacitko { color: #8fc7ff; }',
    'body.v-tmavy .cw-menu-tlacitko:hover { background: #1b2735; }',
    'body.v-tmavy .cw-menu-vybrano { background: #1b2735; color: #ffffff; }',
    'body.v-barevny .cw-menu { border-color: rgba(255, 255, 255, 0.2); }',
    'body.v-barevny .cw-menu-tlacitko { color: #ffe08a; }',
    'body.v-barevny .cw-menu-tlacitko:hover { background: rgba(255, 255, 255, 0.14); }',
    'body.v-barevny .cw-menu-vybrano { background: rgba(255, 255, 255, 0.16); color: #ffffff; }',
    'html { -webkit-text-size-adjust: 100%; }',
    '@media (max-width: 640px) {',
    '  .cw-stranka { padding: 30px 16px 64px; }',
    '  h1 { font-size: 26px; }',
    '  h2 { font-size: 19px; }',
    '  .cw-karta { padding: 16px; }',
    '  .cw-vstup, .cw-vyber { min-width: 0; width: 100%; margin: 0 0 12px; }',
    '  .cw-tlacitko { padding: 12px 18px; }',
    '  .cw-platno { width: 100%; height: auto; }',
    '  .cw-menu { flex-wrap: nowrap; overflow-x: auto; }',
    '  .cw-menu-tlacitko { flex: none; }',
    '}'
  ];

  return { preved: preved };
})();
