/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pages = [
  { name: 'home', url: '/' },
  { name: 'posts', url: '/bai-viet' },
  { name: 'about', url: '/ve-chung-toi' },
  { name: 'contact', url: '/lien-he' },
];

const reportDir = path.join(__dirname, 'perf-reports');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir);
}

async function runLighthouse() {
  console.log('Bắt đầu kiểm tra hiệu năng cho các trang...');
  
  for (const page of pages) {
    const reportPath = path.join(reportDir, `${page.name}-report.html`);
    const cmd = `npx lighthouse http://localhost:3000${page.url} --output html --output json --output-path ${reportPath} --chrome-flags="--headless"`;
    
    console.log(`Đang kiểm tra trang: ${page.name} (${page.url})...`);
    try {
      execSync(cmd, { stdio: 'inherit' });
      console.log(`✅ Đã xong báo cáo cho ${page.name}`);
    } catch (error) {
      console.error(`❌ Lỗi khi kiểm tra trang ${page.name}:`, error.message);
    }
  }
  
  console.log('\n--- TẤT CẢ ĐÃ HOÀN THÀNH ---');
  console.log(`Báo cáo chi tiết nằm trong thư mục: ${reportDir}`);
}

runLighthouse();
