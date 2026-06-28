/* ===========================================================================
   Тратометр — веб-версия (PWA). Самодостаточная: без сети, без библиотек,
   без аналитики. Все данные хранятся только локально (IndexedDB).
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
// Допускаем только #RGB/#RRGGBB — защита от инъекции цвета в разметку SVG
// (например, из импортированного файла резервной копии).
function safeColor(c){ return (typeof c==='string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c)) ? c : '#9E9E9E'; }
function mixHex(a, b, t){
  const x=hexToRgb(a), y=hexToRgb(b);
  const m=(p,q)=>Math.round(p+(q-p)*t).toString(16).padStart(2,'0');
  return `#${m(x.r,y.r)}${m(x.g,y.g)}${m(x.b,y.b)}`;
}
function luminance(hex){
  const c=hexToRgb(hex);
  const f=v=>{ v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); };
  return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b);
}
// Контраст поверх акцента (повторяет AppColors.onColor / estimateBrightness).
function onAccentAuto(hex){
  const L=luminance(hex);
  const isLight=(L+0.05)*(L+0.05) > 0.15;
  return isLight ? '#1E2A26' : '#FFFFFF';
}

/* -------------------------------------------------- Форматирование --------- */
const RU='ru-RU';
const NBSP=' ';      // узкий неразрывный пробел (разделитель разрядов)
const MINUS='−';     // типографский минус
function fmtNum(value){
  const rounded=Math.round(value*100)/100;
  const whole=rounded===Math.round(rounded);
  let s = whole
    ? Math.round(rounded).toLocaleString(RU,{maximumFractionDigits:0})
    : rounded.toLocaleString(RU,{minimumFractionDigits:2,maximumFractionDigits:2});
  return s.replace(/[\s ]/g, NBSP);
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

// Диапазон [start,end) — повторяет PeriodCalc.rangeFor.
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
  const {periodType:t, anchor, customRange} = S.ui;
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
  if (!data){
    try{ const raw=localStorage.getItem(LS_KEY); if (raw) data=JSON.parse(raw); }catch(_){}
  }
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
      headerGauges:['day','limit'],
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
    sort:'dateDesc', txTab:'expense', analysisMode:'expense',
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
function balanceOf(id, net){
  const a=accountById(id); if(!a) return 0;
  net = net || netByAccount();
  return a.initialBalance + (net[id]||0);
}
function totalBalance(net){ net=net||netByAccount(); return S.data.accounts.reduce((s,a)=>s+balanceOf(a.id,net),0); }
function displayedBalance(net){ return S.ui.selectedAccountId!=null ? balanceOf(S.ui.selectedAccountId,net) : totalBalance(net); }

function categoryUsage(){
  const u={};
  for (const t of S.data.transactions) if (t.categoryId!=null) u[t.categoryId]=(u[t.categoryId]||0)+1;
  return u;
}
function popularCategoriesOfType(t){
  const u=categoryUsage();
  return categoriesOfType(t).slice().sort((a,b)=>{
    const ua=u[a.id]||0, ub=u[b.id]||0;
    if (ub!==ua) return ub-ua;
    return a.sortOrder-b.sortOrder;
  });
}

// Операции текущего среза (счёт + тип + период).
function currentSlice(){
  const r=rangeFor(S.ui.periodType,S.ui.anchor,S.ui.customRange);
  const {selectedAccountId:acc, activeType:type} = S.ui;
  return S.data.transactions.filter(t=>{
    if (t.type!==type) return false;
    if (acc!=null && t.accountId!==acc) return false;
    const d=t.date;
    return d>=r.start.getTime() && d<r.end.getTime();
  });
}
function currentTransfers(){
  const r=rangeFor(S.ui.periodType,S.ui.anchor,S.ui.customRange);
  const acc=S.ui.selectedAccountId;
  return S.data.transactions.filter(t=>{
    if (t.type!=='transfer') return false;
    if (acc!=null && t.accountId!==acc && t.toAccountId!==acc) return false;
    const d=t.date;
    return d>=r.start.getTime() && d<r.end.getTime();
  });
}
function sortTx(list){
  const s=S.ui.sort;
  const a=list.slice();
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
  for (const cid in byCat){
    const cat=categoryById(Number(cid)); if(!cat) continue;
    list.push({category:cat, total:byCat[cid], fraction: total>0?byCat[cid]/total:0, count:counts[cid]});
  }
  list.sort((a,b)=>b.total-a.total);
  return list;
}

// --- Спидометры (повторяют app_state + spending_alert) ---
function trimmedMean(values, trim){
  if (!values.length) return 0;
  const sorted=values.slice().sort((a,b)=>a-b);
  const drop=Math.floor(sorted.length*trim);
  const kept=sorted.slice(0, sorted.length-drop);
  if (!kept.length) return 0;
  return kept.reduce((a,b)=>a+b,0)/kept.length;
}
function gaugeData(){
  const n=new Date();
  const today=startOfDay(n);
  const windowStart=new Date(n.getFullYear(),n.getMonth(),n.getDate()-30);
  const exp=S.data.transactions.filter(t=>t.type==='expense');
  const inc=S.data.transactions.filter(t=>t.type==='income');

  // Дневной датчик трат.
  let todayExpense=0; const byDay={}; let firstExp=null;
  for (const t of exp){
    const d=startOfDay(new Date(t.date));
    if (!firstExp || t.date<firstExp) firstExp=t.date;
    if (t.date>=windowStart.getTime()){
      if (sameDay(d,today)) todayExpense+=t.amount;
      else if (d<today) byDay[+d]=(byDay[+d]||0)+t.amount;
    }
  }
  let dayRatio=null;
  const firstExpDay = firstExp!=null ? startOfDay(new Date(firstExp)) : null;
  if (firstExpDay && calDaysBetween(firstExpDay,today)>=7){
    let d=windowStart>firstExpDay?windowStart:firstExpDay;
    d=startOfDay(d);
    const daily=[];
    while (d<today){ daily.push(byDay[+d]||0); d=addDays(d,1); }
    const baseline=trimmedMean(daily,0.10);
    if (baseline>0) dayRatio=todayExpense/baseline;
  }

  // Месячные суммы.
  const monStart=new Date(n.getFullYear(),n.getMonth(),1).getTime();
  const monthExpense=exp.filter(t=>t.date>=monStart).reduce((s,t)=>s+t.amount,0);
  const monthIncome=inc.filter(t=>t.date>=monStart).reduce((s,t)=>s+t.amount,0);
  const last30Expense=exp.filter(t=>t.date>=windowStart.getTime()).reduce((s,t)=>s+t.amount,0);
  const last30Income=inc.filter(t=>t.date>=windowStart.getTime()).reduce((s,t)=>s+t.amount,0);
  const todayIncome=inc.filter(t=>sameDay(startOfDay(new Date(t.date)),today)).reduce((s,t)=>s+t.amount,0);

  const limit=S.data.settings.monthlyLimit, target=S.data.settings.monthlyIncomeTarget;
  const thr=S.data.settings.spendAlertThreshold;
  return {
    dayRatio, dayMax:1+thr,
    limitRatio: limit>0 ? monthExpense/limit : null,
    incomeDayRatio: last30Income>0 ? todayIncome/(last30Income/30) : null,
    incomeTargetRatio: target>0 ? monthIncome/target : null,
    monthIncome, monthExpense, last30Expense, last30Income,
  };
}

// --- Регулярные операции: догенерация наступивших периодов ---
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
    let next=startOfDay(new Date(rule.nextRun));
    let guard=0;
    while (next<=today && guard<4000){
      S.data.transactions.push({
        id:newId(), type:rule.type, amount:rule.amount, accountId:rule.accountId,
        categoryId:rule.categoryId, toAccountId:null, date:next.getTime(),
        comment:rule.comment||null, createdAt:Date.now(),
      });
      next=nextOccurrence(next, rule.frequency, rule.anchorDay);
      guard++; changed=true;
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
function avatarEl(iconKey, color, cls){
  const bg = color ? hexA(color,0.20) : 'var(--surface2)';
  return h('div',{class:'avatar '+(cls||''), style:{background:bg}}, resolveEmoji(iconKey));
}
function toast(msg, isErr){
  let wrap=document.querySelector('.toast-wrap');
  if (!wrap){ wrap=h('div',{class:'toast-wrap'}); document.body.appendChild(wrap); }
  const t=h('div',{class:'toast'+(isErr?' err':'')}, msg);
  wrap.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(()=>t.remove(),300); }, 2200);
}

/* -------------------------------------------------- Тема -------------------- */
function effectiveBrightness(){
  const st=S.data.settings;
  const full=FULL_THEMES.find(t=>t.id===st.themePreset);
  if (full) return 'dark';
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
  let onAccent;
  if (st.accentTextMode==='light') onAccent='#FFFFFF';
  else if (st.accentTextMode==='dark') onAccent='#1E2A26';
  else onAccent=onAccentAuto(accent);

  const r=document.documentElement.style;
  r.setProperty('--bg', base.bg);
  r.setProperty('--surface', base.surface);
  r.setProperty('--surface2', surface2);
  r.setProperty('--divider', base.divider);
  r.setProperty('--text', base.text);
  r.setProperty('--text2', base.text2);
  r.setProperty('--accent', accent);
  r.setProperty('--on-accent', onAccent);
  r.setProperty('--scale', st.uiScale);
  document.body.style.fontFamily = FONTS[st.fontFamily] || 'var(--font)';
  const meta=document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', base.bg);
}

/* -------------------------------------------------- SVG: пончик/датчики ---- */
function pt(cx,cy,r,a){ return [cx+r*Math.cos(a), cy+r*Math.sin(a)]; }
function arcPath(cx,cy,r,a1,a2){
  const [x1,y1]=pt(cx,cy,r,a1), [x2,y2]=pt(cx,cy,r,a2);
  const large=(a2-a1)>Math.PI?1:0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}
function donutSVG(items, size, stroke){
  const r=size/2-stroke/2, c=2*Math.PI*r, cx=size/2;
  let off=0, segs='';
  const track=`<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="var(--surface2)" stroke-width="${stroke}"/>`;
  for (const it of items){
    const len=it.fraction*c;
    if (len<=0) continue;
    const col=safeColor(it.category.color);
    segs+=`<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${col}" stroke-width="${stroke}" stroke-dasharray="${len.toFixed(2)} ${(c-len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" stroke-linecap="butt"/>`;
    off+=len;
  }
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><g transform="rotate(-90 ${cx} ${cx})">${track}${segs}</g></svg>`;
}
function gaugeSVG(ratio, maxRatio, size){
  const s=size, max=maxRatio<=0?1.3:maxRatio;
  const active=ratio!=null;
  const frac=active?Math.min(Math.max(ratio/max,0),1):0;
  const over=active && ratio>max;
  const px=s/2, py=s*0.60, r=s*0.34, sw=s*0.10;
  const third=Math.PI/3;
  const green='#4ADE80', amber='#FBBF24', red='#F87171', dark='#2B3A4A';
  const tint=(col)=>active?col:hexA(col,0.35);
  let arcs;
  if (over){
    arcs=`<path d="${arcPath(px,py,r,Math.PI,2*Math.PI)}" fill="none" stroke="#fff" stroke-width="${sw}"/>`;
  } else {
    arcs=
      `<path d="${arcPath(px,py,r,Math.PI,Math.PI+third)}" fill="none" stroke="${tint(green)}" stroke-width="${sw}"/>`+
      `<path d="${arcPath(px,py,r,Math.PI+third,Math.PI+2*third)}" fill="none" stroke="${tint(amber)}" stroke-width="${sw}"/>`+
      `<path d="${arcPath(px,py,r,Math.PI+2*third,2*Math.PI)}" fill="none" stroke="${tint(red)}" stroke-width="${sw}"/>`;
  }
  const ang=Math.PI+frac*Math.PI, len=r*0.74;
  const [tx,ty]=pt(px,py,len,ang);
  const badge=over?red:'#fff';
  return `<svg viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">`+
    `<circle cx="${px}" cy="${s/2}" r="${s/2}" fill="${badge}"/>`+
    arcs+
    `<line x1="${px}" y1="${py}" x2="${tx.toFixed(2)}" y2="${ty.toFixed(2)}" stroke="${dark}" stroke-width="${s*0.05}" stroke-linecap="round"/>`+
    `<circle cx="${px}" cy="${py}" r="${s*0.06}" fill="${dark}"/>`+
    `<circle cx="${px}" cy="${py}" r="${s*0.028}" fill="${badge}"/>`+
  `</svg>`;
}
function balanceGaugeSVG(income, expense, size){
  const w=size, hgt=size*0.62;
  const px=w/2, py=hgt-w*0.06, r=w*0.42, sw=w*0.07;
  const green='#4ADE80', red='#F87171', dark='#2B3A4A';
  const scale=Math.max(income,expense);
  const fe=scale>0?Math.min(expense/scale,1):0, fi=scale>0?Math.min(income/scale,1):0;
  const aE=Math.PI+fe*(Math.PI/2), aI=2*Math.PI-fi*(Math.PI/2);
  const needle=(a,col)=>{ const [x,y]=pt(px,py,r*0.82,a); return `<line x1="${px}" y1="${py}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${col}" stroke-width="${w*0.035}" stroke-linecap="round"/>`; };
  return `<svg viewBox="0 0 ${w} ${hgt}" width="${w}" height="${hgt}">`+
    `<path d="${arcPath(px,py,r,Math.PI,Math.PI*1.5)}" fill="none" stroke="${hexA(red,0.30)}" stroke-width="${sw}" stroke-linecap="round"/>`+
    `<path d="${arcPath(px,py,r,Math.PI*1.5,2*Math.PI)}" fill="none" stroke="${hexA(green,0.30)}" stroke-width="${sw}" stroke-linecap="round"/>`+
    needle(aE,red)+needle(aI,green)+
    `<circle cx="${px}" cy="${py}" r="${w*0.05}" fill="${dark}"/>`+
    `<circle cx="${px}" cy="${py}" r="${w*0.022}" fill="#fff"/>`+
  `</svg>`;
}

/* -------------------------------------------------- Каркас/рендер ----------- */
const NAV=[
  {id:'dashboard', label:'Главная', ic:'🏠'},
  {id:'transactions', label:'Операции', ic:'📋'},
  {id:'analysis', label:'Графики', ic:'📊'},
  {id:'more', label:'Ещё', ic:'☰'},
];
const TOP_TABS=new Set(['dashboard','transactions','analysis','more']);

function navigate(screen){
  S.ui.screen=screen;
  render();
  const sc=document.querySelector('.screen'); if (sc) sc.scrollTop=0;
}

function appbar(opts){
  // opts: {title, left, actions, accent:true}
  const row=h('div',{class:'ab-row'});
  if (opts.left) row.appendChild(opts.left);
  if (opts.title!=null) row.appendChild(h('div',{class:'appbar-title'}, opts.title));
  if (opts.actions) for (const a of opts.actions) row.appendChild(a);
  return h('header',{class:'appbar'}, row);
}
function backBtn(to){ return h('button',{class:'ab-btn', onclick:()=>navigate(to||'more')}, '‹'); }

function render(){
  applyTheme();
  const screen=S.ui.screen;
  let view;
  switch(screen){
    case 'dashboard': view=screenDashboard(); break;
    case 'transactions': view=screenTransactions(); break;
    case 'analysis': view=screenAnalysis(); break;
    case 'more': view=screenMore(); break;
    case 'accounts': view=screenAccounts(); break;
    case 'categories': view=screenCategories(); break;
    case 'limits': view=screenLimits(); break;
    case 'appearance': view=screenAppearance(); break;
    case 'recurring': view=screenRecurring(); break;
    case 'backup': view=screenBackup(); break;
    case 'about': view=screenAbout(); break;
    default: view=screenDashboard();
  }
  const app=h('div',{class:'app'});
  app.appendChild(view.bar);
  app.appendChild(view.body);
  if (TOP_TABS.has(screen)){
    app.appendChild(bottomNav(screen));
    if (screen==='dashboard'||screen==='transactions')
      app.appendChild(h('button',{class:'fab', onclick:()=>openAddSheet(null)}, '+'));
  }
  const root=document.getElementById('root');
  root.innerHTML='';
  root.appendChild(app);
}
function bottomNav(active){
  return h('nav',{class:'bottomnav'},
    NAV.map(n=>h('button',{class:'bn-item'+(n.id===active?' active':''), onclick:()=>navigate(n.id)},
      h('div',{class:'bn-ic'}, n.ic), h('div',{}, n.label))));
}

/* ==================================================================
   ЭКРАН: Главная (дашборд)
   ================================================================== */
function accountSelectorBtn(){
  const net=netByAccount();
  const acc=S.ui.selectedAccountId!=null?accountById(S.ui.selectedAccountId):null;
  const name=acc?acc.name:'Все счета';
  const bal=displayedBalance(net);
  return h('button',{class:'acct-select', onclick:openAccountSelector},
    h('div',{},
      h('div',{class:'acct-name'}, name),
      h('div',{class:'acct-bal'}, money(bal))),
    h('span',{class:'chev'},'▾'));
}
function screenDashboard(){
  const bar=appbar({ left:accountSelectorBtn(),
    actions:[ h('button',{class:'ab-btn', onclick:()=>navigate('more')}, '⚙') ] });
  const body=h('main',{class:'screen'});

  // Тип (Расходы/Доходы)
  body.appendChild(h('div',{class:'segtabs', style:{marginBottom:'12px'}},
    ['expense','income'].map(t=>h('button',{class:'segtab'+(S.ui.activeType===t?' active':''),
      onclick:()=>{ S.ui.activeType=t; render(); }}, t==='expense'?'Расходы':'Доходы'))));

  // Чипы периода
  body.appendChild(periodChips());

  const slice=currentSlice();
  const total=slice.reduce((s,t)=>s+t.amount,0);
  const items=breakdown(slice);

  // Карточка с навигатором периода + пончик
  const card=h('div',{class:'card'});
  card.appendChild(periodNavigator());
  if (items.length===0){
    card.appendChild(h('div',{class:'empty'}, h('div',{class:'e-ic'},'🗒️'), h('div',{class:'e-txt'},'Нет операций за период')));
  } else {
    const donut=h('div',{class:'donut', html:donutSVG(items,220,30)});
    donut.appendChild(h('div',{class:'center'},
      h('div',{class:'dlabel'}, S.ui.activeType==='expense'?'Расходы':'Доходы'),
      h('div',{class:'dtotal', style:{color:S.ui.activeType==='expense'?'var(--expense)':'var(--income)'}}, money(total))));
    card.appendChild(h('div',{class:'donut-wrap'}, donut));
  }
  body.appendChild(card);

  // Разбивка по категориям
  if (items.length){
    const list=h('div',{class:'card tight'});
    for (const it of items){
      list.appendChild(h('button',{class:'brk-row', onclick:()=>openCategoryTx(it.category)},
        avatarEl(it.category.iconKey, it.category.color),
        h('div',{class:'brk-mid'},
          h('div',{class:'brk-name'}, it.category.name),
          h('div',{class:'brk-bar'}, h('span',{style:{width:(it.fraction*100).toFixed(1)+'%', background:it.category.color||'#9E9E9E'}}))),
        h('div',{class:'brk-right'},
          h('div',{class:'brk-amt'}, money(it.total)),
          h('div',{class:'brk-pct'}, Math.round(it.fraction*100)+'%'))));
    }
    body.appendChild(list);
  }
  return {bar, body};
}
function periodChips(){
  const types=[['day','День'],['week','Неделя'],['month','Месяц'],['year','Год']];
  const chips=types.map(([t,l])=>h('button',{class:'chip'+(S.ui.periodType===t?' active':''),
    onclick:()=>{ S.ui.periodType=t; S.ui.customRange=null; if(t!=='custom'&&t!=='all') S.ui.anchor=todayStart(); render(); }}, l));
  chips.push(h('button',{class:'chip'+((S.ui.periodType==='custom'||S.ui.periodType==='all')?' active':''),
    onclick:openPeriodPicker}, '📅'));
  return h('div',{class:'chips', style:{marginBottom:'12px'}}, chips);
}
function periodNavigator(){
  const fwd=canGoForward();
  return h('div',{class:'periodbar'},
    h('button',{class:'pnav', onclick:()=>{ S.ui.anchor=shiftAnchor(S.ui.periodType,S.ui.anchor,-1); render(); },
      disabled:(S.ui.periodType==='custom'||S.ui.periodType==='all')}, '‹'),
    h('div',{class:'plabel'}, periodLabel(S.ui.periodType,S.ui.anchor,S.ui.customRange)),
    h('button',{class:'pnav'+(fwd?'':' hidden'), onclick:()=>{ if(canGoForward()){ S.ui.anchor=shiftAnchor(S.ui.periodType,S.ui.anchor,1); render(); } }}, '›'));
}

/* ==================================================================
   ЭКРАН: Операции
   ================================================================== */
const SORTS=[['dateDesc','По дате (новые)'],['dateAsc','По дате (старые)'],['amountDesc','По сумме (больше)'],['amountAsc','По сумме (меньше)']];
function screenTransactions(){
  const bar=appbar({ title:'Операции',
    actions:[ h('button',{class:'ab-btn', onclick:openSortMenu}, '⇅') ] });
  const body=h('main',{class:'screen'});

  // Вкладки тип
  body.appendChild(h('div',{class:'segtabs', style:{marginBottom:'12px'}},
    [['expense','Расходы'],['income','Доходы'],['transfer','Переводы']].map(([t,l])=>
      h('button',{class:'segtab'+(S.ui.txTab===t?' active':''), onclick:()=>{ S.ui.txTab=t; render(); }}, l))));

  body.appendChild(periodChips());

  const card=h('div',{class:'card'});
  card.appendChild(periodNavigator());
  body.appendChild(card);

  const isTransfer=S.ui.txTab==='transfer';
  let list;
  if (isTransfer){ list=sortTx(currentTransfers()); }
  else {
    const r=rangeFor(S.ui.periodType,S.ui.anchor,S.ui.customRange);
    const acc=S.ui.selectedAccountId;
    list=sortTx(S.data.transactions.filter(t=>t.type===S.ui.txTab && (acc==null||t.accountId===acc) && t.date>=r.start.getTime() && t.date<r.end.getTime()));
  }
  const total=list.reduce((s,t)=>s+t.amount,0);

  const totalCard=h('div',{class:'card tight'});
  totalCard.appendChild(h('div',{class:'total-row'},
    h('span',{class:'muted'}, isTransfer?'Переведено:':'Всего:'),
    h('span',{class:'t-val'}, money(total))));
  body.appendChild(totalCard);

  if (!list.length){
    body.appendChild(h('div',{class:'empty'}, h('div',{class:'e-ic'},'🗒️'),
      h('div',{class:'e-txt'}, isTransfer?'Нет переводов':'Нет операций')));
    return {bar, body};
  }

  const wrap=h('div',{class:'card tight'});
  const grouped = (S.ui.sort==='dateDesc'||S.ui.sort==='dateAsc');
  if (grouped){
    let curKey=null;
    for (const t of list){
      const d=startOfDay(new Date(t.date));
      const key=+d;
      if (key!==curKey){ curKey=key; wrap.appendChild(h('div',{class:'day-head'}, dayFull(d))); }
      wrap.appendChild(txRow(t));
    }
  } else {
    for (const t of list) wrap.appendChild(txRow(t));
  }
  body.appendChild(wrap);
  return {bar, body};
}
function txRow(t){
  if (t.type==='transfer'){
    const from=accountById(t.accountId), to=accountById(t.toAccountId);
    return h('button',{class:'tx-row', onclick:()=>openAddSheet(t)},
      avatarEl('transport', '#5C6BC0'),
      h('div',{class:'tx-mid'},
        h('div',{class:'tx-title'}, (from?from.name:'?')+' → '+(to?to.name:'?')),
        h('div',{class:'tx-sub'}, t.comment||'Перевод')),
      h('div',{class:'tx-amt amt-transfer'}, money(t.amount)));
  }
  const cat=categoryById(t.categoryId);
  const acc=accountById(t.accountId);
  const isInc=t.type==='income';
  return h('button',{class:'tx-row', onclick:()=>openAddSheet(t)},
    avatarEl(cat?cat.iconKey:'other', cat?cat.color:'#9E9E9E'),
    h('div',{class:'tx-mid'},
      h('div',{class:'tx-title'}, cat?cat.name:'—'),
      h('div',{class:'tx-sub'}, t.comment||(acc?acc.name:''))),
    h('div',{class:'tx-amt '+(isInc?'amt-income':'amt-expense')}, signedMoney(t.amount,isInc)));
}
function openSortMenu(){
  openDialog('Сортировка', h('div',{},
    SORTS.map(([v,l])=>h('button',{class:'list-tile', onclick:()=>{ S.ui.sort=v; closeDialog(); render(); }},
      h('div',{class:'lt-mid'}, h('div',{class:'lt-title'}, l)),
      S.ui.sort===v?h('div',{class:'lt-right', style:{color:'var(--accent)'}},'✓'):null))),
    [{label:'Закрыть', onclick:closeDialog}]);
}

/* ==================================================================
   ЭКРАН: Анализ (Графики)
   ================================================================== */
function screenAnalysis(){
  const bar=appbar({ title:'Анализ' });
  const body=h('main',{class:'screen'});

  body.appendChild(h('div',{class:'segtabs', style:{marginBottom:'12px'}},
    [['expense','Расходы'],['income','Доходы'],['total','Общий']].map(([t,l])=>
      h('button',{class:'segtab'+(S.ui.analysisMode===t?' active':''), onclick:()=>{ S.ui.analysisMode=t; render(); }}, l))));

  body.appendChild(periodChips());
  body.appendChild((()=>{ const c=h('div',{class:'card tight'}); c.appendChild(periodNavigator()); return c; })());

  // Тренд по последним 8 периодам выбранного типа.
  let gran=S.ui.periodType; if (gran==='custom'||gran==='all') gran='month';
  const buckets=[];
  for (let i=7;i>=0;i--){
    const a=shiftAnchor(gran, S.ui.anchor, -i);
    const r=rangeFor(gran, a);
    const acc=S.ui.selectedAccountId;
    let exp=0, inc=0;
    for (const t of S.data.transactions){
      if (acc!=null && t.accountId!==acc) continue;
      if (t.date<r.start.getTime()||t.date>=r.end.getTime()) continue;
      if (t.type==='expense') exp+=t.amount; else if (t.type==='income') inc+=t.amount;
    }
    buckets.push({a, exp, inc, label:bucketLabel(gran,a)});
  }
  const maxV=Math.max(1, ...buckets.map(b=>Math.max(b.exp,b.inc)));
  const chart=h('div',{class:'card'});
  chart.appendChild(h('div',{class:'section-title', style:{margin:'0 0 6px'}},'Динамика'));
  const bars=h('div',{class:'bars'});
  for (const b of buckets){
    const col=h('div',{class:'bar-col'});
    const inner=h('div',{style:{display:'flex', gap:'2px', alignItems:'flex-end', height:'100%', width:'100%', justifyContent:'center'}});
    if (S.ui.analysisMode==='expense'||S.ui.analysisMode==='total')
      inner.appendChild(h('div',{class:'bar exp', style:{height:(b.exp/maxV*100)+'%'}}));
    if (S.ui.analysisMode==='income'||S.ui.analysisMode==='total')
      inner.appendChild(h('div',{class:'bar inc', style:{height:(b.inc/maxV*100)+'%'}}));
    col.appendChild(inner);
    col.appendChild(h('div',{class:'bar-lbl'}, b.label));
    bars.appendChild(col);
  }
  chart.appendChild(bars);
  body.appendChild(chart);

  // Итоги за текущий период.
  const r=rangeFor(S.ui.periodType,S.ui.anchor,S.ui.customRange);
  const acc=S.ui.selectedAccountId;
  let pExp=0,pInc=0;
  for (const t of S.data.transactions){
    if (acc!=null && t.accountId!==acc) continue;
    if (t.date<r.start.getTime()||t.date>=r.end.getTime()) continue;
    if (t.type==='expense') pExp+=t.amount; else if (t.type==='income') pInc+=t.amount;
  }
  const totals=h('div',{class:'card'});
  totals.appendChild(h('div',{class:'section-title', style:{margin:'0 0 8px'}},'Итоги за период'));
  totals.appendChild(h('div',{class:'totals-grid'},
    h('div',{class:'tg-cell'}, h('div',{class:'tg-lbl'},'Доходы'), h('div',{class:'tg-val', style:{color:'var(--income)'}}, money(pInc))),
    h('div',{class:'tg-cell'}, h('div',{class:'tg-lbl'},'Расходы'), h('div',{class:'tg-val', style:{color:'var(--expense)'}}, money(pExp))),
    h('div',{class:'tg-cell'}, h('div',{class:'tg-lbl'},'Баланс'), h('div',{class:'tg-val'}, money(pInc-pExp)))));
  body.appendChild(totals);

  // Разбивка по категориям (для режима расход/доход; в общем — расходы).
  const mode=S.ui.analysisMode==='income'?'income':'expense';
  const slice=S.data.transactions.filter(t=>t.type===mode && (acc==null||t.accountId===acc) && t.date>=r.start.getTime() && t.date<r.end.getTime());
  const items=breakdown(slice);
  if (items.length){
    const list=h('div',{class:'card tight'});
    list.appendChild(h('div',{class:'section-title', style:{margin:'0 0 6px'}}, mode==='income'?'Доходы по категориям':'Расходы по категориям'));
    for (const it of items){
      list.appendChild(h('div',{class:'brk-row'},
        avatarEl(it.category.iconKey, it.category.color),
        h('div',{class:'brk-mid'},
          h('div',{class:'brk-name'}, it.category.name),
          h('div',{class:'brk-bar'}, h('span',{style:{width:(it.fraction*100).toFixed(1)+'%', background:it.category.color||'#9E9E9E'}}))),
        h('div',{class:'brk-right'},
          h('div',{class:'brk-amt'}, money(it.total)),
          h('div',{class:'brk-pct'}, Math.round(it.fraction*100)+'%'))));
    }
    body.appendChild(list);
  }
  return {bar, body};
}
function bucketLabel(gran, a){
  if (gran==='day') return new Intl.DateTimeFormat(RU,{day:'numeric',month:'numeric'}).format(a);
  if (gran==='week') return dayMonthShort(rangeFor('week',a).start);
  if (gran==='month') return cap(new Intl.DateTimeFormat(RU,{month:'short'}).format(a)).replace(/\.$/,'');
  if (gran==='year') return String(a.getFullYear());
  return '';
}

/* ==================================================================
   ЭКРАН: Ещё (хаб)
   ================================================================== */
function gaugeCard(label, ratio, max, valText){
  return h('div',{class:'gauge-card'},
    h('div',{html:gaugeSVG(ratio,max,86)}),
    h('div',{class:'g-label'}, label),
    valText?h('div',{class:'g-val'}, valText):null);
}
function headerGaugesStrip(){
  const g=gaugeData();
  const sel=S.data.settings.headerGauges;
  const strip=h('div',{class:'gauges-strip'});
  const map={
    day:()=>gaugeCard('Траты дня', g.dayRatio, g.dayMax, g.dayRatio!=null?Math.round(g.dayRatio*100)+'%':'—'),
    limit:()=> S.data.settings.monthlyLimit>0 ? gaugeCard('Лимит месяца', g.limitRatio, 1, Math.round((g.limitRatio||0)*100)+'%') : null,
    income_day:()=>gaugeCard('Доход дня', g.incomeDayRatio, g.dayMax, g.incomeDayRatio!=null?Math.round(g.incomeDayRatio*100)+'%':'—'),
    income_target:()=> S.data.settings.monthlyIncomeTarget>0 ? gaugeCard('Цель месяца', g.incomeTargetRatio, 1, Math.round((g.incomeTargetRatio||0)*100)+'%') : null,
    balance:()=>h('div',{class:'gauge-card'}, h('div',{html:balanceGaugeSVG(g.monthIncome,g.monthExpense,96)}), h('div',{class:'g-label'},'Баланс месяца')),
  };
  let any=false;
  for (const key of ['day','limit','income_day','income_target','balance']){
    if (!sel.includes(key)) continue;
    const el=map[key](); if (el){ strip.appendChild(el); any=true; }
  }
  return any?strip:null;
}
function screenMore(){
  const bar=appbar({ title:'Ещё' });
  const body=h('main',{class:'screen'});
  const net=netByAccount();

  const head=h('div',{class:'card balance-head'});
  head.appendChild(h('div',{class:'bh-top'},
    h('div',{}, h('div',{class:'bh-bal-label'},'Остаток:'), h('div',{class:'bh-bal'}, money(totalBalance(net))))));
  const strip=headerGaugesStrip(); if (strip) head.appendChild(strip);
  body.appendChild(head);

  const tiles=[
    ['accounts','💳','Счета','Кошельки и остатки'],
    ['categories','🏷️','Категории','Расходы и доходы'],
    ['limits','🚦','Спидометры','Лимиты, цели, датчики'],
    ['recurring','🔁','Регулярные операции','Автосоздание по расписанию'],
    ['appearance','🎨','Оформление','Тема, цвет, шрифт, масштаб'],
    ['backup','💾','Резервная копия','Сохранить / восстановить данные'],
    ['about','ℹ️','О приложении','Версия и сведения'],
  ];
  for (const [scr,ic,title,sub] of tiles){
    body.appendChild(h('button',{class:'list-tile', onclick:()=>navigate(scr)},
      h('div',{class:'lt-ic'}, ic),
      h('div',{class:'lt-mid'}, h('div',{class:'lt-title'}, title), h('div',{class:'lt-sub'}, sub)),
      h('div',{class:'lt-right'},'›')));
  }
  return {bar, body};
}

/* ==================================================================
   ЭКРАН: Счета
   ================================================================== */
function screenAccounts(){
  const bar=appbar({ left:backBtn('more'), title:'Счета',
    actions:[ h('button',{class:'ab-btn', onclick:()=>openAccountEdit(null)},'+') ] });
  const body=h('main',{class:'screen'});
  const net=netByAccount();
  body.appendChild(h('div',{class:'card tight'},
    h('div',{class:'total-row'}, h('span',{class:'muted'},'Общий баланс'), h('span',{class:'t-val'}, money(totalBalance(net))))));
  for (const a of S.data.accounts.slice().sort((x,y)=>x.sortOrder-y.sortOrder)){
    body.appendChild(h('button',{class:'list-tile', onclick:()=>openAccountEdit(a)},
      avatarEl(a.iconKey, a.color),
      h('div',{class:'lt-mid'}, h('div',{class:'lt-title'}, a.name)),
      h('div',{class:'lt-val'}, money(balanceOf(a.id,net)))));
  }
  return {bar, body};
}

/* ==================================================================
   ЭКРАН: Категории
   ================================================================== */
function screenCategories(){
  if (!S.ui.catTab) S.ui.catTab='expense';
  const bar=appbar({ left:backBtn('more'), title:'Категории',
    actions:[ h('button',{class:'ab-btn', onclick:()=>openCategoryEdit(null, S.ui.catTab)},'+') ] });
  const body=h('main',{class:'screen'});
  body.appendChild(h('div',{class:'segtabs', style:{marginBottom:'12px'}},
    [['expense','Расходы'],['income','Доходы']].map(([t,l])=>
      h('button',{class:'segtab'+(S.ui.catTab===t?' active':''), onclick:()=>{ S.ui.catTab=t; render(); }}, l))));
  const list=h('div',{class:'card tight'});
  for (const c of categoriesOfType(S.ui.catTab).sort((a,b)=>a.sortOrder-b.sortOrder)){
    list.appendChild(h('button',{class:'list-tile', onclick:()=>openCategoryEdit(c, c.type)},
      avatarEl(c.iconKey, c.color),
      h('div',{class:'lt-mid'}, h('div',{class:'lt-title'}, c.name)),
      h('div',{class:'lt-right'},'›')));
  }
  body.appendChild(list);
  return {bar, body};
}

/* ==================================================================
   ЭКРАН: Спидометры
   ================================================================== */
function screenLimits(){
  const bar=appbar({ left:backBtn('more'), title:'Спидометры' });
  const body=h('main',{class:'screen'});
  const g=gaugeData();
  const st=S.data.settings;

  // Все датчики.
  const strip=h('div',{class:'gauges-strip'});
  strip.appendChild(gaugeCard('Траты дня', g.dayRatio, g.dayMax, g.dayRatio!=null?Math.round(g.dayRatio*100)+'%':'—'));
  strip.appendChild(gaugeCard('Лимит месяца', g.limitRatio, 1, st.monthlyLimit>0?Math.round((g.limitRatio||0)*100)+'%':'нет'));
  strip.appendChild(gaugeCard('Доход дня', g.incomeDayRatio, g.dayMax, g.incomeDayRatio!=null?Math.round(g.incomeDayRatio*100)+'%':'—'));
  strip.appendChild(gaugeCard('Цель месяца', g.incomeTargetRatio, 1, st.monthlyIncomeTarget>0?Math.round((g.incomeTargetRatio||0)*100)+'%':'нет'));
  strip.appendChild(h('div',{class:'gauge-card'}, h('div',{html:balanceGaugeSVG(g.monthIncome,g.monthExpense,96)}), h('div',{class:'g-label'},'Баланс месяца')));
  body.appendChild(h('div',{class:'card'}, strip));

  // Лимит трат.
  const limCard=h('div',{class:'card'});
  limCard.appendChild(h('div',{class:'section-title', style:{margin:'0 0 8px'}},'Месячный лимит трат'));
  const limInput=h('input',{class:'input', type:'number', inputmode:'decimal',
    placeholder:'Например, '+fmtNum(g.last30Expense), value: st.monthlyLimit>0?st.monthlyLimit:''});
  limCard.appendChild(h('div',{class:'field'}, limInput,
    h('div',{class:'helper'},'Подсказка: траты за 30 дней — '+money(g.last30Expense))));
  limCard.appendChild(h('div',{class:'btn-row'},
    h('button',{class:'btn primary', onclick:()=>{ const v=parseAmount(limInput.value)||0; st.monthlyLimit=v<0?0:v; persist(); toast('Лимит сохранён'); render(); }},'Сохранить'),
    st.monthlyLimit>0?h('button',{class:'btn outline', onclick:()=>{ st.monthlyLimit=0; persist(); render(); }},'Сбросить'):null));
  body.appendChild(limCard);

  // Целевой доход.
  const tgtCard=h('div',{class:'card'});
  tgtCard.appendChild(h('div',{class:'section-title', style:{margin:'0 0 8px'}},'Целевой доход за месяц'));
  const tgtInput=h('input',{class:'input', type:'number', inputmode:'decimal',
    placeholder:'Например, '+fmtNum(g.last30Income), value: st.monthlyIncomeTarget>0?st.monthlyIncomeTarget:''});
  tgtCard.appendChild(h('div',{class:'field'}, tgtInput,
    h('div',{class:'helper'},'Подсказка: доход за 30 дней — '+money(g.last30Income))));
  tgtCard.appendChild(h('div',{class:'btn-row'},
    h('button',{class:'btn primary', onclick:()=>{ const v=parseAmount(tgtInput.value)||0; st.monthlyIncomeTarget=v<0?0:v; persist(); toast('Цель сохранена'); render(); }},'Сохранить'),
    st.monthlyIncomeTarget>0?h('button',{class:'btn outline', onclick:()=>{ st.monthlyIncomeTarget=0; persist(); render(); }},'Сбросить'):null));
  body.appendChild(tgtCard);

  // Порог.
  const thrCard=h('div',{class:'card'});
  const thrLabel=h('div',{class:'section-title', style:{margin:'0 0 8px'}},'Порог «потрачено больше обычного»: +'+Math.round(st.spendAlertThreshold*100)+'%');
  const slider=h('input',{type:'range', min:'0.10', max:'1.0', step:'0.05', value:st.spendAlertThreshold});
  slider.addEventListener('input',()=>{ thrLabel.textContent='Порог «потрачено больше обычного»: +'+Math.round(parseFloat(slider.value)*100)+'%'; });
  slider.addEventListener('change',()=>{ st.spendAlertThreshold=parseFloat(slider.value); persist(); render(); });
  thrCard.appendChild(thrLabel); thrCard.appendChild(slider);
  body.appendChild(thrCard);

  // Что показывать в шапке «Ещё».
  const hgCard=h('div',{class:'card'});
  hgCard.appendChild(h('div',{class:'section-title', style:{margin:'0 0 8px'}},'Показывать в шапке «Ещё»'));
  const gauges=[['day','Траты дня'],['limit','Лимит месяца'],['income_day','Доход дня'],['income_target','Цель месяца'],['balance','Баланс месяца']];
  for (const [key,label] of gauges){
    hgCard.appendChild(switchRow(label, S.data.settings.headerGauges.includes(key), (on)=>{
      const set=new Set(S.data.settings.headerGauges);
      if (on) set.add(key); else set.delete(key);
      S.data.settings.headerGauges=Array.from(set); persist();
    }));
  }
  body.appendChild(hgCard);
  return {bar, body};
}
function switchRow(label, checked, onChange){
  const input=h('input',{type:'checkbox'});
  input.checked=checked;
  input.addEventListener('change',()=>onChange(input.checked));
  return h('div',{class:'row-between', style:{padding:'10px 0'}},
    h('div',{}, label),
    h('label',{class:'switch'}, input, h('span',{class:'track'})));
}

/* ==================================================================
   ЭКРАН: Оформление
   ================================================================== */
function screenAppearance(){
  const bar=appbar({ left:backBtn('more'), title:'Оформление' });
  const body=h('main',{class:'screen'});
  const st=S.data.settings;
  const isFull=!!FULL_THEMES.find(t=>t.id===st.themePreset);

  // Тема.
  const themeCard=h('div',{class:'card'});
  themeCard.appendChild(h('div',{class:'section-title', style:{margin:'0 0 8px'}},'Тема'));
  themeCard.appendChild(h('div',{class:'chips'},
    [['system','Как в системе'],['light','Светлая'],['dark','Тёмная']].map(([m,l])=>
      h('button',{class:'chip'+(st.themeMode===m&&!isFull?' active':''), disabled:isFull,
        onclick:()=>{ st.themeMode=m; persist(); render(); }}, l))));
  if (isFull) themeCard.appendChild(h('div',{class:'helper', style:{textAlign:'left', marginTop:'8px'}},'Не действует, пока выбрана тема ниже'));
  body.appendChild(themeCard);

  // Цветовая гамма (акценты).
  const accCard=h('div',{class:'card'});
  accCard.appendChild(h('div',{class:'section-title', style:{margin:'0 0 10px'}},'Цветовая гамма'));
  const accRow=h('div',{class:'color-grid'});
  for (const a of ACCENTS){
    accRow.appendChild(h('button',{class:'color-dot'+(!isFull&&st.accentColor===a.accent?' sel':''),
      style:{background:a.accent}, onclick:()=>{ st.themePreset=a.id; st.accentColor=a.accent; persist(); render(); }}));
  }
  accCard.appendChild(accRow);
  accCard.appendChild(h('button',{class:'btn outline', style:{marginTop:'12px'},
    onclick:()=>{ st.themePreset='green'; st.accentColor='#2E7D67'; persist(); render(); }},'Сбросить по умолчанию'));
  body.appendChild(accCard);

  // Тёмные темы.
  const fullCard=h('div',{class:'card'});
  fullCard.appendChild(h('div',{class:'section-title', style:{margin:'0 0 10px'}},'Тёмные темы'));
  for (const t of FULL_THEMES){
    fullCard.appendChild(h('button',{class:'list-tile', style:{background:'var(--surface2)'}, onclick:()=>{ st.themePreset=t.id; st.accentColor=t.accent; persist(); render(); }},
      h('div',{class:'color-dot', style:{background:t.accent, width:'26px', height:'26px', flex:'0 0 auto'}}),
      h('div',{class:'lt-mid'}, h('div',{class:'lt-title'}, t.name)),
      st.themePreset===t.id?h('div',{class:'lt-right', style:{color:'var(--accent)'}},'✓'):null));
  }
  if (isFull) fullCard.appendChild(h('button',{class:'btn outline', style:{marginTop:'4px'},
    onclick:()=>{ st.themePreset='custom'; persist(); render(); }},'Вернуть стандартную гамму'));
  body.appendChild(fullCard);

  // Цвет текста на акценте.
  const txtCard=h('div',{class:'card'});
  txtCard.appendChild(h('div',{class:'section-title', style:{margin:'0 0 8px'}},'Цвет текста на акценте'));
  txtCard.appendChild(h('div',{class:'chips'},
    [['auto','Авто'],['light','Светлый'],['dark','Тёмный']].map(([m,l])=>
      h('button',{class:'chip'+(st.accentTextMode===m?' active':''), onclick:()=>{ st.accentTextMode=m; persist(); render(); }}, l))));
  body.appendChild(txtCard);

  // Шрифт.
  const fontCard=h('div',{class:'card'});
  fontCard.appendChild(h('div',{class:'section-title', style:{margin:'0 0 8px'}},'Шрифт'));
  fontCard.appendChild(h('div',{class:'chips'},
    [[null,'Стандартный'],['dejavu','DejaVu Sans'],['serif','С засечками'],['mono','Моноширинный']].map(([f,l])=>
      h('button',{class:'chip'+(st.fontFamily===f?' active':''), onclick:()=>{ st.fontFamily=f; persist(); render(); }}, l))));
  body.appendChild(fontCard);

  // Масштаб.
  const scaleCard=h('div',{class:'card'});
  const scaleLabel=h('div',{class:'section-title', style:{margin:'0 0 8px'}},'Масштаб интерфейса: '+Math.round(st.uiScale*100)+'%');
  const scaleSlider=h('input',{type:'range', min:'0.85', max:'1.35', step:'0.05', value:st.uiScale});
  scaleSlider.addEventListener('input',()=>{ const v=parseFloat(scaleSlider.value); scaleLabel.textContent='Масштаб интерфейса: '+Math.round(v*100)+'%'; document.documentElement.style.setProperty('--scale', v); });
  scaleSlider.addEventListener('change',()=>{ st.uiScale=parseFloat(scaleSlider.value); persist(); render(); });
  scaleCard.appendChild(scaleLabel); scaleCard.appendChild(scaleSlider);
  body.appendChild(scaleCard);

  return {bar, body};
}

/* ==================================================================
   ЭКРАН: Регулярные операции
   ================================================================== */
const FREQ_TITLE={daily:'Каждый день', weekly:'Каждую неделю', monthly:'Каждый месяц', yearly:'Каждый год'};
const FREQ_SHORT=[['daily','День'],['weekly','Неделя'],['monthly','Месяц'],['yearly','Год']];
function screenRecurring(){
  const bar=appbar({ left:backBtn('more'), title:'Регулярные операции' });
  const body=h('main',{class:'screen'});
  if (!S.data.recurring.length){
    body.appendChild(h('div',{class:'empty'}, h('div',{class:'e-ic'},'🔁'), h('div',{class:'e-txt'},'Пока нет регулярных операций'),
      h('div',{class:'muted', style:{marginTop:'8px', fontSize:'.85rem'}},'Включите «Сделать регулярной» при добавлении операции')));
    return {bar, body};
  }
  for (const rule of S.data.recurring){
    const cat=categoryById(rule.categoryId);
    const next=new Date(rule.nextRun);
    body.appendChild(h('div',{class:'list-tile'},
      avatarEl(cat?cat.iconKey:'other', cat?cat.color:'#9E9E9E'),
      h('div',{class:'lt-mid'},
        h('div',{class:'lt-title'}, (cat?cat.name:'—')+' · '+money(rule.amount)),
        h('div',{class:'lt-sub'}, FREQ_TITLE[rule.frequency]+' · след. '+dayShort(next))),
      switchInline(rule.enabled, (on)=>{ rule.enabled=on; if(on){ materializeRecurring(); afterMutation(); } else { persist(); render(); } }),
      h('button',{class:'ab-btn', style:{color:'var(--danger)'}, onclick:()=>{
        openConfirm('Удалить регулярную операцию?','Само правило будет удалено; уже созданные операции останутся.','Удалить',()=>{
          S.data.recurring=S.data.recurring.filter(r=>r.id!==rule.id); persist(); render();
        });
      }},'🗑')));
  }
  return {bar, body};
}
function switchInline(checked, onChange){
  const input=h('input',{type:'checkbox'}); input.checked=checked;
  input.addEventListener('change',()=>onChange(input.checked));
  return h('label',{class:'switch'}, input, h('span',{class:'track'}));
}

/* ==================================================================
   ЭКРАН: Резервная копия
   ================================================================== */
function screenBackup(){
  const bar=appbar({ left:backBtn('more'), title:'Резервная копия' });
  const body=h('main',{class:'screen'});
  body.appendChild(h('div',{class:'hint'},'Данные хранятся только на этом устройстве (офлайн). Делайте копию перед сменой телефона или переустановкой.'));

  const tx=S.data.transactions.length;
  body.appendChild(h('div',{class:'card'},
    h('div',{class:'section-title', style:{margin:'0 0 8px'}},'Экспорт'),
    h('div',{class:'muted', style:{marginBottom:'10px', fontSize:'.85rem'}}, 'Операций: '+tx+' · Счетов: '+S.data.accounts.length+' · Категорий: '+S.data.categories.length),
    h('button',{class:'btn primary', style:{marginBottom:'8px'}, onclick:exportJSON},'Сохранить копию (JSON)'),
    h('button',{class:'btn outline', onclick:exportCSV},'Экспорт операций (CSV)')));

  const fileInput=h('input',{type:'file', accept:'.json,application/json', style:{display:'none'}});
  fileInput.addEventListener('change',()=>{ if (fileInput.files[0]) importJSON(fileInput.files[0]); });
  body.appendChild(h('div',{class:'card'},
    h('div',{class:'section-title', style:{margin:'0 0 8px'}},'Импорт'),
    h('div',{class:'muted', style:{marginBottom:'10px', fontSize:'.85rem'}},'Восстановить из ранее сохранённого JSON. Текущие данные будут заменены.'),
    fileInput,
    h('button',{class:'btn outline', onclick:()=>fileInput.click()},'Загрузить копию (JSON)')));

  body.appendChild(h('div',{class:'card'},
    h('div',{class:'section-title', style:{margin:'0 0 8px'}},'Опасная зона'),
    h('button',{class:'btn danger', onclick:()=>openConfirm('Стереть все данные?','Все операции, счета и настройки будут удалены без возможности восстановления.','Стереть',()=>{
      S.data=seedData(); persist(); resetFilters(); navigate('dashboard'); toast('Данные сброшены');
    })},'Стереть все данные')));
  return {bar, body};
}
function downloadBlob(name, content, type){
  const blob=new Blob([content],{type});
  const url=URL.createObjectURL(blob);
  const a=h('a',{href:url, download:name});
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ a.remove(); URL.revokeObjectURL(url); }, 1000);
}
function stamp(){ const d=new Date(); const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; }
function exportJSON(){ downloadBlob(`tratometr-backup-${stamp()}.json`, JSON.stringify(S.data,null,2), 'application/json'); toast('Копия сохранена'); }
function exportCSV(){
  const rows=[['Дата','Тип','Сумма','Счёт','Категория/Получатель','Комментарий']];
  const sorted=S.data.transactions.slice().sort((a,b)=>a.date-b.date);
  for (const t of sorted){
    const acc=accountById(t.accountId);
    let typ, target;
    if (t.type==='transfer'){ typ='Перевод'; target=(accountById(t.toAccountId)||{}).name||''; }
    else { typ=t.type==='income'?'Доход':'Расход'; target=(categoryById(t.categoryId)||{}).name||''; }
    const esc=v=>{ v=String(v==null?'':v); return /[",;\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; };
    rows.push([new Date(t.date).toISOString().slice(0,10), typ, String(t.amount), acc?acc.name:'', target, t.comment||''].map(esc));
  }
  downloadBlob(`tratometr-operations-${stamp()}.csv`, '﻿'+rows.map(r=>r.join(';')).join('\n'), 'text/csv');
  toast('CSV сохранён');
}
function importJSON(file){
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      if (!data || !Array.isArray(data.accounts) || !Array.isArray(data.categories) || !Array.isArray(data.transactions))
        throw new Error('bad');
      openConfirm('Восстановить из копии?','Текущие данные будут заменены данными из файла.','Восстановить',()=>{
        S.data=normalizeLoaded(data); persist(); resetFilters(); navigate('dashboard'); toast('Данные восстановлены');
      });
    }catch(_){ toast('Не удалось прочитать файл', true); }
  };
  reader.onerror=()=>toast('Ошибка чтения файла', true);
  reader.readAsText(file);
}

/* ==================================================================
   ЭКРАН: О приложении
   ================================================================== */
function screenAbout(){
  const bar=appbar({ left:backBtn('more'), title:'О приложении' });
  const body=h('main',{class:'screen'});
  const logo=h('div',{class:'card center'});
  logo.appendChild(h('img',{src:'icons/icon-192.png', width:'88', height:'88', style:{borderRadius:'22px'}}));
  logo.appendChild(h('div',{style:{fontSize:'1.3rem', fontWeight:'800', marginTop:'10px'}},'Тратометр'));
  logo.appendChild(h('div',{class:'muted', style:{marginTop:'2px'}},'Веб-версия 1.0'));
  body.appendChild(logo);
  body.appendChild(h('div',{class:'card'},
    h('p',{class:'muted', style:{margin:'0', lineHeight:'1.5'}},
      'Офлайн-трекер личных финансов: операции, счета, категории, лимиты и анализ. '+
      'Работает без интернета. Все данные хранятся только на этом устройстве — '+
      'без аккаунта, без облака и без передачи куда-либо.')));
  body.appendChild(h('div',{class:'hint'},'Совет: чтобы пользоваться как приложением, откройте меню «Поделиться» в Safari и выберите «На экран „Домой“».'));
  return {bar, body};
}

/* ==================================================================
   Диалоги / листы (общие)
   ================================================================== */
function openDialog(title, content, actions){
  closeDialog();
  const scrim=h('div',{class:'dialog-scrim', onclick:(e)=>{ if(e.target===scrim) closeDialog(); }});
  const dlg=h('div',{class:'dialog'});
  if (title) dlg.appendChild(h('h3',{}, title));
  if (content) dlg.appendChild(content);
  if (actions){
    const ab=h('div',{class:'dialog-actions'});
    for (const a of actions) ab.appendChild(h('button',{class:'btn '+(a.kind||''), onclick:a.onclick}, a.label));
    dlg.appendChild(ab);
  }
  scrim.appendChild(dlg);
  document.body.appendChild(scrim);
  requestAnimationFrame(()=>scrim.classList.add('show'));
}
function closeDialog(){ const d=document.querySelector('.dialog-scrim'); if (d) d.remove(); }
function openConfirm(title, text, confirmLabel, onConfirm, danger){
  openDialog(title, h('p',{}, text), [
    {label:'Отмена', kind:'outline', onclick:closeDialog},
    {label:confirmLabel, kind:danger===false?'primary':'danger', onclick:()=>{ closeDialog(); onConfirm(); }},
  ]);
}

let _sheetCloser=null;
function openSheet({title, full, body, onClose}){
  closeSheet();
  const scrim=h('div',{class:'sheet-scrim', onclick:(e)=>{ if(e.target===scrim) closeSheet(); }});
  const sheet=h('div',{class:'sheet'+(full?' full':'')});
  if (!full) sheet.appendChild(h('div',{class:'grab'}));
  const head=h('div',{class:'sheet-head'});
  head.appendChild(h('button',{class:'ab-btn', style:{color:'var(--text)'}, onclick:closeSheet}, full?'✕':'‹'));
  head.appendChild(h('div',{class:'sh-title'}, title||''));
  if (typeof onClose==='object' && onClose.action) head.appendChild(onClose.action);
  sheet.appendChild(head);
  const sb=h('div',{class:'sheet-body'});
  sb.appendChild(body);
  sheet.appendChild(sb);
  scrim.appendChild(sheet);
  document.body.appendChild(scrim);
  requestAnimationFrame(()=>scrim.classList.add('show'));
  _sheetCloser=()=>{ scrim.remove(); _sheetCloser=null; };
  return { close: closeSheet, headEl:head };
}
function closeSheet(){ if (_sheetCloser) _sheetCloser(); }

/* ==================================================================
   Выбор счёта (дашборд)
   ================================================================== */
function openAccountSelector(){
  const net=netByAccount();
  const body=h('div',{});
  body.appendChild(h('button',{class:'list-tile', onclick:()=>{ S.ui.selectedAccountId=null; closeSheet(); render(); }},
    h('div',{class:'lt-ic'},'💼'),
    h('div',{class:'lt-mid'}, h('div',{class:'lt-title'},'Все счета')),
    h('div',{class:'lt-val'}, money(totalBalance(net))),
    S.ui.selectedAccountId==null?h('div',{class:'lt-right', style:{color:'var(--accent)', marginLeft:'8px'}},'✓'):null));
  for (const a of S.data.accounts){
    body.appendChild(h('button',{class:'list-tile', onclick:()=>{ S.ui.selectedAccountId=a.id; closeSheet(); render(); }},
      avatarEl(a.iconKey,a.color),
      h('div',{class:'lt-mid'}, h('div',{class:'lt-title'}, a.name)),
      h('div',{class:'lt-val'}, money(balanceOf(a.id,net))),
      S.ui.selectedAccountId===a.id?h('div',{class:'lt-right', style:{color:'var(--accent)', marginLeft:'8px'}},'✓'):null));
  }
  openSheet({title:'Счёт', body});
}

/* ==================================================================
   Выбор периода (диалог)
   ================================================================== */
function openPeriodPicker(){
  const body=h('div',{});
  body.appendChild(h('div',{class:'section-title', style:{marginTop:'0'}},'Быстрый выбор'));
  body.appendChild(h('div',{class:'chips'},
    [['day','День'],['week','Неделя'],['month','Месяц'],['year','Год']].map(([t,l])=>
      h('button',{class:'chip', onclick:()=>{ S.ui.periodType=t; S.ui.customRange=null; S.ui.anchor=todayStart(); closeSheet(); render(); }}, l))));
  body.appendChild(h('div',{class:'section-title'},'Произвольный период'));
  const from=h('input',{class:'input', type:'date'});
  const to=h('input',{class:'input', type:'date'});
  const r=rangeFor(S.ui.periodType,S.ui.anchor,S.ui.customRange);
  from.value=toInputDate(r.start); to.value=toInputDate(addDays(r.end,-1));
  body.appendChild(h('div',{class:'field'}, h('label',{},'С'), from));
  body.appendChild(h('div',{class:'field'}, h('label',{},'По'), to));
  body.appendChild(h('button',{class:'btn primary', onclick:()=>{
    const s=fromInputDate(from.value), e=fromInputDate(to.value);
    if (!s||!e){ toast('Укажите даты', true); return; }
    const start=s<=e?s:e, end=s<=e?e:s;
    S.ui.customRange={start:startOfDay(start), end:addDays(startOfDay(end),1)};
    S.ui.periodType='custom'; closeSheet(); render();
  }},'Применить период'));
  body.appendChild(h('button',{class:'btn outline', style:{marginTop:'8px'}, onclick:()=>{
    // Весь период: от самой ранней до самой поздней операции.
    if (!S.data.transactions.length){ S.ui.periodType='all'; S.ui.customRange=null; closeSheet(); render(); return; }
    let min=Infinity,max=-Infinity; for (const t of S.data.transactions){ if(t.date<min)min=t.date; if(t.date>max)max=t.date; }
    S.ui.customRange={start:startOfDay(new Date(min)), end:addDays(startOfDay(new Date(max)),1)};
    S.ui.periodType='all'; closeSheet(); render();
  }},'За всё время'));
  openSheet({title:'Период', body});
}
function toInputDate(d){ const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; }
function fromInputDate(s){ if(!s) return null; const [y,m,d]=s.split('-').map(Number); if(!y||!m||!d) return null; return new Date(y,m-1,d); }

/* ==================================================================
   Открыть операции категории (с дашборда)
   ================================================================== */
function openCategoryTx(category){
  const r=rangeFor(S.ui.periodType,S.ui.anchor,S.ui.customRange);
  const acc=S.ui.selectedAccountId;
  const list=sortTx(S.data.transactions.filter(t=>t.categoryId===category.id && (acc==null||t.accountId===acc) && t.date>=r.start.getTime() && t.date<r.end.getTime()));
  const body=h('div',{});
  const total=list.reduce((s,t)=>s+t.amount,0);
  body.appendChild(h('div',{class:'total-row', style:{marginBottom:'8px'}},
    h('span',{class:'muted'},'Всего:'), h('span',{class:'t-val'}, money(total))));
  if (!list.length) body.appendChild(h('div',{class:'empty'}, h('div',{class:'e-txt'},'Нет операций')));
  for (const t of list) body.appendChild(txRow(t));
  openSheet({title:category.name, body});
}

/* ==================================================================
   Добавление / редактирование операции
   ================================================================== */
const CURRENCIES=['RUB','USD','EUR','GBP','KZT','CNY'];
const CUR_SYMBOL={RUB:'₽',USD:'$',EUR:'€',GBP:'£',KZT:'₸',CNY:'¥'};
function parseAmount(s){ if (s==null) return null; const v=parseFloat(String(s).replace(/\s/g,'').replace(',','.')); return isFinite(v)?v:null; }

function openAddSheet(editing){
  const isEdit=!!editing;
  // Состояние формы.
  const f={
    type: editing ? editing.type : (S.ui.screen==='dashboard' ? (S.ui.activeType) : 'expense'),
    amount: editing ? String(editing.originalAmount!=null?editing.originalAmount:editing.amount) : '',
    currency: editing && editing.originalCurrency ? editing.originalCurrency : 'RUB',
    rate: editing && editing.originalRate ? String(editing.originalRate) : '',
    categoryId: editing ? editing.categoryId : null,
    accountId: editing ? editing.accountId : (S.ui.selectedAccountId!=null?S.ui.selectedAccountId:(mainAccount()||{}).id),
    toAccountId: editing ? editing.toAccountId : null,
    date: editing ? startOfDay(new Date(editing.date)) : todayStart(),
    comment: editing ? (editing.comment||'') : '',
    regular: false, freq: 'monthly',
  };
  if (f.type==='transfer' && f.toAccountId==null){
    const other=S.data.accounts.find(a=>a.id!==f.accountId);
    if (other) f.toAccountId=other.id;
  }

  const body=h('div',{});
  const rebuild=()=>{ body.innerHTML=''; buildAddForm(body, f, isEdit, editing, rebuild); };
  const delAction = isEdit ? h('button',{class:'ab-btn', style:{color:'var(--danger)'}, onclick:()=>{
    openConfirm('Удалить операцию?','Действие нельзя отменить.','Удалить',()=>{
      S.data.transactions=S.data.transactions.filter(t=>t.id!==editing.id); afterMutation(); closeSheet();
    });
  }},'🗑') : null;

  rebuild();
  openSheet({title: isEdit?'Редактирование':'Добавление операции', full:true, body, onClose:{action:delAction}});
}
function buildAddForm(body, f, isEdit, editing, rebuild){
  // Тип.
  const types=[['expense','Расход'],['income','Доход'],['transfer','Перевод']];
  body.appendChild(h('div',{class:'segtabs', style:{marginBottom:'16px'}},
    types.map(([t,l])=>h('button',{class:'segtab'+(f.type===t?' active':''), onclick:()=>{
      f.type=t;
      if (t==='transfer'){ f.currency='RUB'; if (f.toAccountId==null||f.toAccountId===f.accountId){ const o=S.data.accounts.find(a=>a.id!==f.accountId); f.toAccountId=o?o.id:null; } }
      else { f.categoryId=null; }
      rebuild();
    }}, l))));

  // Сумма.
  const amountRow=h('div',{style:{display:'flex', gap:'10px', alignItems:'center', marginBottom:'6px'}});
  const amountInput=h('input',{class:'input', type:'text', inputmode:'decimal', placeholder:'0',
    value:f.amount, style:{fontSize:'2rem', fontWeight:'800', textAlign:'left', padding:'10px 14px'}});
  amountInput.addEventListener('input',()=>{ f.amount=amountInput.value; updateSaveState(); updatePreview(); });
  amountRow.appendChild(amountInput);
  if (f.type!=='transfer'){
    const sel=h('select',{class:'selectbox', style:{width:'auto', flex:'0 0 auto'}},
      CURRENCIES.map(c=>h('option',{value:c, selected:f.currency===c}, c)));
    sel.addEventListener('change',()=>{ f.currency=sel.value; rebuild(); });
    amountRow.appendChild(sel);
  } else {
    amountRow.appendChild(h('div',{style:{fontSize:'1.4rem', padding:'0 6px'}},'₽'));
  }
  body.appendChild(amountRow);

  // Курс (для валюты).
  const previewEl=h('div',{class:'helper', style:{textAlign:'left'}});
  if (f.type!=='transfer' && f.currency!=='RUB'){
    const rateRow=h('div',{style:{display:'flex', gap:'10px', alignItems:'center', marginBottom:'6px'}});
    rateRow.appendChild(h('div',{class:'muted', style:{flex:'0 0 auto'}},'Курс к ₽'));
    const rateInput=h('input',{class:'input', type:'text', inputmode:'decimal', placeholder:'0', value:f.rate});
    rateInput.addEventListener('input',()=>{ f.rate=rateInput.value; updateSaveState(); updatePreview(); });
    rateRow.appendChild(rateInput);
    body.appendChild(rateRow);
    body.appendChild(previewEl);
  }
  function updatePreview(){
    if (f.type==='transfer'||f.currency==='RUB'){ previewEl.textContent=''; return; }
    const a=parseAmount(f.amount), r=parseAmount(f.rate);
    previewEl.textContent = (a&&r) ? '= '+money(a*r) : '';
  }
  updatePreview();

  // Категория (расход/доход) или счета (перевод).
  if (f.type!=='transfer'){
    body.appendChild(h('div',{class:'section-title', style:{margin:'8px 4px'}},'Категория'));
    const grid=h('div',{class:'cat-grid'});
    for (const c of popularCategoriesOfType(f.type)){
      grid.appendChild(h('button',{class:'cat-cell'+(f.categoryId===c.id?' sel':''), onclick:()=>{ f.categoryId=c.id; rebuild(); }},
        avatarEl(c.iconKey, c.color),
        h('div',{class:'cat-label'}, c.name)));
    }
    grid.appendChild(h('button',{class:'cat-cell', onclick:()=>openCategoryEdit(null, f.type, (newId)=>{ f.categoryId=newId; rebuild(); })},
      h('div',{class:'avatar', style:{background:'var(--surface2)'}},'＋'),
      h('div',{class:'cat-label'},'Создать')));
    body.appendChild(grid);

    // Счёт.
    body.appendChild(h('div',{class:'section-title', style:{margin:'12px 4px 8px'}},'Счёт'));
    body.appendChild(accountSelectRow(f.accountId, (id)=>{ f.accountId=id; rebuild(); }));
  } else {
    body.appendChild(h('div',{class:'section-title', style:{margin:'8px 4px'}},'Со счёта'));
    body.appendChild(accountSelectRow(f.accountId, (id)=>{ f.accountId=id; if(f.toAccountId===id){ const o=S.data.accounts.find(a=>a.id!==id); f.toAccountId=o?o.id:null; } updateSaveState(); rebuild(); }));
    body.appendChild(h('div',{class:'section-title', style:{margin:'12px 4px 8px'}},'На счёт'));
    body.appendChild(accountSelectRow(f.toAccountId, (id)=>{ f.toAccountId=id; updateSaveState(); rebuild(); }));
    if (S.data.accounts.length<2) body.appendChild(h('div',{class:'hint'},'Нужно минимум два счёта для перевода. Создайте второй счёт в разделе «Счета».'));
  }

  // Дата.
  body.appendChild(h('div',{class:'section-title', style:{margin:'12px 4px 8px'}},'Дата'));
  const dateChips=h('div',{class:'chips'});
  const presets=[[0,'Сегодня'],[-1,'Вчера'],[-2,'Позавчера']];
  for (const [off,l] of presets){
    const d=addDays(todayStart(),off);
    dateChips.appendChild(h('button',{class:'chip'+(sameDay(f.date,d)?' active':''), onclick:()=>{ f.date=d; rebuild(); }}, l));
  }
  const dateInput=h('input',{type:'date', class:'chip', style:{padding:'6px 10px'}, value:toInputDate(f.date)});
  dateInput.addEventListener('change',()=>{ const d=fromInputDate(dateInput.value); if(d){ f.date=startOfDay(d); rebuild(); } });
  dateChips.appendChild(dateInput);
  body.appendChild(dateChips);
  if (!presets.some(([off])=>sameDay(f.date,addDays(todayStart(),off))))
    body.appendChild(h('div',{class:'helper', style:{textAlign:'left'}}, dayWeekday(f.date)));

  // Комментарий.
  body.appendChild(h('div',{class:'section-title', style:{margin:'12px 4px 8px'}},'Комментарий'));
  const comment=h('textarea',{class:'textarea', maxlength:'200', placeholder:'Необязательно'}, f.comment);
  comment.value=f.comment;
  const counter=h('div',{class:'helper'}, f.comment.length+'/200');
  comment.addEventListener('input',()=>{ f.comment=comment.value; counter.textContent=comment.value.length+'/200'; });
  body.appendChild(comment); body.appendChild(counter);

  // Регулярная (только новая операция, не перевод).
  if (!isEdit && f.type!=='transfer'){
    const regWrap=h('div',{class:'card', style:{marginTop:'12px'}});
    regWrap.appendChild(switchRow('Сделать регулярной', f.regular, (on)=>{ f.regular=on; rebuild(); }));
    if (f.regular){
      regWrap.appendChild(h('div',{class:'chips', style:{marginTop:'8px'}},
        FREQ_SHORT.map(([v,l])=>h('button',{class:'chip'+(f.freq===v?' active':''), onclick:()=>{ f.freq=v; rebuild(); }}, l))));
    }
    body.appendChild(regWrap);
  }

  body.appendChild(h('div',{style:{height:'12px'}}));
  const saveBtn=h('button',{class:'btn primary', onclick:()=>saveTransaction(f, isEdit, editing)}, isEdit?'Сохранить':'Добавить');
  body.appendChild(saveBtn);
  body.appendChild(h('div',{style:{height:'24px'}}));

  function valid(){
    const a=parseAmount(f.amount);
    if (!a||a<=0) return false;
    if (f.type==='transfer') return S.data.accounts.length>=2 && f.accountId!=null && f.toAccountId!=null && f.accountId!==f.toAccountId;
    if (f.currency!=='RUB' && !(parseAmount(f.rate)>0)) return false;
    return f.categoryId!=null;
  }
  function updateSaveState(){ saveBtn.disabled=!valid(); }
  updateSaveState();
  // авто-фокус на сумме при новом добавлении
  if (!isEdit) setTimeout(()=>{ try{ amountInput.focus(); }catch(_){} }, 250);
}
function accountSelectRow(selectedId, onPick){
  const acc=accountById(selectedId);
  return h('button',{class:'list-tile', style:{marginBottom:'0'}, onclick:()=>{
    const body=h('div',{});
    for (const a of S.data.accounts){
      body.appendChild(h('button',{class:'list-tile', onclick:()=>{ onPick(a.id); closeSubSheet(); }},
        avatarEl(a.iconKey,a.color),
        h('div',{class:'lt-mid'}, h('div',{class:'lt-title'}, a.name)),
        selectedId===a.id?h('div',{class:'lt-right', style:{color:'var(--accent)'}},'✓'):null));
    }
    openSubSheet('Выберите счёт', body);
  }},
    acc?avatarEl(acc.iconKey,acc.color):h('div',{class:'lt-ic'},'💼'),
    h('div',{class:'lt-mid'}, h('div',{class:'lt-title'}, acc?acc.name:'— нет счёта —')),
    h('div',{class:'lt-right'},'▾'));
}
function saveTransaction(f, isEdit, editing){
  const amount=parseAmount(f.amount);
  if (!amount||amount<=0){ toast('Введите корректную сумму', true); return; }
  if (f.type==='transfer'){
    if (S.data.accounts.length<2){ toast('Нужно минимум два счёта для перевода', true); return; }
    if (f.accountId==null||f.toAccountId==null){ toast('Выберите счета', true); return; }
    if (f.accountId===f.toAccountId){ toast('Счёт списания и зачисления должны отличаться', true); return; }
  } else {
    if (f.currency!=='RUB'){ const r=parseAmount(f.rate); if(!(r>0)){ toast('Введите курс', true); return; } }
    if (f.categoryId==null){ toast('Выберите категорию', true); return; }
  }
  let rub=amount, origAmount=null, origCur=null, origRate=null;
  if (f.type!=='transfer' && f.currency!=='RUB'){
    const r=parseAmount(f.rate); rub=Math.round(amount*r*100)/100;
    origAmount=amount; origCur=f.currency; origRate=r;
  }
  const rec={
    type:f.type, amount:rub,
    accountId:f.accountId, categoryId:f.type==='transfer'?null:f.categoryId,
    toAccountId:f.type==='transfer'?f.toAccountId:null,
    date:f.date.getTime(), comment:f.comment.trim()||null,
    originalAmount:origAmount, originalCurrency:origCur, originalRate:origRate,
  };
  if (isEdit){
    const i=S.data.transactions.findIndex(t=>t.id===editing.id);
    if (i>=0) S.data.transactions[i]=Object.assign({}, editing, rec);
    toast('Сохранено');
  } else {
    rec.id=newId(); rec.createdAt=Date.now();
    S.data.transactions.push(rec);
    if (f.regular && f.type!=='transfer'){
      const anchorDay=f.date.getDate();
      S.data.recurring.push({
        id:newId(), type:f.type, amount:rub, accountId:f.accountId, categoryId:f.categoryId,
        comment:rec.comment, frequency:f.freq, anchorDay,
        enabled:true, nextRun: nextOccurrence(f.date, f.freq, anchorDay).getTime(), createdAt:Date.now(),
      });
      materializeRecurring();
    }
    toast('Добавлено');
  }
  afterMutation();
  closeSheet();
}

/* ==================================================================
   Вложенный лист (выбор счёта / иконки / цвета поверх формы)
   ================================================================== */
let _subSheet=null;
function openSubSheet(title, body){
  closeSubSheet();
  const scrim=h('div',{class:'sheet-scrim', style:{zIndex:'120'}, onclick:(e)=>{ if(e.target===scrim) closeSubSheet(); }});
  const sheet=h('div',{class:'sheet'});
  sheet.appendChild(h('div',{class:'grab'}));
  sheet.appendChild(h('div',{class:'sheet-head'},
    h('button',{class:'ab-btn', onclick:closeSubSheet},'‹'), h('div',{class:'sh-title'}, title)));
  const sb=h('div',{class:'sheet-body'}); sb.appendChild(body); sheet.appendChild(sb);
  scrim.appendChild(sheet); document.body.appendChild(scrim);
  requestAnimationFrame(()=>scrim.classList.add('show'));
  _subSheet=()=>{ scrim.remove(); _subSheet=null; };
}
function closeSubSheet(){ if (_subSheet) _subSheet(); }

/* ==================================================================
   Редактирование категории
   ================================================================== */
function openCategoryEdit(cat, defaultType, onCreated){
  const isEdit=!!cat;
  const f={
    name: cat?cat.name:'',
    type: cat?cat.type:(defaultType||'expense'),
    iconKey: cat?cat.iconKey:'other',
    color: cat?cat.color:PALETTE[5],
  };
  const body=h('div',{});
  const rebuild=()=>{ body.innerHTML=''; buildCategoryForm(body, f, isEdit, cat, onCreated, rebuild); };
  rebuild();
  openSubSheet(isEdit?'Категория':'Новая категория', body);
}
function buildCategoryForm(body, f, isEdit, cat, onCreated, rebuild){
  body.appendChild(h('div',{class:'center', style:{marginBottom:'12px'}},
    avatarEl(f.iconKey, f.color, '')));
  const nameInput=h('input',{class:'input', placeholder:'Название', value:f.name});
  nameInput.addEventListener('input',()=>{ f.name=nameInput.value; });
  body.appendChild(h('div',{class:'field'}, h('label',{},'Название'), nameInput));

  if (!isEdit){
    body.appendChild(h('div',{class:'field'}, h('label',{},'Тип'),
      h('div',{class:'segtabs'},
        [['expense','Расход'],['income','Доход']].map(([t,l])=>
          h('button',{class:'segtab'+(f.type===t?' active':''), onclick:()=>{ f.type=t; rebuild(); }}, l)))));
  }

  body.appendChild(h('label',{class:'field', style:{display:'block'}},'Иконка'));
  const iconGrid=h('div',{class:'icon-grid'});
  for (const key of ICON_ORDER){
    iconGrid.appendChild(h('button',{class:'icon-opt'+(f.iconKey===key?' sel':''), onclick:()=>{ f.iconKey=key; rebuild(); }}, EMOJI[key]));
  }
  body.appendChild(iconGrid);
  const emojiInput=h('input',{class:'input', style:{marginTop:'8px'}, placeholder:'…или вставьте свой эмодзи', maxlength:'8'});
  emojiInput.addEventListener('change',()=>{ const v=emojiInput.value.trim(); if (v){ f.iconKey=EMOJI_PREFIX+Array.from(v)[0]; rebuild(); } });
  body.appendChild(emojiInput);

  body.appendChild(h('label',{class:'field', style:{display:'block', marginTop:'12px'}},'Цвет'));
  const colorGrid=h('div',{class:'color-grid'});
  colorGrid.appendChild(h('button',{class:'color-dot nofill'+(f.color==null?' sel':''), onclick:()=>{ f.color=null; rebuild(); }}));
  for (const col of PALETTE){
    colorGrid.appendChild(h('button',{class:'color-dot'+(f.color===col?' sel':''), style:{background:col}, onclick:()=>{ f.color=col; rebuild(); }}));
  }
  const customColor=h('input',{type:'color', class:'color-dot', style:{padding:'0', border:'none', background:'none'}, value:f.color||'#45C168'});
  customColor.addEventListener('change',()=>{ f.color=customColor.value.toUpperCase(); rebuild(); });
  colorGrid.appendChild(customColor);
  body.appendChild(colorGrid);

  body.appendChild(h('div',{style:{height:'16px'}}));
  body.appendChild(h('button',{class:'btn primary', onclick:()=>{
    const name=f.name.trim();
    if (!name){ toast('Введите название', true); return; }
    if (isEdit){
      const c=categoryById(cat.id);
      Object.assign(c, {name, iconKey:f.iconKey, color:f.color});
      persist(); closeSubSheet(); render(); toast('Сохранено');
    } else {
      const id=newId();
      const order=Math.max(0,...S.data.categories.map(c=>c.sortOrder))+1;
      S.data.categories.push({id, name, type:f.type, iconKey:f.iconKey, color:f.color, sortOrder:order, isDefault:false});
      persist(); closeSubSheet();
      if (onCreated) onCreated(id); else render();
      toast('Категория создана');
    }
  }}, isEdit?'Сохранить':'Создать'));

  if (isEdit){
    body.appendChild(h('button',{class:'btn danger', style:{marginTop:'8px'}, onclick:()=>deleteCategory(cat)},'Удалить'));
  }
  body.appendChild(h('div',{style:{height:'24px'}}));
}
function deleteCategory(cat){
  const sameType=S.data.categories.filter(c=>c.type===cat.type && c.id!==cat.id);
  if (!sameType.length){ toast('Нельзя удалить последнюю категорию', true); return; }
  const fallbackName=cat.type==='expense'?'Другое':'Прочее';
  openConfirm('Удалить категорию?', `Операции этой категории перенесутся в «${fallbackName}».`,'Удалить',()=>{
    let fb=S.data.categories.find(c=>c.type===cat.type && c.id!==cat.id && c.name===fallbackName);
    if (!fb){ fb={id:newId(), name:fallbackName, type:cat.type, iconKey:'other', color:'#9E9E9E', sortOrder:999, isDefault:true}; S.data.categories.push(fb); }
    for (const t of S.data.transactions) if (t.categoryId===cat.id) t.categoryId=fb.id;
    for (const r of S.data.recurring) if (r.categoryId===cat.id) r.categoryId=fb.id;
    S.data.categories=S.data.categories.filter(c=>c.id!==cat.id);
    persist(); closeSubSheet(); render();
  });
}

/* ==================================================================
   Редактирование счёта
   ================================================================== */
function openAccountEdit(acc){
  const isEdit=!!acc;
  const f={ name:acc?acc.name:'', initialBalance:acc?String(acc.initialBalance):'', iconKey:acc?acc.iconKey:'wallet', color:acc?acc.color:PALETTE[6] };
  const body=h('div',{});
  const rebuild=()=>{ body.innerHTML=''; buildAccountForm(body, f, isEdit, acc, rebuild); };
  rebuild();
  openSheet({title:isEdit?'Счёт':'Новый счёт', body});
}
function buildAccountForm(body, f, isEdit, acc, rebuild){
  body.appendChild(h('div',{class:'center', style:{marginBottom:'12px'}}, avatarEl(f.iconKey, f.color)));
  const nameInput=h('input',{class:'input', placeholder:'Название', value:f.name});
  nameInput.addEventListener('input',()=>{ f.name=nameInput.value; });
  body.appendChild(h('div',{class:'field'}, h('label',{},'Название'), nameInput));
  const balInput=h('input',{class:'input', type:'text', inputmode:'decimal', placeholder:'0', value:f.initialBalance});
  balInput.addEventListener('input',()=>{ f.initialBalance=balInput.value; });
  body.appendChild(h('div',{class:'field'}, h('label',{},'Начальный остаток'), balInput));

  body.appendChild(h('label',{class:'field', style:{display:'block'}},'Иконка'));
  const accIcons=['wallet','cash','credit_card','bank','savings','business','star','home','car','phone'];
  const iconGrid=h('div',{class:'icon-grid'});
  for (const key of accIcons) iconGrid.appendChild(h('button',{class:'icon-opt'+(f.iconKey===key?' sel':''), onclick:()=>{ f.iconKey=key; rebuild(); }}, EMOJI[key]));
  body.appendChild(iconGrid);

  body.appendChild(h('label',{class:'field', style:{display:'block', marginTop:'12px'}},'Цвет'));
  const colorGrid=h('div',{class:'color-grid'});
  for (const col of PALETTE) colorGrid.appendChild(h('button',{class:'color-dot'+(f.color===col?' sel':''), style:{background:col}, onclick:()=>{ f.color=col; rebuild(); }}));
  body.appendChild(colorGrid);

  body.appendChild(h('div',{style:{height:'16px'}}));
  body.appendChild(h('button',{class:'btn primary', onclick:()=>{
    const name=f.name.trim(); if (!name){ toast('Введите название', true); return; }
    const bal=parseAmount(f.initialBalance)||0;
    if (isEdit){ const a=accountById(acc.id); Object.assign(a,{name, initialBalance:bal, iconKey:f.iconKey, color:f.color}); }
    else {
      const order=Math.max(0,...S.data.accounts.map(a=>a.sortOrder))+1;
      S.data.accounts.push({id:newId(), name, initialBalance:bal, iconKey:f.iconKey, color:f.color, sortOrder:order});
    }
    persist(); closeSheet(); render(); toast('Сохранено');
  }}, isEdit?'Сохранить':'Создать'));
  if (isEdit){
    body.appendChild(h('button',{class:'btn danger', style:{marginTop:'8px'}, onclick:()=>{
      if (S.data.accounts.length<=1){ toast('Нельзя удалить единственный счёт', true); return; }
      openConfirm('Удалить счёт?','Операции и переводы этого счёта будут удалены.','Удалить',()=>{
        S.data.transactions=S.data.transactions.filter(t=>t.accountId!==acc.id && t.toAccountId!==acc.id);
        S.data.recurring=S.data.recurring.filter(r=>r.accountId!==acc.id);
        S.data.accounts=S.data.accounts.filter(a=>a.id!==acc.id);
        if (S.ui.selectedAccountId===acc.id) S.ui.selectedAccountId=null;
        persist(); closeSheet(); render();
      });
    }},'Удалить счёт'));
  }
  body.appendChild(h('div',{style:{height:'24px'}}));
}

/* -------------------------------------------------- Служебное --------------- */
function afterMutation(){ persist(); render(); }
function resetFilters(){ S.ui.selectedAccountId=null; S.ui.activeType='expense'; S.ui.periodType='day'; S.ui.anchor=todayStart(); S.ui.customRange=null; S.ui.sort='dateDesc'; S.ui.txTab='expense'; }
function normalizeLoaded(data){
  // Гарантируем наличие полей и пересчитываем seq.
  data.settings=Object.assign({}, seedData().settings, data.settings||{});
  data.recurring=data.recurring||[];
  let maxId=0;
  for (const arr of [data.accounts,data.categories,data.transactions,data.recurring])
    for (const o of arr) if (o.id>maxId) maxId=o.id;
  data.seq=Math.max(data.seq||0, maxId+1);
  return data;
}

/* -------------------------------------------------- Запуск ------------------ */
async function boot(){
  let data=await loadState();
  if (data){ S.data=normalizeLoaded(data); }
  else { S.data=seedData(); }
  // Догенерация регулярных операций за пропущенное время.
  if (materializeRecurring()) persist();
  render();
}
boot();
