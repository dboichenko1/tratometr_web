/* Регулярные операции: дата следующего повторения. Порт recurring_test.dart. */
'use strict';
const { loadApp, makeAsserts } = require('./_harness');
const A = loadApp();
const t = makeAsserts('Регулярные операции: nextOccurrence');

const cases = [
  [[2026,6,10], 'weekly',  10, [2026,6,17]],   // +7 дней
  [[2026,6,28], 'weekly',  28, [2026,7,5]],     // через границу месяца
  [[2026,6,4],  'monthly', 4,  [2026,7,4]],      // тот же день след. месяца
  [[2026,3,31], 'monthly', 31, [2026,4,30]],     // кламп 31 → 30 (апрель)
  [[2027,1,31], 'monthly', 31, [2027,2,28]],     // кламп 31 → 28 (февраль)
  [[2026,12,15],'monthly', 15, [2027,1,15]],     // декабрь → январь
  [[2026,6,4],  'yearly',  4,  [2027,6,4]],       // +1 год
  [[2028,2,29], 'yearly',  29, [2029,2,28]],      // 29 фев → 28 фев
];
for (const [from, freq, anchor, exp] of cases){
  const d = A.nextOccurrence(new Date(from[0], from[1]-1, from[2]), freq, anchor);
  const okk = d.getFullYear()===exp[0] && d.getMonth()===exp[1]-1 && d.getDate()===exp[2];
  t.ok(freq+' '+from.join('.')+' → '+exp.join('.'), okk, d.getFullYear()+'.'+(d.getMonth()+1)+'.'+d.getDate());
}

// Догенерация пропущенных периодов (backfill) до сегодня.
A.S.data = A.seedData();
const acc = A.mainAccount().id, ecat = A.categoriesOfType('expense')[0].id;
const start = A.addDays(A.todayStart(), -3);
A.S.data.recurring.push({ id:A.newId(), type:'expense', amount:50, accountId:acc, categoryId:ecat,
  comment:null, frequency:'daily', anchorDay:start.getDate(), enabled:true, nextRun:start.getTime(), createdAt:0 });
const before = A.S.data.transactions.length;
const changed = A.materializeRecurring();
t.eq('materialize: были изменения', changed, true);
t.eq('backfill ежедневного за 3 дня назад → 4 операции', A.S.data.transactions.length - before, 4);
t.eq('nextRun сдвинут в будущее', A.startOfDay(new Date(A.S.data.recurring[0].nextRun)) > A.todayStart(), true);

t.done();
