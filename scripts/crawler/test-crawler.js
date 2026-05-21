/**
 * 测试爬虫 - 简化版
 * 用于验证爬虫功能是否正常工作
 */

const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

// 配置
const CONFIG = {
  baseUrl: 'sz.ke.com',
  district: 'nanshan', // 南山区
  outputDir: path.join(__dirname, '..', '..', 'data', 'crawled')
};

/**
 * 发送HTTP请求
 */
function request(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: CONFIG.baseUrl,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
    req.end();
  });
}

/**
 * 解析小区列表
 */
function parseCommunityList(html) {
  const $ = cheerio.load(html);
  const communities = [];

  $('.xiaoquListItem').each((i, elem) => {
    const $item = $(elem);
    const $title = $item.find('.title a');
    const name = $title.text().trim();
    const href = $title.attr('href');
    const id = href ? href.match(/xiaoqu\/(\d+)\//)?.[1] : null;
    const priceText = $item.find('.totalPrice span').text().trim();
    const district = $item.find('.positionInfo a').eq(0).text().trim();

    if (id && name) {
      communities.push({
        id: `bk_${id}`,
        name,
        district,
        avgPrice: parseInt(priceText) || 0,
        source: '贝壳找房',
        crawlTime: new Date().toISOString()
      });
    }
  });

  return communities;
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('贝壳找房爬虫测试');
  console.log('========================================\n');

  try {
    console.log('正在爬取南山区小区列表...');
    const html = await request(`/xiaoqu/${CONFIG.district}/`);
    
    console.log('解析数据中...');
    const communities = parseCommunityList(html);

    console.log(`\n✓ 成功爬取 ${communities.length} 个小区\n`);

    // 显示前10个
    console.log('前10个小区:');
    communities.slice(0, 10).forEach((c, i) => {
      console.log(`${i + 1}. ${c.name} - ${c.district} - ${c.avgPrice}元/㎡`);
    });

    // 保存数据
    const outputPath = path.join(CONFIG.outputDir, 'test-communities.json');
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify({
      meta: {
        total: communities.length,
        crawlTime: new Date().toISOString(),
        source: '贝壳找房'
      },
      data: communities
    }, null, 2));

    console.log(`\n✓ 数据已保存: ${outputPath}`);

  } catch (error) {
    console.error('\n✗ 爬取失败:', error.message);
    console.error('\n可能原因:');
    console.error('1. 网络连接问题');
    console.error('2. 贝壳找房网站结构变更');
    console.error('3. 访问频率限制');
    process.exit(1);
  }
}

main();
