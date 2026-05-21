/**
 * 贝壳找房数据爬取入口
 * 使用方法: node scripts/crawler/index.js [options]
 */

const CommunityListCrawler = require('./community-list-crawler');
const DetailCrawler = require('./detail-crawler');
const TransactionCrawler = require('./transaction-crawler');
const DataMerger = require('./data-merger');
const config = require('./config');

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  full: args.includes('--full'),
  list: args.includes('--list'),
  detail: args.includes('--detail'),
  transaction: args.includes('--transaction'),
  merge: args.includes('--merge'),
  district: null,
  limit: null,
  headless: !args.includes('--headed')
};

// 解析区域参数
const districtIndex = args.indexOf('--district');
if (districtIndex !== -1 && args[districtIndex + 1]) {
  options.district = args[districtIndex + 1];
}

// 解析限制数量参数
const limitIndex = args.indexOf('--limit');
if (limitIndex !== -1 && args[limitIndex + 1]) {
  options.limit = parseInt(args[limitIndex + 1]);
}

// 显示帮助
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
贝壳找房数据爬取工具

使用方法:
  node scripts/crawler/index.js [options]

选项:
  --full              完整流程：列表+详情+成交+合并
  --list              仅爬取小区列表
  --detail            仅爬取小区详情
  --transaction       仅爬取成交记录
  --merge             仅合并数据
  --district <name>   仅爬取指定区域（如：南山、福田）
  --limit <number>    限制爬取数量（用于测试）
  --headed            显示浏览器窗口（调试用）
  --help, -h          显示帮助

示例:
  # 完整流程（推荐）
  node scripts/crawler/index.js --full

  # 仅爬取小区列表
  node scripts/crawler/index.js --list

  # 仅爬取南山区
  node scripts/crawler/index.js --list --district 南山

  # 测试模式（仅爬取10个小区）
  node scripts/crawler/index.js --full --limit 10

  # 仅合并数据
  node scripts/crawler/index.js --merge
`);
  process.exit(0);
}

// 主函数
async function main() {
  console.log('========================================');
  console.log('贝壳找房数据爬取工具');
  console.log('========================================\n');

  // 如果没有指定任何操作，默认执行完整流程
  if (!options.list && !options.detail && !options.transaction && !options.merge) {
    options.full = true;
  }

  try {
    // 1. 爬取小区列表
    if (options.full || options.list) {
      console.log('\n>>> 阶段 1: 爬取小区列表 <<<\n');
      const listCrawler = new CommunityListCrawler({ headless: options.headless });

      if (options.district) {
        await listCrawler.crawlByName(options.district);
      } else {
        await listCrawler.crawl();
      }
    }

    // 2. 爬取小区详情
    if (options.full || options.detail) {
      console.log('\n>>> 阶段 2: 爬取小区详情 <<<\n');
      const detailCrawler = new DetailCrawler({ headless: options.headless });
      await detailCrawler.crawl(options.limit);
    }

    // 3. 爬取成交记录
    if (options.full || options.transaction) {
      console.log('\n>>> 阶段 3: 爬取成交记录（最近半年）<<<\n');
      const transactionCrawler = new TransactionCrawler({ headless: options.headless });
      await transactionCrawler.crawl(options.limit);
    }

    // 4. 合并数据
    if (options.full || options.merge) {
      console.log('\n>>> 阶段 4: 合并数据 <<<\n');
      const merger = new DataMerger();
      await merger.merge();
    }

    console.log('\n========================================');
    console.log('✓ 所有任务完成！');
    console.log('========================================');
    console.log(`数据保存在: ${config.output.baseDir}`);
    console.log(`小程序数据: data/preloaded-data.js`);
    console.log('========================================\n');

  } catch (error) {
    console.error('\n========================================');
    console.error('✗ 任务失败:', error.message);
    console.error('========================================');
    console.error(error.stack);
    process.exit(1);
  }
}

// 执行主函数
main();
