/**
 * 数据加载工具模块
 * 负责加载数据文件，使用内存缓存避免重复加载
 * 数据直接内联在此文件中，避免小程序 require 路径问题
 * 支持从深圳政府数据开放平台获取真实数据
 * 
 * 两种数据获取方案：
 * 1. 启动时从API获取最近半年数据（实时）
 * 2. 使用预下载的数据（通过 scripts/download-data.js 脚本更新）
 */

// 引入深圳政府数据API
const szGovApi = require('./szgov-api');

// 尝试加载小区数据
let communitiesData = null;
let pricesData = null;
try {
  // 加载全部小区数据（200个）
  communitiesData = require('../data/communities-data.js');
  console.log('加载到小区数据:', communitiesData.communities.length, '个');
} catch (e) {
  console.log('未找到小区数据:', e.message);
}

// 尝试加载预下载的数据（用于其他功能）
let preloadedData = null;
try {
  preloadedData = require('./preloaded-data.js');
  console.log('加载到预下载数据');
} catch (e) {
  console.log('未找到预下载数据');
}

// 区域数据 - 使用新生成的数据
const districtsData = {
  districts: [
    { name: "福田", avg_price: 95000, total_communities: 20, price_change_yoy: 4.1, volume: 1250 },
    { name: "南山", avg_price: 105000, total_communities: 20, price_change_yoy: 5.7, volume: 1580 },
    { name: "罗湖", avg_price: 65000, total_communities: 20, price_change_yoy: 1.6, volume: 980 },
    { name: "宝安", avg_price: 55000, total_communities: 20, price_change_yoy: 2.9, volume: 1420 },
    { name: "龙岗", avg_price: 42000, total_communities: 20, price_change_yoy: 1.1, volume: 1100 },
    { name: "龙华", avg_price: 58000, total_communities: 20, price_change_yoy: 2.7, volume: 890 },
    { name: "盐田", avg_price: 48000, total_communities: 20, price_change_yoy: 1.8, volume: 620 },
    { name: "坪山", avg_price: 32000, total_communities: 20, price_change_yoy: 2.1, volume: 480 },
    { name: "光明", avg_price: 38000, total_communities: 20, price_change_yoy: 3.2, volume: 550 },
    { name: "大鹏", avg_price: 28000, total_communities: 20, price_change_yoy: 0.9, volume: 280 }
  ]
};

// 从新生成的数据转换小区数据
function getNewCommunitiesData() {
  // 优先使用 communities-data.js 中的全部200个小区数据
  if (communitiesData && communitiesData.communities && communitiesData.communities.length > 0) {
    console.log('使用 communities-data.js 中的', communitiesData.communities.length, '个小区');
    return {
      communities: communitiesData.communities
    };
  }
  
  // 降级使用 preloaded-data.js 中的热门小区（只有20个）
  if (preloadedData && preloadedData.hotCommunities) {
    console.log('使用 preloaded-data.js 中的', preloadedData.hotCommunities.length, '个热门小区');
    return {
      communities: preloadedData.hotCommunities.map(c => {
        // 根据户型类型生成合理的平均面积
        const layoutTypes = c.layoutTypes || ['2室', '3室', '4室'];
        let avgArea = 100; // 默认值

        // 根据最大户型计算平均面积（使用确定性计算，基于小区ID生成伪随机数）
        const seed = parseInt(c.id) || 0;
        const pseudoRandom = (min, max) => min + (seed % (max - min + 1));

        if (layoutTypes.includes('4室') || layoutTypes.includes('5室')) {
          avgArea = 110 + pseudoRandom(0, 50); // 110-160㎡
        } else if (layoutTypes.includes('3室')) {
          avgArea = 85 + pseudoRandom(0, 35); // 85-120㎡
        } else if (layoutTypes.includes('2室')) {
          avgArea = 65 + pseudoRandom(0, 25); // 65-90㎡
        } else if (layoutTypes.includes('1室')) {
          avgArea = 45 + pseudoRandom(0, 20); // 45-65㎡
        }
        
        return {
          id: c.id,
          name: c.name,
          district: c.district.replace('新区', '').replace('区', ''),
          address: `${c.district}${c.bizCircle || ''}`,
          longitude: c.longitude || 114.0 + Math.random() * 0.4,
          latitude: c.latitude || 22.4 + Math.random() * 0.4,
          build_year: c.buildYear || 2010,
          total_households: c.totalHouseholds || 1000,
          layout_types: layoutTypes,
          avg_area: avgArea,
          property_type: "住宅"
        };
      })
    };
  }
  return null;
}

// 从新生成的数据转换价格数据
function getNewPricesData() {
  // 优先使用 communities-data.js 中的全部200个小区数据
  if (communitiesData && communitiesData.communities && communitiesData.communities.length > 0) {
    console.log('生成价格数据:', communitiesData.communities.length, '个小区');
    return {
      prices: communitiesData.communities.map(c => {
        const priceChange = c.price_change || 0;
        const currentPrice = c.price || 80000;
        // 生成6个月的历史价格
        const priceHistory = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const variation = 1 + (Math.random() - 0.5) * 0.02; // ±1%波动
          priceHistory.push({
            month,
            avg_price: Math.round(currentPrice * variation)
          });
        }

        return {
          community_id: c.id,
          current_avg_price: currentPrice,
          price_history: priceHistory,
          yoy_change: priceChange,
          mom_change: Math.round((Math.random() - 0.5) * 2 * 10) / 10
        };
      })
    };
  }
  
  // 降级使用 preloaded-data.js 中的热门小区（只有20个）
  if (preloadedData && preloadedData.hotCommunities) {
    return {
      prices: preloadedData.hotCommunities.map(c => {
        const priceChange = c.priceChange || 0;
        const currentPrice = c.price || 80000;
        // 生成6个月的历史价格
        const priceHistory = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const variation = 1 + (Math.random() - 0.5) * 0.02; // ±1%波动
          priceHistory.push({
            month,
            avg_price: Math.round(currentPrice * variation)
          });
        }

        return {
          community_id: c.id,
          current_avg_price: currentPrice,
          price_history: priceHistory,
          yoy_change: priceChange,
          mom_change: Math.round((Math.random() - 0.5) * 2 * 10) / 10
        };
      })
    };
  }
  return null;
}

// 小区数据 - 优先使用新数据
const newCommunitiesData = getNewCommunitiesData();
const finalCommunitiesData = newCommunitiesData || { communities: [] };

// 价格数据 - 优先使用新数据
const newPricesData = getNewPricesData();
const finalPricesData = newPricesData || { prices: [] };

// 配套设施数据 - 基于新数据生成
const facilitiesData = {
  facilities: (newCommunitiesData ? newCommunitiesData.communities : []).map(c => {
    const districts = ['福田', '南山', '罗湖', '宝安', '龙岗', '龙华', '盐田', '坪山', '光明', '大鹏'];
    const districtIndex = districts.indexOf(c.district) % districts.length;
    
    // 根据区域生成不同的地铁线路
    const metroLines = [
      { name: "购物公园站", line: "1/3号线", distance: 380 },
      { name: "高新园站", line: "1号线", distance: 350 },
      { name: "太安站", line: "5/7号线", distance: 450 },
      { name: "宝安中心站", line: "1/5号线", distance: 300 },
      { name: "坂田站", line: "5号线", distance: 800 },
      { name: "龙华站", line: "4号线", distance: 350 },
      { name: "沙头角站", line: "8号线", distance: 500 },
      { name: "坪山广场站", line: "14号线", distance: 600 },
      { name: "光明大街站", line: "6号线", distance: 400 },
      { name: "大鹏站", line: "32号线", distance: 700 }
    ];

    return {
      community_id: c.id,
      metro: metroLines[districtIndex] || metroLines[0],
      schools: [
        { name: `${c.district}实验小学`, type: "小学", distance: 500 + Math.random() * 500 },
        { name: `${c.district}中学`, type: "初中", distance: 800 + Math.random() * 700 }
      ],
      hospitals: [
        { name: `${c.district}人民医院`, distance: 1000 + Math.random() * 1000 }
      ],
      malls: [
        { name: `${c.district}购物中心`, distance: 600 + Math.random() * 800 }
      ]
    };
  })
};

// 元数据
const metaData = {
  data_version: "2026.05.11",
  update_date: "2026-05-11",
  total_communities: newCommunitiesData ? newCommunitiesData.communities.length : 0,
  price_range: { min: 28000, max: 150000 },
  data_source: "深圳房产数据（模拟数据）",
  data_source_url: "https://sz.ke.com",
  api_key: "ab3cbc0e4b574adda096b3b47be57afa"
};

// 内存缓存对象
const cache = {};

// 是否使用真实数据
let useRealData = false;
let dataSource = 'local'; // 'local' | 'api' | 'preloaded'

/**
 * 初始化数据加载器
 * 优先顺序：communities-data.js(200个) > 预下载数据(20个) > API实时数据
 */
async function initDataLoader() {
  try {
    console.log('正在初始化数据加载器...');

    // 方案1：优先使用 communities-data.js 中的200个小区数据（已加载）
    if (communitiesData && communitiesData.communities && communitiesData.communities.length >= 200) {
      console.log('已加载 communities-data.js 中的', communitiesData.communities.length, '个小区，跳过初始化');
      // 只需要加载成交数据
      if (preloadedData && preloadedData.latestTransactions) {
        cache.transactions = preloadedData.latestTransactions;
      }
      useRealData = true;
      dataSource = 'communities-data';
      return;
    }

    // 方案2：降级使用预下载的数据（只有20个热门小区）
    if (preloadedData && preloadedData.hotCommunities && preloadedData.hotCommunities.length > 0) {
      console.log('使用预下载的数据');
      cache.communities = finalCommunitiesData;
      cache.prices = finalPricesData;
      cache.facilities = facilitiesData;
      cache.transactions = preloadedData.latestTransactions;
      useRealData = true;
      dataSource = 'preloaded';
      console.log(`成功加载 ${preloadedData.hotCommunities.length} 个预下载小区数据`);
      return;
    }

    // 方案3：从API获取最近半年数据
    console.log('正在尝试从深圳政府数据平台获取真实数据...');
    const allData = await szGovApi.getAllData();

    if (allData && allData.communities && allData.communities.length > 0) {
      // 使用API数据
      cache.communities = { communities: allData.communities };
      cache.prices = { prices: allData.prices };
      cache.transactions = allData.transactions;
      useRealData = true;
      dataSource = allData.dataSource; // 'api' 或 'local'
      console.log(`成功加载 ${allData.communities.length} 个小区数据（来源：${dataSource}）`);

      // 记录更新时间
      wx.setStorageSync('szgov_last_update', new Date().toISOString());
    } else {
      console.log('政府数据平台返回空数据，使用本地模拟数据');
    }
  } catch (error) {
    console.error('从政府数据平台获取数据失败:', error);
    console.log('使用本地模拟数据');
  }
}

/**
 * 加载指定名称的数据文件
 * @param {string} fileName - 数据文件名称（不含扩展名）
 * @returns {Object} 数据对象
 */
function loadData(fileName) {
  if (cache[fileName]) {
    return cache[fileName];
  }

  let data = {};
  switch (fileName) {
    case 'districts':
      data = districtsData;
      break;
    case 'communities':
      data = finalCommunitiesData;
      break;
    case 'prices':
      data = finalPricesData;
      break;
    case 'facilities':
      data = facilitiesData;
      break;
    case 'meta':
      data = metaData;
      break;
    default:
      console.error('未知数据类型:', fileName);
  }

  cache[fileName] = data;
  return data;
}

/**
 * 获取小区数据列表
 * @returns {Array} 小区对象数组
 */
function getCommunities() {
  return finalCommunitiesData.communities || [];
}

/**
 * 获取价格数据列表
 * @returns {Array} 价格对象数组
 */
function getPrices() {
  return finalPricesData.prices || [];
}

/**
 * 获取配套设施数据列表
 * @returns {Array} 配套设施对象数组
 */
function getFacilities() {
  return facilitiesData.facilities || [];
}

/**
 * 获取指定小区的配套设施
 * @param {string} communityId - 小区ID
 * @returns {Object} 小区配套设施对象
 */
function getCommunityFacilities(communityId) {
  return facilitiesData.facilities.find(item => item.community_id === communityId) || {};
}

/**
 * 获取区域数据列表
 * @returns {Array} 区域对象数组
 */
function getDistricts() {
  return districtsData.districts || [];
}

/**
 * 获取元数据信息
 * @returns {Object} 元数据对象
 */
function getMeta() {
  return {
    ...metaData,
    data_source_type: dataSource,
    use_real_data: useRealData
  };
}

/**
 * 获取成交数据（一手房+二手房）
 * @returns {Object} 成交数据
 */
function getTransactions() {
  return cache.transactions || null;
}

/**
 * 获取数据来源类型
 * @returns {string} 数据来源：'local' | 'api' | 'preloaded'
 */
function getDataSource() {
  return dataSource;
}

/**
 * 检查数据版本是否有更新
 * @returns {Object} 版本对比结果
 */
function checkDataVersion() {
  const currentVersion = metaData.data_version || '';
  let localVersion = '';
  try {
    localVersion = wx.getStorageSync('data_version') || '';
  } catch (e) {
    console.error('读取本地数据版本失败', e);
  }

  return {
    hasUpdate: currentVersion !== localVersion,
    currentVersion: currentVersion,
    localVersion: localVersion
  };
}

// 导出模块接口
module.exports = {
  loadData,
  initDataLoader,
  getCommunities,
  getPrices,
  getFacilities,
  getCommunityFacilities,
  getDistricts,
  getMeta,
  getTransactions,
  getDataSource,
  checkDataVersion
};
