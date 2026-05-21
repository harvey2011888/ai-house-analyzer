/**
 * HTTP 请求爬虫
 * 使用 axios + cheerio 直接请求页面
 * 避免 Puppeteer 被检测
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

// 创建 axios 实例
const httpClient = axios.create({
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
  }
});

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 获取随机延迟
 */
function getRandomDelay() {
  const { min, max } = config.crawler.delay;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 爬取小区列表
 */
async function crawlCommunityList(district, page = 1) {
  const url = `https://sz.ke.com/xiaoqu/${district}/pg${page}/`;
  console.log(`爬取: ${url}`);

  try {
    const response = await httpClient.get(url);
    const $ = cheerio.load(response.data);

    // 检查是否被拦截
    const title = $('title').text();
    if (title.includes('登录') || title.includes('验证')) {
      console.error(`❌ 被拦截: ${title}`);
      return { communities: [], hasMore: false };
    }

    const communities = [];

    // 尝试多种选择器
    const selectors = [
      '.xiaoquListItem',
      '.listContent li',
      '[data-component="list"] li',
      '.xiaoquListItemWrap'
    ];

    let foundSelector = null;
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        foundSelector = selector;
        console.log(`  使用选择器: ${selector}, 找到 ${elements.length} 个元素`);
        break;
      }
    }

    if (!foundSelector) {
      console.log('  未找到匹配的选择器，保存页面内容以供分析');
      await fs.mkdir(config.output.baseDir, { recursive: true });
      await fs.writeFile(
        path.join(config.output.baseDir, `debug-${district}-${page}.html`),
        response.data
      );
      return { communities: [], hasMore: false };
    }

    $(foundSelector).each((index, element) => {
      const $el = $(element);

      // 提取小区信息
      const nameEl = $el.find('.title a, .xiaoquListItemName a, h3 a').first();
      const name = nameEl.text().trim();
      const href = nameEl.attr('href') || '';
      const id = href.match(/xiaoqu\/(\d+)\//)?.[1] || '';

      const priceEl = $el.find('.totalPrice span, .xiaoquListItemPrice span, .totalPrice').first();
      const priceText = priceEl.text().trim();
      const price = parseInt(priceText.replace(/[^\d]/g, '')) || 0;

      const districtEl = $el.find('.positionInfo a').eq(0);
      const districtName = districtEl.text().trim();

      const bizCircleEl = $el.find('.positionInfo a').eq(1);
      const bizCircle = bizCircleEl.text().trim();

      const tags = [];
      $el.find('.tagList span, .tag span').each((i, tag) => {
        tags.push($(tag).text().trim());
      });

      if (name && id) {
        communities.push({
          id,
          name,
          price,
          district: districtName,
          bizCircle,
          tags,
          url: `https://sz.ke.com/xiaoqu/${id}/`,
          crawlTime: new Date().toISOString()
        });
      }
    });

    // 检查是否有下一页
    const nextPage = $('.pagination .next, .pagination a:contains("下一页")');
    const hasMore = nextPage.length > 0 && !nextPage.hasClass('disabled');

    console.log(`  成功解析 ${communities.length} 个小区`);

    return { communities, hasMore };

  } catch (error) {
    console.error(`  请求失败: ${error.message}`);
    return { communities: [], hasMore: false };
  }
}

/**
 * 爬取指定区域的所有小区
 */
async function crawlDistrict(districtCode, districtName, limit = null) {
  console.log(`\n开始爬取 ${districtName}(${districtCode}) 的小区列表...`);

  const allCommunities = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await crawlCommunityList(districtCode, page);

    if (result.communities.length === 0) {
      console.log('  未获取到数据，停止爬取');
      break;
    }

    allCommunities.push(...result.communities);
    hasMore = result.hasMore;

    console.log(`  第 ${page} 页完成，累计 ${allCommunities.length} 个小区`);

    // 检查限制
    if (limit && allCommunities.length >= limit) {
      console.log(`  已达到限制数量 ${limit}`);
      break;
    }

    // 延迟后继续
    if (hasMore) {
      const waitTime = getRandomDelay();
      console.log(`  等待 ${waitTime}ms...`);
      await delay(waitTime);
    }

    page++;

    // 安全限制：最多爬取100页
    if (page > 100) {
      console.log('  达到最大页数限制');
      break;
    }
  }

  console.log(`${districtName} 爬取完成，共 ${allCommunities.length} 个小区`);
  return allCommunities;
}

/**
 * 保存数据
 */
async function saveData(data, filename) {
  const filepath = path.join(config.output.baseDir, filename);
  await fs.mkdir(config.output.baseDir, { recursive: true });

  const output = {
    meta: {
      total: data.length,
      crawlTime: new Date().toISOString(),
      source: config.target.name
    },
    data
  };

  await fs.writeFile(filepath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`数据已保存: ${filepath}`);
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('贝壳找房 HTTP 爬虫');
  console.log('========================================\n');

  // 创建输出目录
  await fs.mkdir(config.output.baseDir, { recursive: true });

  // 爬取所有区域
  const allCommunities = [];

  for (const district of config.districts) {
    const communities = await crawlDistrict(district.code, district.name, 50); // 每个区域限制50个
    allCommunities.push(...communities);

    // 区域间延迟
    if (district !== config.districts[config.districts.length - 1]) {
      const waitTime = getRandomDelay() * 2;
      console.log(`\n区域间等待 ${waitTime}ms...`);
      await delay(waitTime);
    }
  }

  // 保存数据
  await saveData(allCommunities, 'communities-http.json');

  console.log('\n========================================');
  console.log(`爬取完成！总计 ${allCommunities.length} 个小区`);
  console.log('========================================');
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  crawlCommunityList,
  crawlDistrict,
  saveData
};
