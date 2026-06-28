/* Тратометр — XLSX-кодек (чтение и запись .xlsx) для офлайна.
   Сгенерирован и протестирован автоматически (round-trip против zlib).
   Публичный интерфейс: window.XLSX.read(Uint8Array) и window.XLSX.build(sheets). */
;(function(){
'use strict';
'use strict';

// ============================================================================
// RFC1951 raw DEFLATE decompression
// ============================================================================

function inflateRaw(bytes) {
  // Bit reader state
  let bytePos = 0;
  let bitBuf = 0;
  let bitCnt = 0;

  function getBit() {
    if (bitCnt === 0) {
      bitBuf = bytes[bytePos++];
      bitCnt = 8;
    }
    const b = bitBuf & 1;
    bitBuf >>= 1;
    bitCnt--;
    return b;
  }

  function getBits(n) {
    let v = 0;
    for (let i = 0; i < n; i++) {
      v |= getBit() << i;
    }
    return v;
  }

  // Output buffer (growable)
  let out = new Uint8Array(1024);
  let outPos = 0;
  function ensure(extra) {
    if (outPos + extra <= out.length) return;
    let cap = out.length;
    while (cap < outPos + extra) cap *= 2;
    const n = new Uint8Array(cap);
    n.set(out.subarray(0, outPos));
    out = n;
  }
  function pushByte(b) {
    ensure(1);
    out[outPos++] = b;
  }

  // Build a canonical Huffman decoder from a list of code lengths.
  function buildHuffman(lengths, n) {
    const counts = new Int32Array(16);
    for (let i = 0; i < n; i++) counts[lengths[i]]++;
    counts[0] = 0;
    const offsets = new Int32Array(16);
    for (let i = 1; i < 16; i++) offsets[i] = offsets[i - 1] + counts[i - 1];
    const symbols = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      if (lengths[i] !== 0) {
        symbols[offsets[lengths[i]]++] = i;
      }
    }
    return { counts, symbols };
  }

  function decodeSym(huff) {
    const counts = huff.counts;
    const symbols = huff.symbols;
    let code = 0;
    let first = 0;
    let index = 0;
    for (let len = 1; len <= 15; len++) {
      code |= getBit();
      const count = counts[len];
      if (code - first < count) {
        return symbols[index + (code - first)];
      }
      index += count;
      first += count;
      first <<= 1;
      code <<= 1;
    }
    throw new Error('inflateRaw: invalid Huffman code');
  }

  // Length/distance tables (RFC1951 3.2.5)
  const LENGTH_BASE = [
    3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59,
    67, 83, 99, 115, 131, 163, 195, 227, 258,
  ];
  const LENGTH_EXTRA = [
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5,
    5, 5, 5, 0,
  ];
  const DIST_BASE = [
    1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513,
    769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577,
  ];
  const DIST_EXTRA = [
    0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10,
    11, 11, 12, 12, 13, 13,
  ];

  // Fixed Huffman tables (built once per call)
  let fixedLit = null;
  let fixedDist = null;
  function buildFixed() {
    const litLengths = new Uint8Array(288);
    for (let i = 0; i < 144; i++) litLengths[i] = 8;
    for (let i = 144; i < 256; i++) litLengths[i] = 9;
    for (let i = 256; i < 280; i++) litLengths[i] = 7;
    for (let i = 280; i < 288; i++) litLengths[i] = 8;
    fixedLit = buildHuffman(litLengths, 288);
    const distLengths = new Uint8Array(30);
    for (let i = 0; i < 30; i++) distLengths[i] = 5;
    fixedDist = buildHuffman(distLengths, 30);
  }

  function inflateBlock(litHuff, distHuff) {
    for (;;) {
      const sym = decodeSym(litHuff);
      if (sym === 256) break; // end of block
      if (sym < 256) {
        pushByte(sym);
      } else {
        const li = sym - 257;
        if (li >= 29) throw new Error('inflateRaw: invalid length code');
        const length = LENGTH_BASE[li] + getBits(LENGTH_EXTRA[li]);
        const dsym = decodeSym(distHuff);
        if (dsym >= 30) throw new Error('inflateRaw: invalid distance code');
        const dist = DIST_BASE[dsym] + getBits(DIST_EXTRA[dsym]);
        if (dist > outPos) throw new Error('inflateRaw: distance too far back');
        ensure(length);
        let src = outPos - dist;
        for (let i = 0; i < length; i++) {
          out[outPos++] = out[src++];
        }
      }
    }
  }

  // Code length code order for dynamic blocks (RFC1951 3.2.7)
  const CLEN_ORDER = [
    16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15,
  ];

  let final = false;
  while (!final) {
    final = getBit() === 1;
    const type = getBits(2);
    if (type === 0) {
      // Stored block: align to byte boundary
      bitBuf = 0;
      bitCnt = 0;
      const len = bytes[bytePos] | (bytes[bytePos + 1] << 8);
      // nlen at bytePos+2..3 (one's complement; not strictly validated)
      bytePos += 4;
      ensure(len);
      for (let i = 0; i < len; i++) {
        out[outPos++] = bytes[bytePos++];
      }
    } else if (type === 1) {
      if (!fixedLit) buildFixed();
      inflateBlock(fixedLit, fixedDist);
    } else if (type === 2) {
      const hlit = getBits(5) + 257;
      const hdist = getBits(5) + 1;
      const hclen = getBits(4) + 4;
      const clenLengths = new Uint8Array(19);
      for (let i = 0; i < hclen; i++) {
        clenLengths[CLEN_ORDER[i]] = getBits(3);
      }
      const clenHuff = buildHuffman(clenLengths, 19);
      // Read literal+distance code lengths
      const allLengths = new Uint8Array(hlit + hdist);
      let i = 0;
      while (i < hlit + hdist) {
        const sym = decodeSym(clenHuff);
        if (sym < 16) {
          allLengths[i++] = sym;
        } else if (sym === 16) {
          const repeat = 3 + getBits(2);
          const prev = allLengths[i - 1];
          for (let r = 0; r < repeat; r++) allLengths[i++] = prev;
        } else if (sym === 17) {
          const repeat = 3 + getBits(3);
          for (let r = 0; r < repeat; r++) allLengths[i++] = 0;
        } else if (sym === 18) {
          const repeat = 11 + getBits(7);
          for (let r = 0; r < repeat; r++) allLengths[i++] = 0;
        } else {
          throw new Error('inflateRaw: invalid code length symbol');
        }
      }
      const litLengths = allLengths.subarray(0, hlit);
      const distLengths = allLengths.subarray(hlit, hlit + hdist);
      const litHuff = buildHuffman(litLengths, hlit);
      const distHuff = buildHuffman(distLengths, hdist);
      inflateBlock(litHuff, distHuff);
    } else {
      throw new Error('inflateRaw: invalid block type');
    }
  }

  return out.slice(0, outPos);
}

// ============================================================================
// ZIP parsing
// ============================================================================

function unzip(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const result = {};
  const decoder = new TextDecoder('utf-8');

  // Try to read the central directory for authoritative sizes/offsets.
  // Find End Of Central Directory record (signature 0x06054b50), searching
  // backwards from the end (allow for a trailing comment).
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }

  const central = {}; // filename -> { method, compSize, uncompSize, localOffset }
  let centralOk = false;
  if (eocd >= 0) {
    try {
      const cdCount = dv.getUint16(eocd + 10, true);
      const cdOffset = dv.getUint32(eocd + 16, true);
      let p = cdOffset;
      for (let n = 0; n < cdCount; n++) {
        if (dv.getUint32(p, true) !== 0x02014b50) break;
        const method = dv.getUint16(p + 10, true);
        const compSize = dv.getUint32(p + 20, true);
        const uncompSize = dv.getUint32(p + 24, true);
        const nameLen = dv.getUint16(p + 28, true);
        const extraLen = dv.getUint16(p + 30, true);
        const commentLen = dv.getUint16(p + 32, true);
        const localOffset = dv.getUint32(p + 42, true);
        const name = decoder.decode(bytes.subarray(p + 46, p + 46 + nameLen));
        central[name] = { method, compSize, uncompSize, localOffset };
        p += 46 + nameLen + extraLen + commentLen;
      }
      centralOk = true;
    } catch (e) {
      centralOk = false;
    }
  }

  // If we have a usable central directory, use it (authoritative; handles
  // data-descriptor cases where local header sizes are zeroed).
  if (centralOk && Object.keys(central).length > 0) {
    for (const name in central) {
      const ent = central[name];
      const lo = ent.localOffset;
      if (dv.getUint32(lo, true) !== 0x04034b50) continue; // corrupt local hdr
      const lNameLen = dv.getUint16(lo + 26, true);
      const lExtraLen = dv.getUint16(lo + 28, true);
      const dataStart = lo + 30 + lNameLen + lExtraLen;
      const comp = bytes.subarray(dataStart, dataStart + ent.compSize);
      if (name.endsWith('/')) continue; // directory entry
      if (ent.method === 0) {
        result[name] = comp.slice();
      } else if (ent.method === 8) {
        result[name] = inflateRaw(comp);
      } else {
        throw new Error('unzip: unsupported compression method ' + ent.method);
      }
    }
    return result;
  }

  // Fallback: iterate local file headers sequentially.
  let pos = 0;
  while (pos + 4 <= bytes.length && dv.getUint32(pos, true) === 0x04034b50) {
    const flags = dv.getUint16(pos + 6, true);
    const method = dv.getUint16(pos + 8, true);
    let compSize = dv.getUint32(pos + 18, true);
    let uncompSize = dv.getUint32(pos + 22, true);
    const nameLen = dv.getUint16(pos + 26, true);
    const extraLen = dv.getUint16(pos + 28, true);
    const name = decoder.decode(bytes.subarray(pos + 30, pos + 30 + nameLen));
    const dataStart = pos + 30 + nameLen + extraLen;

    const hasDataDescriptor = (flags & 0x08) !== 0;

    if (hasDataDescriptor && compSize === 0) {
      // Sizes unknown in local header; search for the data descriptor sig.
      let scan = dataStart;
      let found = -1;
      while (scan + 16 <= bytes.length) {
        if (dv.getUint32(scan, true) === 0x08074b50) {
          const ddCompSize = dv.getUint32(scan + 8, true);
          if (dataStart + ddCompSize === scan) {
            found = scan;
            compSize = ddCompSize;
            uncompSize = dv.getUint32(scan + 12, true);
            break;
          }
        }
        scan++;
      }
      if (found < 0) {
        throw new Error('unzip: could not locate data descriptor for ' + name);
      }
      const comp = bytes.subarray(dataStart, dataStart + compSize);
      if (!name.endsWith('/')) {
        if (method === 0) result[name] = comp.slice();
        else if (method === 8) result[name] = inflateRaw(comp);
        else throw new Error('unzip: unsupported method ' + method);
      }
      pos = found + 16;
      continue;
    }

    const comp = bytes.subarray(dataStart, dataStart + compSize);
    if (!name.endsWith('/')) {
      if (method === 0) {
        result[name] = comp.slice();
      } else if (method === 8) {
        result[name] = inflateRaw(comp);
      } else {
        throw new Error('unzip: unsupported compression method ' + method);
      }
    }
    pos = dataStart + compSize;
    if (hasDataDescriptor) {
      if (dv.getUint32(pos, true) === 0x08074b50) pos += 16;
      else pos += 12;
    }
  }

  return result;
}

// ============================================================================
// XLSX parsing
// ============================================================================

function _decodeXmlEntities(s) {
  if (s.indexOf('&') === -1) return s;
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, function (_, h) {
      return String.fromCodePoint(parseInt(h, 16));
    })
    .replace(/&#([0-9]+);/g, function (_, d) {
      return String.fromCodePoint(parseInt(d, 10));
    })
    .replace(/&amp;/g, '&');
}

// Column letters ("A", "AB") -> zero-based index.
function _colToIndex(ref) {
  let col = 0;
  for (let i = 0; i < ref.length; i++) {
    const c = ref.charCodeAt(i);
    if (c >= 65 && c <= 90) {
      col = col * 26 + (c - 64);
    } else if (c >= 97 && c <= 122) {
      col = col * 26 + (c - 96);
    } else {
      break; // hit a digit -> row part
    }
  }
  return col - 1;
}

// Parse sharedStrings.xml: return array of strings, one per <si>.
function _parseSharedStrings(xml) {
  const result = [];
  if (!xml) return result;
  const siRe = /<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g;
  let m;
  while ((m = siRe.exec(xml)) !== null) {
    const inner = m[1];
    if (inner === undefined) {
      result.push(''); // self-closed <si/>
      continue;
    }
    let text = '';
    const tRe = /<t\b[^>]*>([\s\S]*?)<\/t>|<t\b[^>]*\/>/g;
    let tm;
    while ((tm = tRe.exec(inner)) !== null) {
      if (tm[1] !== undefined) text += _decodeXmlEntities(tm[1]);
    }
    result.push(text);
  }
  return result;
}

// Extract attribute value from a tag's attribute string.
function _attr(tag, name) {
  const re = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*=\\s*"([^"]*)"');
  const m = re.exec(tag);
  return m ? m[1] : null;
}

// Parse one worksheet XML into a dense 2D array.
function _parseSheet(xml, sharedStrings) {
  const rows = [];
  if (!xml) return rows;

  const rowRe = /<row\b([^>]*)>([\s\S]*?)<\/row>|<row\b([^>]*)\/>/g;
  let rm;
  while ((rm = rowRe.exec(xml)) !== null) {
    const rowAttrs = rm[1] !== undefined ? rm[1] : rm[3];
    const rowInner = rm[2] !== undefined ? rm[2] : '';
    const rIdx = _attr('<row ' + rowAttrs + '>', 'r');
    let rowNum;
    if (rIdx !== null) rowNum = parseInt(rIdx, 10) - 1;
    else rowNum = rows.length;

    const cells = [];
    let maxCol = -1;
    const cellRe = /<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/g;
    let cm;
    let autoCol = 0;
    while ((cm = cellRe.exec(rowInner)) !== null) {
      const cellAttrs = cm[1] !== undefined ? cm[1] : cm[3];
      const cellInner = cm[2] !== undefined ? cm[2] : '';
      const cTag = '<c ' + cellAttrs + '>';
      const ref = _attr(cTag, 'r');
      const type = _attr(cTag, 't');
      let colIdx;
      if (ref !== null) {
        colIdx = _colToIndex(ref);
        autoCol = colIdx + 1;
      } else {
        colIdx = autoCol++;
      }

      let value = null;
      if (type === 'inlineStr') {
        let text = '';
        const tRe = /<t\b[^>]*>([\s\S]*?)<\/t>|<t\b[^>]*\/>/g;
        let tm;
        while ((tm = tRe.exec(cellInner)) !== null) {
          if (tm[1] !== undefined) text += _decodeXmlEntities(tm[1]);
        }
        value = text;
      } else {
        const vm = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(cellInner);
        const raw = vm ? vm[1] : null;
        if (raw === null) {
          value = null;
        } else if (type === 's') {
          const idx = parseInt(raw, 10);
          value = sharedStrings[idx] !== undefined ? sharedStrings[idx] : null;
        } else if (type === 'str') {
          value = _decodeXmlEntities(raw);
        } else if (type === 'b') {
          value = raw === '1' ? 1 : 0;
        } else if (type === 'e') {
          value = _decodeXmlEntities(raw); // error string
        } else {
          // t="n" or none => number; dates stay as raw serial number.
          const num = Number(raw);
          value = Number.isNaN(num) ? _decodeXmlEntities(raw) : num;
        }
      }

      cells[colIdx] = value;
      if (colIdx > maxCol) maxCol = colIdx;
    }

    const denseRow = [];
    for (let i = 0; i <= maxCol; i++) {
      denseRow.push(cells[i] !== undefined ? cells[i] : null);
    }

    while (rows.length <= rowNum) rows.push([]);
    rows[rowNum] = denseRow;
  }

  return rows;
}

function parseXlsx(bytes) {
  const files = unzip(bytes);
  const decoder = new TextDecoder('utf-8');
  function text(name) {
    const b = files[name];
    return b ? decoder.decode(b) : null;
  }

  const sharedStrings = _parseSharedStrings(text('xl/sharedStrings.xml'));

  // Workbook: sheet name -> r:id, in workbook order.
  const workbookXml = text('xl/workbook.xml') || '';
  const sheetEntries = []; // { name, rid }
  const sheetRe = /<sheet\b([^>]*?)\/?>/g;
  let sm;
  while ((sm = sheetRe.exec(workbookXml)) !== null) {
    const attrs = sm[1];
    const name = _decodeXmlEntities(_attr('<sheet ' + attrs + '>', 'name') || '');
    let rid = null;
    const ridM = /\b[A-Za-z0-9]*:?id\s*=\s*"(rId[^"]*)"/.exec(attrs);
    if (ridM) rid = ridM[1];
    if (rid === null) {
      const ridM2 = /\br:id\s*=\s*"([^"]*)"/.exec(attrs);
      rid = ridM2 ? ridM2[1] : null;
    }
    sheetEntries.push({ name, rid });
  }

  // Rels: r:id -> target path.
  const relsXml = text('xl/_rels/workbook.xml.rels') || '';
  const relMap = {}; // id -> target
  const relRe = /<Relationship\b([^>]*?)\/?>/g;
  let rm2;
  while ((rm2 = relRe.exec(relsXml)) !== null) {
    const attrs = rm2[1];
    const id = _attr('<Relationship ' + attrs + '>', 'Id');
    let target = _attr('<Relationship ' + attrs + '>', 'Target');
    if (id && target) {
      target = _decodeXmlEntities(target);
      relMap[id] = target;
    }
  }

  function resolveTarget(target) {
    if (!target) return null;
    let t = target;
    if (t.charAt(0) === '/') {
      return t.substring(1); // absolute within zip
    }
    t = t.replace(/^\.\//, '');
    // Resolve against "xl/" base, handling ../
    const baseParts = ['xl'];
    const parts = t.split('/');
    for (const part of parts) {
      if (part === '..') baseParts.pop();
      else if (part === '.' || part === '') continue;
      else baseParts.push(part);
    }
    return baseParts.join('/');
  }

  const sheets = [];
  for (const entry of sheetEntries) {
    const target = entry.rid ? relMap[entry.rid] : null;
    const path = resolveTarget(target);
    let xml = path ? text(path) : null;
    if (xml === null) {
      const fallback = 'xl/worksheets/sheet' + (sheets.length + 1) + '.xml';
      xml = text(fallback);
    }
    const rows = _parseSheet(xml, sharedStrings);
    sheets.push({ name: entry.name, rows });
  }

  return sheets;
}
try{ window.__xlsxRead = parseXlsx; }catch(e){}
})();

;(function(){
'use strict';
// Self-contained, browser-compatible pure-JS .xlsx writer.
// No Node APIs, no imports. Uses Uint8Array, DataView, TextEncoder.
// Produces a .xlsx with STORED (method 0) zip entries and correct CRC-32.

// ---------- CRC-32 (polynomial 0xEDB88320) ----------
var _crcTable = (function () {
  var table = new Uint32Array(256);
  for (var n = 0; n < 256; n++) {
    var c = n;
    for (var k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  var crc = 0xFFFFFFFF;
  for (var i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ _crcTable[(crc ^ bytes[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ---------- text encoding ----------
var _enc = new TextEncoder(); // always UTF-8
function utf8(str) {
  return _enc.encode(str);
}

// ---------- XML escaping ----------
function xmlEscape(s) {
  s = String(s);
  var out = '';
  for (var i = 0; i < s.length; i++) {
    var ch = s.charCodeAt(i);
    var c = s[i];
    if (c === '&') out += '&amp;';
    else if (c === '<') out += '&lt;';
    else if (c === '>') out += '&gt;';
    else if (c === '"') out += '&quot;';
    else if (c === "'") out += '&apos;';
    else if (ch < 0x20 && ch !== 0x09 && ch !== 0x0A && ch !== 0x0D) {
      // illegal XML control char -> drop
      out += '';
    } else out += c;
  }
  return out;
}

// ---------- column ref helpers (A1, B1, ... Z1, AA1 ...) ----------
function colLetters(n) {
  // n is zero-based column index
  var s = '';
  n = n + 1;
  while (n > 0) {
    var rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// ---------- sheet name sanitize ----------
function sanitizeSheetName(name, index) {
  var s = String(name == null ? '' : name);
  s = s.replace(/[\[\]\*\?\/\\:]/g, '');
  if (s.length > 31) s = s.slice(0, 31);
  if (s.length === 0) s = 'Sheet' + (index + 1);
  return s;
}

// ---------- date -> Excel serial (1900 system, epoch 1899-12-30) ----------
function dateToSerial(d) {
  // Use UTC base to avoid TZ drift relative to the Date's epoch ms.
  var epoch = Date.UTC(1899, 11, 30, 0, 0, 0, 0); // 1899-12-30
  var ms = d.getTime();
  var serial = (ms - epoch) / 86400000;
  return serial;
}

// ---------- normalize a cell ----------
function normalizeCell(cell) {
  if (cell === null || cell === undefined) return { kind: 'empty' };
  if (typeof cell === 'string') return { kind: 'str', v: cell, bold: false };
  if (typeof cell === 'number') return { kind: 'num', v: cell };
  if (typeof cell === 'object') {
    var t = cell.t;
    if (t === 's') return { kind: 'str', v: String(cell.v == null ? '' : cell.v), bold: !!cell.bold };
    if (t === 'b') return { kind: 'str', v: String(cell.v == null ? '' : cell.v), bold: cell.bold === undefined ? true : !!cell.bold };
    if (t === 'n') return { kind: 'num', v: Number(cell.v) };
    if (t === 'd') {
      var dv = cell.v;
      if (!(dv instanceof Date)) dv = new Date(dv);
      return { kind: 'date', v: dv, bold: !!cell.bold };
    }
    if ('v' in cell) return { kind: 'str', v: String(cell.v), bold: !!cell.bold };
  }
  return { kind: 'str', v: String(cell), bold: false };
}

// ---------- worksheet XML ----------
// style indices: 0 normal, 1 bold(header), 2 date, 3 date+bold
function buildSheetXml(rows) {
  var parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  parts.push('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">');
  parts.push('<sheetData>');
  for (var r = 0; r < rows.length; r++) {
    var row = rows[r] || [];
    var rowNum = r + 1;
    parts.push('<row r="' + rowNum + '">');
    for (var c = 0; c < row.length; c++) {
      var nc = normalizeCell(row[c]);
      if (nc.kind === 'empty') continue;
      var ref = colLetters(c) + rowNum;
      if (nc.kind === 'str') {
        var sIdx = nc.bold ? 1 : 0;
        parts.push('<c r="' + ref + '" s="' + sIdx + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEscape(nc.v) + '</t></is></c>');
      } else if (nc.kind === 'num') {
        var v = nc.v;
        if (!isFinite(v)) v = 0;
        parts.push('<c r="' + ref + '" s="0"><v>' + v + '</v></c>');
      } else if (nc.kind === 'date') {
        var serial = dateToSerial(nc.v);
        var dIdx = nc.bold ? 3 : 2;
        parts.push('<c r="' + ref + '" s="' + dIdx + '"><v>' + serial + '</v></c>');
      }
    }
    parts.push('</row>');
  }
  parts.push('</sheetData>');
  parts.push('</worksheet>');
  return parts.join('');
}

// ---------- styles.xml ----------
function buildStylesXml() {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    '<numFmts count="1">',
    '<numFmt numFmtId="164" formatCode="dd.mm.yyyy hh:mm"/>',
    '</numFmts>',
    '<fonts count="2">',
    '<font><sz val="11"/><name val="Calibri"/></font>',
    '<font><b/><sz val="11"/><name val="Calibri"/></font>',
    '</fonts>',
    '<fills count="1">',
    '<fill><patternFill patternType="none"/></fill>',
    '</fills>',
    '<borders count="1">',
    '<border><left/><right/><top/><bottom/><diagonal/></border>',
    '</borders>',
    '<cellStyleXfs count="1">',
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>',
    '</cellStyleXfs>',
    '<cellXfs count="4">',
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>',
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>',
    '<xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>',
    '</cellXfs>',
    '<cellStyles count="1">',
    '<cellStyle name="Normal" xfId="0" builtinId="0"/>',
    '</cellStyles>',
    '</styleSheet>'
  ].join('');
}

// ---------- workbook.xml ----------
function buildWorkbookXml(sheetNames) {
  var parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  parts.push('<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">');
  parts.push('<sheets>');
  for (var i = 0; i < sheetNames.length; i++) {
    parts.push('<sheet name="' + xmlEscape(sheetNames[i]) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>');
  }
  parts.push('</sheets>');
  parts.push('</workbook>');
  return parts.join('');
}

// ---------- xl/_rels/workbook.xml.rels ----------
function buildWorkbookRels(sheetCount) {
  var parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  parts.push('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">');
  var i;
  for (i = 0; i < sheetCount; i++) {
    parts.push('<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>');
  }
  parts.push('<Relationship Id="rId' + (sheetCount + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>');
  parts.push('</Relationships>');
  return parts.join('');
}

// ---------- _rels/.rels ----------
function buildRootRels() {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>',
    '</Relationships>'
  ].join('');
}

// ---------- [Content_Types].xml ----------
function buildContentTypes(sheetCount) {
  var parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  parts.push('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">');
  parts.push('<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>');
  parts.push('<Default Extension="xml" ContentType="application/xml"/>');
  parts.push('<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>');
  parts.push('<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>');
  for (var i = 0; i < sheetCount; i++) {
    parts.push('<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>');
  }
  parts.push('</Types>');
  return parts.join('');
}

// ---------- ZIP writer (STORED / method 0) ----------
function _u8concat(arrays) {
  var total = 0, i;
  for (i = 0; i < arrays.length; i++) total += arrays[i].length;
  var out = new Uint8Array(total);
  var off = 0;
  for (i = 0; i < arrays.length; i++) { out.set(arrays[i], off); off += arrays[i].length; }
  return out;
}

function _dosDateTime(d) {
  var year = d.getFullYear();
  if (year < 1980) { year = 1980; }
  var dosTime = ((d.getHours() & 0x1F) << 11) | ((d.getMinutes() & 0x3F) << 5) | ((Math.floor(d.getSeconds() / 2)) & 0x1F);
  var dosDate = (((year - 1980) & 0x7F) << 9) | (((d.getMonth() + 1) & 0x0F) << 5) | (d.getDate() & 0x1F);
  return { time: dosTime & 0xFFFF, date: dosDate & 0xFFFF };
}

function buildZip(entries) {
  // entries: [{ name: string, data: Uint8Array }]
  var now = new Date();
  var dt = _dosDateTime(now);
  var fileParts = [];
  var centralParts = [];
  var offset = 0;

  for (var i = 0; i < entries.length; i++) {
    var nameBytes = utf8(entries[i].name);
    var data = entries[i].data;
    var crc = crc32(data);
    var size = data.length;

    // ----- Local file header -----
    var lh = new Uint8Array(30 + nameBytes.length);
    var lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true); // PK\x03\x04
    lv.setUint16(4, 20, true);         // version needed
    lv.setUint16(6, 0x0800, true);     // flag: bit 11 UTF-8 names
    lv.setUint16(8, 0, true);          // method 0 stored
    lv.setUint16(10, dt.time, true);
    lv.setUint16(12, dt.date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);      // compressed size
    lv.setUint32(22, size, true);      // uncompressed size
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);         // extra len
    lh.set(nameBytes, 30);

    fileParts.push(lh);
    fileParts.push(data);

    // ----- Central directory header -----
    var ch = new Uint8Array(46 + nameBytes.length);
    var cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true); // central header signature
    cv.setUint16(4, 20, true);         // version made by
    cv.setUint16(6, 20, true);         // version needed
    cv.setUint16(8, 0x0800, true);     // flag UTF-8
    cv.setUint16(10, 0, true);         // method stored
    cv.setUint16(12, dt.time, true);
    cv.setUint16(14, dt.date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);         // extra
    cv.setUint16(32, 0, true);         // comment
    cv.setUint16(34, 0, true);         // disk start
    cv.setUint16(36, 0, true);         // internal attrs
    cv.setUint32(38, 0, true);         // external attrs
    cv.setUint32(42, offset, true);    // local header offset
    ch.set(nameBytes, 46);

    centralParts.push(ch);

    offset += lh.length + data.length;
  }

  var centralDir = _u8concat(centralParts);
  var centralStart = offset;
  var centralSize = centralDir.length;

  // ----- End of central directory -----
  var eocd = new Uint8Array(22);
  var ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);  // EOCD signature
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, centralStart, true);
  ev.setUint16(20, 0, true);

  var all = fileParts.concat([centralDir, eocd]);
  return _u8concat(all);
}

// ---------- public API ----------
function buildXlsx(sheets) {
  if (!sheets || !sheets.length) sheets = [{ name: 'Sheet1', rows: [] }];

  var sheetNames = [];
  for (var i = 0; i < sheets.length; i++) {
    sheetNames.push(sanitizeSheetName(sheets[i].name, i));
  }

  var entries = [];
  entries.push({ name: '[Content_Types].xml', data: utf8(buildContentTypes(sheets.length)) });
  entries.push({ name: '_rels/.rels', data: utf8(buildRootRels()) });
  entries.push({ name: 'xl/workbook.xml', data: utf8(buildWorkbookXml(sheetNames)) });
  entries.push({ name: 'xl/_rels/workbook.xml.rels', data: utf8(buildWorkbookRels(sheets.length)) });
  entries.push({ name: 'xl/styles.xml', data: utf8(buildStylesXml()) });
  for (i = 0; i < sheets.length; i++) {
    entries.push({
      name: 'xl/worksheets/sheet' + (i + 1) + '.xml',
      data: utf8(buildSheetXml(sheets[i].rows || []))
    });
  }

  return buildZip(entries);
}
try{ window.__xlsxBuild = buildXlsx; }catch(e){}
})();

window.XLSX = { read: window.__xlsxRead, build: window.__xlsxBuild };
