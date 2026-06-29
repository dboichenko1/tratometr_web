/* Флаг счёта «не учитывать в „Все счета“»: исключение из общего баланса и
   сводок по «Все счета», но сам счёт и его операции остаются. */
'use strict';
const { loadApp, makeAsserts } = require('./_harness');
const A = loadApp();
const t = makeAsserts('Счёт вне «Все счета» (excludeFromTotal)');

A.S.data = A.seedData();
const main = A.mainAccount().id;
const exId = A.newId();
A.S.data.accounts.push({ id: exId, name: 'Кредитка', initialBalance: -5000,
  iconKey: 'credit_card', color: '#888888', sortOrder: 2, excludeFromTotal: true });

const ecat = A.categoriesOfType('expense')[0].id, icat = A.categoriesOfType('income')[0].id;
const now = Date.now();
A.S.data.transactions.push({ id: A.newId(), type: 'expense', amount: 300, accountId: main, categoryId: ecat, toAccountId: null, date: now });
A.S.data.transactions.push({ id: A.newId(), type: 'income', amount: 1000, accountId: main, categoryId: icat, toAccountId: null, date: now });
A.S.data.transactions.push({ id: A.newId(), type: 'expense', amount: 2000, accountId: exId, categoryId: ecat, toAccountId: null, date: now });

// ── helper ──
t.eq('accExcluded(Кредитка) = true', A.accExcluded(exId), true);
t.eq('accExcluded(Основной) = false', A.accExcluded(main), false);

// ── баланс ──
const net = A.netByAccount();
t.eq('баланс «Основной» = 700', A.balanceOf(main, net), 700);
t.eq('баланс «Кредитка» (свой) = −7000', A.balanceOf(exId, net), -7000);
// Общий баланс исключает «Кредитка»: 700 + 0(Наличные) = 700.
t.eq('общий баланс исключает «Кредитка» = 700', A.totalBalance(net), 700);

// ── сводки по «Все счета» ──
A.S.ui.activeType = 'expense'; A.S.ui.selectedAccountId = null;
A.S.ui.periodType = 'day'; A.S.ui.anchor = A.todayStart(); A.S.ui.customRange = null;
const sliceAll = A.currentSlice();
t.eq('«Все счета»: 1 расход (без «Кредитка»)', sliceAll.length, 1);
t.eq('«Все счета»: сумма расходов = 300', sliceAll.reduce((s, x) => s + x.amount, 0), 300);
t.eq('«Все счета»: displayedBalance = 700', A.displayedBalance(net), 700);

// ── при выборе самого счёта он показывается полностью ──
A.S.ui.selectedAccountId = exId;
const sliceEx = A.currentSlice();
t.eq('выбран «Кредитка»: его расход виден', sliceEx.length, 1);
t.eq('выбран «Кредитка»: сумма = 2000', sliceEx.reduce((s, x) => s + x.amount, 0), 2000);
t.eq('выбран «Кредитка»: displayedBalance = −7000', A.displayedBalance(net), -7000);

// ── снять флаг → счёт снова в общем балансе ──
A.S.ui.selectedAccountId = null;
A.accountById(exId).excludeFromTotal = false;
t.eq('после снятия флага общий баланс = −6300', A.totalBalance(A.netByAccount()), -6300);
t.eq('после снятия флага «Все счета»: 2 расхода', A.currentSlice().length, 2);

// ── совместимость: старые счета без поля не исключаются ──
delete A.accountById(exId).excludeFromTotal;
t.eq('нет поля → accExcluded = false', A.accExcluded(exId), false);
t.eq('нет поля → счёт в общем балансе', A.totalBalance(A.netByAccount()), -6300);

t.done();
