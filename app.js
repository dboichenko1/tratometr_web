/* ===========================================================================
   Тратометр — веб-версия (PWA). Самодостаточная: без сети, без библиотек,
   без аналитики. Все данные хранятся только локально (IndexedDB).
   Оформление повторяет нативное приложение.
   =========================================================================== */
'use strict';

/* -------------------------------------------------- Иконки → эмодзи -------- */
const EMOJI = {
  basket:'🛒', cart:'🛍️', restaurant:'🍽️', cafe:'☕', fastfood:'🍔', pizza:'🍕', bar:'🍸',
  coffee_beans:'🫘', home:'🏠', bank:'🏦', credit_card:'💳', tax:'🧾', percent:'💹',
  health:'❤️', hospital:'🏥', pills:'💊', transport:'🚌', car:'🚗', fuel:'⛽', taxi:'🚕',
  flight:'✈️', hotel:'🏨', clothes:'👕', beauty:'💅', sport:'🏋️', games:'🎮', movie:'🎬',
  music:'🎵', book:'📖', school:'🎓', child:'🧒', pets:'🐾', gift:'🎁', phone:'📱',
  internet:'📶', utilities:'⚡', water:'💧', tools:'🔧', savings:'🐷', wallet:'👛',
  cash:'💵', salary:'💼', business:'🏢', invest:'📈', star:'⭐', heart:'🤍', other:'📦', help:'❓'
};
const ICON_ORDER = [
  'basket','cart','restaurant','cafe','fastfood','pizza','bar','coffee_beans','home','bank',
  'credit_card','tax','percent','health','hospital','pills','transport','car','fuel','taxi',
  'flight','hotel','clothes','beauty','sport','games','movie','music','book','school','child',
  'pets','gift','phone','internet','utilities','water','tools','savings','wallet','cash',
  'salary','business','invest','star','heart','other','help'
];
const EMOJI_PREFIX = 'emoji:';
function resolveEmoji(key){
  if (!key) return '📦';
  if (key.startsWith(EMOJI_PREFIX)) return key.slice(EMOJI_PREFIX.length);
  return EMOJI[key] || '📦';
}

/* -------------------------------------------------- SVG-иконки (чистый контур) */
const ICONS = {
  home:'<path d="M4 11.5 12 4l8 7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v10h12V10" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  list:'<path d="M4 6h16M4 12h16M4 18h11" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>',
  bars:'<rect x="4" y="12" width="4" height="8" rx="1" fill="currentColor"/><rect x="10" y="5" width="4" height="15" rx="1" fill="currentColor"/><rect x="16" y="9" width="4" height="11" rx="1" fill="currentColor"/>',
  pie:'<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 12V3.5M12 12l7.5 4" stroke="currentColor" stroke-width="2"/>',
  lock:'<rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/>',
  bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 20a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  chevL:'<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  chevR:'<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  down:'<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  close:'<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  search:'<circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4.2-4.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  add:'<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  back:'<path d="M11 5l-7 7 7 7M4 12h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  trash:'<path d="M5 7h14M10 7V4.5h4V7M6.5 7l1 12.5h9l1-12.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  cal:'<rect x="4" y="5" width="16" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 9.5h16M8.5 3.5v3M15.5 3.5v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  wallet:'<rect x="3.5" y="6" width="17" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="16.5" cy="12.5" r="1.4" fill="currentColor"/>',
  repeat:'<path d="M5 8h11l-2.5-2.5M19 16H8l2.5 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  sort:'<path d="M7 4v13M4 14l3 3 3-3M17 20V7M14 10l3-3 3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  arrowR:'<path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  bulb:'<path d="M9.5 18h5M10 21h4M12 3a6 6 0 00-3.8 10.6c.8.7 1.3 1.4 1.3 2.4h5c0-1 .5-1.7 1.3-2.4A6 6 0 0012 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  reset:'<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3 4.5V9h4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  io:'<path d="M8 4v11M4.5 7.5 8 4l3.5 3.5M16 20V9M12.5 16.5 16 20l3.5-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  info:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7.8" r="1.1" fill="currentColor"/>',
  help:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.8.3-1.2.9-1.2 1.7v.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="11.9" cy="16.6" r="1.1" fill="currentColor"/>',
  upload:'<path d="M12 15V5M8 9l4-4 4 4M5 19h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  fileIn:'<path d="M7 3h7l4 4v14H6V3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 3v4h4M12 17v-6M9.5 13.5 12 11l2.5 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  grid:'<rect x="4" y="4" width="16" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 10h16M10 4v16" stroke="currentColor" stroke-width="2"/>',
  table:'<rect x="4" y="5" width="16" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 10h16M4 14.5h16M9.5 5v14" stroke="currentColor" stroke-width="2"/>',
  pdf:'<path d="M7 3h7l4 4v14H6V3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 3v4h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 13h1.2a1.2 1.2 0 0 1 0 2.4H9V13zm0 4.5V13M13 13h1.6M13 13v4.5M13 15.3h1.3M16.4 13H18M16.4 13v4.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/>',
  save:'<path d="M5 4h11l3 3v13H5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 4v5h7V4M8 20v-6h8v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  palette:'<path d="M12 3.5c-4.7 0-8.5 3.6-8.5 8 0 3 2.3 4.8 4.8 4.8 1.4 0 2-.8 2-1.7 0-1.3 1-1.9 2.1-1.9h1.6c2.6 0 4.5-1.9 4.5-4.7 0-2.9-2.9-4.5-6.5-4.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="8" cy="9.5" r="1" fill="currentColor"/><circle cx="12" cy="7.5" r="1" fill="currentColor"/><circle cx="16" cy="9.5" r="1" fill="currentColor"/>',
  category:'<path d="M4 4h7l9 9-7 7-9-9V4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/>',
  speed:'<path d="M4 18a8 8 0 1 1 16 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 18l4.2-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="18" r="1.4" fill="currentColor"/>',
  swapH:'<path d="M5 9h12l-3-3M19 15H7l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  nofill:'<path d="M4 4l16 16M7 7a6 6 0 0 0 8.5 8.5M9 4.4A6 6 0 0 1 19.6 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  smile:'<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10.5" r="1.1" fill="currentColor"/><circle cx="15" cy="10.5" r="1.1" fill="currentColor"/><path d="M8.5 14.5a4 4 0 0 0 7 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
};
function icon(name, size){
  size = size || 24;
  const s = ICONS[name] || ICONS.help;
  const el = document.createElement('span');
  el.className = 'ico';
  el.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${s}</svg>`;
  return el;
}

/* -------------------------------------------------- Палитры и темы --------- */
const PALETTE = ['#E5564E','#F4845F','#F4B740','#F7D154','#8BC34A','#45C168','#2E7D67',
  '#26C6DA','#42A5F5','#5C6BC0','#7E57C2','#AB47BC','#EC407A','#8D6E63','#78909C','#9E9E9E'];
const ACCENTS = [
  {id:'green', name:'Зелёный', accent:'#2E7D67'},
  {id:'blue', name:'Синий', accent:'#2F6FED'},
  {id:'purple', name:'Фиолетовый', accent:'#7E57C2'},
  {id:'teal', name:'Бирюзовый', accent:'#159A8C'},
  {id:'orange', name:'Оранжевый', accent:'#EF6C00'},
  {id:'pink', name:'Розовый', accent:'#E0457B'},
];
const FULL_THEMES = [
  {id:'graphite', name:'Графит', accent:'#5E9EFF', bg:'#17191C', surface:'#23272D', divider:'#353B43', text:'#E7EAED', text2:'#9AA4AE'},
  {id:'vscode', name:'VS Code', accent:'#1F8AD8', bg:'#1E1E1E', surface:'#252526', divider:'#3C3C3C', text:'#D4D4D4', text2:'#8C8C8C'},
  {id:'dracula', name:'Dracula', accent:'#BD93F9', bg:'#282A36', surface:'#343746', divider:'#44475A', text:'#F8F8F2', text2:'#A6ACCD'},
  {id:'nord', name:'Nord', accent:'#88C0D0', bg:'#2E3440', surface:'#3B4252', divider:'#434C5E', text:'#ECEFF4', text2:'#9BA7BE'},
  {id:'charm', name:'Charm', accent:'#FF5FAF', bg:'#1A1726', surface:'#272138', divider:'#3A3357', text:'#F2EEFF', text2:'#A79CC9'},
];
const STD_DARK  = {bg:'#101513', surface:'#1A211E', divider:'#2B3531', text:'#E8EDEB', text2:'#8F9D97'};
const STD_LIGHT = {bg:'#F4F6F5', surface:'#FFFFFF', divider:'#E6E9E8', text:'#1E2A26', text2:'#7B8A85'};
const FONTS = {
  null: 'var(--font)',
  dejavu: "'DejaVu Sans', Verdana, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, Menlo, 'SF Mono', monospace",
};

/* -------------------------------------------------- Цветовые утилиты ------- */
function hexToRgb(hex){
  hex = hex.replace('#','');
  if (hex.length===3) hex = hex.split('').map(c=>c+c).join('');
  return { r:parseInt(hex.slice(0,2),16), g:parseInt(hex.slice(2,4),16), b:parseInt(hex.slice(4,6),16) };
}
function hexA(hex, a){ const c=hexToRgb(hex); return `rgba(${c.r},${c.g},${c.b},${a})`; }
function safeColor(c){ return (typeof c==='string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c)) ? c : '#9E9E9E'; }
function mixHex(a, b, t){
  const x=hexToRgb(a), y=hexToRgb(b);
  const m=(p,q)=>Math.round(p+(q-p)*t).toString(16).padStart(2,'0');
  return `#${m(x.r,y.r)}${m(x.g,y.g)}${m(x.b,y.b)}`;
}
function lighten(hex,t){ return mixHex(hex,'#FFFFFF',t); }
function darken(hex,t){ return mixHex(hex,'#000000',t); }
function luminance(hex){
  const c=hexToRgb(hex);
  const f=v=>{ v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); };
  return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b);
}
function onAccentAuto(hex){
  const L=luminance(hex);
  return ((L+0.05)*(L+0.05) > 0.15) ? '#1E2A26' : '#FFFFFF';
}
// Цвет надписей на акценте: авто-контраст / принудительно светлый / тёмный.
function resolveOnAccent(accent, mode){ if (mode==='light') return '#FFFFFF'; if (mode==='dark') return '#1E2A26'; return onAccentAuto(accent); }
function isFullPalette(id){ return !!FULL_THEMES.find(t=>t.id===id); }
// Сменить акцент: если совпал с базовым пресетом — берём его id, иначе 'custom'.
function setAccentColor(color){ const m=ACCENTS.find(a=>a.accent===color); S.data.settings.themePreset = m?m.id:'custom'; S.data.settings.accentColor=color; }

/* -------------------------------------------------- Форматирование --------- */
const RU='ru-RU';
const NBSP=String.fromCharCode(0x202F); // узкий неразрывный пробел
const MINUS=String.fromCharCode(0x2212); // типографский минус
function fmtNum(value){
  const rounded=Math.round(value*100)/100;
  const whole=rounded===Math.round(rounded);
  let s = whole
    ? Math.round(rounded).toLocaleString(RU,{maximumFractionDigits:0})
    : rounded.toLocaleString(RU,{minimumFractionDigits:2,maximumFractionDigits:2});
  return s.replace(/[\s\u00A0\u202F]/g, NBSP);
}
function money(v){ return fmtNum(v)+' ₽'; }
function signedMoney(v, isIncome){ return (isIncome?'+':MINUS)+money(Math.abs(v)); }
function cap(s){ return s ? s[0].toUpperCase()+s.slice(1) : s; }
function dayShort(d){ return new Intl.DateTimeFormat(RU,{day:'numeric',month:'long'}).format(d); }
function dayFull(d){ return dayShort(d)+' '+d.getFullYear(); }
function dayMonthShort(d){ return new Intl.DateTimeFormat(RU,{day:'numeric',month:'short'}).format(d).replace(/\.$/,''); }
function monthLong(d){ return new Intl.DateTimeFormat(RU,{month:'long'}).format(d); }
function monthYear(d){ return cap(monthLong(d))+' '+d.getFullYear(); }
function dayWeekday(d){ return cap(new Intl.DateTimeFormat(RU,{weekday:'long',day:'numeric',month:'long'}).format(d)); }

/* -------------------------------------------------- Даты/периоды ----------- */
function startOfDay(d){ return new Date(d.getFullYear(),d.getMonth(),d.getDate()); }
function todayStart(){ return startOfDay(new Date()); }
function addDays(d,n){ return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n); }
function daysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
function sameDay(a,b){ return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(); }
function calDaysBetween(from,to){ return Math.round((startOfDay(to)-startOfDay(from))/86400000); }
function rangeFor(type, anchor, custom){
  switch(type){
    case 'day': { const s=startOfDay(anchor); return {start:s, end:addDays(s,1)}; }
    case 'week': { const s=startOfDay(anchor); const wd=s.getDay()===0?7:s.getDay(); const mon=addDays(s,-(wd-1)); return {start:mon, end:addDays(mon,7)}; }
    case 'month': return {start:new Date(anchor.getFullYear(),anchor.getMonth(),1), end:new Date(anchor.getFullYear(),anchor.getMonth()+1,1)};
    case 'year': return {start:new Date(anchor.getFullYear(),0,1), end:new Date(anchor.getFullYear()+1,0,1)};
    case 'custom': return custom || {start:startOfDay(anchor), end:addDays(startOfDay(anchor),1)};
    case 'all': return custom || {start:new Date(2000,0,1), end:new Date(anchor.getFullYear()+1,0,1)};
  }
}
function shiftAnchor(type, anchor, dir){
  switch(type){
    case 'day': return addDays(anchor,dir);
    case 'week': return addDays(anchor,7*dir);
    case 'month': return new Date(anchor.getFullYear(),anchor.getMonth()+dir,1);
    case 'year': return new Date(anchor.getFullYear()+dir,anchor.getMonth(),1);
    default: return anchor;
  }
}
function periodLabel(type, anchor, custom){
  switch(type){
    case 'day': {
      const s=startOfDay(anchor), t=todayStart();
      if (sameDay(s,t)) return 'Сегодня, '+dayShort(anchor);
      if (sameDay(s,addDays(t,-1))) return 'Вчера, '+dayShort(anchor);
      return dayFull(anchor);
    }
    case 'week': { const r=rangeFor('week',anchor); return dayMonthShort(r.start)+' — '+dayMonthShort(addDays(r.end,-1)); }
    case 'month': return monthYear(anchor);
    case 'year': return String(anchor.getFullYear());
    case 'custom': { const r=custom||rangeFor('custom',anchor); return dayMonthShort(r.start)+' — '+dayShort(addDays(r.end,-1)); }
    case 'all': return 'Весь период';
  }
}
function canGoForward(){
  const {periodType:t, anchor} = S.ui;
  if (t==='custom'||t==='all') return false;
  const next = rangeFor(t, shiftAnchor(t, anchor, 1)).start;
  return next <= todayStart();
}

/* -------------------------------------------------- Хранилище -------------- */
const DB_NAME='tratometr_db', STORE='kv', LS_KEY='tratometr_state';
function idbOpen(){
  return new Promise((res,rej)=>{
    const r=indexedDB.open(DB_NAME,1);
    r.onupgradeneeded=()=>r.result.createObjectStore(STORE);
    r.onsuccess=()=>res(r.result);
    r.onerror=()=>rej(r.error);
  });
}
async function idbGet(key){
  try{ const db=await idbOpen(); return await new Promise((res,rej)=>{ const req=db.transaction(STORE,'readonly').objectStore(STORE).get(key); req.onsuccess=()=>res(req.result); req.onerror=()=>rej(req.error); }); }
  catch(_){ return undefined; }
}
async function idbSet(key,val){
  try{ const db=await idbOpen(); await new Promise((res,rej)=>{ const req=db.transaction(STORE,'readwrite').objectStore(STORE).put(val,key); req.onsuccess=()=>res(); req.onerror=()=>rej(req.error); }); }
  catch(_){}
}
let _saveTimer=null;
function persist(){
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer=setTimeout(async ()=>{
    const json=JSON.stringify(S.data);
    await idbSet('state', S.data);
    try{ localStorage.setItem(LS_KEY, json); }catch(_){}
  }, 120);
}
async function loadState(){
  let data=await idbGet('state');
  if (!data){ try{ const raw=localStorage.getItem(LS_KEY); if (raw) data=JSON.parse(raw); }catch(_){} }
  return data;
}

/* -------------------------------------------------- Сид (первый запуск) ---- */
function seedData(){
  let id=1; const nid=()=>id++;
  const accounts=[
    {id:nid(), name:'Основной', initialBalance:0, iconKey:'credit_card', color:'#2E7D67', sortOrder:0},
    {id:nid(), name:'Наличные', initialBalance:0, iconKey:'cash', color:'#45C168', sortOrder:1},
  ];
  const defs=[
    ['Продукты','expense','basket','#45C168'],['Шоппинг','expense','cart','#42A5F5'],
    ['Кафе','expense','restaurant','#F7D154'],['Дом','expense','home','#EC407A'],
    ['Транспорт','expense','transport','#26C6DA'],['Кредиты','expense','bank','#8D6E63'],
    ['Здоровье','expense','health','#E5564E'],['Развлечения','expense','games','#7E57C2'],
    ['Связь','expense','phone','#5C6BC0'],['Другое','expense','other','#9E9E9E'],
    ['Зарплата','income','salary','#3DAE6B'],['Подработка','income','business','#45C168'],
    ['Подарки','income','gift','#EC407A'],['Проценты','income','percent','#42A5F5'],
    ['Прочее','income','other','#9E9E9E'],
  ];
  const categories=defs.map((d,i)=>({id:nid(), name:d[0], type:d[1], iconKey:d[2], color:d[3], sortOrder:i, isDefault:true}));
  return {
    v:1, accounts, categories, transactions:[], recurring:[], seq:id,
    settings:{
      themeMode:'dark', accentColor:'#2E7D67', themePreset:'green',
      fontFamily:null, accentTextMode:'auto', uiScale:1.0,
      monthlyLimit:0, monthlyIncomeTarget:0, spendAlertThreshold:0.30,
      headerGauges:['day','limit'], navStyle:'bottom',
      spendAlertEnabled:false, limitAlertEnabled:false, lockEnabled:false, lockHash:null,
    },
  };
}
function newId(){ return S.data.seq++; }

/* -------------------------------------------------- Состояние -------------- */
const S = {
  data: null,
  ui: {
    screen:'dashboard',
    selectedAccountId:null, activeType:'expense',
    periodType:'day', anchor:todayStart(), customRange:null,
    sort:'dateDesc', txTab:'expense', analysisMode:'expense', chartType:'bars',
    catTab:'expense',
  },
};

/* -------------------------------------------------- Бизнес-логика ----------- */
function accountById(id){ return S.data.accounts.find(a=>a.id===id) || null; }
function categoryById(id){ return S.data.categories.find(c=>c.id===id) || null; }
function categoriesOfType(t){ return S.data.categories.filter(c=>c.type===t); }
function mainAccount(){ return S.data.accounts.find(a=>a.name==='Основной') || S.data.accounts[0] || null; }
function netByAccount(){
  const net={};
  for (const a of S.data.accounts) net[a.id]=0;
  for (const t of S.data.transactions){
    const signed = t.type==='income' ? t.amount : -t.amount;
    if (net[t.accountId]!==undefined) net[t.accountId]+=signed;
    if (t.type==='transfer' && t.toAccountId!=null && net[t.toAccountId]!==undefined) net[t.toAccountId]+=t.amount;
  }
  return net;
}
function balanceOf(id, net){ const a=accountById(id); if(!a) return 0; net=net||netByAccount(); return a.initialBalance+(net[id]||0); }
function accExcluded(id){ const a=accountById(id); return !!(a && a.excludeFromTotal); }
function totalBalance(net){ net=net||netByAccount(); return S.data.accounts.reduce((s,a)=>s+(a.excludeFromTotal?0:balanceOf(a.id,net)),0); }
function displayedBalance(net){ return S.ui.selectedAccountId!=null ? balanceOf(S.ui.selectedAccountId,net) : totalBalance(net); }
function categoryUsage(){ const u={}; for (const t of S.data.transactions) if (t.categoryId!=null) u[t.categoryId]=(u[t.categoryId]||0)+1; return u; }
function popularCategoriesOfType(t){
  const u=categoryUsage();
  return categoriesOfType(t).slice().sort((a,b)=>{ const ua=u[a.id]||0, ub=u[b.id]||0; if (ub!==ua) return ub-ua; return a.sortOrder-b.sortOrder; });
}
function inRange(t, r){ return t.date>=r.start.getTime() && t.date<r.end.getTime(); }
function currentSlice(){
  const r=rangeFor(S.ui.periodType,S.ui.anchor,S.ui.customRange);
  const {selectedAccountId:acc, activeType:type} = S.ui;
  return S.data.transactions.filter(t=> t.type===type && (acc==null?!accExcluded(t.accountId):t.accountId===acc) && inRange(t,r));
}
function currentTransfers(){
  const r=rangeFor(S.ui.periodType,S.ui.anchor,S.ui.customRange);
  const acc=S.ui.selectedAccountId;
  return S.data.transactions.filter(t=> t.type==='transfer' && (acc==null?(!accExcluded(t.accountId)||!accExcluded(t.toAccountId)):(t.accountId===acc||t.toAccountId===acc)) && inRange(t,r));
}
function sortTx(list){
  const s=S.ui.sort, a=list.slice();
  if (s==='dateDesc') a.sort((x,y)=>y.date-x.date || y.id-x.id);
  else if (s==='dateAsc') a.sort((x,y)=>x.date-y.date || x.id-y.id);
  else if (s==='amountDesc') a.sort((x,y)=>y.amount-x.amount || y.date-x.date);
  else if (s==='amountAsc') a.sort((x,y)=>x.amount-y.amount || y.date-x.date);
  return a;
}
function breakdown(slice){
  const total=slice.reduce((s,t)=>s+t.amount,0);
  const byCat={}, counts={};
  for (const t of slice){ if (t.categoryId==null) continue; byCat[t.categoryId]=(byCat[t.categoryId]||0)+t.amount; counts[t.categoryId]=(counts[t.categoryId]||0)+1; }
  const list=[];
  for (const cid in byCat){ const cat=categoryById(Number(cid)); if(!cat) continue;
    list.push({category:cat, total:byCat[cid], fraction: total>0?byCat[cid]/total:0, count:counts[cid]}); }
  list.sort((a,b)=>b.total-a.total);
  return list;
}

/* --- Спидометры --- */
function trimmedMean(values, trim){
  if (!values.length) return 0;
  const sorted=values.slice().sort((a,b)=>a-b);
  const drop=Math.floor(sorted.length*trim);
  const kept=sorted.slice(0, sorted.length-drop);
  if (!kept.length) return 0;
  return kept.reduce((a,b)=>a+b,0)/kept.length;
}
// Окно расходов за 30 дней + самый ранний расход (для дневного датчика/уведомлений).
function _expenseWindow(){
  const now=new Date();
  const windowStart=new Date(now.getFullYear(),now.getMonth(),now.getDate()-30);
  const exp=S.data.transactions.filter(t=>t.type==='expense');
  const winExp=exp.filter(t=>t.date>=windowStart.getTime()).map(t=>({amount:t.amount,date:t.date}));
  const firstExp=exp.length ? Math.min.apply(null, exp.map(t=>t.date)) : null;
  return {now, windowStart, exp, winExp, firstExp};
}
// Оценка дневного перерасхода — порт spending_alert.dart. windowExpenses —
// расходы за ~30 дней как [{amount,date}]; firstExpenseMs — самый ранний расход.
function evaluateSpendingAlert(now, windowExpenses, firstExpenseMs, lastNotifiedDay, threshold){
  threshold = threshold==null ? 0.30 : threshold;
  const minHistoryDays=7, trimFraction=0.10, windowDays=30;
  const today=startOfDay(now);
  let todayTotal=0; const byDay={};
  for (const tx of windowExpenses){ const day=startOfDay(new Date(tx.date)); if (sameDay(day,today)) todayTotal+=tx.amount; else if (day<today) byDay[+day]=(byDay[+day]||0)+tx.amount; }
  if (firstExpenseMs==null) return {active:false, shouldNotify:false, todayTotal, baseline:0, percentAbove:null, reason:'no_history'};
  const fed=startOfDay(new Date(firstExpenseMs));
  if (calDaysBetween(fed, today) < minHistoryDays) return {active:false, shouldNotify:false, todayTotal, baseline:0, percentAbove:null, reason:'history_too_short'};
  const windowStart=new Date(today.getFullYear(),today.getMonth(),today.getDate()-windowDays);
  let d=startOfDay(windowStart>fed?windowStart:fed);
  const daily=[]; while (d<today){ daily.push(byDay[+d]||0); d=addDays(d,1); }
  const baseline=trimmedMean(daily, trimFraction);
  if (baseline<=0) return {active:true, shouldNotify:false, todayTotal, baseline, percentAbove:null, reason:'baseline_zero'};
  const percentAbove=(todayTotal-baseline)/baseline*100;
  const over = todayTotal >= baseline*(1+threshold);
  const already = lastNotifiedDay!=null && sameDay(startOfDay(new Date(lastNotifiedDay)), today);
  return {active:true, shouldNotify: over&&!already, todayTotal, baseline, percentAbove, reason: !over?'within_threshold':(already?'already_notified_today':'over_threshold')};
}
// Оценка месячного лимита — порт limit_alert.dart.
function evaluateLimitAlert(now, monthExpense, limit, lastNotifiedDay){
  if (!(limit>0)) return {active:false, monthExpense:0, limit:0, ratio:0, shouldNotify:false, percentOfLimit:0};
  const ratio=monthExpense/limit;
  const already = lastNotifiedDay!=null && sameDay(startOfDay(new Date(lastNotifiedDay)), startOfDay(now));
  return {active:true, monthExpense, limit, ratio, shouldNotify: monthExpense>=limit && !already, percentOfLimit: ratio*100};
}
function gaugeData(){
  const {now, windowStart, exp, winExp, firstExp}=_expenseWindow();
  const inc=S.data.transactions.filter(t=>t.type==='income');
  const thr=S.data.settings.spendAlertThreshold;
  const sa=evaluateSpendingAlert(now, winExp, firstExp, null, thr);
  const dayRatio=(sa.active && sa.baseline>0) ? sa.todayTotal/sa.baseline : null;
  const today=startOfDay(now);
  const monStart=new Date(now.getFullYear(),now.getMonth(),1).getTime();
  const monthExpense=exp.filter(t=>t.date>=monStart).reduce((s,t)=>s+t.amount,0);
  const monthIncome=inc.filter(t=>t.date>=monStart).reduce((s,t)=>s+t.amount,0);
  const last30Expense=winExp.reduce((s,t)=>s+t.amount,0);
  const last30Income=inc.filter(t=>t.date>=windowStart.getTime()).reduce((s,t)=>s+t.amount,0);
  const todayIncome=inc.filter(t=>sameDay(startOfDay(new Date(t.date)),today)).reduce((s,t)=>s+t.amount,0);
  const limit=S.data.settings.monthlyLimit, target=S.data.settings.monthlyIncomeTarget;
  return {
    dayRatio, dayMax:1+thr,
    limitRatio: limit>0 ? monthExpense/limit : null,
    incomeDayRatio: last30Income>0 ? todayIncome/(last30Income/30) : null,
    incomeTargetRatio: target>0 ? monthIncome/target : null,
    monthIncome, monthExpense, last30Expense, last30Income,
  };
}

/* --- Регулярные операции --- */
function nextOccurrence(from, freq, anchorDay){
  const y=from.getFullYear(), m=from.getMonth();
  if (freq==='daily') return addDays(from,1);
  if (freq==='weekly') return addDays(from,7);
  if (freq==='monthly') return new Date(y, m+1, Math.min(anchorDay, daysInMonth(y, m+1)));
  if (freq==='yearly') return new Date(y+1, m, Math.min(anchorDay, daysInMonth(y+1, m)));
  return addDays(from,1);
}
function materializeRecurring(){
  if (!S.data.recurring.length) return false;
  const today=todayStart();
  let changed=false;
  for (const rule of S.data.recurring){
    if (!rule.enabled) continue;
    let next=startOfDay(new Date(rule.nextRun)); let guard=0;
    while (next<=today && guard<4000){
      S.data.transactions.push({ id:newId(), type:rule.type, amount:rule.amount, accountId:rule.accountId,
        categoryId:rule.categoryId, toAccountId:null, date:next.getTime(), comment:rule.comment||null, createdAt:Date.now() });
      next=nextOccurrence(next, rule.frequency, rule.anchorDay); guard++; changed=true;
    }
    rule.nextRun=next.getTime();
  }
  return changed;
}

/* -------------------------------------------------- DOM-хелперы ------------- */
function h(tag, props, ...kids){
  const e=document.createElement(tag);
  if (props) for (const k in props){
    const v=props[k];
    if (v==null||v===false) continue;
    if (k==='class') e.className=v;
    else if (k==='html') e.innerHTML=v;
    else if (k==='style' && typeof v==='object') Object.assign(e.style,v);
    else if (k==='dataset') Object.assign(e.dataset,v);
    else if (k.startsWith('on') && typeof v==='function') e.addEventListener(k.slice(2).toLowerCase(),v);
    else if (v===true) e.setAttribute(k,'');
    else e.setAttribute(k,v);
  }
  for (let kid of kids.flat()){
    if (kid==null||kid===false) continue;
    e.appendChild(typeof kid==='object' ? kid : document.createTextNode(String(kid)));
  }
  return e;
}
// Аватар категории/счёта. size px; filled — залитый (выбранный) вид.
function avatar(iconKey, color, size, filled){
  size = size || 42;
  const transparent = color==null;
  const emo = h('span',{class:'emo', style:{fontSize:(size*0.52)+'px'}}, resolveEmoji(iconKey));
  let bg;
  if (transparent) bg = 'transparent';
  else if (filled) bg = safeColor(color);
  else bg = hexA(safeColor(color), 0.15);
  const el = h('div',{class:'avatar', style:{ width:size+'px', height:size+'px', background:bg,
    border: transparent ? '1px solid var(--divider)' : '0' }}, emo);
  return el;
}
function toast(msg, isErr){
  let wrap=document.querySelector('.toast-wrap');
  if (!wrap){ wrap=h('div',{class:'toast-wrap'}); document.body.appendChild(wrap); }
  const t=h('div',{class:'toast'+(isErr?' err':'')}, msg);
  wrap.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(()=>t.remove(),300); }, 2400);
}

// Свайп/тап по форме убирает клавиатуру (как в нативе).
function dismissKeyboard(){ const a=document.activeElement; if (a && (a.tagName==='INPUT'||a.tagName==='TEXTAREA')){ try{ a.blur(); }catch(_){} } }

/* -------------------------------------------------- Навигация: боковое меню -- */
function useDrawer(){ return S.data.settings.navStyle==='drawer'; }
let _drawerCloser=null;
function closeDrawer(){ if(_drawerCloser) _drawerCloser(); }
function openDrawer(){
  const g=gaugeData(), net=netByAccount();
  const panel=h('div',{class:'drawer'});
  const head=h('div',{class:'hub-head', style:{borderRadius:'0'}});
  const sel=S.data.settings.headerGauges, order=['day','limit','income_day','income_target','balance'];
  const shown=order.filter(k=>sel.includes(k)).map(k=>gaugeColForKey(k,g)).filter(Boolean);
  if (shown.length) head.appendChild(h('div',{class:'hub-gauges'}, shown));
  head.appendChild(h('div',{class:'hub-balance'}, 'Остаток: '+money(totalBalance(net))));
  panel.appendChild(head);
  const cur=S.ui.screen;
  const go=(scr)=>{ closeDrawer(); navigate(scr); };
  const item=(scr,ic,title)=>h('button',{class:'lt'+(cur===scr?' dactive':''), onclick:()=>go(scr)},
    h('span',{class:'lt-lead'}, icon(ic,24)), h('div',{class:'lt-mid'}, h('div',{class:'lt-title'}, title)));
  const dv=()=>h('div',{style:{height:'1px',background:'var(--divider)',margin:'8px 16px'}});
  panel.appendChild(item('dashboard','home','Главная'));
  panel.appendChild(item('transactions','list','Операции'));
  panel.appendChild(item('analysis','bars','Графики'));
  panel.appendChild(dv());
  panel.appendChild(item('accounts','wallet','Счета'));
  panel.appendChild(item('categories','category','Категории'));
  panel.appendChild(item('limits','speed','Спидометры'));
  panel.appendChild(item('recurring','repeat','Регулярные операции'));
  panel.appendChild(item('appearance','palette','Оформление'));
  panel.appendChild(item('security','lock','Безопасность'));
  panel.appendChild(item('notifications','bell','Уведомления'));
  panel.appendChild(dv());
  panel.appendChild(item('io','io','Импорт и экспорт'));
  panel.appendChild(h('button',{class:'lt', onclick:()=>{ closeDrawer(); openAbout(); }},
    h('span',{class:'lt-lead'}, icon('info',24)), h('div',{class:'lt-mid'}, h('div',{class:'lt-title'},'О приложении'))));
  const scrim=h('div',{class:'drawer-scrim', onclick:(e)=>{ if(e.target===scrim) closeDrawer(); }}, panel);
  document.body.appendChild(scrim);
  requestAnimationFrame(()=>scrim.classList.add('show'));
  _drawerCloser=()=>{ scrim.remove(); _drawerCloser=null; };
}

/* -------------------------------------------------- Тема -------------------- */
function effectiveBrightness(){
  const st=S.data.settings;
  if (FULL_THEMES.find(t=>t.id===st.themePreset)) return 'dark';
  if (st.themeMode==='light') return 'light';
  if (st.themeMode==='dark') return 'dark';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
function applyTheme(){
  const st=S.data.settings;
  const full=FULL_THEMES.find(t=>t.id===st.themePreset);
  const br=effectiveBrightness();
  let base, accent;
  if (full){ base=full; accent=full.accent; }
  else { base = br==='light'?STD_LIGHT:STD_DARK; accent=st.accentColor; }
  const surface2 = mixHex(base.surface, br==='light'?'#000000':'#FFFFFF', 0.06);
  const onAccent = resolveOnAccent(accent, st.accentTextMode);
  const r=document.documentElement.style;
  r.setProperty('--bg', base.bg); r.setProperty('--surface', base.surface); r.setProperty('--surface2', surface2);
  r.setProperty('--divider', base.divider); r.setProperty('--text', base.text); r.setProperty('--text2', base.text2);
  r.setProperty('--accent', accent); r.setProperty('--on-accent', onAccent); r.setProperty('--scale', st.uiScale);
  if (br==='light'){ r.setProperty('--card-shadow','0 3px 8px rgba(0,0,0,.10)'); r.setProperty('--card-border','0 solid transparent'); }
  else { r.setProperty('--card-shadow','0 3px 10px rgba(0,0,0,.42)'); r.setProperty('--card-border','.6px solid '+hexA(base.divider,0.7)); }
  document.body.style.fontFamily = FONTS[st.fontFamily] || 'var(--font)';
  const meta=document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', accent);
}

/* -------------------------------------------------- SVG: пончик/датчики ---- */
function pt(cx,cy,r,a){ return [cx+r*Math.cos(a), cy+r*Math.sin(a)]; }
function arcPath(cx,cy,r,a1,a2){
  const [x1,y1]=pt(cx,cy,r,a1), [x2,y2]=pt(cx,cy,r,a2);
  const large=(a2-a1)>Math.PI?1:0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}
// Объёмный пончик (псевдо-3D): градиент сегментов, тень-подложка, глянец.
function donutSVG(items, size){
  const cx=size/2;
  const hole=size*0.30, ring=size*0.17, mid=hole+ring/2, outer=hole+ring;
  const c=2*Math.PI*mid;
  const hasData = items.length>0 && items.reduce((s,i)=>s+i.fraction,0)>0;
  let defs='', segs='', off=0, gi=0;
  const gap = hasData && items.length>1 ? 2.5 : 0;
  if (hasData){
    for (const it of items){
      const base=safeColor(it.category.color);
      const id='g'+(gi++);
      defs+=`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lighten(base,0.34)}"/><stop offset="0.5" stop-color="${base}"/><stop offset="1" stop-color="${darken(base,0.24)}"/></linearGradient>`;
      let len=it.fraction*c - gap; if (len<1) len=1;
      segs+=`<circle cx="${cx}" cy="${cx}" r="${mid.toFixed(2)}" fill="none" stroke="url(#${id})" stroke-width="${ring.toFixed(2)}" stroke-dasharray="${len.toFixed(2)} ${(c-len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"/>`;
      off+=it.fraction*c;
    }
  } else {
    segs=`<circle cx="${cx}" cy="${cx}" r="${mid.toFixed(2)}" fill="none" stroke="var(--divider)" stroke-width="${ring.toFixed(2)}"/>`;
  }
  const shadow=`<circle cx="${cx}" cy="${(cx+ring*0.18).toFixed(2)}" r="${mid.toFixed(2)}" fill="none" stroke="rgba(0,0,0,.26)" stroke-width="${ring.toFixed(2)}" filter="url(#blur)"/>`;
  let gloss='';
  if (hasData){
    const hr=hole+ring*0.72;
    gloss=`<path d="${arcPath(cx,cx,hr,Math.PI*1.12,Math.PI*1.12+Math.PI*0.76)}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="${(ring*0.34).toFixed(2)}" stroke-linecap="round" filter="url(#blur2)"/>`;
  }
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`+
    `<defs>${defs}<filter id="blur"><feGaussianBlur stdDeviation="${(ring*0.22).toFixed(2)}"/></filter><filter id="blur2"><feGaussianBlur stdDeviation="${(ring*0.28).toFixed(2)}"/></filter></defs>`+
    shadow+`<g transform="rotate(-90 ${cx} ${cx})">${segs}</g>`+gloss+
  `</svg>`;
}
function gaugeSVG(ratio, maxRatio, size){
  const s=size, max=maxRatio<=0?1.3:maxRatio;
  const active=ratio!=null;
  const frac=active?Math.min(Math.max(ratio/max,0),1):0;
  const over=active && ratio>max;
  const px=s/2, py=s*0.60, r=s*0.34, sw=s*0.10;
  const third=Math.PI/3, green='#4ADE80', amber='#FBBF24', red='#F87171', dark='#2B3A4A';
  const tint=(col)=>active?col:hexA(col,0.35);
  let arcs;
  if (over){ arcs=`<path d="${arcPath(px,py,r,Math.PI,2*Math.PI)}" fill="none" stroke="#fff" stroke-width="${sw}"/>`; }
  else { arcs=
    `<path d="${arcPath(px,py,r,Math.PI,Math.PI+third)}" fill="none" stroke="${tint(green)}" stroke-width="${sw}"/>`+
    `<path d="${arcPath(px,py,r,Math.PI+third,Math.PI+2*third)}" fill="none" stroke="${tint(amber)}" stroke-width="${sw}"/>`+
    `<path d="${arcPath(px,py,r,Math.PI+2*third,2*Math.PI)}" fill="none" stroke="${tint(red)}" stroke-width="${sw}"/>`; }
  const ang=Math.PI+frac*Math.PI, len=r*0.74, [tx,ty]=pt(px,py,len,ang), badge=over?red:'#fff';
  return `<svg viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">`+
    `<circle cx="${px}" cy="${s/2}" r="${s/2}" fill="${badge}"/>`+arcs+
    `<line x1="${px}" y1="${py}" x2="${tx.toFixed(2)}" y2="${ty.toFixed(2)}" stroke="${dark}" stroke-width="${s*0.05}" stroke-linecap="round"/>`+
    `<circle cx="${px}" cy="${py}" r="${s*0.06}" fill="${dark}"/><circle cx="${px}" cy="${py}" r="${s*0.028}" fill="${badge}"/></svg>`;
}
function balanceGaugeSVG(income, expense, size){
  const w=size, hgt=size*0.62, px=w/2, py=hgt-w*0.06, r=w*0.42, sw=w*0.07;
  const green='#4ADE80', red='#F87171', dark='#2B3A4A';
  const scale=Math.max(income,expense);
  const fe=scale>0?Math.min(expense/scale,1):0, fi=scale>0?Math.min(income/scale,1):0;
  const aE=Math.PI+fe*(Math.PI/2), aI=2*Math.PI-fi*(Math.PI/2);
  const needle=(a,col)=>{ const [x,y]=pt(px,py,r*0.82,a); return `<line x1="${px}" y1="${py}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${col}" stroke-width="${w*0.035}" stroke-linecap="round"/>`; };
  return `<svg viewBox="0 0 ${w} ${hgt}" width="${w}" height="${hgt}">`+
    `<path d="${arcPath(px,py,r,Math.PI,Math.PI*1.5)}" fill="none" stroke="${hexA(red,0.30)}" stroke-width="${sw}" stroke-linecap="round"/>`+
    `<path d="${arcPath(px,py,r,Math.PI*1.5,2*Math.PI)}" fill="none" stroke="${hexA(green,0.30)}" stroke-width="${sw}" stroke-linecap="round"/>`+
    needle(aE,red)+needle(aI,green)+
    `<circle cx="${px}" cy="${py}" r="${w*0.05}" fill="${dark}"/><circle cx="${px}" cy="${py}" r="${w*0.022}" fill="#fff"/></svg>`;
}
function svgBox(markup){ return h('div',{html:markup}); }

/* -------------------------------------------------- Каркас/рендер ----------- */
const NAV=[
  {id:'dashboard', label:'Главная', ic:'home'},
  {id:'transactions', label:'Операции', ic:'list'},
  {id:'analysis', label:'Графики', ic:'bars'},
  {id:'more', label:'Ещё', ic:'menu'},
];
const TOP_TABS=new Set(['dashboard','transactions','analysis','more']);
function navigate(screen){ S.ui.screen=screen; render(); const sc=document.querySelector('.screen'); if (sc) sc.scrollTop=0; }

function render(){
  applyTheme();
  const screen=S.ui.screen;
  const map={ dashboard:screenDashboard, transactions:screenTransactions, analysis:screenAnalysis, more:screenMore,
    accounts:screenAccounts, categories:screenCategories, limits:screenLimits, appearance:screenAppearance,
    recurring:screenRecurring, io:screenIO, notifications:screenNotifications, security:screenSecurity };
  const view=(map[screen]||screenDashboard)();
  const app=h('div',{class:'app'});
  if (view.bar) app.appendChild(view.bar);
  app.appendChild(view.body);
  if (TOP_TABS.has(screen)){
    if (!useDrawer()) app.appendChild(bottomNav(screen));
    if (screen==='dashboard'||screen==='transactions')
      app.appendChild(h('button',{class:'fab', 'aria-label':'Добавить', onclick:()=>openAddSheet(null)}, icon('add',30)));
  }
  const root=document.getElementById('root'); root.innerHTML=''; root.appendChild(app);
}
function bottomNav(active){
  return h('nav',{class:'bottomnav'},
    NAV.map(n=>h('button',{class:'bn-item'+(n.id===active?' active':''), onclick:()=>navigate(n.id)},
      icon(n.ic,24), h('span',{}, n.label))));
}

/* Шапка с центрированным заголовком и кнопками по краям. */
function appbar(opts){
  const row=h('div',{class:'ab-row'});
  row.appendChild(opts.left || h('div',{class:'ab-spacer'}));
  if (opts.titleEl) row.appendChild(opts.titleEl);
  else row.appendChild(h('div',{class:'appbar-title'}, opts.title||''));
  row.appendChild(opts.right || h('div',{class:'ab-spacer'}));
  const bar=h('header',{class:'appbar'}, row);
  if (opts.bottom) bar.appendChild(opts.bottom);
  return bar;
}
function abBtn(name, onclick, color){ return h('button',{class:'ab-btn', style:color?{color}:null, onclick}, icon(name,24)); }
function backBtn(to){ return abBtn('back', ()=>navigate(useDrawer()?'dashboard':(to||'more'))); }

/* Заголовок-селектор счёта (имя + баланс) для дашборда/операций/анализа. */
function accountTitleEl(){
  const net=netByAccount();
  const acc=S.ui.selectedAccountId!=null?accountById(S.ui.selectedAccountId):null;
  const name=acc?acc.name:'Все счета';
  return h('div',{class:'acct-title'},
    h('button',{class:'acct-sel', onclick:openAccountSelector},
      h('span',{class:'acct-name'}, name), icon('down',22)),
    h('div',{class:'acct-bal'}, money(displayedBalance(net))));
}
/* Подчёркнутые вкладки типа на акцентной шапке. */
function uTabs(items, value, onChange){
  return h('div',{class:'utabs'},
    items.map(([v,l])=>h('button',{class:'utab'+(value===v?' active':''), onclick:()=>onChange(v)},
      l, h('span',{class:'utab-ink'}))));
}
/* Чипы периода (День/Неделя/Месяц/Год/Период). */
function periodChips(){
  const types=[['day','День'],['week','Неделя'],['month','Месяц'],['year','Год']];
  const chips=types.map(([t,l])=>h('button',{class:'chip'+(S.ui.periodType===t?' active':''),
    onclick:()=>{ S.ui.periodType=t; S.ui.customRange=null; S.ui.anchor=todayStart(); render(); }}, l));
  const customActive=(S.ui.periodType==='custom'||S.ui.periodType==='all');
  chips.push(h('button',{class:'chip'+(customActive?' active':''), onclick:openPeriodPicker},
    S.ui.periodType==='all'?'Весь период':(S.ui.periodType==='custom'?'Период ·':'Период')));
  return h('div',{class:'chips'}, chips);
}
function periodNav(cls){
  const fwd=canGoForward(), custom=(S.ui.periodType==='custom'||S.ui.periodType==='all');
  return h('div',{class:cls||'pnavrow'},
    h('button',{class:'pnav'+(custom?' hidden':''), onclick:()=>{ S.ui.anchor=shiftAnchor(S.ui.periodType,S.ui.anchor,-1); render(); }}, icon('chevL',24)),
    h('button',{class:'plabel', onclick:openPeriodPicker}, periodLabel(S.ui.periodType,S.ui.anchor,S.ui.customRange)),
    h('button',{class:'pnav'+(fwd?'':' hidden'), onclick:()=>{ if(canGoForward()){ S.ui.anchor=shiftAnchor(S.ui.periodType,S.ui.anchor,1); render(); } }}, icon('chevR',24)));
}
function emptyState(ic, title, sub){
  return h('div',{class:'empty'}, icon(ic,64), title?h('div',{class:'e-t'}, title):null, sub?h('div',{class:'e-s'}, sub):null);
}

/* ================= ЭКРАН: Главная ================= */
function screenDashboard(){
  const bar=appbar({ left: useDrawer()?abBtn('menu',openDrawer):null, titleEl:accountTitleEl(),
    right: useDrawer()?null:abBtn('menu',()=>navigate('more')),
    bottom:uTabs([['expense','Расходы'],['income','Доходы']], S.ui.activeType, v=>{ S.ui.activeType=v; render(); }) });
  const body=h('main',{class:'screen'});
  const inner=h('div',{class:'screen-pad with-fab'});
  inner.appendChild(h('div',{class:'gap12'}));
  inner.appendChild(periodChips());

  const slice=currentSlice(); const total=slice.reduce((s,t)=>s+t.amount,0); const items=breakdown(slice);
  const card=h('div',{class:'card donut-card'});
  card.appendChild(periodNav('donut-period'));
  if (!items.length){
    const dn=h('div',{class:'donut', style:{width:'196px',height:'196px'}, html:donutSVG([],196)});
    dn.appendChild(h('div',{class:'dcenter'}, h('div',{class:'dnote'},'нет операций')));
    card.appendChild(h('div',{class:'donut-wrap'}, dn));
  } else {
    const dn=h('div',{class:'donut', style:{width:'196px',height:'196px'}, html:donutSVG(items,196)});
    dn.appendChild(h('div',{class:'dcenter'}, h('div',{class:'dtotal'}, money(total))));
    card.appendChild(h('div',{class:'donut-wrap'}, dn));
    // свёрнутый вид при прокрутке: горизонтальная полоса-разбивка + итог
    card.appendChild(h('div',{class:'donut-collapsed'}, segmentBar(items), h('div',{class:'dc-total'}, money(total))));
    body.addEventListener('scroll', ()=>{ card.classList.toggle('collapsed', body.scrollTop>70); });
  }
  inner.appendChild(card);

  if (!items.length){
    inner.appendChild(emptyState('list','Нет операций за период', null));
  } else {
    for (const it of items){
      inner.appendChild(h('button',{class:'tile', onclick:()=>openCategoryTx(it.category)},
        h('div',{class:'brk'},
          avatar(it.category.iconKey, it.category.color, 40),
          h('div',{class:'brk-name'}, it.category.name),
          h('div',{class:'brk-pct'}, Math.round(it.fraction*100)+'%'),
          h('div',{class:'brk-amt'}, money(it.total)))));
    }
  }
  body.appendChild(inner);
  return {bar, body};
}

/* ================= ЭКРАН: Операции ================= */
const SORTS=[['dateDesc','По дате (новые)','Новые'],['dateAsc','По дате (старые)','Старые'],['amountDesc','По сумме (больше)','Больше'],['amountAsc','По сумме (меньше)','Меньше']];
function sortShort(){ return (SORTS.find(s=>s[0]===S.ui.sort)||SORTS[0])[2]; }
function screenTransactions(){
  const bar=appbar({ left: useDrawer()?abBtn('menu',openDrawer):null, titleEl:accountTitleEl(),
    bottom:uTabs([['expense','Расходы'],['income','Доходы'],['transfer','Переводы']], S.ui.txTab, v=>{ S.ui.txTab=v; render(); }) });
  const body=h('main',{class:'screen'});
  const inner=h('div',{class:'screen-pad with-fab'});
  inner.appendChild(h('div',{class:'gap12'}));
  inner.appendChild(periodChips());
  inner.appendChild(periodNav());

  const isTransfer=S.ui.txTab==='transfer';
  let list;
  if (isTransfer) list=sortTx(currentTransfers());
  else { const r=rangeFor(S.ui.periodType,S.ui.anchor,S.ui.customRange); const acc=S.ui.selectedAccountId;
    list=sortTx(S.data.transactions.filter(t=>t.type===S.ui.txTab && (acc==null?!accExcluded(t.accountId):t.accountId===acc) && inRange(t,r))); }
  const total=list.reduce((s,t)=>s+t.amount,0);

  inner.appendChild(h('div',{class:'head-row'},
    h('div',{class:'h-total'}, (isTransfer?'Переведено: ':'Всего: ')+money(total)),
    h('button',{class:'h-sort', onclick:openSortMenu}, icon('sort',20), sortShort(), icon('down',18))));

  if (!list.length){
    inner.appendChild(emptyState(isTransfer?'swapH':'list',
      isTransfer?'Нет переводов':'Нет операций',
      isTransfer?'Добавьте перевод кнопкой +':'Добавьте операцию кнопкой +'));
    body.appendChild(inner); return {bar, body};
  }
  const grouped=(S.ui.sort==='dateDesc'||S.ui.sort==='dateAsc');
  if (grouped){
    let curKey=null;
    for (const t of list){
      const d=startOfDay(new Date(t.date)), key=+d;
      if (key!==curKey){ curKey=key; inner.appendChild(h('div',{class:'day-head'}, dayFull(d))); }
      inner.appendChild(txTile(t));
    }
  } else { for (const t of list) inner.appendChild(txTile(t)); }
  body.appendChild(inner);
  return {bar, body};
}
function txTile(t){
  if (t.type==='transfer'){
    const from=accountById(t.accountId), to=accountById(t.toAccountId);
    return h('button',{class:'tile', onclick:()=>openAddSheet(t)}, h('div',{class:'tx'},
      avatar(from?from.iconKey:'wallet', from?from.color:'#5C6BC0', 42),
      h('div',{class:'tx-mid'},
        h('div',{class:'tx-name'}, from?from.name:'Счёт'),
        h('div',{class:'tx-sub'}, icon('arrowR',13), (to?to.name:'Счёт')+(t.comment?' · '+t.comment:''))),
      h('div',{class:'tx-amt amt-transfer'}, money(t.amount))));
  }
  const cat=categoryById(t.categoryId), acc=accountById(t.accountId), isInc=t.type==='income';
  const amt=h('div',{class:'tx-amt '+(isInc?'amt-income':'amt-expense')}, (isInc?'+':'')+money(t.amount));
  if (t.originalCurrency) amt.appendChild(h('span',{class:'tx-orig'}, fmtNum(t.originalAmount)+' '+(CUR_SYMBOL[t.originalCurrency]||t.originalCurrency)));
  return h('button',{class:'tile', onclick:()=>openAddSheet(t)}, h('div',{class:'tx'},
    avatar(cat?cat.iconKey:'other', cat?cat.color:'#9E9E9E', 42),
    h('div',{class:'tx-mid'},
      h('div',{class:'tx-name'}, cat?cat.name:'Без категории'),
      t.comment?h('div',{class:'tx-sub'}, t.comment):(acc?h('div',{class:'tx-sub'}, acc.name):null)),
    amt));
}
function openSortMenu(){
  const body=h('div',{});
  for (const [v,l] of SORTS) body.appendChild(h('button',{class:'lt', onclick:()=>{ S.ui.sort=v; closeSheet(); render(); }},
    h('div',{class:'lt-mid'}, h('div',{class:'lt-title'}, l)), S.ui.sort===v?h('span',{class:'lt-check'}, icon('check',22)):null));
  openSheet({title:'Сортировка', body});
}

/* ================= ЭКРАН: Анализ ================= */
function screenAnalysis(){
  const bar=appbar({ left: useDrawer()?abBtn('menu',openDrawer):null, title:'Анализ',
    bottom:uTabs([['expense','Расходы'],['income','Доходы'],['total','Общий']], S.ui.analysisMode, v=>{ S.ui.analysisMode=v; render(); }) });
  const body=h('main',{class:'screen'});
  const inner=h('div',{class:'screen-pad'});
  inner.appendChild(h('div',{class:'gap12'}));
  inner.appendChild(periodChips());
  inner.appendChild(periodNav());

  const combined=S.ui.analysisMode==='total';
  let gran=S.ui.periodType; if (gran==='custom'||gran==='all') gran='month';
  const N=gran==='year'?5:(gran==='month'?12:(gran==='week'?8:7));
  const acc=S.ui.selectedAccountId;
  const buckets=[];
  for (let i=N-1;i>=0;i--){
    const a=shiftAnchor(gran,S.ui.anchor,-i), r=rangeFor(gran,a);
    let exp=0, inc=0;
    for (const t of S.data.transactions){ if (acc==null?accExcluded(t.accountId):t.accountId!==acc) continue; if(!inRange(t,r)) continue;
      if (t.type==='expense') exp+=t.amount; else if (t.type==='income') inc+=t.amount; }
    buckets.push({exp,inc,label:bucketLabel(gran,a)});
  }
  const r=rangeFor(S.ui.periodType,S.ui.anchor,S.ui.customRange);
  let pExp=0,pInc=0;
  for (const t of S.data.transactions){ if (acc!=null&&t.accountId!==acc) continue; if(!inRange(t,r)) continue;
    if (t.type==='expense') pExp+=t.amount; else if (t.type==='income') pInc+=t.amount; }
  const periodMode=S.ui.analysisMode==='income'?'income':'expense';
  const periodItems=breakdown(S.data.transactions.filter(t=>t.type===periodMode && (acc==null?!accExcluded(t.accountId):t.accountId===acc) && inRange(t,r)));

  const maxV=Math.max(1,...buckets.map(b=>combined?Math.max(b.exp,b.inc):(S.ui.analysisMode==='income'?b.inc:b.exp)));
  const isPie=S.ui.chartType==='pie';
  const chartCard=h('div',{class:'card'});
  const toggle=h('div',{class:'toggle-seg'},
    h('button',{class:isPie?'':'active', onclick:()=>{ S.ui.chartType='bars'; render(); }}, icon('bars',18)),
    h('button',{class:isPie?'active':'', onclick:()=>{ S.ui.chartType='pie'; render(); }}, icon('pie',18)));
  const ttl=isPie?(combined?'Доходы и расходы':'Распределение за период'):'Динамика';
  chartCard.appendChild(h('div',{style:{display:'flex',alignItems:'center',marginBottom:'12px'}},
    h('div',{style:{flex:'1',fontSize:'1rem',fontWeight:'700'}}, ttl), toggle));
  const legend=()=>h('div',{class:'legend'},
    h('span',{class:'lg'}, h('span',{class:'dot', style:{background:'var(--income)'}}), 'Доходы'),
    h('span',{class:'lg'}, h('span',{class:'dot', style:{background:'var(--expense)'}}), 'Расходы'));
  if (!isPie){
    const bars=h('div',{class:'bars'});
    for (const b of buckets){
      const grp=h('div',{class:'bar-grp'});
      if (combined){ grp.appendChild(h('div',{class:'bar inc', style:{height:(b.inc/maxV*100)+'%'}})); grp.appendChild(h('div',{class:'bar exp', style:{height:(b.exp/maxV*100)+'%'}})); }
      else { const v=S.ui.analysisMode==='income'?b.inc:b.exp; grp.appendChild(h('div',{class:'bar '+(S.ui.analysisMode==='income'?'inc':'exp'), style:{height:(v/maxV*100)+'%'}})); }
      bars.appendChild(h('div',{class:'bar-col'}, grp, h('div',{class:'bar-lbl'}, b.label)));
    }
    chartCard.appendChild(bars);
    if (combined) chartCard.appendChild(legend());
  } else if (combined){
    const bal=pInc-pExp, tot=Math.max(1,pInc+pExp);
    const segs=[]; if (pInc>0) segs.push({category:{color:'#3DAE6B'}, fraction:pInc/tot, total:pInc}); if (pExp>0) segs.push({category:{color:'#E5564E'}, fraction:pExp/tot, total:pExp});
    const dn=h('div',{class:'donut', style:{width:'200px',height:'200px'}, html:donutSVG(segs,200)});
    dn.appendChild(h('div',{class:'dcenter'}, h('div',{class:'dtotal', style:{color:bal>=0?'var(--income)':'var(--expense)'}}, money(bal)), h('div',{class:'dnote'},'баланс')));
    chartCard.appendChild(h('div',{class:'donut-wrap'}, dn));
    chartCard.appendChild(legend());
  } else {
    if (!periodItems.length) chartCard.appendChild(h('div',{class:'muted', style:{textAlign:'center',padding:'24px'}},'Нет операций за выбранный период'));
    else { const tot=periodItems.reduce((s,i)=>s+i.total,0);
      const dn=h('div',{class:'donut', style:{width:'200px',height:'200px'}, html:donutSVG(periodItems,200)});
      dn.appendChild(h('div',{class:'dcenter'}, h('div',{class:'dtotal'}, money(tot))));
      chartCard.appendChild(h('div',{class:'donut-wrap'}, dn)); }
  }
  inner.appendChild(chartCard);

  if (!combined){
    const items=periodItems;
    const bc=h('div',{class:'card'});
    bc.appendChild(h('div',{style:{fontSize:'1rem',fontWeight:'700',marginBottom:'12px'}},'По категориям за период'));
    if (!items.length) bc.appendChild(h('div',{class:'muted'},'Нет операций за период'));
    else for (const it of items){
      bc.appendChild(h('div',{class:'abreak'},
        avatar(it.category.iconKey, it.category.color, 40),
        h('div',{class:'ab-mid'},
          h('div',{class:'ab-top'}, h('div',{class:'ab-name'}, it.category.name), h('div',{class:'ab-amt'}, money(it.total))),
          h('div',{class:'ab-top', style:{marginTop:'6px'}},
            h('div',{class:'ab-bar'}, h('span',{style:{width:(it.fraction*100).toFixed(1)+'%', background:safeColor(it.category.color)}})),
            h('div',{class:'ab-pct'}, Math.round(it.fraction*100)+'%')))));
    }
    inner.appendChild(bc);
  }

  const tot=h('div',{class:'card'});
  tot.appendChild(h('div',{style:{fontSize:'1rem',fontWeight:'700',marginBottom:'12px'}},'Итоги за период'));
  tot.appendChild(h('div',{class:'trow'}, h('div',{class:'tr-l'},'Доходы'), h('div',{class:'tr-v', style:{color:'var(--income)'}}, money(pInc))));
  tot.appendChild(h('div',{class:'trow'}, h('div',{class:'tr-l'},'Расходы'), h('div',{class:'tr-v', style:{color:'var(--expense)'}}, money(pExp))));
  tot.appendChild(h('div',{class:'adivider'}));
  tot.appendChild(h('div',{class:'trow emph'}, h('div',{class:'tr-l'},'Баланс'),
    h('div',{class:'tr-v', style:{color:(pInc-pExp)>=0?'var(--income)':'var(--expense)'}}, money(pInc-pExp))));
  inner.appendChild(tot);

  body.appendChild(inner);
  return {bar, body};
}
function bucketLabel(gran, a){
  if (gran==='day') return String(a.getDate());
  if (gran==='week') return dayMonthShort(rangeFor('week',a).start);
  if (gran==='month') return String(a.getMonth()+1);
  if (gran==='year') return String(a.getFullYear());
  return '';
}
/* ================= ЭКРАН: Ещё (хаб) ================= */
function gaugeColForKey(key, g){
  const pct=(r)=> r!=null ? ' · '+Math.round(r*100)+'%' : '';
  if (key==='day') return h('div',{class:'gauge-col'}, svgBox(gaugeSVG(g.dayRatio,g.dayMax,52)), h('div',{class:'g-lbl'},'День'+pct(g.dayRatio)));
  if (key==='limit') return h('div',{class:'gauge-col'}, svgBox(gaugeSVG(g.limitRatio,1,52)), h('div',{class:'g-lbl'},'Лимит'+pct(g.limitRatio)));
  if (key==='income_day') return h('div',{class:'gauge-col'}, svgBox(gaugeSVG(g.incomeDayRatio,2,52)), h('div',{class:'g-lbl'},'Доход'+pct(g.incomeDayRatio)));
  if (key==='income_target') return h('div',{class:'gauge-col'}, svgBox(gaugeSVG(g.incomeTargetRatio,1,52)), h('div',{class:'g-lbl'},'Цель'+pct(g.incomeTargetRatio)));
  if (key==='balance') return h('div',{class:'gauge-col'}, svgBox(balanceGaugeSVG(g.monthIncome,g.monthExpense,84)), h('div',{class:'g-lbl'},'Баланс'));
  return null;
}
function screenMore(){
  const body=h('main',{class:'screen'});
  const g=gaugeData(), net=netByAccount();
  const head=h('div',{class:'hub-head'});
  const sel=S.data.settings.headerGauges;
  const order=['day','limit','income_day','income_target','balance'];
  const shown=order.filter(k=>sel.includes(k)).map(k=>gaugeColForKey(k,g)).filter(Boolean);
  if (shown.length) head.appendChild(h('div',{class:'hub-gauges'}, shown));
  head.appendChild(h('div',{class:'hub-balance'}, 'Остаток: '+money(totalBalance(net))));
  body.appendChild(head);

  const sec=(scr,ic,title)=>h('button',{class:'lt', onclick:()=>navigate(scr)},
    h('span',{class:'lt-lead'}, icon(ic,24)), h('div',{class:'lt-mid'}, h('div',{class:'lt-title'}, title)), h('span',{class:'lt-trail'}, icon('chevR',22)));
  const dv=()=>h('div',{style:{height:'1px',background:'var(--divider)',margin:'8px 16px'}});
  const wrap=h('div',{class:'screen-pad', style:{paddingTop:'0'}});
  wrap.appendChild(sec('accounts','wallet','Счета'));
  wrap.appendChild(sec('categories','category','Категории'));
  wrap.appendChild(dv());
  wrap.appendChild(sec('appearance','palette','Оформление'));
  wrap.appendChild(sec('security','lock','Безопасность'));
  wrap.appendChild(sec('notifications','bell','Уведомления'));
  wrap.appendChild(sec('limits','speed','Спидометры'));
  wrap.appendChild(sec('recurring','repeat','Регулярные операции'));
  wrap.appendChild(dv());
  wrap.appendChild(sec('io','io','Импорт и экспорт'));
  wrap.appendChild(h('button',{class:'lt', onclick:openAbout}, h('span',{class:'lt-lead'}, icon('info',24)),
    h('div',{class:'lt-mid'}, h('div',{class:'lt-title'},'О приложении'))));
  body.appendChild(wrap);
  return {bar: null, body};  // у хаба «Ещё» собственной шапки нет — сверху зелёный заголовок
}

/* ================= ЭКРАН: Счета ================= */
function screenAccounts(){
  const bar=appbar({ left:backBtn('more'), title:'Счета', right:abBtn('add',()=>openAccountEdit(null)) });
  const body=h('main',{class:'screen'}); const inner=h('div',{class:'screen-pad flat', style:{paddingTop:'8px'}});
  const net=netByAccount();
  const totalCard=h('div',{class:'card', style:{background:'var(--accent)', color:'var(--on-accent)', padding:'20px'}});
  totalCard.appendChild(h('div',{style:{fontSize:'.86rem',opacity:'.92'}},'Общий баланс'));
  totalCard.appendChild(h('div',{style:{fontSize:'1.7rem',fontWeight:'700',marginTop:'6px'}}, money(totalBalance(net))));
  inner.appendChild(totalCard);
  inner.appendChild(h('div',{class:'gap8'}));
  for (const a of S.data.accounts.slice().sort((x,y)=>x.sortOrder-y.sortOrder)){
    inner.appendChild(h('button',{class:'tile', onclick:()=>openAccountEdit(a)}, h('div',{class:'lt'},
      avatar(a.iconKey,a.color,42),
      h('div',{class:'lt-mid'}, h('div',{class:'lt-title', style:{fontWeight:'500'}}, a.name),
        a.excludeFromTotal?h('div',{style:{fontSize:'.78rem',color:'var(--text2)',marginTop:'2px'}},'не в общем балансе'):null),
      h('div',{class:'lt-val'}, money(balanceOf(a.id,net))))));
  }
  body.appendChild(inner); return {bar, body};
}

/* ================= ЭКРАН: Категории ================= */
function screenCategories(){
  const bar=appbar({ left:backBtn('more'), title:'Категории', right:abBtn('add',()=>openCategoryEdit(null, S.ui.catTab)) });
  const body=h('main',{class:'screen'}); const inner=h('div',{class:'screen-pad flat'});
  inner.appendChild(h('div',{class:'segtabs', style:{margin:'8px 16px 8px'}},
    [['expense','РАСХОД','--expense'],['income','ДОХОД','--income']].map(([t,l,cv])=>
      h('button',{class:'segtab'+(S.ui.catTab===t?' active':''), style:S.ui.catTab===t?{background:'var('+cv+')'}:null,
        onclick:()=>{ S.ui.catTab=t; render(); }}, l))));
  const cats=categoriesOfType(S.ui.catTab).sort((a,b)=>a.sortOrder-b.sortOrder);
  if (!cats.length) inner.appendChild(emptyState('category','Нет категорий','Добавьте первую категорию кнопкой +'));
  for (const c of cats){
    inner.appendChild(h('button',{class:'tile', onclick:()=>openCategoryEdit(c, c.type)}, h('div',{class:'lt'},
      avatar(c.iconKey,c.color,42),
      h('div',{class:'lt-mid'}, h('div',{class:'lt-title', style:{fontWeight:'500'}}, c.name)),
      h('span',{class:'lt-trail'}, icon('chevR',22)))));
  }
  body.appendChild(inner); return {bar, body};
}

/* ================= ЭКРАН: Спидометры ================= */
function bigGauge(svg, label, sub){ return h('div',{class:'gc-col'}, svgBox(svg), h('div',{class:'g-lbl2'}, label), h('div',{class:'g-sub'}, sub)); }
function amountFieldBlock(ctrlRef, hint, suggestion, suggestionLabel, onSave, onReset){
  const input=h('input',{class:'input', type:'text', inputmode:'decimal', placeholder:hint, value:ctrlRef.value});
  input.addEventListener('input',()=>ctrlRef.value=input.value);
  const rows=[input];
  if (suggestion>0) rows.push(h('div',{class:'helper', style:{display:'flex',alignItems:'center',gap:'6px'}}, icon('bulb',16), 'Подсказка: ваш '+suggestionLabel+' — '+money(suggestion)));
  rows.push(h('div',{class:'btn-row', style:{marginTop:'10px'}},
    h('button',{class:'btn primary', onclick:()=>onSave(input.value)},'Сохранить'),
    onReset?h('button',{class:'btn outline', onclick:onReset},'Сбросить'):null));
  return h('div',{class:'field'}, rows);
}
function screenLimits(){
  const bar=appbar({ left:backBtn('more'), title:'Спидометры' });
  const body=h('main',{class:'screen'}); const inner=h('div',{class:'screen-pad flat'});
  const g=gaugeData(), st=S.data.settings;
  const pct=r=>r!=null?Math.round(r*100)+'%':null;

  inner.appendChild(h('div',{class:'section-title'},'Расходы'));
  inner.appendChild(h('div',{class:'card', style:{padding:'18px 8px'}}, h('div',{style:{display:'flex',justifyContent:'space-evenly'}},
    bigGauge(gaugeSVG(g.dayRatio,g.dayMax,110),'Траты дня', g.dayRatio==null?'мало данных':(pct(g.dayRatio)+' от обычного')),
    bigGauge(gaugeSVG(g.limitRatio,1,110),'Лимит месяца', st.monthlyLimit>0?(pct(g.limitRatio)+' лимита'):'не задан'))));
  if (st.monthlyLimit>0) inner.appendChild(h('div',{style:{padding:'10px 16px 0',fontWeight:'600',fontSize:'.9rem'}},
    'Потрачено за месяц: '+money(g.monthExpense)+' из '+money(st.monthlyLimit)));
  const thrLabel=h('div',{class:'section-title'},'Порог «потрачено больше обычного»: +'+Math.round(st.spendAlertThreshold*100)+'%');
  const thr=h('input',{type:'range', min:'0.10', max:'1.0', step:'0.05', value:st.spendAlertThreshold});
  thr.addEventListener('input',()=>thrLabel.textContent='Порог «потрачено больше обычного»: +'+Math.round(parseFloat(thr.value)*100)+'%');
  thr.addEventListener('change',()=>{ st.spendAlertThreshold=parseFloat(thr.value); persist(); render(); });
  inner.appendChild(thrLabel); inner.appendChild(h('div',{style:{padding:'0 16px'}}, thr));
  const limRef={value: st.monthlyLimit>0?String(st.monthlyLimit):''};
  inner.appendChild(amountFieldBlock(limRef,'Месячный лимит трат, ₽', g.last30Expense,'траты за 30 дней',
    (v)=>{ const n=parseAmount(v); if(!(n>0)){ toast('Введите сумму лимита',true); return; } st.monthlyLimit=n; persist(); toast('Лимит сохранён'); render(); },
    st.monthlyLimit>0?()=>{ st.monthlyLimit=0; persist(); render(); }:null));

  inner.appendChild(h('div',{class:'section-title'},'Доходы'));
  inner.appendChild(h('div',{class:'card', style:{padding:'18px 8px'}}, h('div',{style:{display:'flex',justifyContent:'space-evenly'}},
    bigGauge(gaugeSVG(g.incomeDayRatio,2,110),'Доход дня', g.incomeDayRatio==null?'мало данных':(pct(g.incomeDayRatio)+' от обычного')),
    bigGauge(gaugeSVG(g.incomeTargetRatio,1,110),'Цель месяца', st.monthlyIncomeTarget>0?(pct(g.incomeTargetRatio)+' цели'):'не задана'))));
  if (st.monthlyIncomeTarget>0) inner.appendChild(h('div',{style:{padding:'10px 16px 0',fontWeight:'600',fontSize:'.9rem'}},
    'Получено за месяц: '+money(g.monthIncome)+' из '+money(st.monthlyIncomeTarget)));
  const incRef={value: st.monthlyIncomeTarget>0?String(st.monthlyIncomeTarget):''};
  inner.appendChild(amountFieldBlock(incRef,'Целевой доход за месяц, ₽', g.last30Income,'доход за 30 дней',
    (v)=>{ const n=parseAmount(v); if(!(n>0)){ toast('Введите целевой доход',true); return; } st.monthlyIncomeTarget=n; persist(); toast('Цель дохода сохранена'); render(); },
    st.monthlyIncomeTarget>0?()=>{ st.monthlyIncomeTarget=0; persist(); render(); }:null));

  inner.appendChild(h('div',{class:'section-title'},'Баланс месяца'));
  inner.appendChild(h('div',{class:'card', style:{padding:'18px 8px',textAlign:'center'}},
    h('div',{style:{display:'flex',justifyContent:'center'}}, svgBox(balanceGaugeSVG(g.monthIncome,g.monthExpense,200))),
    h('div',{style:{fontSize:'1.25rem',fontWeight:'700',marginTop:'10px',color:(g.monthIncome-g.monthExpense)>=0?'#4ADE80':'#F87171'}}, money(g.monthIncome-g.monthExpense)),
    h('div',{class:'muted', style:{fontSize:'.78rem',marginTop:'2px'}}, 'Доход '+money(g.monthIncome)+'  '+MINUS+'  Расход '+money(g.monthExpense))));

  inner.appendChild(h('div',{class:'section-title'},'Показывать в шапке «Ещё»'));
  const hg=h('div',{class:'card', style:{padding:'4px 16px'}});
  for (const [key,label] of [['day','Траты дня'],['limit','Лимит месяца'],['income_day','Доход дня'],['income_target','Цель месяца'],['balance','Баланс месяца']]){
    hg.appendChild(switchRow(label, st.headerGauges.includes(key), (on)=>{
      const set=new Set(st.headerGauges); if(on) set.add(key); else set.delete(key); st.headerGauges=Array.from(set); persist();
    }));
  }
  inner.appendChild(hg);
  body.appendChild(inner); return {bar, body};
}
function switchRow(label, checked, onChange){
  const input=h('input',{type:'checkbox'}); input.checked=checked;
  input.addEventListener('change',()=>onChange(input.checked));
  return h('div',{class:'row-between', style:{padding:'12px 0'}}, h('div',{}, label), h('label',{class:'switch'}, input, h('span',{class:'track'})));
}
function switchInline(checked, onChange){
  const input=h('input',{type:'checkbox'}); input.checked=checked;
  input.addEventListener('change',()=>onChange(input.checked));
  return h('label',{class:'switch'}, input, h('span',{class:'track'}));
}

/* ================= ЭКРАН: Оформление ================= */
function screenAppearance(){
  const bar=appbar({ left:backBtn('more'), title:'Оформление' });
  const body=h('main',{class:'screen'}); const inner=h('div',{class:'screen-pad flat', style:{paddingTop:'8px'}});
  const st=S.data.settings, isFull=!!FULL_THEMES.find(t=>t.id===st.themePreset);

  // Тема
  const themeSec=h('div',{class:'section'}); themeSec.appendChild(h('div',{class:'section-title'},'Тема'));
  for (const [m,l] of [['system','Как в системе'],['light','Светлая'],['dark','Тёмная']]){
    themeSec.appendChild(h('button',{class:'lt', disabled:isFull, style:isFull?{opacity:'.5'}:null,
      onclick:()=>{ if(isFull) return; st.themeMode=m; persist(); render(); }},
      h('div',{class:'lt-mid'}, h('div',{class:'lt-title'}, l), isFull?h('div',{class:'lt-sub'},'Не действует, пока выбрана тема ниже'):null),
      (st.themeMode===m&&!isFull)?h('span',{class:'lt-check'}, icon('check',22)):null));
  }
  inner.appendChild(themeSec);

  // Готовые темы
  const presetSec=h('div',{class:'section'}); presetSec.appendChild(h('div',{class:'section-title'},'Готовые тёмные темы'));
  const strip=h('div',{style:{display:'flex',gap:'12px',overflowX:'auto',padding:'0 16px 4px'}});
  const stdCard=h('button',{style:cardStyle(!isFull, 'var(--accent)'), onclick:()=>{ st.themePreset='green'; st.accentColor='#2E7D67'; persist(); render(); }},
    h('span',{class:'lt-lead', style:{color:'var(--text2)'}}, icon('nofill',18)),
    h('div',{style:{fontWeight:'700',fontSize:'.82rem'}},'Стандартная'),
    !isFull?h('span',{style:{color:'var(--accent)'}}, icon('check',18)):h('span',{},' '));
  strip.appendChild(stdCard);
  for (const t of FULL_THEMES){
    const active=st.themePreset===t.id;
    strip.appendChild(h('button',{style:cardStyle(active,t.accent,t.bg), onclick:()=>{ st.themePreset=t.id; st.accentColor=t.accent; persist(); render(); }},
      h('div',{style:{display:'flex',gap:'5px'}}, h('span',{style:dot(18,t.accent)}), h('span',{style:dot(18,t.surface)})),
      h('div',{style:{fontWeight:'700',fontSize:'.82rem',color:t.text}}, t.name),
      active?h('span',{style:{color:t.accent}}, icon('check',18)):h('span',{style:{color:t.text2,fontSize:'.7rem'}},'Тёмная')));
  }
  presetSec.appendChild(strip);
  inner.appendChild(presetSec);

  // Цветовая гамма
  const accSec=h('div',{class:'section'}); accSec.appendChild(h('div',{class:'section-title'},'Цветовая гамма'));
  const sw=h('div',{class:'colorpick', style:{padding:'4px 16px 8px'}});
  const accentColors=ACCENTS.map(a=>a.accent).concat(PALETTE.filter(p=>!ACCENTS.find(a=>a.accent===p)));
  for (const col of accentColors){
    const active=!isFull && st.accentColor===col;
    sw.appendChild(h('button',{class:'cdot'+(active?' sel':''), style:{width:'44px',height:'44px',background:col},
      onclick:()=>{ setAccentColor(col); persist(); render(); }},
      active?h('span',{class:'ck', style:{color:onAccentAuto(col)}}, icon('check',22)):null));
  }
  accSec.appendChild(sw);
  accSec.appendChild(h('button',{class:'lt', style:{color:'var(--accent)'}, onclick:()=>{ st.themePreset='green'; st.accentColor='#2E7D67'; persist(); render(); }},
    h('span',{class:'lt-lead'}, icon('reset',20)), h('div',{class:'lt-mid'}, h('div',{class:'lt-title', style:{color:'var(--accent)'}},'Сбросить по умолчанию'))));
  inner.appendChild(accSec);

  // Цвет текста на акценте
  const txtSec=h('div',{class:'section'}); txtSec.appendChild(h('div',{class:'section-title'},'Цвет текста на акценте'));
  for (const [m,l,s] of [['auto','Авто (контраст)','Белый на тёмном фоне, тёмный — на светлом'],['light','Светлый','Всегда белые надписи'],['dark','Тёмный','Всегда тёмные надписи']]){
    txtSec.appendChild(h('button',{class:'lt', onclick:()=>{ st.accentTextMode=m; persist(); render(); }},
      h('div',{class:'lt-mid'}, h('div',{class:'lt-title'}, l), h('div',{class:'lt-sub'}, s)),
      st.accentTextMode===m?h('span',{class:'lt-check'}, icon('check',22)):null));
  }
  inner.appendChild(txtSec);

  // Шрифт
  const fontSec=h('div',{class:'section'}); fontSec.appendChild(h('div',{class:'section-title'},'Шрифт'));
  for (const [f,l] of [[null,'Стандартный'],['dejavu','DejaVu Sans'],['serif','С засечками'],['mono','Моноширинный']]){
    fontSec.appendChild(h('button',{class:'lt', onclick:()=>{ st.fontFamily=f; persist(); render(); }},
      h('div',{class:'lt-mid'}, h('div',{class:'lt-title', style:{fontFamily:FONTS[f]}}, l)),
      st.fontFamily===f?h('span',{class:'lt-check'}, icon('check',22)):null));
  }
  inner.appendChild(fontSec);

  // Масштаб
  const scaleSec=h('div',{class:'section'});
  const scaleLabel=h('div',{class:'section-title'},'Размер интерфейса: '+Math.round(st.uiScale*100)+'%');
  const scale=h('input',{type:'range', min:'0.85', max:'1.35', step:'0.05', value:st.uiScale});
  scale.addEventListener('input',()=>{ const v=parseFloat(scale.value); scaleLabel.textContent='Размер интерфейса: '+Math.round(v*100)+'%'; document.documentElement.style.setProperty('--scale', v); });
  scale.addEventListener('change',()=>{ st.uiScale=parseFloat(scale.value); persist(); render(); });
  scaleSec.appendChild(scaleLabel); scaleSec.appendChild(h('div',{style:{padding:'0 16px 8px'}}, scale));
  inner.appendChild(scaleSec);

  // Навигация: где показывать меню
  const navSec=h('div',{class:'section'}); navSec.appendChild(h('div',{class:'section-title'},'Навигация'));
  for (const [v,l,s] of [['bottom','Нижняя панель','Разделы внизу экрана + кнопка «Ещё»'],['drawer','Боковое меню','Кнопка-гамбургер слева открывает меню']]){
    navSec.appendChild(h('button',{class:'lt', onclick:()=>{ st.navStyle=v; persist(); render(); }},
      h('div',{class:'lt-mid'}, h('div',{class:'lt-title'}, l), h('div',{class:'lt-sub'}, s)),
      st.navStyle===v?h('span',{class:'lt-check'}, icon('check',22)):null));
  }
  inner.appendChild(navSec);

  body.appendChild(inner); return {bar, body};
}
function cardStyle(active, accent, bg){ return {flex:'0 0 auto',width:'92px',minHeight:'88px',borderRadius:'14px',padding:'10px',
  display:'flex',flexDirection:'column',justifyContent:'space-between',alignItems:'flex-start',
  background:bg||'var(--surface)', border:(active?'2.5px solid '+accent:'1px solid var(--divider)')}; }
function dot(sz,col){ return {width:sz+'px',height:sz+'px',borderRadius:'50%',background:col,display:'inline-block'}; }

/* ================= ЭКРАН: Регулярные операции ================= */
const FREQ_TITLE={daily:'Каждый день', weekly:'Каждую неделю', monthly:'Каждый месяц', yearly:'Каждый год'};
const FREQ_SHORT=[['daily','День'],['weekly','Неделя'],['monthly','Месяц'],['yearly','Год']];
function screenRecurring(){
  const bar=appbar({ left:backBtn('more'), title:'Регулярные операции', right:abBtn('add',()=>openAddSheet(null,true)) });
  const body=h('main',{class:'screen'}); const inner=h('div',{class:'screen-pad flat', style:{paddingTop:'8px'}});
  if (!S.data.recurring.length){
    inner.appendChild(emptyState('repeat','Нет регулярных операций','Добавьте по кнопке + или отметьте операцию как регулярную при создании.'));
    body.appendChild(inner); return {bar, body};
  }
  for (const rule of S.data.recurring){
    const cat=categoryById(rule.categoryId), next=new Date(rule.nextRun), inc=rule.type==='income';
    inner.appendChild(h('div',{class:'tile'}, h('div',{class:'lt'},
      avatar(cat?cat.iconKey:'other', cat?cat.color:'#9E9E9E', 40),
      h('div',{class:'lt-mid'}, h('div',{class:'lt-title', style:{fontWeight:'500'}}, cat?cat.name:'Операция'),
        h('div',{class:'lt-sub'}, FREQ_TITLE[rule.frequency]+' · след. '+dayMonthShort(next))),
      h('span',{class:'lt-trail'},
        h('span',{style:{color:rule.enabled?(inc?'var(--income)':'var(--expense)'):'var(--text2)',fontWeight:'600'}}, signedMoney(rule.amount,inc)),
        switchInline(rule.enabled,(on)=>{ rule.enabled=on; if(on){ materializeRecurring(); afterMutation(); } else { persist(); render(); } }),
        h('button',{class:'ab-btn', style:{color:'var(--danger)'}, onclick:()=>openConfirm('Удалить регулярную операцию?','Уже созданные операции останутся, новые создаваться не будут.','Удалить',()=>{
          S.data.recurring=S.data.recurring.filter(r=>r.id!==rule.id); persist(); render(); })}, icon('trash',22))) )));
  }
  body.appendChild(inner); return {bar, body};
}
/* ================= Диалоги / листы ================= */
function openDialog(title, content, actions){
  closeDialog();
  const scrim=h('div',{class:'dialog-scrim', onclick:(e)=>{ if(e.target===scrim) closeDialog(); }});
  const dlg=h('div',{class:'dialog'});
  if (title) dlg.appendChild(h('h3',{}, title));
  if (content) dlg.appendChild(content);
  if (actions){
    const ab=h('div',{class:'dialog-actions'});
    for (const a of actions) ab.appendChild(h('button',{class:'tbtn'+(a.danger?' danger':''), onclick:a.onclick}, a.label));
    dlg.appendChild(ab);
  }
  scrim.appendChild(dlg); document.body.appendChild(scrim);
  requestAnimationFrame(()=>scrim.classList.add('show'));
}
function closeDialog(){ const d=document.querySelector('.dialog-scrim'); if (d) d.remove(); }
function openConfirm(title, text, confirmLabel, onConfirm){
  openDialog(title, h('p',{}, text), [
    {label:'Отмена', onclick:closeDialog},
    {label:confirmLabel, danger:true, onclick:()=>{ closeDialog(); onConfirm(); }},
  ]);
}
let _sheetCloser=null;
function openSheet({title, full, body, footer, action}){
  closeSheet();
  const scrim=h('div',{class:'sheet-scrim', onclick:(e)=>{ if(e.target===scrim) closeSheet(); }});
  const sheet=h('div',{class:'sheet'+(full?' full':'')});
  if (!full) sheet.appendChild(h('div',{class:'grab'}));
  const head=h('div',{class:'sheet-head'},
    h('button',{class:'ab-btn', onclick:closeSheet}, icon(full?'close':'chevL',24)),
    h('div',{class:'sh-title'}, title||''));
  if (action) head.appendChild(action);
  sheet.appendChild(head);
  const sb=h('div',{class:'sheet-body'}); sb.appendChild(body); sheet.appendChild(sb);
  sb.addEventListener('touchmove', dismissKeyboard, {passive:true});
  sb.addEventListener('pointerdown', (e)=>{ if (!e.target.closest('input,textarea,select,button,label,a')) dismissKeyboard(); });
  if (footer) sheet.appendChild(footer);
  scrim.appendChild(sheet); document.body.appendChild(scrim);
  requestAnimationFrame(()=>scrim.classList.add('show'));
  _sheetCloser=()=>{ scrim.remove(); _sheetCloser=null; };
}
function closeSheet(){ if (_sheetCloser) _sheetCloser(); }
let _subSheet=null;
function openSubSheet(title, body, footer){
  closeSubSheet();
  const scrim=h('div',{class:'sheet-scrim', style:{zIndex:'120'}, onclick:(e)=>{ if(e.target===scrim) closeSubSheet(); }});
  const sheet=h('div',{class:'sheet'});
  sheet.appendChild(h('div',{class:'grab'}));
  sheet.appendChild(h('div',{class:'sheet-head'}, h('button',{class:'ab-btn', onclick:closeSubSheet}, icon('chevL',24)), h('div',{class:'sh-title'}, title)));
  const sb=h('div',{class:'sheet-body'}); sb.appendChild(body); sheet.appendChild(sb);
  sb.addEventListener('touchmove', dismissKeyboard, {passive:true});
  sb.addEventListener('pointerdown', (e)=>{ if (!e.target.closest('input,textarea,select,button,label,a')) dismissKeyboard(); });
  if (footer) sheet.appendChild(footer);
  scrim.appendChild(sheet); document.body.appendChild(scrim);
  requestAnimationFrame(()=>scrim.classList.add('show'));
  _subSheet=()=>{ scrim.remove(); _subSheet=null; };
}
function closeSubSheet(){ if (_subSheet) _subSheet(); }

function openAbout(){
  const body=h('div',{style:{padding:'4px 16px 16px',textAlign:'center'}});
  body.appendChild(h('img',{src:'icons/icon-192.png', class:'about-logo'}));
  body.appendChild(h('div',{style:{fontSize:'1.25rem',fontWeight:'700',marginTop:'10px'}},'Тратометр'));
  body.appendChild(h('div',{class:'muted', style:{marginTop:'2px'}},'Веб-версия'));
  body.appendChild(h('p',{class:'muted', style:{marginTop:'14px',lineHeight:'1.5',textAlign:'left'}},
    'Учёт доходов и расходов, категории, графики анализа, импорт и выгрузка операций. '+
    'Работает офлайн. Все данные хранятся только на этом устройстве — без аккаунта, облака и передачи куда-либо.'));
  openSheet({title:'О приложении', body});
}

/* Выбор счёта (заголовок дашборда) */
function openAccountSelector(){
  const net=netByAccount(); const body=h('div',{});
  body.appendChild(h('button',{class:'lt', onclick:()=>{ S.ui.selectedAccountId=null; closeSheet(); render(); }},
    h('span',{class:'lt-lead'}, icon('wallet',24)), h('div',{class:'lt-mid'}, h('div',{class:'lt-title'},'Все счета')),
    h('span',{class:'lt-trail'}, h('span',{class:'lt-val'}, money(totalBalance(net))), S.ui.selectedAccountId==null?h('span',{class:'lt-check'}, icon('check',22)):null)));
  for (const a of S.data.accounts){
    body.appendChild(h('button',{class:'lt', onclick:()=>{ S.ui.selectedAccountId=a.id; closeSheet(); render(); }},
      avatar(a.iconKey,a.color,40),
      h('div',{class:'lt-mid'}, h('div',{class:'lt-title'}, a.name),
        a.excludeFromTotal?h('div',{style:{fontSize:'.76rem',color:'var(--text2)',marginTop:'2px'}},'не в общем балансе'):null),
      h('span',{class:'lt-trail'}, h('span',{class:'lt-val'}, money(balanceOf(a.id,net))), S.ui.selectedAccountId===a.id?h('span',{class:'lt-check'}, icon('check',22)):null)));
  }
  openSheet({title:'Счёт', body});
}

/* Выбор периода */
function toInputDate(d){ const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; }
function fromInputDate(s){ if(!s) return null; const [y,m,d]=s.split('-').map(Number); if(!y||!m||!d) return null; return new Date(y,m-1,d); }
function openPeriodPicker(){
  const body=h('div',{style:{padding:'0 16px 8px'}});
  body.appendChild(h('div',{class:'section-title', style:{padding:'12px 0 8px'}},'Быстрый выбор'));
  body.appendChild(h('div',{style:{display:'flex',flexWrap:'wrap',gap:'8px'}},
    [['day','День'],['week','Неделя'],['month','Месяц'],['year','Год']].map(([t,l])=>
      h('button',{class:'chip bordered'+(S.ui.periodType===t?' active':''), onclick:()=>{ S.ui.periodType=t; S.ui.customRange=null; S.ui.anchor=todayStart(); closeSheet(); render(); }}, l))));
  body.appendChild(h('div',{class:'section-title', style:{padding:'16px 0 8px'}},'Произвольный период'));
  const r=rangeFor(S.ui.periodType,S.ui.anchor,S.ui.customRange);
  const from=h('input',{class:'input', type:'date', value:toInputDate(r.start)});
  const to=h('input',{class:'input', type:'date', value:toInputDate(addDays(r.end,-1))});
  body.appendChild(h('div',{style:{marginBottom:'10px'}}, h('div',{class:'helper', style:{textAlign:'left',marginBottom:'4px'}},'С'), from));
  body.appendChild(h('div',{style:{marginBottom:'12px'}}, h('div',{class:'helper', style:{textAlign:'left',marginBottom:'4px'}},'По'), to));
  body.appendChild(h('button',{class:'btn primary', onclick:()=>{
    const s=fromInputDate(from.value), e=fromInputDate(to.value);
    if (!s||!e){ toast('Укажите даты',true); return; }
    const start=s<=e?s:e, end=s<=e?e:s;
    S.ui.customRange={start:startOfDay(start), end:addDays(startOfDay(end),1)}; S.ui.periodType='custom'; closeSheet(); render();
  }},'Применить период'));
  body.appendChild(h('button',{class:'btn outline', style:{marginTop:'8px'}, onclick:()=>{
    if (!S.data.transactions.length){ S.ui.periodType='all'; S.ui.customRange=null; closeSheet(); render(); return; }
    let min=Infinity,max=-Infinity; for (const t of S.data.transactions){ if(t.date<min)min=t.date; if(t.date>max)max=t.date; }
    S.ui.customRange={start:startOfDay(new Date(min)), end:addDays(startOfDay(new Date(max)),1)}; S.ui.periodType='all'; closeSheet(); render();
  }},'За всё время'));
  openSheet({title:'Период', body});
}

/* Операции одной категории */
function openCategoryTx(category){
  const r=rangeFor(S.ui.periodType,S.ui.anchor,S.ui.customRange), acc=S.ui.selectedAccountId;
  const list=sortTx(S.data.transactions.filter(t=>t.categoryId===category.id && (acc==null?!accExcluded(t.accountId):t.accountId===acc) && inRange(t,r)));
  const total=list.reduce((s,t)=>s+t.amount,0);
  const body=h('div',{});
  body.appendChild(h('div',{class:'head-row'}, h('div',{class:'h-total'},'Всего: '+money(total))));
  if (!list.length) body.appendChild(emptyState('list','Нет операций',null));
  for (const t of list) body.appendChild(txTile(t));
  openSheet({title:category.name, body});
}

/* ================= Добавление / редактирование операции ================= */
const CURRENCIES=['RUB','USD','EUR','GBP','KZT','CNY'];
const CUR_SYMBOL={RUB:'₽',USD:'$',EUR:'€',GBP:'£',KZT:'₸',CNY:'¥'};
function parseAmount(s){ if (s==null) return null; const v=parseFloat(String(s).replace(/[\s ]/g,'').replace(',','.')); return isFinite(v)?v:null; }
const TYPE_COLOR={expense:'var(--expense)', income:'var(--income)', transfer:'var(--transfer)'};

function openAddSheet(editing, startRegular){
  const isEdit=!!editing;
  const f={
    type: editing ? editing.type : (S.ui.screen==='dashboard'?S.ui.activeType:'expense'),
    amount: editing ? String(editing.originalAmount!=null?editing.originalAmount:editing.amount) : '',
    currency: editing && editing.originalCurrency ? editing.originalCurrency : 'RUB',
    rate: editing && editing.originalRate ? String(editing.originalRate) : '',
    categoryId: editing ? editing.categoryId : null,
    accountId: editing ? editing.accountId : (S.ui.selectedAccountId!=null?S.ui.selectedAccountId:(mainAccount()||{}).id),
    toAccountId: editing ? editing.toAccountId : null,
    date: editing ? startOfDay(new Date(editing.date)) : todayStart(),
    comment: editing ? (editing.comment||'') : '',
    regular: !isEdit && !!startRegular, freq: 'monthly',
  };
  if (f.type==='transfer' && f.toAccountId==null){ const o=S.data.accounts.find(a=>a.id!==f.accountId); if (o) f.toAccountId=o.id; }
  const body=h('div',{});
  const footer=h('div',{class:'submit-wrap'});
  const saveBtn=h('button',{class:'submit-pill', onclick:()=>saveTransaction(f, isEdit, editing)}, isEdit?'Сохранить':'Добавить');
  footer.appendChild(saveBtn);
  f._save=saveBtn;
  const rebuild=()=>{ body.innerHTML=''; buildAddForm(body, f, isEdit, rebuild); };
  const delAction = isEdit ? h('button',{class:'ab-btn', style:{color:'var(--danger)'}, onclick:()=>openConfirm('Удалить операцию?','Действие нельзя отменить.','Удалить',()=>{
    S.data.transactions=S.data.transactions.filter(t=>t.id!==editing.id); afterMutation(); closeSheet(); })}, icon('trash',24)) : null;
  rebuild();
  openSheet({title: isEdit?'Редактирование':'Добавление операции', full:true, body, footer, action:delAction});
}
function buildAddForm(body, f, isEdit, rebuild){
  const updateSave=()=>{ f._save.disabled=!addValid(f); };
  // тип
  body.appendChild(h('div',{class:'segtabs', style:{marginTop:'12px'}},
    [['expense','РАСХОД'],['income','ДОХОД'],['transfer','ПЕРЕВОД']].map(([t,l])=>
      h('button',{class:'segtab'+(f.type===t?' active':''), style:f.type===t?{background:TYPE_COLOR[t]}:null, onclick:()=>{
        f.type=t;
        if (t==='transfer'){ f.currency='RUB'; f.rate=''; if (f.toAccountId==null||f.toAccountId===f.accountId){ const o=S.data.accounts.find(a=>a.id!==f.accountId); f.toAccountId=o?o.id:null; } }
        else f.categoryId=null;
        rebuild();
      }}, l))));
  body.appendChild(h('div',{class:'gap16'}));
  // сумма
  const amountRow=h('div',{class:'add-amount'});
  const amountInput=h('input',{type:'text', inputmode:'decimal', placeholder:'0', value:f.amount});
  amountInput.addEventListener('input',()=>{ f.amount=amountInput.value; updateSave(); updatePreview(); });
  amountRow.appendChild(amountInput);
  if (f.type!=='transfer'){
    const sel=h('select', null, CURRENCIES.map(c=>h('option',{value:c, selected:f.currency===c}, c)));
    sel.addEventListener('change',()=>{ f.currency=sel.value; rebuild(); });
    amountRow.appendChild(sel);
  } else amountRow.appendChild(h('div',{class:'cur-rub'},'₽'));
  body.appendChild(amountRow);
  const preview=h('div',{class:'rate-row', style:{display:'none'}});
  if (f.type!=='transfer' && f.currency!=='RUB'){
    const rateInput=h('input',{type:'text', inputmode:'decimal', placeholder:'напр. 90', value:f.rate});
    rateInput.addEventListener('input',()=>{ f.rate=rateInput.value; updateSave(); updatePreview(); });
    const eq=h('div',{class:'rate-eq'});
    body.appendChild(h('div',{class:'rate-row'}, h('div',{class:'rate-lbl'},'Курс к ₽'), rateInput, eq));
    f._eq=eq;
  }
  function updatePreview(){ if (f._eq){ const a=parseAmount(f.amount), r=parseAmount(f.rate); f._eq.textContent=(a&&r)?'= '+money(a*r):''; } }
  updatePreview();
  body.appendChild(h('div',{class:'add-divider'}));

  if (f.type!=='transfer'){
    body.appendChild(accountRow('Счёт', f.accountId, (id)=>{ f.accountId=id; }));
    body.appendChild(h('div',{class:'gap16'}));
    body.appendChild(h('div',{class:'add-label', style:{marginBottom:'4px'}},'Категории'));
    const allCats=popularCategoriesOfType(f.type);
    const showInline = allCats.length<=8;
    let visible = showInline ? allCats : allCats.slice(0,7);
    if (!showInline && f.categoryId!=null && !visible.find(c=>c.id===f.categoryId)){ const sc=allCats.find(c=>c.id===f.categoryId); if (sc) visible=[sc,...visible.slice(0,6)]; }
    const grid=h('div',{class:'catgrid'});
    for (const c of visible){ const seld=f.categoryId===c.id;
      grid.appendChild(h('button',{class:'catcell'+(seld?' sel':''), onclick:()=>{ f.categoryId=c.id; rebuild(); }},
        avatar(c.iconKey,c.color,54,seld), h('div',{class:'cc-label'}, c.name))); }
    if (showInline) grid.appendChild(h('button',{class:'catcell', onclick:()=>openCategoryEdit(null,f.type,(id)=>{ f.categoryId=id; rebuild(); })},
      h('div',{class:'cc-action'}, icon('add',24)), h('div',{class:'cc-label'},'Создать')));
    else grid.appendChild(h('button',{class:'catcell', onclick:()=>openAllCategories(f.type,(id)=>{ f.categoryId=id; rebuild(); })},
      h('div',{class:'cc-action'}, icon('search',24)), h('div',{class:'cc-label'},'Ещё')));
    body.appendChild(grid);
  } else {
    body.appendChild(accountRow('Со счёта', f.accountId, (id)=>{ f.accountId=id; if(f.toAccountId===id){ const o=S.data.accounts.find(a=>a.id!==id); f.toAccountId=o?o.id:null; } rebuild(); }));
    body.appendChild(accountRow('На счёт', f.toAccountId, (id)=>{ f.toAccountId=id; updateSave(); }));
    if (S.data.accounts.length<2) body.appendChild(h('div',{class:'hint', style:{marginTop:'8px'}},'Нужно минимум два счёта для перевода. Создайте второй счёт в разделе «Счета».'));
  }

  body.appendChild(h('div',{class:'gap16'}));
  body.appendChild(h('div',{class:'add-label', style:{marginBottom:'8px'}},'Дата'));
  const chips=h('div',{class:'datechips'});
  for (const [off,l] of [[0,'Сегодня'],[-1,'Вчера'],[-2,'Позавчера']]){
    const d=addDays(todayStart(),off);
    chips.appendChild(h('button',{class:'dchip'+(sameDay(f.date,d)?' active':''), onclick:()=>{ f.date=d; rebuild(); }}, l));
  }
  const isCustomDate=![0,-1,-2].some(o=>sameDay(f.date,addDays(todayStart(),o)));
  const calChip=h('label',{class:'dchip'+(isCustomDate?' active':'')}, icon('cal',16), isCustomDate?h('span',{}, dayShort(f.date)):null);
  const dateInput=h('input',{type:'date', value:toInputDate(f.date), style:{position:'absolute',opacity:'0',width:'1px',height:'1px'}});
  dateInput.addEventListener('change',()=>{ const d=fromInputDate(dateInput.value); if(d){ f.date=startOfDay(d); rebuild(); } });
  calChip.appendChild(dateInput);
  chips.appendChild(calChip);
  body.appendChild(chips);

  body.appendChild(h('div',{class:'gap16'}));
  body.appendChild(h('div',{class:'add-label', style:{marginBottom:'8px'}},'Комментарий'));
  const comment=h('textarea',{class:'textarea', style:{margin:'0 16px',width:'calc(100% - 32px)'}, maxlength:'200', placeholder:'Комментарий'});
  comment.value=f.comment;
  const counter=h('div',{class:'helper', style:{padding:'0 16px'}}, f.comment.length+' / 200');
  comment.addEventListener('input',()=>{ f.comment=comment.value; counter.textContent=comment.value.length+' / 200'; });
  body.appendChild(comment); body.appendChild(counter);

  if (!isEdit && f.type!=='transfer'){
    body.appendChild(h('div',{class:'gap16'}));
    const reg=h('div',{class:'reg-row'}, h('div',{class:'reg-lbl'}, icon('repeat',18)?'Сделать регулярной':''), switchInline(f.regular,(on)=>{ f.regular=on; rebuild(); }));
    reg.firstChild.textContent='Сделать регулярной';
    body.appendChild(reg);
    if (f.regular) body.appendChild(h('div',{class:'datechips', style:{marginTop:'8px'}},
      FREQ_SHORT.map(([v,l])=>h('button',{class:'dchip'+(f.freq===v?' active':''), onclick:()=>{ f.freq=v; rebuild(); }}, l))));
  }
  body.appendChild(h('div',{class:'gap24'}));
  updateSave();
  if (!isEdit) setTimeout(()=>{ try{ amountInput.focus(); }catch(_){} }, 250);
}
function accountRow(label, value, onChange){
  const sel=h('select', null, S.data.accounts.map(a=>h('option',{value:a.id, selected:value===a.id}, a.name)));
  sel.addEventListener('change',()=>onChange(Number(sel.value)));
  return h('div',{class:'acct-row'}, h('span',{class:'lt-lead', style:{color:'var(--text2)'}}, icon('wallet',20)), h('span',{class:'ar-lbl'}, label), sel);
}
function addValid(f){
  const a=parseAmount(f.amount); if (!a||a<=0) return false;
  if (f.type==='transfer') return S.data.accounts.length>=2 && f.accountId!=null && f.toAccountId!=null && f.accountId!==f.toAccountId;
  if (f.currency!=='RUB' && !(parseAmount(f.rate)>0)) return false;
  return f.categoryId!=null;
}
function saveTransaction(f, isEdit, editing){
  const amount=parseAmount(f.amount);
  if (!amount||amount<=0){ toast('Введите корректную сумму',true); return; }
  if (f.type==='transfer'){
    if (S.data.accounts.length<2){ toast('Нужно минимум два счёта для перевода',true); return; }
    if (f.accountId==null||f.toAccountId==null){ toast('Выберите счета',true); return; }
    if (f.accountId===f.toAccountId){ toast('Счёт списания и зачисления должны отличаться',true); return; }
  } else {
    if (f.currency!=='RUB'){ const r=parseAmount(f.rate); if(!(r>0)){ toast('Введите курс',true); return; } }
    if (f.categoryId==null){ toast('Выберите категорию',true); return; }
  }
  let rub=amount, origAmount=null, origCur=null, origRate=null;
  if (f.type!=='transfer' && f.currency!=='RUB'){ const r=parseAmount(f.rate); rub=Math.round(amount*r*100)/100; origAmount=amount; origCur=f.currency; origRate=r; }
  const rec={ type:f.type, amount:rub, accountId:f.accountId, categoryId:f.type==='transfer'?null:f.categoryId,
    toAccountId:f.type==='transfer'?f.toAccountId:null, date:f.date.getTime(), comment:f.comment.trim()||null,
    originalAmount:origAmount, originalCurrency:origCur, originalRate:origRate };
  if (isEdit){ const i=S.data.transactions.findIndex(t=>t.id===editing.id); if (i>=0) S.data.transactions[i]=Object.assign({}, editing, rec); toast('Сохранено'); }
  else {
    rec.id=newId(); rec.createdAt=Date.now(); S.data.transactions.push(rec);
    if (f.type==='expense') notifyAlerts();
    if (f.regular && f.type!=='transfer'){
      const anchorDay=f.date.getDate();
      S.data.recurring.push({ id:newId(), type:f.type, amount:rub, accountId:f.accountId, categoryId:f.categoryId,
        comment:rec.comment, frequency:f.freq, anchorDay, enabled:true, nextRun:nextOccurrence(f.date,f.freq,anchorDay).getTime(), createdAt:Date.now() });
      materializeRecurring();
    }
    toast('Добавлено');
  }
  afterMutation(); closeSheet();
}

/* ================= Редактирование категории ================= */
function openCategoryEdit(cat, defaultType, onCreated){
  const isEdit=!!cat;
  const f={ name:cat?cat.name:'', type:cat?cat.type:(defaultType||'expense'), iconKey:cat?cat.iconKey:'basket', color:cat?cat.color:PALETTE[5] };
  const body=h('div',{});
  const rebuild=()=>{ body.innerHTML=''; buildCategoryForm(body, f, isEdit, cat, onCreated, rebuild); };
  rebuild();
  openSubSheet(isEdit?'Категория':'Создание категории', body);
}
function buildCategoryForm(body, f, isEdit, cat, onCreated, rebuild){
  body.appendChild(h('div',{style:{display:'flex',justifyContent:'center',padding:'8px 0 14px'}}, avatar(f.iconKey,f.color,56,true)));
  const nameInput=h('input',{class:'input', placeholder:'Название', value:f.name});
  nameInput.addEventListener('input',()=>f.name=nameInput.value);
  body.appendChild(h('div',{class:'field'}, h('label',{},'Название'), nameInput));
  if (!isEdit) body.appendChild(h('div',{class:'field'}, h('label',{},'Тип'),
    h('div',{class:'segtabs', style:{margin:'0'}},
      [['expense','РАСХОДЫ','--expense'],['income','ДОХОДЫ','--income']].map(([t,l,cv])=>
        h('button',{class:'segtab'+(f.type===t?' active':''), style:f.type===t?{background:'var('+cv+')'}:null, onclick:()=>{ f.type=t; rebuild(); }}, l)))));
  body.appendChild(h('div',{class:'add-label', style:{margin:'4px 0 8px'}},'Иконка'));
  body.appendChild(iconPicker(f, rebuild));
  body.appendChild(h('div',{class:'add-label', style:{margin:'16px 0 8px'}},'Цвет'));
  body.appendChild(colorPicker(f, rebuild));
  const footer=()=>{};
  body.appendChild(h('div',{class:'gap16'}));
  body.appendChild(h('div',{style:{padding:'0 16px'}}, h('button',{class:'btn primary', onclick:()=>{
    const name=f.name.trim(); if (!name){ toast('Введите название',true); return; }
    if (isEdit){ Object.assign(categoryById(cat.id), {name, iconKey:f.iconKey, color:f.color}); persist(); closeSubSheet(); render(); toast('Сохранено'); }
    else { const id=newId(); const order=Math.max(0,...S.data.categories.map(c=>c.sortOrder))+1;
      S.data.categories.push({id, name, type:f.type, iconKey:f.iconKey, color:f.color, sortOrder:order, isDefault:false});
      persist(); closeSubSheet(); if (onCreated) onCreated(id); else render(); toast('Категория создана'); }
  }}, isEdit?'Сохранить':'Добавить')));
  if (isEdit) body.appendChild(h('div',{style:{padding:'8px 16px 0'}}, h('button',{class:'btn danger', onclick:()=>deleteCategory(cat)},'Удалить')));
  body.appendChild(h('div',{class:'gap24'}));
}
function iconPicker(f, rebuild){
  const grid=h('div',{class:'iconpick'});
  const isEmojiSel=f.iconKey && f.iconKey.startsWith(EMOJI_PREFIX);
  const emojiCell=h('button',{class:'ip'+(isEmojiSel?' sel':''), style:isEmojiSel?{background:safeColor(f.color)}:null, onclick:()=>{
    openDialog('Свой эмодзи', (()=>{ const i=h('input',{class:'input', style:{textAlign:'center',fontSize:'32px'}, maxlength:'8', placeholder:'Введите эмодзи'});
      setTimeout(()=>i.focus(),100); window._emojiInput=i; return i; })(),
      [{label:'Отмена', onclick:closeDialog}, {label:'Готово', onclick:()=>{ const v=(window._emojiInput.value||'').trim(); closeDialog(); if(v){ f.iconKey=EMOJI_PREFIX+Array.from(v)[0]; rebuild(); } }}]);
  }}, isEmojiSel?h('span',{class:'emo'}, resolveEmoji(f.iconKey)):icon('smile',24));
  grid.appendChild(emojiCell);
  for (const key of ICON_ORDER){
    const sel=f.iconKey===key;
    grid.appendChild(h('button',{class:'ip'+(sel?' sel':''), style:sel?{background:safeColor(f.color)}:null, onclick:()=>{ f.iconKey=key; rebuild(); }},
      h('span',{class:'emo'}, EMOJI[key])));
  }
  return grid;
}
function colorPicker(f, rebuild){
  const grid=h('div',{class:'colorpick'});
  grid.appendChild((()=>{ const wrap=h('label',{class:'cdot add'}, icon('add',20));
    const inp=h('input',{type:'color', style:{position:'absolute',opacity:'0',width:'1px',height:'1px'}, value:safeColor(f.color||'#45C168')});
    inp.addEventListener('change',()=>{ f.color=inp.value.toUpperCase(); rebuild(); }); wrap.appendChild(inp); return wrap; })());
  grid.appendChild(h('button',{class:'cdot nofill'+(f.color==null?' sel':''), onclick:()=>{ f.color=null; rebuild(); }},
    f.color==null?icon('check',20):icon('nofill',20)));
  if (f.color!=null && !PALETTE.includes(f.color))
    grid.appendChild(h('button',{class:'cdot sel', style:{background:safeColor(f.color)}}, h('span',{class:'ck'}, icon('check',20))));
  for (const col of PALETTE){
    const sel=f.color===col;
    grid.appendChild(h('button',{class:'cdot'+(sel?' sel':''), style:{background:col}, onclick:()=>{ f.color=col; rebuild(); }},
      sel?h('span',{class:'ck'}, icon('check',20)):null));
  }
  return grid;
}
function deleteCategory(cat){
  const sameType=S.data.categories.filter(c=>c.type===cat.type && c.id!==cat.id);
  if (!sameType.length){ toast('Нельзя удалить последнюю категорию',true); return; }
  const fb=cat.type==='expense'?'Другое':'Прочее';
  openConfirm('Удалить категорию?', 'Операции этой категории перенесутся в «'+fb+'».','Удалить',()=>{
    let fbc=S.data.categories.find(c=>c.type===cat.type && c.id!==cat.id && c.name===fb);
    if (!fbc){ fbc={id:newId(), name:fb, type:cat.type, iconKey:'other', color:'#9E9E9E', sortOrder:999, isDefault:true}; S.data.categories.push(fbc); }
    for (const t of S.data.transactions) if (t.categoryId===cat.id) t.categoryId=fbc.id;
    for (const r of S.data.recurring) if (r.categoryId===cat.id) r.categoryId=fbc.id;
    S.data.categories=S.data.categories.filter(c=>c.id!==cat.id);
    persist(); closeSubSheet(); render();
  });
}

/* ================= Редактирование счёта ================= */
function openAccountEdit(acc){
  const isEdit=!!acc;
  const f={ name:acc?acc.name:'', initialBalance:acc?String(acc.initialBalance):'', iconKey:acc?acc.iconKey:'wallet', color:acc?acc.color:PALETTE[6], excludeFromTotal:acc?!!acc.excludeFromTotal:false };
  const body=h('div',{});
  const rebuild=()=>{ body.innerHTML=''; buildAccountForm(body, f, isEdit, acc, rebuild); };
  rebuild();
  openSheet({title:isEdit?'Счёт':'Новый счёт', body});
}
function buildAccountForm(body, f, isEdit, acc, rebuild){
  body.appendChild(h('div',{style:{display:'flex',justifyContent:'center',padding:'8px 0 14px'}}, avatar(f.iconKey,f.color,56,true)));
  const nameInput=h('input',{class:'input', placeholder:'Название счёта', value:f.name});
  nameInput.addEventListener('input',()=>f.name=nameInput.value);
  body.appendChild(h('div',{class:'field'}, h('label',{},'Название'), nameInput));
  const balInput=h('input',{class:'input', type:'text', inputmode:'decimal', placeholder:'0', value:f.initialBalance});
  balInput.addEventListener('input',()=>f.initialBalance=balInput.value);
  body.appendChild(h('div',{class:'field'}, h('label',{},'Начальный остаток'), balInput));
  body.appendChild(h('div',{class:'add-label', style:{margin:'4px 0 8px'}},'Иконка'));
  body.appendChild(iconPicker(f, rebuild));
  body.appendChild(h('div',{class:'add-label', style:{margin:'16px 0 8px'}},'Цвет'));
  body.appendChild(colorPicker(f, rebuild));
  body.appendChild(switchRow('Не учитывать в «Все счета»', f.excludeFromTotal, (on)=>{ f.excludeFromTotal=on; }));
  body.appendChild(h('div',{class:'helper', style:{textAlign:'left',marginTop:'-4px'}},'Счёт не войдёт в общий баланс и сводки по «Все счета». Сам счёт и его операции останутся.'));
  body.appendChild(h('div',{class:'gap16'}));
  body.appendChild(h('div',{style:{padding:'0 16px'}}, h('button',{class:'btn primary', onclick:()=>{
    const name=f.name.trim(); if (!name){ toast('Введите название счёта',true); return; }
    const bal=parseAmount(f.initialBalance)||0;
    if (isEdit) Object.assign(accountById(acc.id),{name, initialBalance:bal, iconKey:f.iconKey, color:f.color, excludeFromTotal:f.excludeFromTotal});
    else { const order=Math.max(0,...S.data.accounts.map(a=>a.sortOrder))+1; S.data.accounts.push({id:newId(), name, initialBalance:bal, iconKey:f.iconKey, color:f.color, sortOrder:order, excludeFromTotal:f.excludeFromTotal}); }
    persist(); closeSheet(); render(); toast('Сохранено');
  }}, isEdit?'Сохранить':'Добавить')));
  if (isEdit) body.appendChild(h('div',{style:{padding:'8px 16px 0'}}, h('button',{class:'btn danger', onclick:()=>{
    if (S.data.accounts.length<=1){ toast('Нельзя удалить единственный счёт',true); return; }
    openConfirm('Удалить счёт?','Счёт и все его операции будут удалены.','Удалить',()=>{
      S.data.transactions=S.data.transactions.filter(t=>t.accountId!==acc.id && t.toAccountId!==acc.id);
      S.data.recurring=S.data.recurring.filter(r=>r.accountId!==acc.id);
      S.data.accounts=S.data.accounts.filter(a=>a.id!==acc.id);
      if (S.ui.selectedAccountId===acc.id) S.ui.selectedAccountId=null;
      persist(); closeSheet(); render();
    });
  }},'Удалить счёт')));
  body.appendChild(h('div',{class:'gap24'}));
}
/* ================= ЭКРАН: Импорт и экспорт ================= */
function screenIO(){
  const bar=appbar({ left:backBtn('more'), title:'Импорт и экспорт' });
  const body=h('main',{class:'screen'}); const inner=h('div',{class:'screen-pad flat'});

  const head=h('div',{style:{display:'flex',alignItems:'center',gap:'14px',padding:'20px 16px'}});
  head.appendChild(h('div',{style:{width:'48px',height:'48px',borderRadius:'14px',background:hexA('#2E7D67',0.0),display:'flex',alignItems:'center',justifyContent:'center'}},
    h('img',{src:'icons/icon-192.png', style:{width:'48px',height:'48px',borderRadius:'12px'}})));
  head.appendChild(h('div',{}, h('div',{style:{fontSize:'1.1rem',fontWeight:'700'}},'Тратометр'),
    h('div',{class:'muted', style:{fontSize:'.82rem'}}, 'Операций: '+S.data.transactions.length)));
  inner.appendChild(head);

  const tile=(ic,title,sub,onclick,onInfo)=>h('button',{class:'lt', onclick},
    h('span',{class:'lt-lead'}, icon(ic,24)),
    h('div',{class:'lt-mid'}, h('div',{class:'lt-title'}, title), sub?h('div',{class:'lt-sub'}, sub):null),
    h('span',{class:'lt-trail'}, onInfo?h('button',{class:'ab-btn', style:{color:'var(--accent)'}, onclick:(e)=>{ e.stopPropagation(); onInfo(); }}, icon('help',22)):null, icon('chevR',22)));

  inner.appendChild(h('div',{class:'section-title'},'Импорт'));
  inner.appendChild(tile('fileIn','Импорт из Excel (.xlsx)','Загрузить операции из таблицы', ()=>pickFile('.xlsx', importXlsxFile), ()=>helpXlsx()));
  inner.appendChild(tile('upload','Импорт из 1Money (.csv)','Загрузить операции из выгрузки 1Money', ()=>pickFile('.csv', importCsvFile), ()=>help1Money()));
  inner.appendChild(tile('save','Восстановить копию (.json)','Заменить данные сохранённой копией', ()=>pickFile('.json', importJSONFile)));

  inner.appendChild(h('div',{class:'section-title'},'Экспорт'));
  inner.appendChild(tile('grid','Экспорт в Excel (.xlsx)', null, ()=>pickExportPeriod(exportXlsx)));
  inner.appendChild(tile('table','Экспорт в CSV', null, ()=>pickExportPeriod(exportCSV)));
  inner.appendChild(tile('pdf','Экспорт в PDF (печать)', null, ()=>pickExportPeriod(exportPDF)));
  inner.appendChild(tile('save','Сохранить копию (.json)','Полная резервная копия', ()=>exportJSON()));

  inner.appendChild(h('div',{class:'section-title'},'Опасная зона'));
  inner.appendChild(h('div',{style:{padding:'0 16px'}}, h('button',{class:'btn danger', onclick:()=>openConfirm('Стереть все данные?','Все операции, счета и настройки будут удалены без возможности восстановления.','Стереть',()=>{
    S.data=seedData(); persist(); resetFilters(); navigate('dashboard'); toast('Данные сброшены'); })},'Стереть все данные')));

  body.appendChild(inner); return {bar, body};
}
function helpXlsx(){ openDialog('Формат Excel', h('p',{html:'Поддерживается файл с листами «Расходы» и «Доходы» (как в выгрузке этого приложения). Нужны столбцы с датой, суммой, категорией и счётом. Лист «Переводы» не импортируется.'}), [{label:'Понятно', onclick:closeDialog}]); }
function help1Money(){ openDialog('Импорт из 1Money', h('p',{html:'В приложении 1Money: «Настройки → Экспорт данных → CSV». Полученный .csv загрузите здесь. Распознаются столбцы ДАТА, ТИП, СУММА, ВАЛЮТА, СО СЧЁТА, КАТЕГОРИЯ/НА СЧЁТ, ЗАМЕТКИ.'}), [{label:'Понятно', onclick:closeDialog}]); }

function pickFile(accept, cb){
  const inp=h('input',{type:'file', accept, style:{display:'none'}});
  inp.addEventListener('change',()=>{ const f=inp.files[0]; if (f) cb(f); });
  document.body.appendChild(inp); inp.click(); setTimeout(()=>inp.remove(), 60000);
}
function readFileBytes(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(new Uint8Array(r.result)); r.onerror=()=>rej(r.error); r.readAsArrayBuffer(file); }); }
function readFileText(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=()=>rej(r.error); r.readAsText(file,'utf-8'); }); }

/* -------- Парсинг чисел/дат/имён (как в import_service) -------- */
function normName(s){ return String(s==null?'':s).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim(); }
function parseNumber(raw){
  if (raw==null) return null;
  let s=String(raw).trim(); if (!s) return null;
  s=s.replace(/[\s  ]/g,'');
  if (/^[-+]?\d+([.,]\d+)?[eE][-+]?\d+$/.test(s)) return parseFloat(s.replace(',','.'));
  s=s.replace(/[^0-9,.\-]/g,'').replace(/,/g,'.');
  const i=s.lastIndexOf('.');
  if (i>=0) s=s.slice(0,i).replace(/\./g,'')+s.slice(i);
  const v=parseFloat(s); return isFinite(v)?v:null;
}
function parseDateString(raw){
  if (raw==null) return null; const s=String(raw).trim(); if (!s) return null;
  const m=s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m){ const d=+m[1],mo=+m[2],y=+m[3],hh=+(m[4]||0),mi=+(m[5]||0),se=+(m[6]||0);
    const dt=new Date(y,mo-1,d,hh,mi,se);
    if (dt.getFullYear()===y && dt.getMonth()===mo-1 && dt.getDate()===d) return dt; return null; }
  const t=Date.parse(s); return isNaN(t)?null:new Date(t);
}
function excelSerialToDate(serial){ if (!isFinite(serial)||serial<1||serial>80000) return null; const whole=Math.floor(serial); const ms=Math.round((serial-whole)*86400000); return new Date(new Date(1899,11,30+whole).getTime()+ms); }
function joinComment(comment, tags){ const t=(tags||'').trim(); const c=(comment||'').trim(); if (!t) return c; if (!c) return t; return c+' · '+t; }

/* -------- CSV (1Money) -------- */
function csvRecords(text){
  const rows=[]; let row=[], cur='', q=false;
  for (let i=0;i<text.length;i++){
    const ch=text[i];
    if (q){ if (ch==='"'){ if (text[i+1]==='"'){ cur+='"'; i++; } else q=false; } else cur+=ch; }
    else { if (ch==='"') q=true; else if (ch===','){ row.push(cur); cur=''; } else if (ch==='\n'){ row.push(cur); rows.push(row); row=[]; cur=''; } else cur+=ch; }
  }
  row.push(cur); rows.push(row);
  // развернуть 1Money-обёртку: строка из одного поля с запятыми
  return rows.map(r=>{ if (r.length===1 && r[0].indexOf(',')>=0){ const inner=csvRecordsSingle(r[0]); return inner[0]||r; } return r; });
}
function csvRecordsSingle(line){ return csvRecords(line); }
// Чистый парсер 1Money CSV (тестируется отдельно). Бросает строку-ошибку.
function parse1MoneyCsv(text){
  if (text.charCodeAt(0)===0xFEFF) text=text.slice(1);
  text=text.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  const recs=csvRecords(text).filter(r=>r.length);
  if (!recs.length) throw 'CSV-файл пуст или не распознан.';
  let hi=-1;
  for (let i=0;i<recs.length;i++){ const cells=recs[i].map(normName); if (cells.some(c=>c.includes('дата')) && cells.some(c=>c.includes('тип'))){ hi=i; break; } }
  if (hi<0) throw 'Это не похоже на выгрузку 1Money: не найдены столбцы «ДАТА» и «ТИП».';
  const H=recs[hi].map(normName); const col={};
  const set=(k,idx)=>{ if (col[k]==null) col[k]=idx; };
  H.forEach((c,i)=>{ if (c.includes('дата')) set('date',i); else if (c.includes('тип')) set('type',i);
    else if (c.includes('со сч')) set('account',i); else if (c.includes('категори')||c.includes('на сч')) set('category',i);
    else if (c==='сумма') set('amount',i); else if (c==='валюта') set('currency',i);
    else if (c.includes('заметк')) set('comment',i); else if (c.includes('метк')) set('tags',i); });
  if (col.date==null||col.type==null||col.amount==null) throw 'В CSV не найдены нужные столбцы (дата / тип / сумма).';
  const at=(r,i)=> (i==null||i<0||i>=r.length)?'':r[i];
  const ops=[]; let rowsSkipped=0; const accountBalances={};
  for (let i=hi+1;i<recs.length;i++){
    const r=recs[i]; if (r.every(c=>!String(c).trim())) continue;
    // Блок «НАЗВАНИЕ/БАЛАНС/ВАЛЮТА» 1Money — это конец операций. Запоминаем
    // текущие остатки счетов, чтобы потом восстановить их при импорте.
    if (normName(at(r,0)).includes('название')){
      const BH=r.map(normName); let nC=BH.findIndex(c=>c.includes('название')), bC=BH.findIndex(c=>c.includes('баланс'));
      if (nC<0) nC=0; if (bC<0) bC=1;
      for (let j=i+1;j<recs.length;j++){ const br=recs[j]; if (br.every(c=>!String(c).trim())) continue;
        const nm=String(at(br,nC)).trim(); if (!nm) continue; const bv=parseNumber(at(br,bC));
        if (bv==null||!isFinite(bv)) continue; accountBalances[normName(nm)]={ name:nm, balance:bv }; }
      break;
    }
    if (r.length<2) continue;
    const ts=normName(at(r,col.type)); let type;
    if (ts.includes('расход')) type='expense'; else if (ts.includes('доход')) type='income'; else if (ts.includes('перевод')) type='transfer'; else { rowsSkipped++; continue; }
    const date=parseDateString(at(r,col.date)), amount=parseNumber(at(r,col.amount));
    if (!date||amount==null||!isFinite(amount)||amount===0){ rowsSkipped++; continue; }
    const cur=String(at(r,col.currency)).toUpperCase().trim(); const accCur=cur||'RUB';
    const oa=accCur!=='RUB'?Math.abs(amount):null, oc=accCur!=='RUB'?accCur:null;
    const isT=type==='transfer';
    ops.push({ type, date, accountName:String(at(r,col.account)).trim(), toAccountName:isT?String(at(r,col.category)).trim():null,
      categoryName:isT?'':String(at(r,col.category)).trim(), amount:Math.abs(amount), currency:accCur, originalAmount:oa, originalCurrency:oc, comment:joinComment(at(r,col.comment),at(r,col.tags))||null });
  }
  if (!ops.length && !rowsSkipped) throw 'В CSV не найдено операций для импорта.';
  return { operations:ops, rowsSkipped, accountBalances };
}
async function importCsvFile(file){
  try{ const text=await readFileText(file); const {operations, rowsSkipped, accountBalances}=parse1MoneyCsv(text); afterParseImport(operations, rowsSkipped, [], accountBalances); }
  catch(err){ toast(typeof err==='string'?err:'Не удалось импортировать файл. Проверьте формат.', true); }
}

/* -------- XLSX import -------- */
async function importXlsxFile(file){
  if (!window.XLSX || !window.XLSX.read){ toast('Чтение .xlsx недоступно в этой сборке. Используйте CSV или JSON.', true); return; }
  try{
    const bytes=await readFileBytes(file);
    if (bytes.length>50*1024*1024){ toast('Файл слишком большой (более 50 МБ)', true); return; }
    const sheets=window.XLSX.read(bytes);
    const find=(nm)=> sheets.find(s=>normName(s.name)===nm);
    const exp=find('расходы'), inc=find('доходы'), tr=find('переводы');
    if (!exp && !inc) throw 'В файле нет листов «Расходы» или «Доходы».';
    const ops=[]; let rowsSkipped=0; const warnings=[];
    const parseSheet=(sh,type)=>{ if (!sh) return; const rows=sh.rows||[];
      let hi=-1; for (let i=0;i<Math.min(6,rows.length);i++){ if ((rows[i]||[]).some(c=>normName(c).includes('дата'))){ hi=i; break; } }
      if (hi<0) return; const H=(rows[hi]||[]).map(normName); const col={}; const set=(k,i)=>{ if(col[k]==null) col[k]=i; };
      H.forEach((c,i)=>{ if (c.includes('дата')) set('date',i); else if (c.includes('категори')) set('category',i);
        else if (c.includes('сумма')&&c.includes('валюте счета')) set('amount',i); else if (c.includes('сумма')&&c.includes('валюте операции')) set('opAmount',i);
        else if (c==='валюта счета') set('currency',i); else if (c==='валюта операции') set('opCurrency',i);
        else if (c.includes('тег')) set('tags',i); else if (c.includes('коммент')) set('comment',i);
        else if (c==='счет'||c.includes('входящий счет')) set('account',i); });
      if (col.date==null||col.amount==null) return;
      const at=(r,i)=> (i==null||i<0||i>=r.length)?null:r[i];
      const readDate=(v)=> typeof v==='number'?excelSerialToDate(v):parseDateString(v);
      for (let i=hi+1;i<rows.length;i++){ const r=rows[i]||[]; if (r.every(c=>c==null||c==='')) continue;
        const date=readDate(at(r,col.date)); const amount=typeof at(r,col.amount)==='number'?at(r,col.amount):parseNumber(at(r,col.amount));
        if (!date||amount==null||!isFinite(amount)||amount===0){ rowsSkipped++; continue; }
        const cur=String(at(r,col.currency)||'').toUpperCase().trim(); const accCur=cur||'RUB';
        const opAmtRaw=at(r,col.opAmount); const opAmt=typeof opAmtRaw==='number'?opAmtRaw:parseNumber(opAmtRaw); const opCur=String(at(r,col.opCurrency)||'').toUpperCase().trim();
        let oa=null,oc=null; const hasOp=opAmt!=null&&isFinite(opAmt)&&opAmt!==0;
        if (hasOp && opCur && opCur!=='RUB' && opCur!==accCur){ oa=Math.abs(opAmt); oc=opCur; }
        else if (accCur!=='RUB'){ oa=hasOp?Math.abs(opAmt):Math.abs(amount); oc=accCur; }
        ops.push({ type, date, accountName:String(at(r,col.account)||'').trim(), toAccountName:null,
          categoryName:String(at(r,col.category)||'').trim(), amount:Math.abs(amount), currency:accCur, originalAmount:oa, originalCurrency:oc, comment:joinComment(at(r,col.comment),at(r,col.tags))||null });
      }
    };
    parseSheet(exp,'expense'); parseSheet(inc,'income');
    if (tr && (tr.rows||[]).length>2){ const n=(tr.rows.length-2); warnings.push('Переводы ('+n+') не импортированы.'); }
    if (!ops.length && !rowsSkipped) throw 'В файле не найдено операций.';
    afterParseImport(ops, rowsSkipped, warnings);
  }catch(err){ toast(typeof err==='string'?err:'Не удалось прочитать .xlsx. Проверьте формат.', true); }
}

/* -------- Применение импорта (период + режим) -------- */
function afterParseImport(ops, rowsSkipped, warnings, accountBalances){
  pickExportPeriod((range)=>{
    const filtered=ops.filter(op=>{ if (range.all) return true; const t=op.date.getTime(); return t>=range.start.getTime() && t<range.end.getTime(); });
    const apply=(mode)=>{ const sum=applyImport(filtered, mode, accountBalances); sum.rowsSkipped=rowsSkipped; sum.warnings=(sum.warnings||[]).concat(warnings); showImportResult(sum); };
    if (S.data.transactions.length){
      const body=h('div',{});
      const mb=(t,s,mode)=>h('button',{class:'mode-btn', onclick:()=>{ closeDialog(); apply(mode); }}, h('div',{class:'mb-t'}, t), h('div',{class:'mb-s'}, s));
      body.appendChild(mb('Объединить','Добавить только новые, пропустить дубли','merge'));
      body.appendChild(mb('Добавить всё','Дописать все операции из файла','add'));
      body.appendChild(mb('Заменить всё','Удалить текущие операции и импортировать заново','replace'));
      openDialog('Импорт операций', body, [{label:'Отмена', onclick:closeDialog}]);
    } else apply('add');
  }, 'Импорт операций', 'За какой период импортировать операции?');
}
function applyImport(ops, mode, accountBalances){
  const accByName={}, catByKey={};
  for (const a of S.data.accounts) accByName[normName(a.name)]=a.id;
  for (const c of S.data.categories) catByKey[c.type+'|'+normName(c.name)]=c.id;
  // Снимок «до импорта»: какие счета уже были и были ли у них операции — чтобы
  // безопасно восстановить остатки только у новых/пустых счетов (см. ниже).
  const existedBefore=new Set(S.data.accounts.map(a=>a.id));
  const txCountBefore={}; for (const t of S.data.transactions) txCountBefore[t.accountId]=(txCountBefore[t.accountId]||0)+1;
  const createdAccounts=[], createdCategories=[]; let cursor=S.data.accounts.length+S.data.categories.length;
  const palColor=()=>PALETTE[(cursor++)%PALETTE.length];
  const resolveAccount=(raw)=>{ const name=(raw||'').trim()||'Импорт'; const k=normName(name); if (accByName[k]!=null) return accByName[k];
    const order=Math.max(0,...S.data.accounts.map(a=>a.sortOrder))+1; const id=newId();
    S.data.accounts.push({id, name, initialBalance:0, iconKey:'wallet', color:palColor(), sortOrder:order}); accByName[k]=id; createdAccounts.push(name); return id; };
  const resolveCategory=(type,raw)=>{ const def=type==='expense'?'Другое':'Прочее'; const name=(raw||'').trim()||def; const k=type+'|'+normName(name);
    if (catByKey[k]!=null) return catByKey[k]; const order=Math.max(0,...S.data.categories.map(c=>c.sortOrder))+1; const id=newId();
    S.data.categories.push({id, name, type, iconKey:'other', color:palColor(), sortOrder:order, isDefault:false}); catByKey[k]=id; createdCategories.push(name); return id; };
  const records=[]; let droppedTransfers=0;
  for (const op of ops){
    const accId=resolveAccount(op.accountName);
    let catId=null, toAccId=null;
    if (op.type==='transfer'){ const to=(op.toAccountName||'').trim(); if (!to){ droppedTransfers++; continue; } toAccId=resolveAccount(to); if (toAccId===accId){ droppedTransfers++; continue; } }
    else catId=resolveCategory(op.type, op.categoryName);
    records.push({ type:op.type, amount:op.amount, accountId:accId, categoryId:catId, toAccountId:toAccId, date:op.date.getTime(),
      comment:op.comment||null, originalAmount:op.type==='transfer'?null:(op.originalAmount||null), originalCurrency:op.type==='transfer'?null:(op.originalCurrency||null), originalRate:null });
  }
  let deletedExisting=0, duplicatesSkipped=0, toInsert=records;
  if (mode==='replace' && records.length){ deletedExisting=S.data.transactions.length; S.data.transactions=[]; }
  else if (mode==='merge'){
    const key=t=>t.type+'|'+Math.round(t.amount*100)+'|'+t.accountId+'|'+t.categoryId+'|'+t.toAccountId+'|'+Math.floor(t.date/1000);
    const counts={}; for (const t of S.data.transactions){ const k=key(t); counts[k]=(counts[k]||0)+1; }
    const uniq=[]; for (const r of records){ const k=key(r); if ((counts[k]||0)>0){ counts[k]--; duplicatesSkipped++; continue; } uniq.push(r); } toInsert=uniq;
  }
  for (const r of toInsert){ r.id=newId(); r.createdAt=Date.now(); S.data.transactions.push(r); }
  // Восстанавливаем остатки из 1Money (блок «БАЛАНС»): выставляем стартовый
  // остаток так, чтобы итоговый баланс счёта совпал с тем, что показывал 1Money.
  // Делаем это только для новых и пустых счетов, а в режиме «Заменить всё» — для
  // всех счетов из файла (прежние операции стёрты, источник истины — выгрузка).
  // Счета с уже введёнными данными не трогаем, чтобы не затереть их.
  let balancesRestored=0;
  if (accountBalances){
    const netNow=netByAccount();
    for (const k in accountBalances){
      const acc=S.data.accounts.find(a=>normName(a.name)===k); if (!acc) continue;
      const isNew=!existedBefore.has(acc.id);
      const wasEmpty=(txCountBefore[acc.id]||0)===0 && !acc.initialBalance;
      if (!(isNew || wasEmpty || mode==='replace')) continue;
      acc.initialBalance=Math.round((accountBalances[k].balance-(netNow[acc.id]||0))*100)/100; balancesRestored++;
    }
  }
  materializeRecurring(); persist(); resetFilters(); render();
  return { imported:toInsert.length, importedTransfers:toInsert.filter(r=>r.type==='transfer').length, droppedTransfers,
    deletedExisting, duplicatesSkipped, createdAccounts, createdCategories, balancesRestored };
}
function showImportResult(s){
  const lines=[]; const plural=(n)=>{ const a=n%10,b=n%100; return (a===1&&b!==11)?'операция':((a>=2&&a<=4&&(b<10||b>=20))?'операции':'операций'); };
  if (s.imported) lines.push('Добавлено '+s.imported+' '+plural(s.imported)+'.');
  if (s.importedTransfers) lines.push('Из них переводов: '+s.importedTransfers+'.');
  if (s.droppedTransfers) lines.push('Некорректных переводов пропущено: '+s.droppedTransfers+'.');
  if (s.deletedExisting) lines.push('Удалено прежних операций: '+s.deletedExisting+'.');
  if (s.duplicatesSkipped) lines.push('Пропущено дублей: '+s.duplicatesSkipped+'.');
  if (s.createdAccounts && s.createdAccounts.length) lines.push('Новые счета: '+s.createdAccounts.join(', ')+'.');
  if (s.balancesRestored) lines.push('Остатки счетов восстановлены из 1Money: '+s.balancesRestored+'.');
  if (s.createdCategories && s.createdCategories.length) lines.push('Новые категории: '+s.createdCategories.join(', ')+'.');
  if (s.rowsSkipped) lines.push('Строк пропущено (нет даты/суммы): '+s.rowsSkipped+'.');
  (s.warnings||[]).forEach(w=>lines.push(w));
  if (!lines.length) lines.push('Подходящих операций не найдено.');
  openDialog(s.imported?'Импорт завершён':'Импорт', h('div',{}, lines.map(l=>h('p',{style:{margin:'0 0 6px'}}, l))), [{label:'Готово', onclick:closeDialog}]);
}

/* -------- Период для экспорта/импорта -------- */
function pickExportPeriod(cb, title, question){
  const body=h('div',{style:{padding:'0 16px 8px'}});
  if (question) body.appendChild(h('p',{class:'muted', style:{margin:'8px 0 12px'}}, question));
  body.appendChild(h('button',{class:'btn primary', onclick:()=>{ closeSheet(); cb({all:true}); }},'Весь период'));
  body.appendChild(h('div',{class:'section-title', style:{padding:'16px 0 8px'}},'Выбрать период'));
  const now=new Date();
  const from=h('input',{class:'input', type:'date', value:toInputDate(new Date(now.getFullYear(),now.getMonth(),1))});
  const to=h('input',{class:'input', type:'date', value:toInputDate(now)});
  body.appendChild(h('div',{style:{marginBottom:'10px'}}, h('div',{class:'helper', style:{textAlign:'left',marginBottom:'4px'}},'С'), from));
  body.appendChild(h('div',{style:{marginBottom:'12px'}}, h('div',{class:'helper', style:{textAlign:'left',marginBottom:'4px'}},'По'), to));
  body.appendChild(h('button',{class:'btn outline', onclick:()=>{ const s=fromInputDate(from.value), e=fromInputDate(to.value);
    if (!s||!e){ toast('Укажите даты',true); return; } const a=s<=e?s:e, b=s<=e?e:s; closeSheet(); cb({start:startOfDay(a), end:addDays(startOfDay(b),1)}); }},'Применить период'));
  openSheet({title:title||'Экспорт операций', body});
}

/* -------- Экспорт -------- */
function downloadBlob(name, content, type){
  const blob=new Blob([content],{type});
  const url=URL.createObjectURL(blob);
  const a=h('a',{href:url, download:name}); document.body.appendChild(a); a.click();
  setTimeout(()=>{ a.remove(); URL.revokeObjectURL(url); }, 1500);
}
function stamp(){ const d=new Date(); const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; }
function pad2(n){ return String(n).padStart(2,'0'); }
function expDate(ms){ const d=new Date(ms); return pad2(d.getDate())+'.'+pad2(d.getMonth()+1)+'.'+d.getFullYear(); }
function expAmount(v){ const r=Math.round(v*100)/100; return (r===Math.round(r)?String(Math.round(r)):r.toFixed(2)).replace('.',','); }
function exportRows(range){
  return S.data.transactions.filter(t=>t.type!=='transfer' && (range.all||(t.date>=range.start.getTime() && t.date<range.end.getTime())))
    .sort((a,b)=>a.date-b.date);
}
function exportCSV(range){
  const txs=exportRows(range);
  if (!txs.length){ toast(range.all?'Нет операций для экспорта':'Нет операций за выбранный период', true); return; }
  const esc=v=>{ v=String(v==null?'':v); return /[";\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; };
  const rows=[['Дата','Тип','Категория','Счёт','Сумма, ₽','Сумма (валюта)','Валюта','Комментарий']];
  for (const t of txs){ const acc=accountById(t.accountId), cat=categoryById(t.categoryId);
    rows.push([expDate(t.date), t.type==='income'?'Доход':'Расход', cat?cat.name:'—', acc?acc.name:'—', expAmount(t.amount),
      t.originalAmount!=null?expAmount(t.originalAmount):'', t.originalCurrency||'RUB', t.comment||'']); }
  downloadBlob('finance_operations_'+stamp()+'.csv', '﻿'+rows.map(r=>r.map(esc).join(';')).join('\r\n'), 'text/csv');
  toast('CSV сохранён');
}
function exportXlsx(range){
  if (!window.XLSX || !window.XLSX.build){ toast('Создание .xlsx недоступно в этой сборке. Используйте CSV.', true); return; }
  const txs=exportRows(range);
  if (!txs.length){ toast(range.all?'Нет операций для экспорта':'Нет операций за выбранный период', true); return; }
  const sheet=(title,header,type)=>{ const rows=[[{t:'s',v:title}]]; rows.push(header.map(hd=>({t:'b',v:hd,bold:true})));
    for (const t of txs.filter(x=>x.type===type)){ const acc=accountById(t.accountId), cat=categoryById(t.categoryId);
      rows.push([{t:'d',v:new Date(t.date)}, {t:'s',v:cat?cat.name:''}, {t:'s',v:acc?acc.name:''}, {t:'n',v:Math.round(t.amount*100)/100},
        {t:'s',v:'RUB'}, t.originalAmount!=null?{t:'n',v:Math.round(t.originalAmount*100)/100}:{t:'s',v:''}, {t:'s',v:t.originalCurrency||''}, {t:'s',v:''}, {t:'s',v:t.comment||''}]); }
    return {name:title.replace('Список ',''), rows}; };
  const H=['Дата и время','Категория','Счет','Сумма в валюте счета','Валюта счета','Сумма операции в валюте операции','Валюта операции','Теги','Комментарий'];
  const sheets=[ {name:'Расходы', rows:sheetRows('Список расходов',H,'expense',txs)}, {name:'Доходы', rows:sheetRows('Список доходов',H,'income',txs)},
    {name:'Переводы', rows:[[{t:'s',v:'Список переводов'}],['Дата и время','Исходящий счет','Входящий счет','Сумма в исходящей валюте счета','Валюта исходящего счета','Сумма во входящей валюте счета','Валюта входящего счета','Комментарий'].map(hd=>({t:'b',v:hd,bold:true}))]} ];
  try{ downloadBlob('finance_operations_'+stamp()+'.xlsx', window.XLSX.build(sheets), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); toast('Excel сохранён'); }
  catch(_){ toast('Не удалось сформировать файл', true); }
}
function sheetRows(title,H,type,txs){
  const rows=[[{t:'s',v:title}], H.map(hd=>({t:'b',v:hd,bold:true}))];
  for (const t of txs.filter(x=>x.type===type)){ const acc=accountById(t.accountId), cat=categoryById(t.categoryId);
    rows.push([{t:'d',v:new Date(t.date)}, {t:'s',v:cat?cat.name:''}, {t:'s',v:acc?acc.name:''}, {t:'n',v:Math.round(t.amount*100)/100},
      {t:'s',v:'RUB'}, t.originalAmount!=null?{t:'n',v:Math.round(t.originalAmount*100)/100}:{t:'s',v:''}, {t:'s',v:t.originalCurrency||''}, {t:'s',v:''}, {t:'s',v:t.comment||''}]); }
  return rows;
}
function exportPDF(range){
  const txs=exportRows(range);
  if (!txs.length){ toast(range.all?'Нет операций для экспорта':'Нет операций за выбранный период', true); return; }
  let inc=0,exp=0; for (const t of txs){ if (t.type==='income') inc+=t.amount; else exp+=t.amount; }
  const esc=s=>String(s==null?'':s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  let rowsHtml='';
  for (const t of txs.slice().sort((a,b)=>b.date-a.date)){ const acc=accountById(t.accountId), cat=categoryById(t.categoryId), isI=t.type==='income';
    rowsHtml+=`<tr><td>${esc(dayFull(new Date(t.date)))}</td><td>${isI?'Доход':'Расход'}</td><td>${esc(cat?cat.name:'—')}</td><td>${esc(acc?acc.name:'—')}</td><td class="r" style="color:${isI?'#3DAE6B':'#E5564E'}">${esc(signedMoney(t.amount,isI))}</td><td>${esc(t.comment||'')}</td></tr>`; }
  const html=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Отчёт — Тратометр</title><style>
    body{font-family:-apple-system,Roboto,Arial,sans-serif;color:#1E2A26;padding:24px;}
    h1{font-size:20px;margin:0 0 4px}.sub{color:#666;font-size:12px;margin-bottom:16px}
    .cards{display:flex;gap:8px;margin-bottom:18px}.c{flex:1;background:#f5f5f5;border-radius:8px;padding:10px}
    .c .l{font-size:10px;color:#666}.c .v{font-size:15px;font-weight:700;margin-top:3px}
    table{width:100%;border-collapse:collapse;font-size:11px}th{background:#2E7D67;color:#fff;text-align:left;padding:5px 6px}
    td{padding:5px 6px;border-bottom:1px solid #e0e0e0}tr:nth-child(even) td{background:#f2f5f4}.r{text-align:right;font-weight:600}
    @media print{body{padding:0}}</style></head><body>
    <h1>Тратометр — отчёт по операциям</h1><div class="sub">Сформировано: ${esc(dayFull(new Date()))} · операций: ${txs.length}</div>
    <div class="cards"><div class="c"><div class="l">Доходы</div><div class="v" style="color:#3DAE6B">${esc(money(inc))}</div></div>
    <div class="c"><div class="l">Расходы</div><div class="v" style="color:#E5564E">${esc(money(exp))}</div></div>
    <div class="c"><div class="l">Баланс</div><div class="v" style="color:${(inc-exp)>=0?'#2E7D67':'#E5564E'}">${esc(money(inc-exp))}</div></div></div>
    <table><thead><tr><th>Дата</th><th>Тип</th><th>Категория</th><th>Счёт</th><th class="r">Сумма</th><th>Комментарий</th></tr></thead><tbody>${rowsHtml}</tbody></table>
    <script>setTimeout(function(){try{window.print()}catch(e){}},400)</script></body></html>`;
  const url=URL.createObjectURL(new Blob([html],{type:'text/html'}));
  const w=window.open(url,'_blank');
  if (!w){ downloadBlob('finance_report_'+stamp()+'.html', html, 'text/html'); toast('Открой файл и выбери «Печать → Сохранить PDF»'); }
  else toast('В новой вкладке выбери «Поделиться → Печать → Сохранить PDF»');
  setTimeout(()=>URL.revokeObjectURL(url), 60000);
}
function exportJSON(){ downloadBlob('tratometr-backup-'+stamp()+'.json', JSON.stringify(S.data,null,2), 'application/json'); toast('Копия сохранена'); }
async function importJSONFile(file){
  try{ const text=await readFileText(file); const data=JSON.parse(text);
    if (!data||!Array.isArray(data.accounts)||!Array.isArray(data.categories)||!Array.isArray(data.transactions)) throw 'bad';
    openConfirm('Восстановить из копии?','Текущие данные будут заменены данными из файла.','Восстановить',()=>{
      S.data=normalizeLoaded(data); persist(); resetFilters(); navigate('dashboard'); toast('Данные восстановлены'); });
  }catch(_){ toast('Не удалось прочитать файл', true); }
}

/* ================= Служебное / запуск ================= */
function afterMutation(){ persist(); render(); }
function resetFilters(){ Object.assign(S.ui,{ selectedAccountId:null, activeType:'expense', periodType:'day', anchor:todayStart(), customRange:null, sort:'dateDesc', txTab:'expense' }); }
function normalizeLoaded(data){
  data.settings=Object.assign({}, seedData().settings, data.settings||{});
  data.recurring=data.recurring||[];
  let maxId=0;
  for (const arr of [data.accounts,data.categories,data.transactions,data.recurring]) for (const o of arr) if (o.id>maxId) maxId=o.id;
  data.seq=Math.max(data.seq||0, maxId+1);
  return data;
}
/* ================= Поиск категорий (лист «Все категории» с лупой) ========= */
function segmentBar(items){
  const bar=h('div',{class:'segbar'});
  for (const it of items){ if (it.fraction<=0) continue; bar.appendChild(h('span',{style:{width:(it.fraction*100)+'%', background:safeColor(it.category.color)}})); }
  return bar;
}
function openAllCategories(type, onPick){
  let searching=false, query='';
  const body=h('div',{});
  function render2(){
    body.innerHTML='';
    const head=h('div',{style:{display:'flex',alignItems:'center',gap:'4px',padding:'0 8px 8px'}});
    if (searching){
      const inp=h('input',{class:'input', placeholder:'Поиск категории', value:query, style:{border:'0',background:'transparent',padding:'8px 4px'}});
      inp.addEventListener('input',()=>{ query=inp.value; rebuildGrid(); });
      head.appendChild(inp);
      head.appendChild(h('button',{class:'ab-btn', onclick:()=>{ searching=false; query=''; render2(); }}, icon('close',22)));
      body.appendChild(head); setTimeout(()=>{ try{inp.focus();}catch(_){} }, 60);
    } else {
      head.appendChild(h('div',{style:{flex:'1',fontWeight:'700',fontSize:'1.05rem',padding:'4px 8px'}},'Все категории'));
      head.appendChild(h('button',{class:'ab-btn', onclick:()=>{ searching=true; render2(); }}, icon('search',22)));
      body.appendChild(head);
    }
    const gridWrap=h('div',{}); body.appendChild(gridWrap);
    function rebuildGrid(){
      gridWrap.innerHTML='';
      const q=query.trim().toLowerCase();
      const list=popularCategoriesOfType(type).filter(c=>!q || c.name.toLowerCase().includes(q));
      if (!list.length){ gridWrap.appendChild(h('div',{class:'muted', style:{textAlign:'center',padding:'24px'}},'Ничего не найдено')); return; }
      const grid=h('div',{class:'catgrid'});
      for (const c of list) grid.appendChild(h('button',{class:'catcell', onclick:()=>{ onPick(c.id); closeSubSheet(); }},
        avatar(c.iconKey,c.color,54), h('div',{class:'cc-label'}, c.name)));
      if (!searching) grid.appendChild(h('button',{class:'catcell', onclick:()=>{ closeSubSheet(); openCategoryEdit(null,type,(id)=>onPick(id)); }},
        h('div',{class:'cc-action'}, icon('add',24)), h('div',{class:'cc-label'},'Создать')));
      gridWrap.appendChild(grid);
    }
    rebuildGrid();
  }
  render2();
  openSubSheet('', body);
}

/* ================= Уведомления (веб-аналог) ================= */
function notifyAlerts(){
  try{
    if (typeof Notification==='undefined' || Notification.permission!=='granted') return;
    const st=S.data.settings;
    const {now, winExp, firstExp}=_expenseWindow();
    const monStart=new Date(now.getFullYear(),now.getMonth(),1).getTime();
    const monthExpense=S.data.transactions.filter(t=>t.type==='expense'&&t.date>=monStart).reduce((s,t)=>s+t.amount,0);
    const sa=evaluateSpendingAlert(now, winExp, firstExp, st.lastSpendNotify?new Date(st.lastSpendNotify):null, st.spendAlertThreshold);
    if (st.spendAlertEnabled && sa.shouldNotify && sa.percentAbove!=null){
      new Notification('Тратометр', {body:'Сегодня потрачено больше обычного на '+Math.round(sa.percentAbove)+'%'});
      st.lastSpendNotify=+startOfDay(now); persist();
    }
    const la=evaluateLimitAlert(now, monthExpense, st.monthlyLimit, st.lastLimitNotify?new Date(st.lastLimitNotify):null);
    if (st.limitAlertEnabled && la.shouldNotify){
      new Notification('Тратометр', {body:'Достигнут месячный лимит трат'});
      st.lastLimitNotify=+startOfDay(now); persist();
    }
  }catch(_){}
}
function screenNotifications(){
  const bar=appbar({ left:backBtn('more'), title:'Уведомления' });
  const body=h('main',{class:'screen'}); const inner=h('div',{class:'screen-pad flat'});
  const st=S.data.settings;
  const sec=h('div',{class:'section'}); sec.appendChild(h('div',{class:'section-title'},'Перерасход'));
  sec.appendChild(h('div',{style:{padding:'4px 16px'}}, switchRow('Предупреждать о перерасходе', st.spendAlertEnabled, (on)=>{
    if (on && typeof Notification!=='undefined' && Notification.permission!=='granted'){
      Notification.requestPermission().then(p=>{ st.spendAlertEnabled=(p==='granted'); persist(); render(); if(p!=='granted') toast('Разрешите уведомления в браузере'); });
    } else { st.spendAlertEnabled=on; persist(); render(); }
  })));
  const thrLabel=h('div',{class:'section-title'},'Порог срабатывания: +'+Math.round(st.spendAlertThreshold*100)+'%');
  const thr=h('input',{type:'range', min:'0.10', max:'1.0', step:'0.05', value:st.spendAlertThreshold});
  thr.addEventListener('input',()=>thrLabel.textContent='Порог срабатывания: +'+Math.round(parseFloat(thr.value)*100)+'%');
  thr.addEventListener('change',()=>{ st.spendAlertThreshold=parseFloat(thr.value); persist(); });
  sec.appendChild(thrLabel); sec.appendChild(h('div',{style:{padding:'0 16px 8px'}}, thr));
  inner.appendChild(sec);
  if (st.monthlyLimit>0){
    const lim=h('div',{class:'section'}); lim.appendChild(h('div',{class:'section-title'},'Месячный лимит'));
    lim.appendChild(h('div',{style:{padding:'4px 16px'}}, switchRow('Уведомлять о месячном лимите', st.limitAlertEnabled, (on)=>{
      if (on && typeof Notification!=='undefined' && Notification.permission!=='granted'){
        Notification.requestPermission().then(p=>{ st.limitAlertEnabled=(p==='granted'); persist(); render(); });
      } else { st.limitAlertEnabled=on; persist(); }
    })));
    inner.appendChild(lim);
  }
  inner.appendChild(h('div',{class:'hint'},'Уведомления локальные и приходят, когда приложение открыто (веб без фоновых служб). Порог берётся из спидометра «Траты дня».'));
  body.appendChild(inner); return {bar, body};
}

/* ================= Безопасность: блокировка PIN-кодом ================= */
async function sha(s){
  try{ const b=new TextEncoder().encode(s); const h=await crypto.subtle.digest('SHA-256', b); return Array.from(new Uint8Array(h)).map(x=>x.toString(16).padStart(2,'0')).join(''); }
  catch(_){ return 'plain:'+s; }
}
function isLocked(){ return !!(S.data.settings.lockEnabled && S.data.settings.lockHash); }
let _lockHiddenAt=null;
function setupResumeLock(){
  document.addEventListener('visibilitychange', ()=>{
    if (document.hidden) _lockHiddenAt=Date.now();
    else if (isLocked() && _lockHiddenAt && (Date.now()-_lockHiddenAt>15000)) showLock(()=>{});
  });
}
function pinPad(onDigit){
  const pad=h('div',{class:'lock-pad'});
  for (const d of ['1','2','3','4','5','6','7','8','9']) pad.appendChild(h('button',{class:'lock-key', onclick:()=>onDigit(d)}, d));
  pad.appendChild(h('span',{}));
  pad.appendChild(h('button',{class:'lock-key', onclick:()=>onDigit('0')}, '0'));
  pad.appendChild(h('button',{class:'lock-key', onclick:()=>onDigit('del')}, icon('back',24)));
  return pad;
}
function dotsEl(n){ const d=h('div',{class:'lock-dots'}); for(let i=0;i<4;i++) d.appendChild(h('span',{class:'lock-dot'+(i<n?' on':'')})); return d; }
function showLock(onUnlock){
  if (document.querySelector('.lock-screen')) return;
  let entered='';
  const scr=h('div',{class:'lock-screen'});
  const dotsWrap=h('div',{}); const setDots=()=>{ dotsWrap.innerHTML=''; dotsWrap.appendChild(dotsEl(entered.length)); }; setDots();
  const press=async (d)=>{
    if (d==='del'){ entered=entered.slice(0,-1); setDots(); return; }
    if (entered.length>=4) return; entered+=d; setDots();
    if (entered.length===4){
      const hash=await sha(entered);
      if (hash===S.data.settings.lockHash){ scr.remove(); _lockHiddenAt=null; onUnlock(); }
      else { scr.classList.add('shake'); setTimeout(()=>{ scr.classList.remove('shake'); entered=''; setDots(); }, 420); }
    }
  };
  scr.appendChild(h('img',{src:'icons/icon-192.png', class:'about-logo'}));
  scr.appendChild(h('div',{class:'lock-title'},'Приложение заблокировано'));
  scr.appendChild(dotsWrap);
  scr.appendChild(pinPad(press));
  document.body.appendChild(scr);
}
function setPinFlow(onDone){
  let first=null, entered='';
  const title=h('div',{style:{textAlign:'center',marginBottom:'10px',fontWeight:'600'}},'Придумайте PIN (4 цифры)');
  const dotsWrap=h('div',{style:{display:'flex',justifyContent:'center'}}); const setDots=()=>{ dotsWrap.innerHTML=''; dotsWrap.appendChild(dotsEl(entered.length)); }; setDots();
  const press=async (d)=>{
    if (d==='del'){ entered=entered.slice(0,-1); setDots(); return; }
    if (entered.length>=4) return; entered+=d; setDots();
    if (entered.length===4){
      if (first==null){ first=entered; entered=''; title.textContent='Повторите PIN'; setDots(); }
      else if (entered===first){ const hash=await sha(entered); closeDialog(); onDone(hash); }
      else { first=null; entered=''; title.textContent='Не совпало, придумайте PIN'; setDots(); }
    }
  };
  openDialog('Блокировка', h('div',{}, title, dotsWrap, h('div',{style:{display:'flex',justifyContent:'center',marginTop:'10px'}}, pinPad(press))), [{label:'Отмена', onclick:closeDialog}]);
}
function verifyPinFlow(onOk){
  let entered='';
  const title=h('div',{style:{textAlign:'center',marginBottom:'10px',fontWeight:'600'}},'Введите текущий PIN');
  const dotsWrap=h('div',{style:{display:'flex',justifyContent:'center'}}); const setDots=()=>{ dotsWrap.innerHTML=''; dotsWrap.appendChild(dotsEl(entered.length)); }; setDots();
  const press=async (d)=>{
    if (d==='del'){ entered=entered.slice(0,-1); setDots(); return; }
    if (entered.length>=4) return; entered+=d; setDots();
    if (entered.length===4){
      const hash=await sha(entered);
      if (hash===S.data.settings.lockHash){ closeDialog(); onOk(); }
      else { title.textContent='Неверный PIN'; entered=''; setDots(); }
    }
  };
  openDialog('Подтверждение', h('div',{}, title, dotsWrap, h('div',{style:{display:'flex',justifyContent:'center',marginTop:'10px'}}, pinPad(press))), [{label:'Отмена', onclick:closeDialog}]);
}
function screenSecurity(){
  const bar=appbar({ left:backBtn('more'), title:'Безопасность' });
  const body=h('main',{class:'screen'}); const inner=h('div',{class:'screen-pad flat'});
  const st=S.data.settings;
  const sec=h('div',{class:'section'}); sec.appendChild(h('div',{class:'section-title'},'Блокировка'));
  sec.appendChild(h('div',{style:{padding:'4px 16px'}}, switchRow('Блокировка приложения (PIN)', st.lockEnabled, (on)=>{
    if (on){ setPinFlow((hash)=>{ st.lockEnabled=true; st.lockHash=hash; persist(); render(); toast('Блокировка включена'); }); render(); }
    else { verifyPinFlow(()=>{ st.lockEnabled=false; st.lockHash=null; persist(); render(); toast('Блокировка выключена'); }); render(); }
  })));
  sec.appendChild(h('div',{class:'helper', style:{padding:'0 16px 10px'}},'PIN из 4 цифр запрашивается при запуске и возврате из фона. Хранится только на устройстве (в виде хэша).'));
  inner.appendChild(sec);
  body.appendChild(inner); return {bar, body};
}

/* ================= Запуск ================= */
async function boot(){
  const data=await loadState();
  S.data = data ? normalizeLoaded(data) : seedData();
  if (materializeRecurring()) persist();
  if (isLocked()) showLock(()=>render());
  else render();
  setupResumeLock();
}
boot();



