/**
 * 小区详情爬虫
 * 爬取贝壳找房小区详情页面
 */

const BaseCrawler = require('./base-crawler');
const config = require('./config');
const cheerio = require('cheerio');
const antiDetect = require('./anti-detect');
const fs = require('fs').promises;
const path = require('path');

class DetailCrawler extends BaseCrawler {
  constructor(options = {}) {
    super(options);
    this.communities = [];
    this.currentIndex = 0;
  }

  /**
   * 加载小区列表
   */
  async loadCommunities() {
    const filepath = config.output.communities;
    try {
      const content = await fs.readFile(filepath, 'utf8');
      const data = JSON.parse(content);
      this.communities = data.data || [];
      console.log(`加载了 ${this.communities.length} 个小区`);
    } catch (error) {
      console.error('加载小区列表失败:', error.message);
      throw new Error('请先运行小区列表爬取');
    }
  }

  /**
   * 解析小区详情页面
   * @param {string} html HTML内容
   * @param {Object} community 基础小区信息
   * @returns {Object} 完整小区信息
   */
  parse(html, community) {
    const $ = cheerio.load(html);
    const selectors = config.selectors.communityDetail;

    try {
      // 获取详细信息
      const name = $(selectors.name).text().trim() || community.name;
      const address = $(selectors.address).text().trim();
      const priceText = $(selectors.price).text().trim();
      const avgPrice = antiDetect.parsePrice(priceText) || community.avgPrice;

      // 从信息项中提取数据
      const infoItems = {};
      $('.xiaoquInfoItem').each((i, elem) => {
        const label = $(elem).find('.xiaoquInfoLabel').text().trim();
        const content = $(elem).find('.xiaoquInfoContent').text().trim();
        infoItems[label] = content;
      });

      // 解析建筑年代
      const buildYear = this.parseBuildYear(infoItems['建筑年代']);

      // 解析总户数
      const totalHouseholds = this.parseHouseholds(infoItems['房屋总数']);

      // 解析户型分布
      const layoutTypes = this.parseLayoutTypes(infoItems['户型分布']);

      // 解析平均面积
      const avgArea = this.parseAvgArea(infoItems['户型分布']);

      // 获取地铁信息
      const subway = infoItems['地铁'] || '';

      // 获取物业类型
      const propertyType = infoItems['物业类型'] || '住宅';

      // 尝试从页面获取经纬度（如果有地图）
      const coordinates = this.extractCoordinates(html);

      return {
        ...community,
        name,
        address: address || community.address,
        avgPrice,
        buildYear,
        totalHouseholds,
        layoutTypes,
        avgArea,
        subway,
        propertyType,
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
        detailCrawled: true,
        detailCrawlTime: new Date().toISOString()
      };
    } catch (error) {
      console.error(`解析详情失败: ${error.message}`);
      return community;
    }
  }

  /**
   * 解析建筑年代
   * @param {string} text 文本
   * @returns {number} 年份
   */
  parseBuildYear(text) {
    if (!text) return null;
    const match = text.match(/(\d{4})/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * 解析总户数
   * @param {string} text 文本
   * @returns {number} 户数
   */
  parseHouseholds(text) {
    if (!text) return null;
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * 解析户型分布
   * @param {string} text 文本
   * @returns {Array} 户型列表
   */
  parseLayoutTypes(text) {
    if (!text) return [];
    const layouts = [];
    if (text.includes('1')) layouts.push('1室');
    if (text.includes('2')) layouts.push('2室');
    if (text.includes('3')) layouts.push('3室');
    if (text.includes('4')) layouts.push('4室');
    if (text.includes('5')) layouts.push('5室+');
    return layouts.length > 0 ? layouts : ['2室', '3室'];
  }

  /**
   * 解析平均面积
   * @param {string} text 文本
   * @returns {number} 面积
   */
  parseAvgArea(text) {
    if (!text) return null;
    // 尝试匹配 "平均面积 85㎡" 格式
    const match = text.match(/平均面积\s*(\d+)/);
    if (match) return parseInt(match[1]);

    // 尝试匹配面积范围 "80-120㎡"
    const rangeMatch = text.match(/(\d+)-(\d+)/);
    if (rangeMatch) {
      return Math.round((parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2);
    }

    return null;
  }

  /**
   * 从HTML中提取经纬度
   * @param {string} html HTML内容
   * @returns {Object} 经纬度
   */
  extractCoordinates(html) {
    try {
      // 尝试从页面脚本中提取坐标
      const lngMatch = html.match(/longitude["']?\s*[:=]\s*["']?([\d.]+)/);
      const latMatch = html.match(/latitude["']?\s*[:=]\s*["']?([\d.]+)/);

      if (lngMatch && latMatch) {
        return {
          longitude: parseFloat(lngMatch[1]),
          latitude: parseFloat(latMatch[1])
        };
      }
    } catch (e) {
      console.warn('提取坐标失败');
    }

    return { longitude: null, latitude: null };
  }

  /**
   * 爬取单个小区详情
   * @param {Object} community 小区信息
   * @returns {Promise<Object>} 完整小区信息
   */
  async crawlCommunity(community) {
    const url = config.urls.communityDetail(community.id.replace('bk_', ''));

    try {
      console.log(`[${this.currentIndex + 1}/${this.communities.length}] 爬取: ${community.name}`);
      const html = await this.fetch(url);
      const detail = this.parse(html, community);
      this.currentIndex++;
      return detail;
    } catch (error) {
      console.error(`爬取详情失败 ${community.name}: ${error.message}`);
      this.currentIndex++;
      return community;
    }
  }

  /**
   * 爬取所有小区详情
   * @param {number} limit 限制数量（用于测试）
   * @returns {Promise<Array>} 完整小区列表
   */
  async crawl(limit = null) {
    this.stats.startTime = Date.now();

    await this.init();
    await this.loadCommunities();

    let communitiesToCrawl = this.communities;

    // 过滤已爬取的小区
    communitiesToCrawl = communitiesToCrawl.filter(c => !c.detailCrawled);
    console.log(`需要爬取详情的小区: ${communitiesToCrawl.length} 个`);

    // 限制数量（用于测试）
    if (limit) {
      communitiesToCrawl = communitiesToCrawl.slice(0, limit);
      console.log(`测试模式: 仅爬取前 ${limit} 个`);
    }

    const results = [];
    const concurrency = config.crawler.concurrency;

    for (let i = 0; i < communitiesToCrawl.length; i += concurrency) {
      const batch = communitiesToCrawl.slice(i, i + concurrency);

      // 并发爬取
      const batchResults = await Promise.all(
        batch.map(community => this.crawlCommunity(community))
      );

      results.push(...batchResults);

      // 更新进度
      console.log(`进度: ${Math.min(i + concurrency, communitiesToCrawl.length)}/${communitiesToCrawl.length}`);

      // 批次间延迟
      if (i + concurrency < communitiesToCrawl.length) {
        await new Promise(resolve => setTimeout(resolve, antiDetect.getRandomDelay()));
      }

      // 每10个保存一次（防止中断丢失数据）
      if (results.length % 10 === 0) {
        await this.updateCommunities(results);
      }
    }

    // 保存最终结果
    await this.updateCommunities(results);

    this.stats.endTime = Date.now();
    this.printStats();

    await this.close();

    return results;
  }

  /**
   * 更新小区数据
   * @param {Array} details 详情数据
   */
  async updateCommunities(details) {
    // 更新内存中的数据
    details.forEach(detail => {
      const index = this.communities.findIndex(c => c.id === detail.id);
      if (index !== -1) {
        this.communities[index] = detail;
      }
    });

    // 保存到文件
    const output = {
      meta: {
        total: this.communities.length,
        detailCrawled: this.communities.filter(c => c.detailCrawled).length,
        crawlTime: new Date().toISOString(),
        source: config.target.name
      },
      data: this.communities
    };

    await fs.writeFile(config.output.communities, JSON.stringify(output, null, 2), 'utf8');
    console.log(`已保存进度: ${output.meta.detailCrawled}/${output.meta.total}`);
  }
}

module.exports = DetailCrawler;
