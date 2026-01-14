/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, 'perf-reports');
const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.report.json'));

files.forEach(file => {
  const filePath = path.join(reportsDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  console.log(`\n=== ISSUES FOR ${file.replace('-report.report.json', '').toUpperCase()} ===`);
  
  const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
  
  categories.forEach(catId => {
    const category = data.categories[catId];
    if (!category) return;
    
    const failedAudits = category.auditRefs
      .filter(ref => {
        const audit = data.audits[ref.id];
        return audit && audit.score !== null && audit.score < 0.9;
      })
      .map(ref => {
        const audit = data.audits[ref.id];
        return {
          id: ref.id,
          title: audit.title,
          score: audit.score,
          displayValue: audit.displayValue
        };
      });
      
    if (failedAudits.length > 0) {
      console.log(`\n--- ${catId.toUpperCase()} (Score: ${Math.round(category.score * 100)}) ---`);
      failedAudits.forEach(a => {
        console.log(`- [${a.score}] ${a.title}: ${a.displayValue || ''}`);
      });
    }
  });
});
