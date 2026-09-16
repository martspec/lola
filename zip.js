// zip.js - mini zapisovac formatu ZIP (bez komprese, metoda STORE)
// Vysledkem je platny .zip soubor, ktery otevre Windows, macOS i hostovaci sluzby.

const ZIP = (function () {
  'use strict';

  const TABULKA = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = TABULKA[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  // soubory: [{ nazev: "index.html", obsah: "..." }]
  function vytvor(soubory) {
    const enc = new TextEncoder();
    const telo = [];
    const centrum = [];
    let offset = 0;

    const ted = new Date();
    const cas = ((ted.getHours() << 11) | (ted.getMinutes() << 5) | Math.floor(ted.getSeconds() / 2)) & 0xFFFF;
    const datum = (((ted.getFullYear() - 1980) << 9) | ((ted.getMonth() + 1) << 5) | ted.getDate()) & 0xFFFF;

    for (const s of soubory) {
      const data = enc.encode(s.obsah);
      const nazev = enc.encode(s.nazev);
      const crc = crc32(data);

      const hlava = new Uint8Array(30 + nazev.length);
      const dh = new DataView(hlava.buffer);
      dh.setUint32(0, 0x04034b50, true);
      dh.setUint16(4, 20, true);
      dh.setUint16(6, 0x0800, true);
      dh.setUint16(8, 0, true);
      dh.setUint16(10, cas, true);
      dh.setUint16(12, datum, true);
      dh.setUint32(14, crc, true);
      dh.setUint32(18, data.length, true);
      dh.setUint32(22, data.length, true);
      dh.setUint16(26, nazev.length, true);
      dh.setUint16(28, 0, true);
      hlava.set(nazev, 30);
      telo.push(hlava, data);

      const zaznam = new Uint8Array(46 + nazev.length);
      const dz = new DataView(zaznam.buffer);
      dz.setUint32(0, 0x02014b50, true);
      dz.setUint16(4, 20, true);
      dz.setUint16(6, 20, true);
      dz.setUint16(8, 0x0800, true);
      dz.setUint16(10, 0, true);
      dz.setUint16(12, cas, true);
      dz.setUint16(14, datum, true);
      dz.setUint32(16, crc, true);
      dz.setUint32(20, data.length, true);
      dz.setUint32(24, data.length, true);
      dz.setUint16(28, nazev.length, true);
      dz.setUint16(30, 0, true);
      dz.setUint16(32, 0, true);
      dz.setUint16(34, 0, true);
      dz.setUint16(36, 0, true);
      dz.setUint32(38, 0, true);
      dz.setUint32(42, offset, true);
      zaznam.set(nazev, 46);
      centrum.push(zaznam);

      offset += hlava.length + data.length;
    }

    let velikostCentra = 0;
    for (const z of centrum) velikostCentra += z.length;

    const konec = new Uint8Array(22);
    const dk = new DataView(konec.buffer);
    dk.setUint32(0, 0x06054b50, true);
    dk.setUint16(4, 0, true);
    dk.setUint16(6, 0, true);
    dk.setUint16(8, soubory.length, true);
    dk.setUint16(10, soubory.length, true);
    dk.setUint32(12, velikostCentra, true);
    dk.setUint32(16, offset, true);
    dk.setUint16(20, 0, true);

    return new Blob(telo.concat(centrum, [konec]), { type: 'application/zip' });
  }

  function stahni(blob, nazevSouboru) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nazevSouboru;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  return { vytvor: vytvor, stahni: stahni };
})();
