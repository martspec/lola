// ai.js - AI pomocnik, ktery bezi primo v prohlizeci (WebLLM)
// Model se jednou stahne do cache prohlizece a pak uz se pocitá u tebe v pocitaci.
// Nic se neposila na zadny server. Vyuziva Editor a NAPOVEDA z ostatnich souboru.

(function () {
  'use strict';

  // Knihovna se nacita z CDN jen kdyz clovek AI opravdu otevre.
  const ADRESA_WEBLLM = 'https://esm.run/@mlc-ai/web-llm';

  const $ = function (id) { return document.getElementById(id); };
  const panel = $('ai');
  const btnAi = $('btn-ai');
  const btnNacti = $('ai-nacti');
  const btnPosli = $('ai-posli');
  const vyberModelu = $('ai-model');
  const vstup = $('ai-vstup');
  const log = $('ai-log');
  const aiStav = $('ai-stav');

  if (!panel || !btnAi || !log) return;

  const hlavni = document.querySelector('main');
  let knihovna = null;      // nactena knihovna web-llm
  let engine = null;        // spusteny model
  let historie = [];        // prubeh rozhovoru
  let bezi = false;         // aby se nedalo poslat dvakrat naraz
  let seznamHotov = false;  // jestli uz je nabidka modelu nactena

  // ------------------------------------------------------------------ pomucky
  function nastavStav(text, chyba) {
    aiStav.textContent = text;
    aiStav.className = chyba ? 'stav chyba' : 'stav';
  }

  function pridejZpravu(kdo, text) {
    const obal = document.createElement('div');
    obal.className = 'ai-zprava ' + (kdo === 'ja' ? 'ja' : 'bot');
    const bublina = document.createElement('div');
    bublina.className = 'ai-bublina';
    bublina.textContent = text;
    obal.appendChild(bublina);
    log.appendChild(obal);
    log.scrollTop = log.scrollHeight;
    return bublina;
  }

  // Vezme z odpovedi jen kod. Kdyz je v ``` bloku, pouzije ten.
  function vytahniKod(text) {
    const s = String(text == null ? '' : text);
    const bloky = s.split('```');
    const kusy = [];
    for (let i = 1; i < bloky.length; i += 2) kusy.push(bloky[i]);
    if (kusy.length) {
      let k = kusy.join('\n');
      // odstranime jazyk na prvnim radku (napr. ```ceskyweb)
      k = k.replace(/^[ \t]*[A-Za-z0-9_+-]*[ \t]*\r?\n/, '');
      return k.trim();
    }
    return s.trim();
  }

  // Vlozi kod do editoru a da ostatnim castem programu vedet, ze se zmenil.
  function dejDoEditoru(kod) {
    if (typeof Editor === 'undefined') return;
    Editor.nastav(kod);
    const ta = $('kod');
    if (ta) ta.dispatchEvent(new Event('input', { bubbles: true }));
    Editor.zamer();
  }

  // ------------------------------------------------------------------ zadani pro model
  function systemPrompt() {
    let seznam = '';
    if (typeof NAPOVEDA !== 'undefined' && NAPOVEDA.prikazy) {
      NAPOVEDA.prikazy.forEach(function (p) {
        seznam += '- ' + p.klic + ' : ' + p.popis + ' (ukazka: ' + p.ukazka + ')\n';
      });
    }
    let soucasny = '';
    if (typeof Editor !== 'undefined') {
      soucasny = String(Editor.ziskej() || '').slice(0, 2000);
    }
    return 'Jsi pomocnik, ktery pise kod v jazyce CeskyWeb. ' +
      'Je to cesky jazyk pro vyrobu webovych stranek. Odpovidej cesky.\n' +
      'Vracej POUZE kod v jazyce CeskyWeb. Nepouzivej HTML, CSS ani JavaScript. ' +
      'Kazdy prikaz pis na vlastni radek. Kdyz neco nevysvetlujes, jen vrat kod.\n\n' +
      'Prikazy jazyka:\n' + seznam + '\n' +
      'Pravidla: prvek na strance ma jmeno se znakem #, promenna znak $. ' +
      'Tlacitko spousti akci zapsanou slovem akce. U textu se uvozovky psat nemusi.\n\n' +
      'Kod, ktery je prave v editoru:\n' + (soucasny || '(prazdno)');
  }

  // ------------------------------------------------------------------ nacteni knihovny a modelu
  function vyberVychozi(modely) {
    const vzory = ['1.5B', '1B', '2B', '3B'];
    for (let v = 0; v < vzory.length; v++) {
      for (let m = 0; m < modely.length; m++) {
        if (modely[m].id.indexOf(vzory[v]) >= 0 && modely[m].id.indexOf('q4f16') >= 0) return modely[m].id;
      }
    }
    return modely.length ? modely[0].id : '';
  }

  async function nactiKnihovnu() {
    if (knihovna) return knihovna;
    nastavStav('nacitam knihovnu...', false);
    knihovna = await import(ADRESA_WEBLLM);
    return knihovna;
  }

  async function naplnSeznamModelu() {
    if (seznamHotov) return;
    const lib = await nactiKnihovnu();
    const cfg = lib && lib.prebuiltAppConfig;
    if (!cfg || !cfg.model_list || !cfg.model_list.length) {
      throw new Error('Seznam modelu se nepodarilo precist.');
    }
    const modely = cfg.model_list.map(function (m) {
      return { id: m.model_id, vram: m.vram_required_MB || 0 };
    });
    modely.sort(function (a, b) { return a.id < b.id ? -1 : 1; });
    const vychozi = vyberVychozi(modely);
    modely.forEach(function (m) {
      const o = document.createElement('option');
      o.value = m.id;
      o.textContent = m.id + (m.vram ? '  (' + Math.round(m.vram) + ' MB)' : '');
      vyberModelu.appendChild(o);
    });
    if (vychozi) vyberModelu.value = vychozi;
    seznamHotov = true;
    nastavStav('vyber model a stiskni Stahnout', false);
  }

  async function nactiModel() {
    const id = vyberModelu.value;
    if (!id) { nastavStav('neni vybrany model', true); return; }
    if (engine) { nastavStav('model uz je spusteny', false); return; }
    // WebGPU je podminka - bez nej se model v prohlizeci vubec nespusti.
    // Kontrola je tady, aby clovek nestahoval gigabajty zbytecne.
    if (!navigator.gpu) {
      nastavStav('prohlizec neumi WebGPU', true);
      pridejZpravu('bot', 'Tvuj prohlizec neumi WebGPU, proto v nem model spustit nelze. ' +
        'Zkus nejnovejsi Chrome nebo Edge. Pokud je stranka otevrena dvojklikem ze souboru, ' +
        'musi bezet pres http - nahraj ji na hosting.');
      return;
    }
    btnNacti.disabled = true;
    try {
      const lib = await nactiKnihovnu();
      nastavStav('stahuji model, muze to trvat i nekolik minut', false);
      pridejZpravu('bot', 'Stahuji model ' + id + '. Pri prvnim spusteni to muze trvat i nekolik minut, ' +
        'protoze se model uklada do prohlizece. Prubeh vidis vpravo nahore.');
      engine = await lib.CreateMLCEngine(id, {
        initProgressCallback: function (r) {
          const text = (r && r.text) ? r.text : 'nacitam model...';
          const proc = (r && typeof r.progress === 'number') ? Math.round(r.progress * 100) : null;
          nastavStav(proc === null ? text : text + ' ' + proc + ' %', false);
        }
      });
      nastavStav('model je pripraven', false);
      pridejZpravu('bot', 'Model je pripraven. Napis, co chces vytvorit. Priklady: ' +
        '"udělej kalkulacku", "stranka o mne s obrazkem", "hra hadej cislo".');
      vstup.disabled = false;
      btnPosli.disabled = false;
      vstup.focus();
    } catch (e) {
      nastavStav('model se nepodarilo spustit', true);
      pridejZpravu('bot', 'Model se nepodarilo spustit. Duvod: ' + (e && e.message ? e.message : String(e)) +
        '\n\nNejcastejsi priciny: prohlizec neumi WebGPU, nebo stranka neni otevrena pres http ' +
        '(funguje na hostingu, ne dvojklikem ze souboru), nebo neni internet pri prvnim stahovani.');
    } finally {
      btnNacti.disabled = false;
    }
  }

  // ------------------------------------------------------------------ chat
  async function posli() {
    if (bezi) return;
    const dotaz = String(vstup.value || '').trim();
    if (!dotaz) return;
    if (!engine) { nastavStav('nejdriv stahni model', true); return; }

    bezi = true;
    btnPosli.disabled = true;
    vstup.value = '';
    pridejZpravu('ja', dotaz);

    const bublina = pridejZpravu('bot', '');
    let odpoved = '';
    bublina.textContent = '...';

    const zpravy = [{ role: 'system', content: systemPrompt() }];
    for (let i = 0; i < historie.length; i++) zpravy.push(historie[i]);
    zpravy.push({ role: 'user', content: dotaz });

    try {
      nastavStav('model pise...', false);
      const proud = await engine.chat.completions.create({
        messages: zpravy,
        stream: true,
        temperature: 0.7,
        max_tokens: 1024
      });
      for await (const cast of proud) {
        const volba = cast && cast.choices && cast.choices[0];
        const kus = volba && volba.delta && volba.delta.content ? volba.delta.content : '';
        if (!kus) continue;
        odpoved += kus;
        bublina.textContent = odpoved;
        log.scrollTop = log.scrollHeight;
      }
      if (!odpoved) {
        bublina.textContent = '(model nic nevratil)';
        nastavStav('model nic nevratil', true);
        bezi = false;
        btnPosli.disabled = false;
        return;
      }
      historie.push({ role: 'user', content: dotaz });
      historie.push({ role: 'assistant', content: odpoved });
      nastavStav('hotovo', false);
    } catch (e) {
      bublina.textContent = 'Chyba: ' + (e && e.message ? e.message : String(e));
      nastavStav('chyba pri odpovedi', true);
      bezi = false;
      btnPosli.disabled = false;
      return;
    }

    // Tlacitko pro vlozeni kodu do editoru.
    const kod = vytahniKod(odpoved);
    if (kod) {
      const tl = document.createElement('button');
      tl.type = 'button';
      tl.className = 'tlacitko ai-vlozit';
      tl.textContent = 'Dat do editoru';
      tl.addEventListener('click', function () { dejDoEditoru(kod); });
      const obal = bublina.parentNode;
      if (obal) obal.appendChild(tl);
    }

    bezi = false;
    btnPosli.disabled = false;
    vstup.focus();
  }

  // ------------------------------------------------------------------ panel
  function zavriNapovedu() {
    const nap = $('napoveda');
    if (nap && !nap.hasAttribute('hidden')) {
      nap.setAttribute('hidden', '');
      const bn = $('btn-napoveda');
      if (bn) bn.textContent = 'Napoveda';
    }
  }

  function prepni() {
    const skryta = panel.hasAttribute('hidden');
    if (skryta) {
      zavriNapovedu();
      const blokyPanel = $('bloky');
      if (blokyPanel && !blokyPanel.hasAttribute('hidden')) {
        blokyPanel.setAttribute('hidden', '');
        const btnBloky = $('btn-bloky');
        if (btnBloky) btnBloky.textContent = 'Bloky';
      }
      panel.removeAttribute('hidden');
      if (hlavni) hlavni.classList.add('s-panelem');
      btnAi.textContent = 'Zavrit AI';
      if (!seznamHotov) {
        naplnSeznamModelu().catch(function (e) {
          nastavStav('knihovnu se nepodarilo nacist', true);
          pridejZpravu('bot', 'Knihovnu pro AI se nepodarilo nacist z internetu. Duvod: ' +
            (e && e.message ? e.message : String(e)));
        });
      }
    } else {
      panel.setAttribute('hidden', '');
      if (hlavni) hlavni.classList.remove('s-panelem');
      btnAi.textContent = 'AI';
    }
  }

  btnAi.addEventListener('click', prepni);
  btnNacti.addEventListener('click', function () { nactiModel(); });
  btnPosli.addEventListener('click', function () { posli(); });

  vstup.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); posli(); }
  });

  // Upozorneni predem, kdyz stranka neni spustena pres http.
  if (window.location.protocol === 'file:') {
    const p = document.createElement('div');
    p.className = 'ai-pozor';
    p.textContent = 'Pozor: stranka je otevrena ze souboru. Model v prohlizeci potrebuje ' +
      'spusteni pres http (hosting nebo maly lokalni server), jinak se muze stat, ze se nenacte.';
    panel.insertBefore(p, log);
  }
})();
