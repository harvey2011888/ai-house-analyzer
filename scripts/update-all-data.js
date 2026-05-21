/**
 * 数据更新脚本
 * 一键更新所有数据文件
 * 
 * 使用方法：
 * node scripts/update-all-data.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('========================================');
console.log('深圳房产数据更新工具');
console.log('========================================\n');

const steps = [];

// 步骤1：生成新数据
steps.push({
  name: '生成模拟数据',
  command: 'node scripts/crawler/generate-mock-data.js',
  cwd: process.cwd()
});

// 步骤2：复制数据到 data/ 目录
steps.push({
  name: '复制数据到项目目录',
  action: () => {
    const sourceDir = path.join(process.cwd(), 'data', 'crawled');
    const targetDir = path.join(process.cwd(), 'data');
    
    const files = ['communities.json', 'transactions.json', 'preloaded-data.js'];
    files.forEach(file => {
      const src = path.join(sourceDir, file);
      const dest = path.join(targetDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`  ✓ 复制: ${file}`);
      }
    });
    return true;
  }
});

// 步骤3：转换 transactions.json 为 JS 模块
steps.push({
  name: '转换成交数据格式',
  command: 'node scripts/crawler/convert-json-to-js.js',
  cwd: process.cwd()
});

// 步骤4：复制 transactions-data.js 到 utils/
steps.push({
  name: '更新 utils/transactions-data.js',
  action: () => {
    const src = path.join(process.cwd(), 'data', 'transactions-data.js');
    const dest = path.join(process.cwd(), 'utils', 'transactions-data.js');
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log('  ✓ 已更新 utils/transactions-data.js');
    }
    return true;
  }
});

// 步骤5：复制 preloaded-data.js 到 utils/
steps.push({
  name: '更新 utils/preloaded-data.js',
  action: () => {
    const src = path.join(process.cwd(), 'data', 'preloaded-data.js');
    const dest = path.join(process.cwd(), 'utils', 'preloaded-data.js');
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log('  ✓ 已更新 utils/preloaded-data.js');
    }
    return true;
  }
});

// 执行所有步骤
async function runUpdate() {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`\n【步骤 ${i + 1}/${steps.length}】${step.name}...`);
    
    try {
      if (step.command) {
        execSync(step.command, { 
          cwd: step.cwd,
          stdio: 'inherit'
        });
      } else if (step.action) {
        step.action();
      }
      console.log(`  ✓ 完成`);
    } catch (error) {
      console.error(`  ✗ 失败:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('\n========================================');
  console.log('数据更新完成！');
  console.log('========================================');
  console.log('\n已更新的文件:');
  console.log('  - data/communities.json');
  console.log('  - data/transactions.json');
  console.log('  - data/preloaded-data.js');
  console.log('  - utils/preloaded-data.js');
  console.log('  - utils/transactions-data.js');
  console.log('\n使用新数据的地方:');
  console.log('  ✓ 首页热门小区');
  console.log('  ✓ 智能推荐');
  console.log('  ✓ 本地推荐算法');
  console.log('========================================');
}

runUpdate();
