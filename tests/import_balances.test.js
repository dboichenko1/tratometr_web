/* Восстановление остатков счетов из блока «БАЛАНС» 1Money + правила
   безопасности: счета с уже введёнными данными не затираются. */
'use strict';
const { loadApp, makeAsserts } = require('./_harness');
const A = loadApp();
const t = makeAsserts('Импорт 1Money: восстановление остатков счетов');
const close = (a, b) => Math.abs(a - b) < 1e-6;

const CSV = [
  'ДАТА,ТИП,СО СЧЁТА,НА СЧЁТ/НА КАТЕГОРИЮ,СУММА,ВАЛЮТА',
  '09.06.2026,Расход,Основной,Еда,100,RUB',
  '08.06.2026,Доход,Карта,ЗП,5000,RUB',
  '',
  'НАЗВАНИЕ,БАЛАНС,ВАЛЮТА',
  'Основной,9999,RUB',
  'Карта,5000,RUB',
  'Наличные,300,RUB',
].join('\n');

// Парсинг блока счетов.
const parsed = A.parse1MoneyCsv(CSV);
t.eq('операций 2', parsed.operations.length, 2);
t.eq('остатки из блока: 3 счёта', Object.keys(parsed.accountBalances).length, 3);
t.eq('остаток «Карта» из блока = 5000', parsed.accountBalances['карта'].balance, 5000);

// ── Режим «Добавить»: существующий счёт с данными НЕ трогаем ──
function freshWithData() {
  A.S.data = A.seedData();
  const mainId = A.mainAccount().id;
  A.accountById(mainId).initialBalance = 1000;
  A.S.data.transactions.push({ id: A.newId(), type: 'expense', amount: 200, accountId: mainId,
    categoryId: A.categoriesOfType('expense')[0].id, toAccountId: null, date: Date.now() });
  return mainId;
}
const mainId = freshWithData();
t.eq('до импорта: баланс «Основной» = 800', A.balanceOf(mainId), 800);

const sum = A.applyImport(A.parse1MoneyCsv(CSV).operations, 'add', A.parse1MoneyCsv(CSV).accountBalances);
const id = (n) => A.S.data.accounts.find(a => a.name === n).id;
t.eq('восстановлено 2 остатка (Карта, Наличные)', sum.balancesRestored, 2);
// «Основной» уже с данными → стартовый остаток НЕ затёрт (остался 1000).
t.eq('«Основной» стартовый остаток не тронут = 1000', A.accountById(mainId).initialBalance, 1000);
// баланс «Основной» = 1000 − 200 (было) − 100 (импорт) = 700.
t.eq('«Основной» баланс = 700', A.balanceOf(mainId), 700);
// «Карта» новая → баланс совпадает с 1Money.
t.eq('«Карта» баланс = 5000', close(A.balanceOf(id('Карта')), 5000), true);
// «Наличные» — пустой сид-счёт → восстановлен до 300 (даже без операций).
t.eq('«Наличные» баланс = 300', close(A.balanceOf(id('Наличные')), 300), true);

// ── Режим «Заменить всё»: остатки всех счетов из файла = 1Money ──
freshWithData();
const sum2 = A.applyImport(A.parse1MoneyCsv(CSV).operations, 'replace', A.parse1MoneyCsv(CSV).accountBalances);
t.eq('replace: восстановлено 3 остатка', sum2.balancesRestored, 3);
t.eq('replace: «Основной» баланс = 9999', close(A.balanceOf(id('Основной')), 9999), true);
t.eq('replace: «Карта» баланс = 5000', close(A.balanceOf(id('Карта')), 5000), true);
t.eq('replace: «Наличные» баланс = 300', close(A.balanceOf(id('Наличные')), 300), true);

// ── Без блока счетов остатки не восстанавливаем (баланс = сумма операций) ──
A.S.data = A.seedData();
const noBlock = A.parse1MoneyCsv([
  'ДАТА,ТИП,СО СЧЁТА,НА СЧЁТ/НА КАТЕГОРИЮ,СУММА,ВАЛЮТА',
  '09.06.2026,Расход,Кошелёк,Еда,250,RUB',
].join('\n'));
t.eq('без блока: accountBalances пуст', Object.keys(noBlock.accountBalances).length, 0);
const sum3 = A.applyImport(noBlock.operations, 'add', noBlock.accountBalances);
t.eq('без блока: ничего не восстановлено', sum3.balancesRestored, 0);
t.eq('без блока: «Кошелёк» баланс = −250', A.balanceOf(id('Кошелёк')), -250);

t.done();
