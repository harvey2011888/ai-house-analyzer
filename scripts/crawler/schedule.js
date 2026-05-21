/**
 * 定时任务配置
 * 使用 node-cron 实现定时数据更新
 */

const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

// 爬虫脚本路径
const CRAWLER_SCRIPT = path.join(__dirname, 'index.js');

// 日志文件路径
const LOG_FILE = path.join(__dirname, '..', '..', 'data', 'crawled', 'schedule.log');

/**
 * 写入日志
 * @param {string} message 日志消息
 */
async function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(message);
  
  try {
    await fs.appendFile(LOG_FILE, logMessage, 'utf8');
  } catch (error) {
    console.error('写入日志失败:', error.message);
  }
}

/**
 * 执行爬虫任务
 * @param {string} mode 执行模式
 */
async function runCrawler(mode = '--full') {
  await log(`开始执行爬虫任务: ${mode}`);
  
  return new Promise((resolve, reject) => {
    const command = `node "${CRAWLER_SCRIPT}" ${mode}`;
    
    exec(command, { cwd: path.join(__dirname, '..', '..') }, async (error, stdout, stderr) => {
      if (error) {
        await log(`任务执行失败: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        await log(`警告: ${stderr}`);
      }
      
      await log('任务执行完成');
      await log(stdout);
      resolve();
    });
  });
}

/**
 * 启动定时任务
 */
function startScheduler() {
  console.log('========================================');
  console.log('贝壳找房数据定时更新服务');
  console.log('========================================\n');

  // 每周日凌晨 2:00 执行全量更新
  cron.schedule('0 2 * * 0', async () => {
    console.log('\n>>> 执行定时任务: 全量更新 <<<\n');
    try {
      await runCrawler('--full');
    } catch (error) {
      console.error('全量更新失败:', error.message);
    }
  });

  // 每天凌晨 3:00 执行增量更新（成交记录）
  cron.schedule('0 3 * * *', async () => {
    console.log('\n>>> 执行定时任务: 增量更新 <<<\n');
    try {
      await runCrawler('--transaction');
    } catch (error) {
      console.error('增量更新失败:', error.message);
    }
  });

  console.log('定时任务已启动:');
  console.log('  - 每周日 02:00: 全量更新');
  console.log('  - 每天 03:00: 增量更新（成交记录）');
  console.log(`\n日志文件: ${LOG_FILE}`);
  console.log('\n按 Ctrl+C 停止服务\n');
}

// 如果直接运行此脚本
if (require.main === module) {
  startScheduler();
}

module.exports = {
  startScheduler,
  runCrawler,
  log
};
