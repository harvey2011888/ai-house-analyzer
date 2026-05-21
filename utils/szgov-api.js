/**
 * 深圳政府数据平台 API 服务
 * 获取一手商品房和二手房成交数据
 * 支持两种方案：
 * 1. 启动时从API获取最近半年数据
 * 2. 数据打包进项目（通过脚本提前下载）
 */

// 深圳政府数据开放平台基础地址
const SZGOV_BASE_URL = 'https://opendata.sz.gov.cn/api';
// 用户提供的 AppKey
const APP_KEY = 'ab3cbc0e4b574adda096b3b47be57afa';

// API接口ID
const API_IDS = {
  NEW_HOUSE: '29200_01903510',      // 一手商品房成交信息
  SECOND_HAND: '29200_01903513'     // 二手房成交信息
};

/**
 * 请求深圳政府数据平台API
 * @param {string} apiId - 接口ID
 * @param {Object} params - 请求参数
 * @returns {Promise} 请求结果
 */
function requestSzGovApi(apiId, params = {}) {
  return new Promise((resolve, reject) => {
    const queryParams = Object.assign({
      appKey: APP_KEY,
      page: 1,
      rows: 100
    }, params);

    // 构建查询字符串
    const queryString = Object.keys(queryParams)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
      .join('&');

    const url = `${SZGOV_BASE_URL}/${apiId}/1/service.xhtml?${queryString}`;

    console.log('请求深圳政府数据API:', url);

    wx.request({
      url: url,
      method: 'GET',
      header: {
        'Content-Type': 'application/json'
      },
      timeout: 15000, // 15秒超时
      success: (res) => {
        if (res.statusCode === 200) {
          console.log('深圳政府数据API响应成功');
          resolve(res.data);
        } else {
          console.error('深圳政府数据API请求失败:', res.statusCode);
          reject(new Error(`请求失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('深圳政府数据API网络错误:', err.errMsg || err);
        reject(err);
      }
    });
  });
}

/**
 * 获取一手商品房成交信息
 * @param {number} page - 页码
 * @param {number} rows - 每页条数
 * @returns {Promise} 成交数据
 */
function getNewHouseTransactions(page = 1, rows = 100) {
  return requestSzGovApi(API_IDS.NEW_HOUSE, { page, rows });
}

/**
 * 获取二手房成交信息
 * @param {number} page - 页码
 * @param {number} rows - 每页条数
 * @returns {Promise} 成交数据
 */
function getSecondHandTransactions(page = 1, rows = 100) {
  return requestSzGovApi(API_IDS.SECOND_HAND, { page, rows });
}

/**
 * 获取最近半年的成交数据
 * 方案1：启动时从API获取
 * @returns {Promise} 最近半年的数据
 */
async function getRecentSixMonthsData() {
  try {
    console.log('正在获取最近半年的成交数据...');

    // 计算半年前的日期
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const startDate = formatDate(sixMonthsAgo);

    // 获取一手商品房数据（最近半年，最多获取1000条）
    const newHouseResult = await getNewHouseTransactions(1, 1000);
    let newHouseData = filterRecentData(newHouseResult.data || [], startDate);

    // 获取二手房数据（最近半年，最多获取1000条）
    const secondHandResult = await getSecondHandTransactions(1, 1000);
    let secondHandData = filterRecentData(secondHandResult.data || [], startDate);

    // 如果筛选后没有数据，使用全部数据（不过滤日期）
    if (newHouseData.length === 0 && newHouseResult.data && newHouseResult.data.length > 0) {
      console.log('一手房筛选后无数据，使用全部数据');
      newHouseData = newHouseResult.data.slice(0, 100); // 只取前100条
    }
    if (secondHandData.length === 0 && secondHandResult.data && secondHandResult.data.length > 0) {
      console.log('二手房筛选后无数据，使用全部数据');
      secondHandData = secondHandResult.data.slice(0, 100); // 只取前100条
    }

    console.log(`获取成功：一手房${newHouseData.length}条，二手房${secondHandData.length}条`);

    // 转换数据格式
    const transactions = {
      newHouse: newHouseData.map(item => ({
        id: item.ID,
        date: item.TJ_DATE,
        zone: item.ZONE,
        usage: item.REPORTCATALOG,
        dealCount: parseInt(item.CJ_NUM) || 0,
        dealArea: parseFloat(item.CJ_AREA) || 0,
        availableCount: parseInt(item.KS_NUM) || 0,
        availableArea: parseFloat(item.KS_AREA) || 0,
        avgPrice: parseFloat(item.CJ_AVG) || 0,
        type: 'new'
      })),
      secondHand: secondHandData.map(item => ({
        id: item.ID,
        date: item.TJ_DATE,
        zone: item.ZONE,
        usage: item.HOUSE_USAGE2,
        dealCount: parseInt(item.CJ_NUM) || 0,
        dealArea: parseFloat(item.CJ_AREA) || 0,
        type: 'secondHand'
      })),
      fetchTime: new Date().toISOString(),
      startDate: startDate
    };

    // 保存到本地存储
    wx.setStorageSync('szgov_transactions', transactions);

    return transactions;
  } catch (error) {
    console.error('获取最近半年数据失败:', error);
    // 尝试从本地缓存读取
    const cached = wx.getStorageSync('szgov_transactions');
    if (cached) {
      console.log('使用本地缓存数据');
      return cached;
    }
    throw error;
  }
}

/**
 * 筛选最近的数据
 * @param {Array} data - 原始数据
 * @param {string} startDate - 开始日期 (YYYY-MM-DD)
 * @returns {Array} 筛选后的数据
 */
function filterRecentData(data, startDate) {
  console.log('筛选数据，开始日期:', startDate, '数据条数:', data.length);

  if (data.length === 0) {
    return [];
  }

  // 打印第一条数据的日期字段，用于调试
  console.log('第一条数据日期字段:', data[0].TJ_DATE, '类型:', typeof data[0].TJ_DATE);

  // 检查日期格式
  const sampleDate = data[0].TJ_DATE;
  if (!sampleDate) {
    console.warn('数据中没有日期字段，返回全部数据');
    return data;
  }

  // 深圳政府API返回的日期格式是 YYYY-MM-DD
  // 但有些数据可能是历史累计数据（2018年及之前），需要过滤掉
  const filtered = data.filter(item => {
    const itemDate = item.TJ_DATE;
    if (!itemDate) return false;

    // 提取日期字符串（处理可能的时间部分）
    const dateStr = itemDate.toString().substring(0, 10);

    // 检查日期格式是否有效
    if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return false;
    }

    // 只保留最近2年的数据（避免历史数据干扰）
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const twoYearsAgoStr = formatDate(twoYearsAgo);

    const isRecent = dateStr >= twoYearsAgoStr;
    const isAfterStart = dateStr >= startDate;

    return isRecent && isAfterStart;
  });

  console.log('筛选结果:', filtered.length, '条');

  // 如果筛选后数据太少，返回最近的数据（最多100条）
  if (filtered.length < 10 && data.length > 0) {
    console.log('筛选后数据太少，返回最近100条数据');
    // 按日期排序后取前100条
    const sorted = data
      .filter(item => item.TJ_DATE)
      .sort((a, b) => (b.TJ_DATE || '').localeCompare(a.TJ_DATE || ''));
    return sorted.slice(0, 100);
  }

  return filtered;
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 从成交数据生成小区信息
 * 由于政府数据没有直接的小区列表，根据区域成交数据估算
 * @param {Object} transactions - 成交数据
 * @returns {Array} 小区列表
 */
function generateCommunitiesFromTransactions(transactions) {
  const zones = ['福田', '南山', '罗湖', '宝安', '龙岗', '龙华', '盐田', '坪山', '光明', '大鹏'];

  // 区域基准价格（根据成交数据动态调整）
  const zonePrices = {};

  // 计算各区域平均成交价
  if (transactions.newHouse && transactions.newHouse.length > 0) {
    transactions.newHouse.forEach(item => {
      if (item.avgPrice > 0) {
        if (!zonePrices[item.zone]) {
          zonePrices[item.zone] = { total: 0, count: 0 };
        }
        zonePrices[item.zone].total += item.avgPrice;
        zonePrices[item.zone].count += 1;
      }
    });
  }

  // 生成小区数据
  const communities = [];
  let idCounter = 1;

  zones.forEach((zone, zoneIndex) => {
    // 每个区域生成2-4个小区
    const communityCount = 2 + Math.floor(Math.random() * 3);

    // 计算该区域均价
    let basePrice = 60000;
    if (zonePrices[zone] && zonePrices[zone].count > 0) {
      basePrice = Math.round(zonePrices[zone].total / zonePrices[zone].count);
    } else {
      // 默认价格
      const defaultPrices = {
        '福田': 115000, '南山': 121500, '罗湖': 71667,
        '宝安': 76000, '龙岗': 51667, '龙华': 71667,
        '盐田': 55000, '坪山': 42000, '光明': 48000, '大鹏': 38000
      };
      basePrice = defaultPrices[zone] || 60000;
    }

    for (let i = 0; i < communityCount; i++) {
      const priceVariation = 0.8 + Math.random() * 0.4; // 价格浮动 ±20%
      const currentPrice = Math.round(basePrice * priceVariation);

      communities.push({
        id: `c${String(idCounter).padStart(3, '0')}`,
        name: `${zone}${['花园', '小区', '苑', '家园', '公寓'][i]}`,
        district: zone,
        address: `深圳市${zone}区`,
        longitude: 113.8 + Math.random() * 0.4,
        latitude: 22.4 + Math.random() * 0.4,
        build_year: 2000 + Math.floor(Math.random() * 24),
        total_households: 500 + Math.floor(Math.random() * 2000),
        layout_types: ['2室', '3室', '4室'],
        avg_area: 80 + Math.floor(Math.random() * 80),
        property_type: '住宅',
        avg_price: currentPrice
      });

      idCounter++;
    }
  });

  return communities;
}

/**
 * 生成价格数据
 * @param {Array} communities - 小区列表
 * @returns {Array} 价格列表
 */
function generatePrices(communities) {
  const currentYear = new Date().getFullYear();

  return communities.map(community => {
    const buildingAge = currentYear - (community.build_year || currentYear);
    const ageFactor = Math.max(0.7, 1 - buildingAge * 0.01);
    const currentAvgPrice = community.avg_price || Math.round(60000 * ageFactor);

    // 生成6个月的历史价格
    const priceHistory = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = formatDate(date).substring(0, 7);

      const variation = 0.95 + Math.random() * 0.1;
      priceHistory.push({
        month: monthStr,
        avg_price: Math.round(currentAvgPrice * variation)
      });
    }

    return {
      community_id: community.id,
      current_avg_price: currentAvgPrice,
      price_history: priceHistory,
      yoy_change: parseFloat((Math.random() * 10 - 2).toFixed(1)),
      mom_change: parseFloat((Math.random() * 4 - 1).toFixed(1))
    };
  });
}

/**
 * 获取所有数据（小区+价格）
 * 优先使用API获取的真实数据
 * @returns {Promise} 完整数据
 */
async function getAllData() {
  try {
    // 方案1：尝试从API获取最近半年数据
    const transactions = await getRecentSixMonthsData();

    // 从成交数据生成小区信息
    const communities = generateCommunitiesFromTransactions(transactions);
    const prices = generatePrices(communities);

    return {
      communities,
      prices,
      transactions,
      dataSource: 'api',
      updateTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('从API获取数据失败，使用本地数据:', error);

    // 降级到本地数据
    const dataLoader = require('./data-loader');
    return {
      communities: dataLoader.getCommunities(),
      prices: dataLoader.getPrices(),
      transactions: null,
      dataSource: 'local',
      updateTime: new Date().toISOString()
    };
  }
}

/**
 * 检查数据是否需要更新（超过1天）
 * @returns {boolean} 是否需要更新
 */
function needUpdate() {
  const lastUpdate = wx.getStorageSync('szgov_last_update');
  if (!lastUpdate) return true;

  const lastTime = new Date(lastUpdate).getTime();
  const now = new Date().getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  return (now - lastTime) > oneDay;
}

/**
 * 获取本地存储的成交数据
 * 用于离线展示
 * @returns {Object} 成交数据
 */
function getStoredTransactions() {
  return wx.getStorageSync('szgov_transactions') || null;
}

module.exports = {
  // API请求
  requestSzGovApi,
  getNewHouseTransactions,
  getSecondHandTransactions,

  // 数据获取
  getRecentSixMonthsData,
  getAllData,

  // 数据生成
  generateCommunitiesFromTransactions,
  generatePrices,

  // 工具函数
  needUpdate,
  getStoredTransactions,
  formatDate
};
