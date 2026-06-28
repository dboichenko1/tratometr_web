/* Импорт 1Money CSV + парсинг чисел/дат + Excel-serial. Порт
   import_1money_csv_test / import_export_test. */
'use strict';
const { loadApp, makeAsserts } = require('./_harness');
const A = loadApp();
const t = makeAsserts('Импорт: 1Money CSV, числа, даты');

// ── parseNumber ──
t.eq("parseNumber '1678'", A.parseNumber('1678'), 1678);
t.close("parseNumber '6080.99'", A.parseNumber('6080.99'), 6080.99, 1e-9);
t.close("parseNumber '1 234,56' (пробел+запятая)", A.parseNumber('1 234,56'), 1234.56, 1e-9);
t.close("parseNumber '1.234,56'", A.parseNumber('1.234,56'), 1234.56, 1e-9);
t.close("parseNumber '1,234.56'", A.parseNumber('1,234.56'), 1234.56, 1e-9);
t.eq("parseNumber '900 RUB'", A.parseNumber('900 RUB'), 900);
t.eq("parseNumber '1.23e5' (научная)", A.parseNumber('1.23e5'), 123000);
t.eq("parseNumber '' → null", A.parseNumber(''), null);

// ── parseDateString (dd.MM.yyyy) ──
let d1 = A.parseDateString('09.06.2026');
t.ok('дата 09.06.2026', d1 && d1.getFullYear()===2026 && d1.getMonth()===5 && d1.getDate()===9, d1);
let d2 = A.parseDateString('09.06.2026 14:30');
t.ok('дата+время 14:30', d2 && d2.getHours()===14 && d2.getMinutes()===30, d2);
t.eq('невалидная 31.02.2026 → null', A.parseDateString('31.02.2026'), null);
t.eq('невалидная 13.13.2026 → null', A.parseDateString('13.13.2026'), null);
t.eq('пустая дата → null', A.parseDateString(''), null);
let iso = A.parseDateString('2026-06-09');
t.ok('ISO-дата 2026-06-09', iso && iso.getFullYear()===2026 && iso.getMonth()===5 && iso.getDate()===9, iso);

// ── excelSerialToDate ──
let e1 = A.excelSerialToDate(46182);
t.ok('excel 46182 → 09.06.2026', e1 && e1.getFullYear()===2026 && e1.getMonth()===5 && e1.getDate()===9, e1 && e1.toDateString());
let e2 = A.excelSerialToDate(46182.5);
t.ok('excel 46182.5 → 9-е, 12:00', e2 && e2.getDate()===9 && e2.getHours()===12, e2 && e2.toString());

// ── joinComment ──
t.eq("joinComment('Обед','')", A.joinComment('Обед',''), 'Обед');
t.eq("joinComment('','VIP')", A.joinComment('','VIP'), 'VIP');
t.eq("joinComment('Обед','VIP')", A.joinComment('Обед','VIP'), 'Обед · VIP');
t.eq("joinComment('','')", A.joinComment('',''), '');

// ── normName ──
t.eq("normName('  Счёт  Один ')", A.normName('  Счёт  Один '), 'счет один');
t.eq("normName('РАСХОДЫ')", A.normName('РАСХОДЫ'), 'расходы');

// ── parse1MoneyCsv: расходы/доходы/перевод + блок счетов ──
const csv = [
  'ДАТА,ТИП,СО СЧЁТА,НА СЧЁТ/НА КАТЕГОРИЮ,СУММА,ВАЛЮТА,СУММА 2,ВАЛЮТА 2,МЕТКИ,ЗАМЕТКИ',
  '09.06.2026,Расход,Совместный,Покупки,1678,RUB,1678,RUB,,',
  '08.06.2026,Расход,Совместный,Кафе,8750,RUB,8750,RUB,,Обед',
  '07.06.2026,Доход, МИР,Пополнение,1000,RUB,1000,RUB,,',
  '06.06.2026,Перевод,Совместный, МИР,500,RUB,500,RUB,,',
  '',
  'НАЗВАНИЕ,БАЛАНС,ВАЛЮТА',
  ' МИР,21121.26,RUB',
  'Совместный,48271.53,RUB',
].join('\n');
const res = A.parse1MoneyCsv(csv);
t.eq('csv: 4 операции', res.operations.length, 4);
t.eq('csv: 1 перевод', res.operations.filter(o=>o.type==='transfer').length, 1);
t.eq('csv: op0 расход', res.operations[0].type, 'expense');
t.eq('csv: op0 счёт', res.operations[0].accountName, 'Совместный');
t.eq('csv: op0 категория', res.operations[0].categoryName, 'Покупки');
t.eq('csv: op0 сумма', res.operations[0].amount, 1678);
t.eq('csv: Кафе комментарий', res.operations[1].comment, 'Обед');
const inc = res.operations.find(o=>o.type==='income');
t.eq('csv: доход счёт (trim)', inc.accountName, 'МИР');
t.eq('csv: доход категория', inc.categoryName, 'Пополнение');
const tr = res.operations.find(o=>o.type==='transfer');
t.eq('csv: перевод получатель (trim)', tr.toAccountName, 'МИР');
t.eq('csv: перевод без категории', tr.categoryName, '');

// ── двойная обёртка строк (1Money) ──
const wrapped = ['"ДАТА,ТИП,СУММА"', '"09.06.2026,Расход,100"'].join('\n');
const wr = A.parse1MoneyCsv(wrapped);
t.eq('csv: разворачивает двойную обёртку', wr.operations.length, 1);
t.eq('csv: сумма из обёртки = 100', wr.operations[0].amount, 100);

// ── не-1Money → ошибка ──
let threw=false; try { A.parse1MoneyCsv('foo,bar,baz\n1,2,3\n'); } catch(_){ threw=true; }
t.ok('не-1Money CSV бросает ошибку', threw, threw);

// ── дробные и иностранная валюта ──
const f = A.parse1MoneyCsv([
  'ДАТА,ТИП,СО СЧЁТА,КАТЕГОРИЯ,СУММА,ВАЛЮТА',
  '09.06.2026,Расход,Совместный,Коммуналка,6080.99,RUB',
  '05.06.2026,Расход,Карта,Кафе,10,USD',
].join('\n'));
t.close('csv: дробная сумма 6080.99', f.operations[0].amount, 6080.99, 1e-9);
t.eq('csv: валюта USD', f.operations[1].currency, 'USD');
t.eq('csv: origAmount 10', f.operations[1].originalAmount, 10);
t.eq('csv: origCurrency USD', f.operations[1].originalCurrency, 'USD');

// ── пропуск строк: пустые, неизвестный тип, нет даты/суммы ──
const skip = A.parse1MoneyCsv([
  'ДАТА,ТИП,СО СЧЁТА,КАТЕГОРИЯ,СУММА,ВАЛЮТА',
  '10.06.2026,Расход,Карта,Еда,500,RUB',
  '',
  '11.06.2026,Бонус,Карта,Х,100,RUB',     // неизвестный тип → skip
  '32.13.2026,Расход,Карта,Х,100,RUB',    // плохая дата → skip
  '12.06.2026,Расход,Карта,Х,0,RUB',      // нулевая сумма → skip
].join('\n'));
t.eq('csv: валидных операций 1', skip.operations.length, 1);
t.eq('csv: пропущено строк 3', skip.rowsSkipped, 3);

t.done();
