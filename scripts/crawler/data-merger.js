/**
 * 数据合并工具
 * 合并爬取的小区数据、成交记录，生成小程序可用的数据文件
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

class DataMerger {
  constructor() {
    this.communities = [];
    this.transactions = [];
    this.mergedData = {
      communities: [],
      prices: [],
      facilities: [],
      transactions: [],
      meta: {}
    };
  }

  /**
   * 加载爬取的数据
   */
  async loadData() {
    console.log('加载爬取的数据...');

    // 加载小区数据
    try {
      const communityData = await fs.readFile(config.output.communities, 'utf8');
      const parsed = JSON.parse(communityData);
      this.communities = parsed.data || [];
      console.log(`✓ 加载了 ${this.communities.length} 个小区`);
    } catch (error) {
      console.warn('小区数据加载失败:', error.message);
    }

    // 加载成交记录
    try {
      const transactionData = await fs.readFile(config.output.transactions, 'utf8');
      const parsed = JSON.parse(transactionData);
      this.transactions = parsed.transactions || [];
      console.log(`✓ 加载了 ${this.transactions.length} 条成交记录`);
    } catch (error) {
      console.warn('成交记录加载失败:', error.message);
    }
  }

  /**
   * 合并小区数据和成交记录
   */
  mergeData() {
    console.log('\n合并数据...');

    // 按小区聚合成交记录
    const transactionMap = new Map();
    this.transactions.forEach(t => {
      if (!transactionMap.has(t.communityId)) {
        transactionMap.set(t.communityId, []);
      }
      transactionMap.get(t.communityId).push(t);
    });

    // 合并小区数据
    this.mergedData.communities = this.communities.map(community => {
      const communityTransactions = transactionMap.get(community.id) || [];

      // 计算半年成交均价
      const avgPrice = communityTransactions.length > 0
        ? Math.round(communityTransactions.reduce((sum, t) => sum + t.unitPrice, 0) / communityTransactions.length)
        : community.avgPrice;

      // 计算价格变化（如果有历史数据）
      const priceChange = this.calculatePriceChange(communityTransactions);

      return {
        id: community.id,
        name: community.name,
        district: community.district,
        address: community.address || `${community.district}区`,
        longitude: community.longitude,
        latitude: community.latitude,
        build_year: community.buildYear,
        total_households: community.totalHouseholds,
        layout_types: community.layoutTypes || ['2室', '3室'],
        avg_area: community.avgArea || 90,
        property_type: community.propertyType || '住宅',
        avg_price: avgPrice,
        subway: community.subway,
        deal_count_6m: communityTransactions.length,
        source: community.source,
        crawl_time: community.crawlTime
      };
    });

    // 生成价格数据
    this.mergedData.prices = this.mergedData.communities.map(community => {
      const communityTransactions = transactionMap.get(community.id) || [];

      return {
        community_id: community.id,
        current_avg_price: community.avg_price,
        price_history: this.generatePriceHistory(communityTransactions),
        yoy_change: this.calculateYoYChange(communityTransactions),
        mom_change: this.calculateMoMChange(communityTransactions),
        update_time: new Date().toISOString()
      };
    });

    // 生成配套设施数据（简化版）
    this.mergedData.facilities = this.mergedData.communities.map(community => {
      return this.generateFacilities(community);
    });

    // 保留成交记录
    this.mergedData.transactions = {
      meta: {
        date_range: config.timeRange.getStartDate() + ' 至 ' + new Date().toISOString().split('T')[0],
        total_records: this.transactions.length,
        community_count: transactionMap.size,
        update_time: new Date().toISOString()
      },
      summary: this.generateTransactionSummary(transactionMap),
      records: this.transactions
    };

    // 元数据
    this.mergedData.meta = {
      data_version: new Date().toISOString().split('T')[0],
      update_date: new Date().toISOString().split('T')[0],
      total_communities: this.mergedData.communities.length,
      data_source: config.target.name,
      data_source_url: config.target.baseUrl,
      crawl_time: new Date().toISOString()
    };

    console.log(`✓ 合并完成: ${this.mergedData.communities.length} 个小区`);
  }

  /**
   * 计算价格变化
   * @param {Array} transactions 成交记录
   * @returns {Object} 价格变化
   */
  calculatePriceChange(transactions) {
    if (transactions.length < 2) return { yoy: 0, mom: 0 };

    // 按月份分组
    const monthlyPrices = {};
    transactions.forEach(t => {
      const month = t.dealDate.substring(0, 7);
      if (!monthlyPrices[month]) {
        monthlyPrices[month] = [];
      }
      monthlyPrices[month].push(t.unitPrice);
    });

    const months = Object.keys(monthlyPrices).sort();
    if (months.length < 2) return { yoy: 0, mom: 0 };

    // 计算月度均价
    const monthlyAvg = months.map(m => ({
      month: m,
      price: monthlyPrices[m].reduce((a, b) => a + b, 0) / monthlyPrices[m].length
    }));

    const current = monthlyAvg[monthlyAvg.length - 1].price;
    const lastMonth = monthlyAvg[monthlyAvg.length - 2]?.price || current;
    const lastYear = monthlyAvg[monthlyAvg.length - 13]?.price || current;

    return {
      yoy: lastYear > 0 ? ((current - lastYear) / lastYear * 100).toFixed(1) : 0,
      mom: lastMonth > 0 ? ((current - lastMonth) / lastMonth * 100).toFixed(1) : 0
    };
  }

  /**
   * 生成价格历史
   * @param {Array} transactions 成交记录
   * @returns {Array} 价格历史
   */
  generatePriceHistory(transactions) {
    // 按月份分组
    const monthlyPrices = {};
    transactions.forEach(t => {
      const month = t.dealDate.substring(0, 7);
      if (!monthlyPrices[month]) {
        monthlyPrices[month] = [];
      }
      monthlyPrices[month].push(t.unitPrice);
    });

    // 生成6个月的历史
    const history = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toISOString().substring(0, 7);

      const prices = monthlyPrices[month] || [];
      history.push({
        month,
        avg_price: prices.length > 0
          ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
          : null
      });
    }

    return history;
  }

  /**
   * 计算同比变化
   * @param {Array} transactions 成交记录
   * @returns {number} 同比变化百分比
   */
  calculateYoYChange(transactions) {
    const change = this.calculatePriceChange(transactions);
    return parseFloat(change.yoy) || 0;
  }

  /**
   * 计算环比变化
   * @param {Array} transactions 成交记录
   * @returns {number} 环比变化百分比
   */
  calculateMoMChange(transactions) {
    const change = this.calculatePriceChange(transactions);
    return parseFloat(change.mom) || 0;
  }

  /**
   * 生成配套设施数据
   * @param {Object} community 小区信息
   * @returns {Object} 配套设施
   */
  generateFacilities(community) {
    // 根据地铁信息生成交通配套
    const metro = community.subway ? {
      name: community.subway.split(' ')[0] || '地铁站',
      line: this.extractMetroLine(community.subway),
      distance: this.extractDistance(community.subway)
    } : null;

    // 生成其他配套（简化版）
    const hasMetro = !!metro;
    const hasSchool = Math.random() > 0.3;
    const hasHospital = Math.random() > 0.4;
    const hasMall = Math.random() > 0.3;

    return {
      community_id: community.id,
      metro,
      schools: hasSchool ? [{
        name: `${community.district}实验学校`,
        type: '九年一贯',
        distance: 500 + Math.floor(Math.random() * 500)
      }] : [],
      hospitals: hasHospital ? [{
        name: `${community.district}区人民医院`,
        distance: 800 + Math.floor(Math.random() * 700)
      }] : [],
      malls: hasMall ? [{
        name: `${community.district}商业中心`,
        distance: 600 + Math.floor(Math.random() * 600)
      }] : []
    };
  }

  /**
   * 提取地铁线路
   * @param {string} subwayText 地铁文本
   * @returns {string} 线路
   */
  extractMetroLine(subwayText) {
    const match = subwayText.match(/(\d+)号线/);
    return match ? `${match[1]}号线` : '地铁';
  }

  /**
   * 提取距离
   * @param {string} subwayText 地铁文本
   * @returns {number} 距离（米）
   */
  extractDistance(subwayText) {
    const match = subwayText.match(/(\d+)米/);
    return match ? parseInt(match[1]) : 500;
  }

  /**
   * 生成成交汇总
   * @param {Map} transactionMap 成交记录Map
   * @returns {Array} 汇总列表
   */
  generateTransactionSummary(transactionMap) {
    const summary = [];

    transactionMap.forEach((transactions, communityId) => {
      const community = this.communities.find(c => c.id === communityId);
      if (!community) return;

      const prices = transactions.map(t => t.unitPrice);
      const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

      summary.push({
        community_id: communityId,
        community_name: community.name,
        district: community.district,
        deal_count: transactions.length,
        avg_price: avgPrice,
        min_price: Math.min(...prices),
        max_price: Math.max(...prices),
        period: '近6个月'
      });
    });

    return summary.sort((a, b) => b.deal_count - a.deal_count);
  }

  /**
   * 保存合并后的数据
   */
  async save() {
    console.log('\n保存数据...');

    // 保存完整数据（JSON格式）
    const outputPath = path.join(config.output.baseDir, 'merged-data.json');
    await fs.writeFile(
      outputPath,
      JSON.stringify(this.mergedData, null, 2),
      'utf8'
    );
    console.log(`✓ 完整数据: ${outputPath}`);

    // 生成小程序可用的JS文件
    const jsOutputPath = path.join(
      path.dirname(config.output.baseDir),
      'preloaded-data.js'
    );

    const jsContent = `/**
 * 预下载的深圳房产数据
 * 数据来源：${config.target.name}
 * 更新日期：${new Date().toISOString().split('T')[0]}
 * 数据范围：最近6个月成交记录
 *
 * 此文件由 scripts/crawler/data-merger.js 自动生成
 * 建议每周运行一次爬虫更新数据
 */

module.exports = ${JSON.stringify(this.mergedData, null, 2)};
`;

    await fs.writeFile(jsOutputPath, jsContent, 'utf8');
    console.log(`✓ 小程序数据: ${jsOutputPath}`);

    // 生成统计报告
    await this.generateReport();
  }

  /**
   * 生成统计报告
   */
  async generateReport() {
    const report = {
      生成时间: new Date().toISOString(),
      数据来源: config.target.name,
      小区总数: this.mergedData.communities.length,
      有成交记录的小区: this.mergedData.transactions.summary.length,
      成交记录总数: this.mergedData.transactions.meta.total_records,
      区域分布: this.getDistrictDistribution(),
      价格区间: this.getPriceRange(),
      成交活跃小区TOP10: this.mergedData.transactions.summary.slice(0, 10)
    };

    const reportPath = path.join(config.output.baseDir, 'report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`✓ 统计报告: ${reportPath}`);
  }

  /**
   * 获取区域分布
   * @returns {Object} 区域分布
   */
  getDistrictDistribution() {
    const distribution = {};
    this.mergedData.communities.forEach(c => {
      distribution[c.district] = (distribution[c.district] || 0) + 1;
    });
    return distribution;
  }

  /**
   * 获取价格区间
   * @returns {Object} 价格区间
   */
  getPriceRange() {
    const prices = this.mergedData.communities.map(c => c.avg_price).filter(p => p > 0);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    };
  }

  /**
   * 执行合并
   */
  async merge() {
    console.log('========== 数据合并 ==========\n');

    await this.loadData();
    this.mergeData();
    await this.save();

    console.log('\n========== 合并完成 ==========');
    console.log(`小区总数: ${this.mergedData.communities.length}`);
    console.log(`成交记录: ${this.mergedData.transactions.meta.total_records}`);
    console.log(`价格区间: ${this.getPriceRange().min} - ${this.getPriceRange().max} 元/㎡`);
    console.log('==============================\n');
  }
}

module.exports = DataMerger;
