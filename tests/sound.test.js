/* Тест: звук «Больше золота» звучит ТОЛЬКО при добавлении дохода.
   Ловит регрессию, когда звук срабатывал при загрузке/обновлении страницы
   или по любому касанию экрана. Запуск:  node tests/sound.test.js
   (чистый Node, без браузера — DOM подменяется минимальным шимом). */
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');

let src = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
src = src.replace(/\nboot\(\);\s*$/, '\n');   // не запускаем автозагрузку

const driver = `
;(function(){
  S.data = seedData();
  S.data.settings.replenishSound = true;     // звук включён
  globalThis.__plays = 0;

  // 1) Загрузка, навигация по экранам и «касания» НЕ должны давать звук
  for (const s of ['dashboard','transactions','analysis','more','accounts']) { S.ui.screen=s; render(); }
  globalThis.__fire('touchend'); globalThis.__fire('mousedown'); globalThis.__fire('pointerdown'); globalThis.__fire('visibilitychange');
  globalThis.__afterLoad = globalThis.__plays;

  const acc = mainAccount().id, acc2 = S.data.accounts[1].id;
  const icat = categoriesOfType('income')[0].id, ecat = categoriesOfType('expense')[0].id;
  const f = (o) => Object.assign({ amount:'100', currency:'RUB', rate:'', categoryId:null, accountId:acc, toAccountId:null, date:todayStart(), comment:'', regular:false, freq:'monthly' }, o);

  // 2) Доход → ровно один звук
  saveTransaction(f({ type:'income', amount:'1000', categoryId:icat }), false, null);
  globalThis.__afterIncome = globalThis.__plays;
  // 3) Расход → без звука
  saveTransaction(f({ type:'expense', amount:'200', categoryId:ecat }), false, null);
  globalThis.__afterExpense = globalThis.__plays;
  // 4) Перевод → без звука
  saveTransaction(f({ type:'transfer', amount:'50', toAccountId:acc2 }), false, null);
  globalThis.__afterTransfer = globalThis.__plays;
})();
`;
src += driver;

// --- минимальный DOM-шим ---
function el(tag){
  const e={ tagName:(tag||'div').toUpperCase(), children:[], style:{}, dataset:{}, attributes:{}, _l:{},
    classList:{ _s:new Set(), add(){[].forEach.call(arguments,x=>this._s.add(x))}, remove(){[].forEach.call(arguments,x=>this._s.delete(x))}, contains(c){return this._s.has(c)}, toggle(){} },
    appendChild(c){ this.children.push(c); return c; }, removeChild(c){ const i=this.children.indexOf(c); if(i>=0)this.children.splice(i,1); }, remove(){},
    setAttribute(k,v){ this.attributes[k]=v; }, getAttribute(k){ return this.attributes[k]; },
    addEventListener(t,f){ (this._l[t]=this._l[t]||[]).push(f); }, focus(){}, blur(){}, click(){}, closest(){return null;}, querySelector(){return null;}, querySelectorAll(){return [];} };
  e.style.setProperty=()=>{};
  Object.defineProperty(e,'className',{get(){return this._cn||''},set(v){this._cn=v;(''+v).split(/\s+/).forEach(c=>c&&e.classList._s.add(c))}});
  Object.defineProperty(e,'innerHTML',{get(){return this._h||''},set(v){this._h=String(v); if(v==='')this.children=[]}});
  Object.defineProperty(e,'textContent',{get(){return this._t||''},set(v){this._t=String(v); this.children=[]}});
  Object.defineProperty(e,'firstChild',{get(){return this.children[0]||null}});
  return e;
}
const root=el('div'); root.id='root';
const docHandlers={};
const document={
  createElement:(t)=>el(t), createTextNode:(t)=>({nodeType:3,textContent:String(t)}),
  getElementById:(id)=> id==='root'?root:null, querySelector:()=>null, querySelectorAll:()=>[],
  body:el('body'), documentElement:el('html'),
  addEventListener:(t,f)=>{ (docHandlers[t]=docHandlers[t]||[]).push(f); }, hidden:false,
};
let plays=0;
const ctx={
  document, window:{ matchMedia:()=>({matches:false}), addEventListener(){}, open:()=>null },
  navigator:{}, localStorage:{ getItem:()=>null, setItem(){}, removeItem(){} },
  requestAnimationFrame:(f)=>{ try{f(0)}catch(e){} }, setTimeout:()=>0, clearTimeout(){},
  Audio:function(){ this.play=function(){ plays++; ctx.__plays=plays; return {catch(){}}; };
    this.pause=function(){}; this.currentTime=0; this.preload=''; this.muted=false; this.setAttribute=function(){}; },
  Math, Date, JSON, Intl, console, isFinite, parseInt, parseFloat, isNaN, Number, String, Array, Object,
  TextEncoder, TextDecoder, Uint8Array,
};
ctx.globalThis=ctx;
ctx.__fire=(type)=>{ (docHandlers[type]||[]).forEach(fn=>{ try{ fn({ target:{ closest:()=>null }, type }); }catch(e){} }); };
vm.createContext(ctx);
vm.runInContext(src, ctx, { filename:'app.js' });

let fail=0;
const ok=(name,cond,got)=>{ console.log((cond?'  ok  ':'  FAIL')+' '+name+(cond?'':' → получено '+got)); if(!cond) fail++; };
console.log('Звук «Больше золота» — только на доход:');
ok('нет звука при загрузке/навигации/касаниях', ctx.__afterLoad===0, ctx.__afterLoad);
ok('доход → ровно 1 звук', ctx.__afterIncome===1, ctx.__afterIncome);
ok('расход → без нового звука', ctx.__afterExpense===1, ctx.__afterExpense);
ok('перевод → без нового звука', ctx.__afterTransfer===1, ctx.__afterTransfer);
console.log(fail? '\n❌ Провалено: '+fail : '\n✅ Звук срабатывает только на доход');
process.exit(fail?1:0);
