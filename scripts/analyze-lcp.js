/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const reportFile = process.argv[2] || path.join(process.cwd(), 'scripts', 'perf-reports', 'home-report.report.json');
const reportPath = path.isAbsolute(reportFile) ? reportFile : path.join(process.cwd(), reportFile);

if (!fs.existsSync(reportPath)) {
  console.error(`Report file not found: ${reportPath}`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// Cố gắng tìm audit cụ thể cho phần tử LCP
const lcpElementAudit = report.audits['largest-contentful-paint-element'];
const lcpAudit = report.audits['largest-contentful-paint'];

console.log('--- LCP Summary ---');
console.log('LCP Score:', lcpAudit.score);
console.log('LCP Value:', (lcpAudit.numericValue / 1000).toFixed(2), 's');

if (lcpElementAudit && lcpElementAudit.details && lcpElementAudit.details.items) {
  console.log('\n--- LCP Element Details ---');
  lcpElementAudit.details.items.forEach((item, index) => {
    console.log(`Item ${index + 1}:`);
    if (item.node) {
      console.log('  Element Selector:', item.node.selector);
      console.log('  Snippet:', item.node.snippet);
    }
  });
}

// LCP Breakdown (Insights)
const lcpBreakdown = report.audits['lcp-breakdown-insight'];
if (lcpBreakdown && lcpBreakdown.details && lcpBreakdown.details.items) {
    console.log('\n--- LCP Breakdown ---');
    // Tìm item chứa table breakdown
    const tableItem = lcpBreakdown.details.items.find(item => item.type === 'table');
    if (tableItem && tableItem.items) {
        tableItem.items.forEach(subItem => {
            console.log(`  ${subItem.label}: ${subItem.duration.toFixed(2)} ms`);
        });
    }

    // Tìm item chứa node LCP
    const nodeItem = lcpBreakdown.details.items.find(item => item.type === 'node');
    if (nodeItem) {
        console.log('\n--- LCP Element ---');
        console.log('  Selector:', nodeItem.selector);
        console.log('  Snippet:', nodeItem.snippet);
    }
}

const networkRequests = report.audits['network-requests'].details.items;
console.log('--- Top Network Requests ---');
networkRequests
  .sort((a, b) => b.transferSize - a.transferSize)
  .slice(0, 10)
  .forEach(req => {
    console.log(`- ${req.url} (${(req.transferSize / 1024).toFixed(2)} KB)`);
  });
