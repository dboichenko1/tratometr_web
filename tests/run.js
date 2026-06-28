/* Запуск всех тестов веб-версии:  node tests/run.js
   Прогоняет каждый *.test.js в этой папке и сводит результат. */
'use strict';
const { execSync } = require('child_process');
const fs = require('fs'), path = require('path');
const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.test.js')).sort();
let failed = 0;
for (const f of files) {
  console.log('\n──────── ' + f + ' ────────');
  try { execSync('node ' + JSON.stringify(path.join(dir, f)), { stdio: 'inherit' }); }
  catch (_) { failed++; }
}
console.log('\n' + (failed ? ('❌ Провалено файлов: ' + failed + ' из ' + files.length)
                            : ('✅ Все тест-файлы прошли (' + files.length + ')')));
process.exit(failed ? 1 : 0);
