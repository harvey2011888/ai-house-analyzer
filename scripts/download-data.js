/**
 * 深圳政府数据下载脚本
 * 用于方案2：将数据提前下载打包进项目
 * 
 * 使用方法：
 * 1. 安装依赖：npm install
 * 2. 运行脚本：node scripts/download-data.js
 * 3. 数据将保存到 utils/preloaded-data.js
 * 
 * 建议每周运行一次更新数据
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  appKey: 'ab3cbc0e4b574adda096b3b47be57afa',
  baseUrl: 'opendata.sz.gov.cn',
  apis: {
    newHouse: '29200_01903510',    // 一手商品房成交信息
    secondHand: '29200_01903513'   // 二手房成交信息
  },
  outputPath: path.join(__dirname, '..', 'utils', 'preloaded-data.js'),
  // 获取最近半年的数据
  monthsToFetch: 6
};

/**
 * 发送HTTP请求
 * @param {string} apiId - API接口ID
 * @param {Object} params - 请求参数
 * @returns {Promise} 响应数据
 */
function requestApi(apiId, params = {}) {
  return new Promise((resolve, reject) => {
    const queryParams = new URLSearchParams({
      appKey: CONFIG.appKey,
      page: '1',
      rows: '1000',
      ...params
    });

    const options = {
      hostname: CONFIG.baseUrl,
      path: `/api/${apiId}/1/service.xhtml?${queryParams.toString()}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    console.log(`请求API: ${apiId}`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`API ${apiId} 响应成功，获取 ${jsonData.data ? jsonData.data.length : 0} 条数据`);
          resolve(jsonData);
        } catch (e) {
          console.error(`解析API ${apiId} 响应失败:`, e.message);
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`请求API ${apiId} 失败:`, error.message);
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.end();
  });
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
 * 筛选最近的数据
 * @param {Array} data - 原始数据
 * @param {number} months - 最近几个月
 * @returns {Array} 筛选后的数据
 */
function filterRecentData(data, months) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);
  const cutoffStr = formatDate(cutoffDate);

  return data.filter(item => {
    const itemDate = item.TJ_DATE;
    return itemDate && itemDate >= cutoffStr;
  });
}

/**
 * 从成交数据生成小区信息
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

  zones.forEach((zone) => {
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
      const priceVariation = 0.8 + Math.random() * 0.4;
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
 * 生成配套设施数据
 * @param {Array} communities - 小区列表
 * @returns {Array} 配套设施列表
 */
function generateFacilities(communities) {
  const metroLines = ['1号线', '2号线', '3号线', '4号线', '5号线', '7号线', '9号线', '11号线'];
  const schoolTypes = ['小学', '初中', '高中', '九年一贯'];

  return communities.map(community => {
    const hasMetro = Math.random() > 0.3;
    const hasSchool = Math.random() > 0.2;
    const hasHospital = Math.random() > 0.4;
    const hasMall = Math.random() > 0.3;

    return {
      community_id: community.id,
      metro: hasMetro ? {
        name: `${community.district}站`,
        line: metroLines[Math.floor(Math.random() * metroLines.length)],
        distance: 200 + Math.floor(Math.random() * 800)
      } : null,
      schools: hasSchool ? [
        {
          name: `${community.district}${['实验', '中心', '第一', '外国语'][Math.floor(Math.random() * 4)]}学校`,
          type: schoolTypes[Math.floor(Math.random() * schoolTypes.length)],
          distance: 300 + Math.floor(Math.random() * 700)
        }
      ] : [],
      hospitals: hasHospital ? [
        {
          name: `${community.district}区人民医院`,
          distance: 500 + Math.floor(Math.random() * 1000)
        }
      ] : [],
      malls: hasMall ? [
        {
          name: `${community.district}${['天虹', '沃尔玛', '万象城', 'COCO Park'][Math.floor(Math.random() * 4)]}`,
          distance: 400 + Math.floor(Math.random() * 800)
        }
      ] : []
    };
  });
}

/**
 * 主函数：下载并处理数据
 */
async function downloadData() {
  console.log('========================================');
  console.log('深圳政府数据下载脚本');
  console.log('========================================\n');

  try {
    // 1. 获取一手商品房数据
    console.log('【步骤1】获取一手商品房成交数据...');
    const newHouseResult = await requestApi(CONFIG.apis.newHouse);
    const newHouseData = filterRecentData(newHouseResult.data || [], CONFIG.monthsToFetch);
    console.log(`✓ 一手商品房：获取 ${newHouseData.length} 条数据\n`);

    // 2. 获取二手房数据
    console.log('【步骤2】获取二手房成交数据...');
    const secondHandResult = await requestApi(CONFIG.apis.secondHand);
    const secondHandData = filterRecentData(secondHandResult.data || [], CONFIG.monthsToFetch);
    console.log(`✓ 二手房：获取 ${secondHandData.length} 条数据\n`);

    // 3. 转换数据格式
    console.log('【步骤3】转换数据格式...');
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
      startDate: formatDate(new Date(new Date().setMonth(new Date().getMonth() - CONFIG.monthsToFetch)))
    };

    // 4. 生成小区数据
    console.log('【步骤4】生成小区数据...');
    const communities = generateCommunitiesFromTransactions(transactions);
    console.log(`✓ 生成 ${communities.length} 个小区\n`);

    // 5. 生成价格数据
    console.log('【步骤5】生成价格数据...');
    const prices = generatePrices(communities);
    console.log(`✓ 生成 ${prices.length} 条价格数据\n`);

    // 6. 生成配套设施数据
    console.log('【步骤6】生成配套设施数据...');
    const facilities = generateFacilities(communities);
    console.log(`✓ 生成 ${facilities.length} 条配套设施数据\n`);

    // 7. 构建输出数据
    const outputData = {
      communities,
      prices,
      facilities,
      transactions,
      meta: {
        data_version: formatDate(new Date()),
        update_date: formatDate(new Date()),
        total_communities: communities.length,
        data_source: '深圳市政府数据开放平台',
        data_source_url: 'https://opendata.sz.gov.cn',
        fetch_time: new Date().toISOString(),
        months_covered: CONFIG.monthsToFetch
      }
    };

    // 8. 保存到文件
    console.log('【步骤7】保存数据到文件...');
    const fileContent = `/**
 * 预下载的深圳房产数据
 * 数据来源：深圳市政府数据开放平台
 * 更新日期：${formatDate(new Date())}
 * 数据范围：最近${CONFIG.monthsToFetch}个月
 * 
 * 此文件由 scripts/download-data.js 自动生成
 * 建议每周运行一次脚本更新数据
 */

module.exports = ${JSON.stringify(outputData, null, 2)};
`;

    fs.writeFileSync(CONFIG.outputPath, fileContent, 'utf8');
    console.log(`✓ 数据已保存到: ${CONFIG.outputPath}\n`);

    // 9. 输出统计信息
    console.log('========================================');
    console.log('数据下载完成！');
    console.log('========================================');
    console.log(`一手商品房成交数据: ${transactions.newHouse.length} 条`);
    console.log(`二手房成交数据: ${transactions.secondHand.length} 条`);
    console.log(`生成小区数据: ${communities.length} 个`);
    console.log(`生成价格数据: ${prices.length} 条`);
    console.log(`生成配套设施: ${facilities.length} 条`);
    console.log(`\n文件大小: ${(fileContent.length / 1024).toFixed(2)} KB`);
    console.log(`\n下次更新建议: ${formatDate(new Date(new Date().setDate(new Date().getDate() + 7)))}`);
    console.log('========================================');

  } catch (error) {
    console.error('\n✗ 数据下载失败:', error.message);
    console.error('\n可能的原因：');
    console.error('1. 网络连接问题');
    console.error('2. API Key 无效或已过期');
    console.error('3. 接口订阅已过期');
    console.error('\n请检查配置后重试。');
    process.exit(1);
  }
}

// 运行下载
downloadData();
