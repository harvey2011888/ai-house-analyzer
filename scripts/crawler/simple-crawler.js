/**
 * 简单爬虫 - 使用 Node.js 内置 https 模块
 * 避免依赖安装问题
 */

const https = require('https');
const zlib = require('zlib');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// 确保输出目录存在
const outputDir = path.join(__dirname, '..', '..', 'data', 'crawled');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * 发送 HTTP GET 请求
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',  // 支持压缩
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      }
    };

    https.get(url, options, (res) => {
      let data = [];

      // 检查是否需要解压
      const encoding = res.headers['content-encoding'];
      let stream = res;

      if (encoding === 'gzip') {
        stream = res.pipe(zlib.createGunzip());
      } else if (encoding === 'deflate') {
        stream = res.pipe(zlib.createInflate());
      }

      stream.on('data', (chunk) => {
        data.push(chunk);
      });

      stream.on('end', () => {
        const buffer = Buffer.concat(data);
        resolve(buffer.toString('utf8'));
      });

      stream.on('error', (err) => {
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 爬取单个区域的小区列表
 */
async function crawlDistrict(districtCode, districtName, maxPages = 2) {
  console.log(`\n开始爬取 ${districtName}(${districtCode})...`);
  const communities = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = `https://sz.ke.com/xiaoqu/${districtCode}/pg${page}/`;
    console.log(`  爬取第 ${page} 页: ${url}`);

    try {
      const html = await httpGet(url);

      // 检查内容是否为空
      if (!html || html.length < 100) {
        console.log(`  返回内容为空或太短 (${html?.length} 字符)`);
        fs.writeFileSync(path.join(outputDir, `debug-${districtCode}-${page}.html`), html || 'empty');
        continue;
      }

      const $ = cheerio.load(html);

      // 检查是否被拦截
      const title = $('title').text();
      console.log(`  页面标题: ${title}`);

      if (title.includes('登录') || title.includes('验证') || title.includes('passport')) {
        console.error(`  ❌ 被拦截: ${title}`);
        fs.writeFileSync(path.join(outputDir, `debug-${districtCode}-${page}.html`), html);
        break;
      }

      // 尝试找到小区列表 - 贝壳找房的选择器
      const selectors = [
        '.xiaoquListItem',
        '.listContent li',
        '[data-component="list"] li',
        '.xiaoquListItemWrap',
        '.info',
        'ul li'  // 更通用的选择器
      ];

      let listItems = null;
      let usedSelector = '';

      for (const selector of selectors) {
        const items = $(selector);
        if (items.length > 0) {
          listItems = items;
          usedSelector = selector;
          console.log(`  使用选择器: ${selector}, 找到 ${items.length} 个元素`);
          break;
        }
      }

      if (!listItems || listItems.length === 0) {
        console.log('  未找到匹配的选择器，保存页面内容以供分析');
        fs.writeFileSync(path.join(outputDir, `debug-${districtCode}-${page}.html`), html);
        console.log(`  已保存调试文件: debug-${districtCode}-${page}.html`);
        continue;
      }

      listItems.each((index, element) => {
        const $el = $(element);

        const nameEl = $el.find('.title a, .xiaoquListItemName a, h3 a, a').first();
        const name = nameEl.text().trim();
        const href = nameEl.attr('href') || '';
        const id = href.match(/xiaoqu\/(\d+)\//)?.[1] || '';

        const priceEl = $el.find('.totalPrice span, .xiaoquListItemPrice span, .price').first();
        const priceText = priceEl.text().trim();
        const price = parseInt(priceText.replace(/[^\d]/g, '')) || 0;

        if (name && id) {
          communities.push({
            id,
            name,
            price,
            district: districtName,
            url: `https://sz.ke.com/xiaoqu/${id}/`,
            crawlTime: new Date().toISOString()
          });
        }
      });

      console.log(`  成功解析 ${communities.length} 个小区`);

      // 延迟后继续
      if (page < maxPages) {
        const waitTime = 2000 + Math.random() * 3000;
        console.log(`  等待 ${Math.round(waitTime)}ms...`);
        await delay(waitTime);
      }

    } catch (error) {
      console.error(`  请求失败: ${error.message}`);
    }
  }

  console.log(`${districtName} 完成，共 ${communities.length} 个小区`);
  return communities;
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('贝壳找房简单爬虫');
  console.log('========================================\n');

  // 深圳各区域
  const districts = [
    { name: '福田', code: 'futian' },
    { name: '南山', code: 'nanshan' },
    { name: '罗湖', code: 'luohu' },
    { name: '宝安', code: 'baoan' },
    { name: '龙岗', code: 'longgang' },
    { name: '龙华', code: 'longhua' }
  ];

  const allCommunities = [];

  // 只爬取前3个区域，每区域2页
  for (const district of districts.slice(0, 3)) {
    const communities = await crawlDistrict(district.code, district.name, 2);
    allCommunities.push(...communities);

    // 区域间延迟
    if (district !== districts[2]) {
      await delay(3000);
    }
  }

  // 保存数据
  const output = {
    meta: {
      total: allCommunities.length,
      crawlTime: new Date().toISOString(),
      source: '贝壳找房'
    },
    data: allCommunities
  };

  const outputPath = path.join(outputDir, 'communities-simple.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

  console.log('\n========================================');
  console.log(`爬取完成！总计 ${allCommunities.length} 个小区`);
  console.log(`数据已保存: ${outputPath}`);
  console.log('========================================');

  return allCommunities;
}

// 运行
main().catch(console.error);
