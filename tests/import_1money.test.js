/* Порт нативного test/import_1money_csv_test.dart — РЕАЛЬНЫЙ формат выгрузки
   1Money: двойная обёртка (вся строка в кавычках, каждое поле тоже в кавычках
   с экранированием ""). Ловит сдвиг столбцов → «шляпотень со счетами». */
'use strict';
const { loadApp, makeAsserts } = require('./_harness');
const A = loadApp();
const t = makeAsserts('Импорт 1Money — реальный двойной-обёрнутый формат');

// Повторяем нативные хелперы wrap()/build().
const wrap = (inner) => '"' + inner.replace(/"/g, '""') + '"';
const build = (lines, bom = true) => {
  const wrapped = lines.map(l => l === '' ? '' : wrap(l)).join('\r\n');
  return (bom ? '﻿' : '') + wrapped + '\r\n';
};

// ── Кейс 1: расходы/доходы/перевод + блок счетов (как в нативном тесте) ──
const csv = build([
  'ДАТА,"ТИП","СО СЧЁТА","НА СЧЁТ/НА КАТЕГОРИЮ","СУММА","ВАЛЮТА","СУММА 2","ВАЛЮТА 2","МЕТКИ","ЗАМЕТКИ"',
  '09.06.2026,"Расход","Совместный","Покупки","1678","RUB","1678","RUB","",""',
  '08.06.2026,"Расход","Совместный","Кафе","8750","RUB","8750","RUB","","Обед"',
  '07.06.2026,"Доход"," МИР","Пополнение","1000","RUB","1000","RUB","",""',
  '06.06.2026,"Перевод","Совместный"," МИР","500","RUB","500","RUB","",""',
  '',
  'НАЗВАНИЕ,"БАЛАНС","ВАЛЮТА"',
  ' МИР,"21121.26","RUB"',
  'Совместный,"48271.53","RUB"',
]);

const r = A.parse1MoneyCsv(csv);
t.eq('операций 4 (2 расхода + доход + перевод)', r.operations.length, 4);
t.eq('переводов 1', r.operations.filter(o => o.type === 'transfer').length, 1);

const exp = r.operations[0];
t.eq('расход[0] тип', exp.type, 'expense');
t.eq('расход[0] счёт «Совместный» (СО СЧЁТА)', exp.accountName, 'Совместный');
t.eq('расход[0] категория «Покупки» (НА СЧЁТ/КАТЕГОРИЯ)', exp.categoryName, 'Покупки');
t.eq('расход[0] сумма 1678', exp.amount, 1678);
t.eq('расход[0] валюта RUB', exp.currency, 'RUB');

const cafe = r.operations[1];
t.eq('расход[1] категория «Кафе»', cafe.categoryName, 'Кафе');
t.eq('расход[1] комментарий «Обед» (ЗАМЕТКИ)', cafe.comment, 'Обед');

const inc = r.operations.find(o => o.type === 'income');
t.eq('доход счёт «МИР» (пробел обрезан)', inc.accountName, 'МИР');
t.eq('доход категория «Пополнение»', inc.categoryName, 'Пополнение');
t.eq('доход сумма 1000', inc.amount, 1000);

const tr = r.operations.find(o => o.type === 'transfer');
t.eq('перевод счёт списания «Совместный»', tr.accountName, 'Совместный');
t.eq('перевод счёт зачисления «МИР»', tr.toAccountName, 'МИР');
t.eq('перевод сумма 500', tr.amount, 500);
t.eq('перевод без категории', tr.categoryName, '');

// ── Применение: балансы по счетам ──
A.S.data = A.seedData();
t.eq('остатки счетов из блока: 2', Object.keys(r.accountBalances).length, 2);
const sum = A.applyImport(r.operations, 'add', r.accountBalances);
t.eq('импортировано 4', sum.imported, 4);
// Созданы ровно 2 счёта: «Совместный», «МИР» (без мусора вроде «Импорт»).
t.eq('создано 2 счёта', sum.createdAccounts.length, 2);
t.eq('новые счета = МИР,Совместный', sum.createdAccounts.slice().sort().join(','), 'МИР,Совместный');
const names = A.S.data.accounts.map(a => a.name).sort().join(',');
t.eq('все счета = МИР,Наличные,Основной,Совместный', names, 'МИР,Наличные,Основной,Совместный');

t.eq('остатки восстановлены для 2 счетов', sum.balancesRestored, 2);

const id = (n) => A.S.data.accounts.find(a => a.name === n).id;
const close = (a, b) => Math.abs(a - b) < 1e-6;
const net = A.netByAccount();
// Остатки восстановлены из блока «БАЛАНС» 1Money → итоговый баланс совпадает с 1Money.
// Совместный: операции −1678 −8750 −500 = −10928, остаток подобран так, что баланс = 48271.53.
t.eq('баланс «Совместный» = 48271.53 (как в 1Money)', close(A.balanceOf(id('Совместный'), net), 48271.53), true);
// МИР: операции +1000 +500 = +1500, баланс = 21121.26.
t.eq('баланс «МИР» = 21121.26 (как в 1Money)', close(A.balanceOf(id('МИР'), net), 21121.26), true);
// Стартовый остаток = баланс − net операций.
t.eq('стартовый остаток «Совместный» = 59199.53', close(A.accountById(id('Совместный')).initialBalance, 59199.53), true);
t.eq('стартовый остаток «МИР» = 19621.26', close(A.accountById(id('МИР')).initialBalance, 19621.26), true);
t.eq('общий баланс = 69392.79', close(A.totalBalance(net), 69392.79), true);
// «Совместный»/«МИР» не должны были стать категориями.
t.eq('нет категории «Совместный»', A.S.data.categories.some(c => c.name === 'Совместный'), false);
t.eq('нет категории «МИР»', A.S.data.categories.some(c => c.name === 'МИР'), false);

// ── Кейс 2: дробные суммы и иностранная валюта ──
const csv2 = build([
  'ДАТА,"ТИП","СО СЧЁТА","НА СЧЁТ/НА КАТЕГОРИЮ","СУММА","ВАЛЮТА","СУММА 2","ВАЛЮТА 2","МЕТКИ","ЗАМЕТКИ"',
  '09.06.2026,"Расход","Совместный","Коммуналка","6080.99","RUB","6080.99","RUB","",""',
  '05.06.2026,"Расход","Карта","Кафе","10","USD","900","RUB","","Coffee"',
]);
const r2 = A.parse1MoneyCsv(csv2);
t.eq('кейс2: операций 2', r2.operations.length, 2);
t.eq('кейс2: дробная сумма 6080.99', Math.abs(r2.operations[0].amount - 6080.99) < 1e-9, true);
const usd = r2.operations[1];
t.eq('кейс2: валюта USD', usd.currency, 'USD');
t.eq('кейс2: orig валюта USD', usd.originalCurrency, 'USD');
t.eq('кейс2: orig сумма 10', usd.originalAmount, 10);
t.eq('кейс2: комментарий Coffee', usd.comment, 'Coffee');

// ── Кейс 3: не-1Money CSV → ошибка ──
let threw = false;
try { A.parse1MoneyCsv('foo,bar,baz\n1,2,3\n'); } catch (_) { threw = true; }
t.eq('кейс3: не-1Money → ошибка', threw, true);

t.done();
