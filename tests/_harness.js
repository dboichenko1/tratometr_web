/* Общий шим для тестов: загружает app.js в Node без браузера и возвращает
   контекст со всеми функциями приложения и состоянием S. DOM подменяется
   минимальной заглушкой, поэтому работают и функции, дергающие render(). */
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');

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

function loadApp(){
  let src = fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
  src = src.replace(/\nboot\(\);\s*$/, '\n');           // не запускаем автозагрузку
  src += '\n;globalThis.S = S;\n';                       // открываем доступ к состоянию

  const root = el('div'); root.id='root';
  const docHandlers = {};
  const document = {
    createElement:(t)=>el(t), createTextNode:(t)=>({nodeType:3,textContent:String(t)}),
    getElementById:(id)=> id==='root'?root:null, querySelector:()=>null, querySelectorAll:()=>[],
    body:el('body'), documentElement:el('html'),
    addEventListener:(t,f)=>{ (docHandlers[t]=docHandlers[t]||[]).push(f); }, hidden:false,
  };
  let plays=0;
  const ctx={
    document, window:{ matchMedia:()=>({matches:false}), addEventListener(){}, open:()=>null },
    navigator:{}, localStorage:{ _m:{}, getItem(k){return this._m[k]||null;}, setItem(k,v){this._m[k]=v;}, removeItem(k){delete this._m[k];} },
    requestAnimationFrame:(f)=>{ try{f(0)}catch(e){} }, setTimeout:()=>0, clearTimeout(){},
    Audio:function(){ this.play=function(){ plays++; ctx.__plays=plays; return {catch(){}}; }; this.pause=function(){}; this.currentTime=0; this.preload=''; this.muted=false; this.setAttribute=function(){}; },
    Math, Date, JSON, Intl, console, isFinite, parseInt, parseFloat, isNaN, Number, String, Array, Object,
    TextEncoder, TextDecoder, Uint8Array,
  };
  ctx.globalThis=ctx;
  ctx.__plays=0;
  ctx.__fire=(type)=>{ (docHandlers[type]||[]).forEach(fn=>{ try{ fn({ target:{ closest:()=>null }, type }); }catch(e){} }); };
  vm.createContext(ctx);
  vm.runInContext(src, ctx, { filename:'app.js' });
  ctx.S.data = ctx.seedData();   // свежее состояние по умолчанию
  return ctx;
}

// Мини-ассертер
function makeAsserts(title){
  let fail=0;
  console.log(title+':');
  const ok=(name,cond,got)=>{ console.log((cond?'  ok   ':'  FAIL ')+name+(cond?'':'  → '+JSON.stringify(got))); if(!cond) fail++; };
  const done=()=>{ console.log(fail? ('  ❌ провалено: '+fail) : '  ✅ ok'); if(fail) process.exit(1); };
  return { ok, done, eq:(name,a,b)=>ok(name, a===b, a), close:(name,a,b,e)=>ok(name, Math.abs(a-b)<=(e||1e-9), a) };
}

module.exports = { loadApp, makeAsserts };
