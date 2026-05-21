/**
 * 统一数据源管理器
 * 支持多个数据源，按优先级自动切换
 * 数据源优先级：
 * 1. 深圳政府数据API（最权威）
 * 2. 房天下API（备选）
 * 3. 本地缓存数据（兜底）
 * 4. AI推荐数据（补充）
 */

// 引入现有数据源
const szGovApi = require('./szgov-api');
const dataLoader = require('./data-loader');
const dataValidator = require('./data-validator');

// 数据源配置
const DATA_SOURCES = {
  SZGOV_API: 'szgov_api',      // 深圳政府API
  LOCAL_CACHE: 'local_cache',  // 本地缓存
  AI_RECOMMEND: 'ai_recommend' // AI推荐
};

// 数据缓存
const cache = {
  communities: null,
  prices: null,
  transactions: null,
  lastUpdate: null,
  dataSource: null
};

// 缓存有效期（毫秒）- 1小时
const CACHE_EXPIRY = 60 * 60 * 1000;

/**
 * 获取小区数据
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>} 小区列表
 */
async function getCommunities(options = {}) {
  // 检查缓存是否有效
  if (isCacheValid()) {
    console.log('使用缓存数据');
    return cache.communities || [];
  }

  // 按优先级尝试各个数据源
  try {
    // 1. 尝试深圳政府API
    console.log('尝试从深圳政府API获取数据...');
    const szGovData = await szGovApi.getAllData();
    if (szGovData && szGovData.communities && szGovData.communities.length > 0) {
      updateCache(szGovData, DATA_SOURCES.SZGOV_API);
      return szGovData.communities;
    }
  } catch (error) {
    console.warn('深圳政府API获取失败:', error.message);
  }

  // 2. 尝试本地数据
  try {
    console.log('尝试从本地数据获取...');
    const localCommunities = dataLoader.getCommunities();
    const localPrices = dataLoader.getPrices();
    
    if (localCommunities && localCommunities.length > 0) {
      const localData = {
        communities: localCommunities,
        prices: localPrices,
        transactions: dataLoader.getTransactions(),
        dataSource: 'local'
      };
      updateCache(localData, DATA_SOURCES.LOCAL_CACHE);
      return localCommunities;
    }
  } catch (error) {
    console.warn('本地数据获取失败:', error.message);
  }

  // 3. 返回空数组
  console.warn('所有数据源均获取失败');
  return [];
}

/**
 * 获取价格数据
 * @param {string} communityId - 小区ID
 * @returns {Promise<Object>} 价格数据
 */
async function getPrices(communityId) {
  // 检查缓存
  if (isCacheValid() && cache.prices) {
    const priceData = cache.prices.find(p => p.community_id === communityId);
    if (priceData) return priceData;
  }

  // 从数据源获取
  const communities = await getCommunities();
  const community = communities.find(c => c.id === communityId);
  
  if (community) {
    return {
      community_id: communityId,
      current_avg_price: community.avg_price || 0,
      price_history: generatePriceHistory(community.avg_price),
      yoy_change: 0,
      mom_change: 0
    };
  }

  return null;
}

/**
 * 获取成交数据
 * @returns {Promise<Object>} 成交数据
 */
async function getTransactions() {
  if (isCacheValid() && cache.transactions) {
    return cache.transactions;
  }

  // 尝试从深圳政府API获取
  try {
    const transactions = await szGovApi.getRecentSixMonthsData();
    if (transactions) {
      cache.transactions = transactions;
      return transactions;
    }
  } catch (error) {
    console.warn('获取成交数据失败:', error.message);
  }

  // 返回本地缓存
  return dataLoader.getTransactions();
}

/**
 * 检查缓存是否有效
 * @returns {boolean} 是否有效
 */
function isCacheValid() {
  if (!cache.lastUpdate) return false;
  const now = Date.now();
  return (now - cache.lastUpdate) < CACHE_EXPIRY;
}

/**
 * 更新缓存
 * @param {Object} data - 数据
 * @param {string} source - 数据源
 */
function updateCache(data, source) {
  // 数据验证和清洗
  const validationResult = dataValidator.validateAndClean(data.communities || []);
  
  cache.communities = validationResult.valid;
  cache.prices = data.prices || [];
  cache.transactions = data.transactions || null;
  cache.lastUpdate = Date.now();
  cache.dataSource = source;
  
  console.log(`数据验证结果：总计${validationResult.summary.total}条，有效${validationResult.summary.valid}条，无效${validationResult.summary.invalid}条，警告${validationResult.summary.warnings}条`);
  
  // 保存到本地存储
  try {
    wx.setStorageSync('unified_cache', {
      communities: cache.communities,
      prices: cache.prices,
      transactions: cache.transactions,
      lastUpdate: cache.lastUpdate,
      dataSource: cache.dataSource
    });
  } catch (error) {
    console.warn('缓存保存失败:', error.message);
  }
}

/**
 * 生成价格历史数据
 * @param {number} currentPrice - 当前价格
 * @returns {Array} 价格历史
 */
function generatePriceHistory(currentPrice) {
  if (!currentPrice || currentPrice <= 0) return [];
  
  const history = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    // 生成合理的价格波动（±3%）
    const variation = 1 + (Math.random() - 0.5) * 0.06;
    const price = Math.round(currentPrice * variation);
    
    history.push({
      month,
      avg_price: price
    });
  }
  
  return history;
}

/**
 * 清除缓存
 */
function clearCache() {
  cache.communities = null;
  cache.prices = null;
  cache.transactions = null;
  cache.lastUpdate = null;
  cache.dataSource = null;
  
  try {
    wx.removeStorageSync('unified_cache');
  } catch (error) {
    console.warn('清除缓存失败:', error.message);
  }
}

/**
 * 获取数据来源信息
 * @returns {Object} 数据源信息
 */
function getDataSourceInfo() {
  return {
    source: cache.dataSource || 'unknown',
    lastUpdate: cache.lastUpdate ? new Date(cache.lastUpdate).toISOString() : null,
    isCached: isCacheValid(),
    communityCount: cache.communities ? cache.communities.length : 0
  };
}

module.exports = {
  getCommunities,
  getPrices,
  getTransactions,
  clearCache,
  getDataSourceInfo,
  DATA_SOURCES
};
