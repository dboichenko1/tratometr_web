/* Логика: форматирование, периоды, балансы, разбивка, дефолты, тема.
   Порт из default_account_test / default_period_test / theme_test /
   appearance_settings_test / improvements_15_6_test. */
'use strict';
const { loadApp, makeAsserts } = require('./_harness');
const A = loadApp();
const t = makeAsserts('Логика (форматы, периоды, балансы, тема, дефолты)');
const NBSP = String.fromCharCode(0x202F), MINUS = String.fromCharCode(0x2212);

// ── Форматирование денег ──
t.eq('money(24855)', A.money(24855), '24'+NBSP+'855 ₽');
t.eq('money(1274.5)', A.money(1274.5), '1'+NBSP+'274,50 ₽');
t.eq('money(1000000)', A.money(1000000), '1'+NBSP+'000'+NBSP+'000 ₽');
t.eq('signedMoney расход', A.signedMoney(500,false), MINUS+'500 ₽');
t.eq('signedMoney доход', A.signedMoney(1000,true), '+1'+NBSP+'000 ₽');

// ── Сид / дефолты ──
const seed = A.seedData();
t.eq('сид: первый счёт «Основной»', seed.accounts[0].name, 'Основной');
t.eq('сид: второй счёт «Наличные»', seed.accounts[1].name, 'Наличные');
t.eq('сид: 15 категорий', seed.categories.length, 15);
t.eq('сид: 10 расходных', seed.categories.filter(c=>c.type==='expense').length, 10);
t.eq('сид: 5 доходных', seed.categories.filter(c=>c.type==='income').length, 5);
t.eq('дефолт тема — тёмная', seed.settings.themeMode, 'dark');
t.eq('дефолт навигация — нижняя', seed.settings.navStyle, 'bottom');
t.eq('дефолт текст на акценте — авто', seed.settings.accentTextMode, 'auto');
t.eq('дефолт звук — выкл', seed.settings.replenishSound, false);
t.eq('дефолт пресет — green', seed.settings.themePreset, 'green');

// mainAccount находит «Основной» независимо от порядка
A.S.data = A.seedData(); A.S.data.accounts.reverse();
t.eq('mainAccount = «Основной» при любом порядке', A.mainAccount().name, 'Основной');

// ── Период по умолчанию = день, диапазон = сегодня ──
A.S.data = A.seedData();
t.eq('дефолт период — day', A.S.ui.periodType, 'day');
const r = A.rangeFor('day', A.todayStart());
t.eq('day: начало = сегодня 00:00', +r.start, +A.todayStart());
t.eq('day: конец = завтра 00:00', +r.end, +A.addDays(A.todayStart(),1));
t.eq('неделя начинается с понедельника', A.rangeFor('week', new Date(2026,5,24)).start.getDay(), 1);

// ── canGoForward (нельзя листать в будущее) ──
A.S.ui.periodType='day'; A.S.ui.customRange=null; A.S.ui.anchor=A.todayStart();
t.eq('canGoForward сегодня = false', A.canGoForward(), false);
A.S.ui.anchor = A.addDays(A.todayStart(),-1);
t.eq('canGoForward вчера = true', A.canGoForward(), true);
A.S.ui.periodType='month'; A.S.ui.anchor=A.todayStart();
t.eq('canGoForward этот месяц = false', A.canGoForward(), false);
A.S.ui.anchor = A.shiftAnchor('month', A.todayStart(), -1);
t.eq('canGoForward прошлый месяц = true', A.canGoForward(), true);
A.S.ui.periodType='all';
t.eq('canGoForward «весь период» = false', A.canGoForward(), false);

// ── Балансы (доход +, расход −, перевод: −источник / +получатель) ──
A.S.data = A.seedData();
A.S.ui.periodType='day'; A.S.ui.anchor=A.todayStart(); A.S.ui.customRange=null;
A.S.ui.selectedAccountId=null; A.S.ui.activeType='expense';
const acc=A.mainAccount().id, acc2=A.S.data.accounts[1].id;
const ecat=A.categoriesOfType('expense')[0].id, icat=A.categoriesOfType('income')[0].id;
const now=Date.now();
A.S.data.transactions.push({id:A.newId(),type:'expense',amount:300,accountId:acc,categoryId:ecat,toAccountId:null,date:now});
A.S.data.transactions.push({id:A.newId(),type:'income',amount:1000,accountId:acc,categoryId:icat,toAccountId:null,date:now});
A.S.data.transactions.push({id:A.newId(),type:'transfer',amount:200,accountId:acc,categoryId:null,toAccountId:acc2,date:now});
const net=A.netByAccount();
t.eq('баланс счёта-1 = 500', A.balanceOf(acc,net), 500);
t.eq('баланс счёта-2 = 200', A.balanceOf(acc2,net), 200);
t.eq('общий баланс = 700', A.totalBalance(net), 700);

// ── Разбивка по категориям ──
const bd = A.breakdown(A.currentSlice());
t.eq('разбивка: 1 категория', bd.length, 1);
t.eq('разбивка: сумма 300', bd[0].total, 300);
t.eq('разбивка: доля 1.0', bd[0].fraction, 1);
t.eq('пустая разбивка → []', A.breakdown([]).length, 0);

// ── Тема: контраст текста на акценте ──
t.eq('resolveOnAccent auto = onAccentAuto', A.resolveOnAccent('#E0457B','auto'), A.onAccentAuto('#E0457B'));
t.eq('resolveOnAccent dark → тёмный', A.resolveOnAccent('#E0457B','dark'), '#1E2A26');
t.eq('resolveOnAccent light → светлый', A.resolveOnAccent('#E0457B','light'), '#FFFFFF');
t.eq('onAccentAuto жёлтый → тёмный текст', A.onAccentAuto('#F4B740'), '#1E2A26');
t.eq('onAccentAuto тёмно-зелёный → белый текст', A.onAccentAuto('#1F5C4B'), '#FFFFFF');

// ── Пресет из акцента ──
A.S.data = A.seedData();
A.setAccentColor('#2F6FED');
t.eq('акцент = синий пресет', A.S.data.settings.themePreset, 'blue');
t.eq('синий пресет не полнопалитровый', A.isFullPalette('blue'), false);
A.S.data.settings.themePreset='dracula';
A.setAccentColor('#123456');
t.eq('кастомный акцент уходит из полной темы', A.S.data.settings.themePreset, 'custom');
t.eq('isFullPalette(custom) = false', A.isFullPalette('custom'), false);

t.done();
