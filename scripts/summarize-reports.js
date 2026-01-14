/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, 'perf-reports');
const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.report.json'));

console.log('--- Performance Summary (P/A/B/S) ---');
files.forEach(file => {
  const filePath = path.join(reportsDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const categories = data.categories;
  
  const p = categories.performance ? Math.round(categories.performance.score * 100) : 'N/A';
  const a = categories.accessibility ? Math.round(categories.accessibility.score * 100) : 'N/A';
  const b = categories['best-practices'] ? Math.round(categories['best-practices'].score * 100) : 'N/A';
  const s = categories.seo ? Math.round(categories.seo.score * 100) : 'N/A';
  
  console.log(`${file.replace('-report.report.json', '').padEnd(10)}: P:${p} A:${a} B:${b} S:${s}`);
});
