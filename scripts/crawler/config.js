/**
 * 爬虫配置文件
 * 贝壳找房数据爬取配置
 */

const path = require('path');

module.exports = {
  // 目标网站
  target: {
    name: '贝壳找房',
    baseUrl: 'https://sz.ke.com',
    city: '深圳',
    cityCode: 'sz'
  },

  // 爬取区域列表
  districts: [
    { name: '福田', code: 'futian' },
    { name: '南山', code: 'nanshan' },
    { name: '罗湖', code: 'luohu' },
    { name: '宝安', code: 'baoan' },
    { name: '龙岗', code: 'longgang' },
    { name: '龙华', code: 'longhua' },
    { name: '盐田', code: 'yantian' },
    { name: '坪山', code: 'pingshan' },
    { name: '光明', code: 'guangming' },
    { name: '大鹏新区', code: 'dapeng' }
  ],

  // URL模板
  urls: {
    // 小区列表页
    communityList: (district, page) => `https://sz.ke.com/xiaoqu/${district}/pg${page}/`,
    // 小区详情页
    communityDetail: (id) => `https://sz.ke.com/xiaoqu/${id}/`,
    // 成交记录列表
    transactionList: (district, page) => `https://sz.ke.com/chengjiao/${district}/pg${page}/`,
    // 小区成交记录
    communityTransaction: (id, page) => `https://sz.ke.com/chengjiao/c${id}/pg${page}/`
  },

  // 输出路径
  output: {
    baseDir: path.join(__dirname, '..', '..', 'data', 'crawled'),
    communities: path.join(__dirname, '..', '..', 'data', 'crawled', 'communities.json'),
    prices: path.join(__dirname, '..', '..', 'data', 'crawled', 'prices.json'),
    transactions: path.join(__dirname, '..', '..', 'data', 'crawled', 'transactions.json'),
    lastUpdate: path.join(__dirname, '..', '..', 'data', 'crawled', 'last-update.json')
  },

  // 爬取配置
  crawler: {
    // 请求间隔（毫秒）
    delay: {
      min: 2000,
      max: 5000
    },
    // 并发数
    concurrency: 3,
    // 重试次数
    retries: 3,
    // 超时时间（毫秒）
    timeout: 30000,
    // 用户代理列表
    userAgents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
    ]
  },

  // 时间范围配置
  timeRange: {
    // 成交记录时间范围（月）
    transactionMonths: 6,
    // 计算起始日期
    getStartDate: function() {
      const date = new Date();
      date.setMonth(date.getMonth() - this.transactionMonths);
      return date.toISOString().split('T')[0];
    }
  },

  // 数据选择器（CSS选择器）
  selectors: {
    // 小区列表页
    communityList: {
      items: '.xiaoquListItem',
      name: '.title a',
      id: '.title a',
      price: '.totalPrice span',
      district: '.positionInfo a:nth-child(1)',
      bizCircle: '.positionInfo a:nth-child(2)',
      tags: '.tagList span'
    },
    // 小区详情页
    communityDetail: {
      name: 'h1.detailTitle',
      address: '.detailDesc',
      price: '.xiaoquUnitPrice',
      buildYear: '.xiaoquInfoItem:nth-child(1) .xiaoquInfoContent',
      totalHouseholds: '.xiaoquInfoItem:nth-child(2) .xiaoquInfoContent',
      layoutTypes: '.xiaoquInfoItem:nth-child(3) .xiaoquInfoContent',
      subway: '.xiaoquInfoItem.subway .xiaoquInfoContent',
      longitude: '', // 需要从地图API获取
      latitude: ''
    },
    // 成交记录列表
    transactionList: {
      items: '.listContent li',
      title: '.title a',
      dealPrice: '.totalPrice span',
      unitPrice: '.unitPrice span',
      dealDate: '.dealDate',
      layout: '.houseInfo',
      floor: '.positionInfo',
      communityName: '.houseInfo a'
    }
  },

  // 日志配置
  log: {
    level: 'info', // debug, info, warn, error
    file: path.join(__dirname, '..', '..', 'data', 'crawled', 'crawler.log')
  }
};
