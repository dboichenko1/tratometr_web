/* Импорт 1Money → применение к состоянию: счета и балансы.
   Ловит «сбивающиеся балансы» и лишние счета. */
'use strict';
const { loadApp, makeAsserts } = require('./_harness');
const A = loadApp();
const t = makeAsserts('Импорт 1Money: счета и балансы после применения');

// Свежее состояние: счета «Основной», «Наличные» (нач. остаток 0).
A.S.data = A.seedData();
const namesBefore = A.S.data.accounts.map(a=>a.name).sort().join(',');
t.eq('старт: счета Наличные,Основной', namesBefore, 'Наличные,Основной');

// 1Money CSV: новый счёт «Карта» + существующий «Наличные», все RUB.
const csv = [
  'ДАТА,ТИП,СО СЧЁТА,НА СЧЁТ/НА КАТЕГОРИЮ,СУММА,ВАЛЮТА,СУММА 2,ВАЛЮТА 2,МЕТКИ,ЗАМЕТКИ',
  '09.06.2026,Расход,Карта,Продукты,1000,RUB,1000,RUB,,',
  '08.06.2026,Доход,Карта,Зарплата,5000,RUB,5000,RUB,,аванс',
  '07.06.2026,Расход,Наличные,Кафе,300,RUB,300,RUB,,',
  '06.06.2026,Перевод,Карта,Наличные,200,RUB,200,RUB,,',
  '',
  'НАЗВАНИЕ,БАЛАНС,ВАЛЮТА',
  'Карта,3800,RUB',
  'Наличные,-100,RUB',
].join('\n');

const { operations, rowsSkipped } = A.parse1MoneyCsv(csv);
t.eq('распарсено 4 операции', operations.length, 4);
t.eq('строк пропущено 0', rowsSkipped, 0);

const sum = A.applyImport(operations, 'add');
t.eq('импортировано 4', sum.imported, 4);
t.eq('из них переводов 1', sum.importedTransfers, 1);

// Счета: должны быть ровно 3 (Основной, Наличные, +Карта) — без мусорных.
const names = A.S.data.accounts.map(a=>a.name).sort().join(',');
t.eq('счета после импорта: Карта,Наличные,Основной', names, 'Карта,Наличные,Основной');
t.eq('создан 1 новый счёт «Карта»', sum.createdAccounts.join(','), 'Карта');

const byName = (n)=> A.S.data.accounts.find(a=>a.name===n).id;
const net = A.netByAccount();
// Карта: +5000 (доход) −1000 (расход) −200 (перевод со счёта) = 3800
t.eq('баланс «Карта» = 3800', A.balanceOf(byName('Карта'), net), 3800);
// Наличные: −300 (расход) +200 (перевод на счёт) = −100
t.eq('баланс «Наличные» = −100', A.balanceOf(byName('Наличные'), net), -100);
t.eq('баланс «Основной» = 0', A.balanceOf(byName('Основной'), net), 0);
t.eq('общий баланс = 3700', A.totalBalance(net), 3700);

// Доход «Зарплата» попал на счёт «Карта» (СО СЧЁТА), а не создал счёт-категорию.
const inc = A.S.data.transactions.find(x=>x.type==='income');
t.eq('доход на счёте «Карта»', A.accountById(inc.accountId).name, 'Карта');
t.eq('категория дохода «Зарплата»', A.categoryById(inc.categoryId).name, 'Зарплата');
t.eq('комментарий дохода = аванс', inc.comment, 'аванс');

// Перевод: со счёта Карта → на счёт Наличные (не категория).
const tr = A.S.data.transactions.find(x=>x.type==='transfer');
t.eq('перевод: со счёта Карта', A.accountById(tr.accountId).name, 'Карта');
t.eq('перевод: на счёт Наличные', A.accountById(tr.toAccountId).name, 'Наличные');
t.eq('перевод без категории', tr.categoryId, null);

// Никаких категорий-счетов: проверим, что не появилось категории «Карта»/«Наличные».
t.eq('нет категории-счёта «Карта»', A.S.data.categories.some(c=>c.name==='Карта'), false);
t.eq('нет категории-счёта «Наличные»', A.S.data.categories.some(c=>c.name==='Наличные'), false);

// Режим «Заменить всё»: стирает прежние операции.
const sum2 = A.applyImport(operations, 'replace');
t.eq('replace: прежние удалены', sum2.deletedExisting > 0, true);
t.eq('replace: импортировано 4', sum2.imported, 4);
t.eq('replace: операций ровно 4', A.S.data.transactions.length, 4);

t.done();
