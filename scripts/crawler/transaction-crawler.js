/**
 * 成交记录爬虫
 * 爬取贝壳找房小区成交记录（最近半年）
 */

const BaseCrawler = require('./base-crawler');
const config = require('./config');
const cheerio = require('cheerio');
const antiDetect = require('./anti-detect');
const fs = require('fs').promises;

class TransactionCrawler extends BaseCrawler {
  constructor(options = {}) {
    super(options);
    this.communities = [];
    this.transactions = [];
    this.startDate = config.timeRange.getStartDate();
  }

  /**
   * 加载小区列表
   */
  async loadCommunities() {
    const filepath = config.output.communities;
    try {
      const content = await fs.readFile(filepath, 'utf8');
      const data = JSON.parse(content);
      // 只加载有详情的小区
      this.communities = (data.data || []).filter(c => c.detailCrawled);
      console.log(`加载了 ${this.communities.length} 个有详情的小区`);
    } catch (error) {
      console.error('加载小区列表失败:', error.message);
      throw new Error('请先运行小区详情爬取');
    }
  }

  /**
   * 解析成交记录页面
   * @param {string} html HTML内容
   * @param {Object} community 小区信息
   * @returns {Array} 成交记录列表
   */
  parse(html, community) {
    const $ = cheerio.load(html);
    const selectors = config.selectors.transactionList;
    const transactions = [];

    $(selectors.items).each((index, element) => {
      try {
        const $item = $(element);

        // 获取成交日期
        const dateText = $item.find(selectors.dealDate).text().trim();
        const dealDate = antiDetect.parseDate(dateText);

        // 检查是否在时间范围内（最近半年）
        if (!antiDetect.isWithinDateRange(dealDate)) {
          return; // 跳过超出时间范围的记录
        }

        // 获取成交价格
        const dealPriceText = $item.find(selectors.dealPrice).text().trim();
        const dealPrice = antiDetect.parsePrice(dealPriceText);

        // 获取单价
        const unitPriceText = $item.find(selectors.unitPrice).text().trim();
        const unitPrice = antiDetect.parsePrice(unitPriceText);

        // 获取户型信息
        const houseInfo = $item.find(selectors.layout).text().trim();
        const layout = this.parseLayout(houseInfo);
        const area = antiDetect.parseArea(houseInfo);

        // 获取楼层信息
        const floorInfo = $item.find(selectors.floor).text().trim();
        const floor = this.parseFloor(floorInfo);

        // 生成唯一ID
        const id = `cj_${community.id}_${dealDate.replace(/-/g, '')}_${index}`;

        transactions.push({
          id,
          communityId: community.id,
          communityName: community.name,
          district: community.district,
          dealDate,
          dealPrice,
          unitPrice,
          area,
          layout,
          floor,
          source: config.target.name,
          crawlTime: new Date().toISOString()
        });
      } catch (error) {
        console.error(`解析成交记录失败: ${error.message}`);
      }
    });

    console.log(`解析到 ${transactions.length} 条成交记录`);
    return transactions;
  }

  /**
   * 解析户型
   * @param {string} text 文本
   * @returns {string} 户型
   */
  parseLayout(text) {
    if (!text) return '';
    const match = text.match(/(\d室\d厅)/);
    return match ? match[1] : '';
  }

  /**
   * 解析楼层
   * @param {string} text 文本
   * @returns {string} 楼层
   */
  parseFloor(text) {
    if (!text) return '';
    if (text.includes('高楼层')) return '高楼层';
    if (text.includes('中楼层')) return '中楼层';
    if (text.includes('低楼层')) return '低楼层';
    return text;
  }

  /**
   * 获取总页数
   * @param {string} html HTML内容
   * @returns {number} 总页数
   */
  getTotalPages(html) {
    const $ = cheerio.load(html);

    // 尝试从分页信息获取
    const pageData = $('.house-lst-page-box').attr('page-data');
    if (pageData) {
      try {
        const data = JSON.parse(pageData);
        return data.totalPage || 1;
      } catch (e) {
        console.warn('解析分页数据失败');
      }
    }

    return 1;
  }

  /**
   * 爬取单个小区的成交记录
   * @param {Object} community 小区信息
   * @returns {Promise<Array>} 成交记录列表
   */
  async crawlCommunity(community) {
    const allTransactions = [];
    let page = 1;
    let hasMore = true;

    console.log(`\n爬取: ${community.name}`);

    while (hasMore && page <= 10) { // 最多爬10页
      const url = config.urls.communityTransaction(
        community.id.replace('bk_', ''),
        page
      );

      try {
        const html = await this.fetch(url);
        const transactions = this.parse(html, community);

        if (transactions.length === 0) {
          hasMore = false;
        } else {
          allTransactions.push(...transactions);
          console.log(`  第${page}页: ${transactions.length}条`);

          // 如果最后一笔成交已超出时间范围，停止翻页
          const lastDate = transactions[transactions.length - 1]?.dealDate;
          if (lastDate && lastDate < this.startDate) {
            console.log('  已超出时间范围，停止翻页');
            hasMore = false;
          }
        }

        page++;

        // 页面间延迟
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, antiDetect.getRandomDelay()));
        }
      } catch (error) {
        console.error(`  爬取失败: ${error.message}`);
        hasMore = false;
      }
    }

    console.log(`  总计: ${allTransactions.length}条`);
    return allTransactions;
  }

  /**
   * 爬取所有小区的成交记录
   * @param {number} limit 限制数量（用于测试）
   * @returns {Promise<Array>} 所有成交记录
   */
  async crawl(limit = null) {
    this.stats.startTime = Date.now();

    await this.init();
    await this.loadCommunities();

    let communitiesToCrawl = this.communities;

    // 限制数量（用于测试）
    if (limit) {
      communitiesToCrawl = communitiesToCrawl.slice(0, limit);
      console.log(`测试模式: 仅爬取前 ${limit} 个小区`);
    }

    const allTransactions = [];

    for (let i = 0; i < communitiesToCrawl.length; i++) {
      const community = communitiesToCrawl[i];
      console.log(`\n[${i + 1}/${communitiesToCrawl.length}]`);

      try {
        const transactions = await this.crawlCommunity(community);
        allTransactions.push(...transactions);

        // 每10个小区保存一次
        if ((i + 1) % 10 === 0) {
          await this.saveTransactions(allTransactions);
        }

        // 小区间延迟
        if (i < communitiesToCrawl.length - 1) {
          await new Promise(resolve => setTimeout(resolve, antiDetect.getRandomDelay() * 2));
        }
      } catch (error) {
        console.error(`爬取失败 ${community.name}: ${error.message}`);
      }
    }

    // 保存最终结果
    await this.saveTransactions(allTransactions);

    // 生成汇总数据
    await this.generateSummary(allTransactions);

    this.stats.endTime = Date.now();
    this.printStats();

    await this.close();

    return allTransactions;
  }

  /**
   * 保存成交记录
   * @param {Array} transactions 成交记录
   */
  async saveTransactions(transactions) {
    const output = {
      meta: {
        dateRange: `${this.startDate} 至 ${new Date().toISOString().split('T')[0]}`,
        totalRecords: transactions.length,
        communityCount: new Set(transactions.map(t => t.communityId)).size,
        crawlTime: new Date().toISOString(),
        source: config.target.name
      },
      transactions
    };

    await fs.writeFile(
      config.output.transactions,
      JSON.stringify(output, null, 2),
      'utf8'
    );

    console.log(`\n已保存 ${transactions.length} 条成交记录`);
  }

  /**
   * 生成小区成交汇总
   * @param {Array} transactions 成交记录
   */
  async generateSummary(transactions) {
    const summary = {};

    transactions.forEach(t => {
      if (!summary[t.communityId]) {
        summary[t.communityId] = {
          communityId: t.communityId,
          communityName: t.communityName,
          district: t.district,
          dealCount: 0,
          totalPrice: 0,
          minPrice: Infinity,
          maxPrice: 0,
          prices: []
        };
      }

      const s = summary[t.communityId];
      s.dealCount++;
      s.totalPrice += t.unitPrice;
      s.prices.push(t.unitPrice);
      s.minPrice = Math.min(s.minPrice, t.unitPrice);
      s.maxPrice = Math.max(s.maxPrice, t.unitPrice);
    });

    // 计算平均价
    const summaryList = Object.values(summary).map(s => ({
      ...s,
      avgPrice: Math.round(s.totalPrice / s.dealCount),
      period: '近6个月'
    }));

    // 读取现有交易数据并更新汇总
    const output = {
      meta: {
        dateRange: `${this.startDate} 至 ${new Date().toISOString().split('T')[0]}`,
        totalRecords: transactions.length,
        communityCount: summaryList.length,
        crawlTime: new Date().toISOString(),
        source: config.target.name
      },
      summary: summaryList,
      transactions
    };

    await fs.writeFile(
      config.output.transactions,
      JSON.stringify(output, null, 2),
      'utf8'
    );

    console.log(`生成汇总: ${summaryList.length} 个小区`);
  }
}

module.exports = TransactionCrawler;
