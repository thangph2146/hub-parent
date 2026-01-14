/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const dir = './scripts/perf-reports';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.report.json'));

console.log('--- KẾT QUẢ KIỂM TRA HIỆU NĂNG ---');
files.forEach(f => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f)));
    const perf = data.categories.performance.score * 100;
    const lcp = data.audits['largest-contentful-paint'].numericValue / 1000;
    const cls = data.audits['cumulative-layout-shift'].numericValue;
    const tbt = data.audits['total-blocking-time'].numericValue;
    console.log(`Trang: ${f.split('-')[0].padEnd(10)} | Điểm: ${perf.toFixed(0).padStart(3)} | LCP: ${lcp.toFixed(2)}s | CLS: ${cls.toFixed(3)} | TBT: ${tbt.toFixed(0)}ms`);
  } catch {
    // skip
  }
});
