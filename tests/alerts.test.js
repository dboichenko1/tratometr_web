/* Спидометр трат и месячный лимит. Порт spending_alert_test / limit_alert_test. */
'use strict';
const { loadApp, makeAsserts } = require('./_harness');
const A = loadApp();
const t = makeAsserts('Уведомления: перерасход дня и месячный лимит');

const now = new Date(2026, 5, 10, 15, 30);          // 2026-06-10 15:30
const D = (y, mo, d) => new Date(y, mo - 1, d, 12, 0).getTime();
const ex = (amount, ms) => ({ amount, date: ms });

// История по 100 за N прошедших дней, начиная с (today-1).
function hist(n){ const a=[]; for (let i=1;i<=n;i++) a.push(ex(100, new Date(2026,5,10-i,12,0).getTime())); return a; }
const firstOf = (arr)=> Math.min.apply(null, arr.map(x=>x.date));

// 1) Пустая история → неактивно
let d = A.evaluateSpendingAlert(now, [], null, null, 0.30);
t.eq('пусто: active=false', d.active, false);
t.eq('пусто: shouldNotify=false', d.shouldNotify, false);
t.eq('пусто: reason=no_history', d.reason, 'no_history');

// 2) Меньше 7 дней истории → неактивно даже при большой трате сегодня
let w2 = [ex(100,D(2026,6,9)), ex(100,D(2026,6,8)), ex(100,D(2026,6,7)), ex(500,D(2026,6,10))];
d = A.evaluateSpendingAlert(now, w2, D(2026,6,7), null, 0.30);
t.eq('<7 дней: active=false', d.active, false);
t.eq('<7 дней: reason=history_too_short', d.reason, 'history_too_short');

// 3) Ровно 7 дней → фича активна
let w3 = hist(7);
d = A.evaluateSpendingAlert(now, w3, firstOf(w3), null, 0.30);
t.eq('ровно 7 дней: active=true', d.active, true);

// 4) Ровно +30% — срабатывает; на копейку ниже — нет
let base = hist(10);
let A_ = A.evaluateSpendingAlert(now, base.concat([ex(130, D(2026,6,10))]), firstOf(base), null, 0.30);
t.close('порог: baseline≈100', A_.baseline, 100, 1e-6);
t.eq('порог 130: shouldNotify=true', A_.shouldNotify, true);
t.eq('порог 130: reason=over_threshold', A_.reason, 'over_threshold');
let B_ = A.evaluateSpendingAlert(now, base.concat([ex(129.99, D(2026,6,10))]), firstOf(base), null, 0.30);
t.eq('порог 129.99: shouldNotify=false', B_.shouldNotify, false);
t.eq('порог 129.99: reason=within_threshold', B_.reason, 'within_threshold');

// 5) Выброс не раздувает базу (усечённое среднее)
let big = []; for (let i=1;i<=29;i++) big.push(ex(100, new Date(2026,5,10-i,12,0).getTime()));
big.push(ex(5000, new Date(2026,5,10-30,12,0).getTime()));   // 30 дней назад
d = A.evaluateSpendingAlert(now, big.concat([ex(200, D(2026,6,10))]), firstOf(big), null, 0.30);
t.close('выброс: baseline≈100 (не ~263)', d.baseline, 100, 1);
t.eq('выброс: shouldNotify=true', d.shouldNotify, true);
t.close('выброс: percentAbove=100', d.percentAbove, 100, 1e-6);

// 6) Не чаще одного уведомления в день
let h6 = hist(10);
d = A.evaluateSpendingAlert(now, h6.concat([ex(300, D(2026,6,10))]), firstOf(h6), new Date(2026,5,10), 0.30);
t.eq('уже уведомляли: active=true', d.active, true);
t.eq('уже уведомляли: shouldNotify=false', d.shouldNotify, false);
t.eq('уже уведомляли: reason=already_notified_today', d.reason, 'already_notified_today');

// ── Лимит месяца ──
let l = A.evaluateLimitAlert(now, 1000, 0, null);
t.eq('лимит не задан: active=false', l.active, false);
t.eq('лимит не задан: shouldNotify=false', l.shouldNotify, false);
l = A.evaluateLimitAlert(now, 5000, 10000, null);
t.eq('ниже лимита: active=true', l.active, true);
t.eq('ниже лимита: shouldNotify=false', l.shouldNotify, false);
t.close('ниже лимита: ratio=0.5', l.ratio, 0.5, 1e-9);
t.close('ниже лимита: percent=50', l.percentOfLimit, 50, 1e-9);
l = A.evaluateLimitAlert(now, 10000, 10000, null);
t.eq('равно лимиту: shouldNotify=true', l.shouldNotify, true);
t.close('равно лимиту: percent=100', l.percentOfLimit, 100, 1e-9);
l = A.evaluateLimitAlert(now, 12000, 10000, null);
t.eq('выше лимита: shouldNotify=true', l.shouldNotify, true);
t.close('выше лимита: percent=120', l.percentOfLimit, 120, 1e-9);
l = A.evaluateLimitAlert(now, 12000, 10000, new Date(2026,5,10));
t.eq('лимит уже уведомлён сегодня: shouldNotify=false', l.shouldNotify, false);

t.done();
