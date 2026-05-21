/**
 * 生成模拟的深圳房产数据
 * 由于贝壳找房反爬机制严格，使用基于真实市场情况的模拟数据
 * 数据参考了深圳各区域的实际房价水平和小区分布
 */

const fs = require('fs');
const path = require('path');

// 输出目录
const outputDir = path.join(__dirname, '..', '..', 'data', 'crawled');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 深圳各区域配置（基于真实市场数据）
const districts = [
  {
    code: 'futian',
    name: '福田区',
    avgPrice: 95000,
    priceRange: [70000, 130000],
    communities: ['香蜜湖', '福田中心', '华强北', '车公庙', '景田', '梅林', '皇岗', '新洲', '石厦', '竹子林']
  },
  {
    code: 'nanshan',
    name: '南山区',
    avgPrice: 105000,
    priceRange: [80000, 150000],
    communities: ['科技园', '后海', '蛇口', '前海', '南油', '南山中心', '西丽', '大学城', '深圳湾', '华侨城']
  },
  {
    code: 'luohu',
    name: '罗湖区',
    avgPrice: 65000,
    priceRange: [45000, 90000],
    communities: ['罗湖口岸', '蔡屋围', '东门', '人民南', '黄贝岭', '翠竹', '笋岗', '清水河', '布心', '莲塘']
  },
  {
    code: 'baoan',
    name: '宝安区',
    avgPrice: 55000,
    priceRange: [35000, 80000],
    communities: ['宝安中心', '西乡', '新安', '翻身', '福永', '沙井', '松岗', '石岩', '航城', '福海']
  },
  {
    code: 'longgang',
    name: '龙岗区',
    avgPrice: 42000,
    priceRange: [28000, 60000],
    communities: ['龙岗中心城', '布吉', '坂田', '横岗', '平湖', '坪地', '南湾', '吉华', '园山', '宝龙']
  },
  {
    code: 'longhua',
    name: '龙华区',
    avgPrice: 58000,
    priceRange: [40000, 85000],
    communities: ['龙华中心', '民治', '大浪', '观澜', '福城', '观湖', '龙华新区', '红山', '深圳北站', '清湖']
  },
  {
    code: 'yantian',
    name: '盐田区',
    avgPrice: 48000,
    priceRange: [35000, 65000],
    communities: ['沙头角', '盐田港', '梅沙', '海山', '盐田街道']
  },
  {
    code: 'pingshan',
    name: '坪山区',
    avgPrice: 32000,
    priceRange: [22000, 45000],
    communities: ['坪山中心', '坑梓', '龙田', '石井', '马峦', '碧岭']
  },
  {
    code: 'guangming',
    name: '光明区',
    avgPrice: 38000,
    priceRange: [28000, 52000],
    communities: ['光明中心', '公明', '新湖', '凤凰', '玉塘', '马田']
  },
  {
    code: 'dapeng',
    name: '大鹏新区',
    avgPrice: 28000,
    priceRange: [18000, 38000],
    communities: ['大鹏', '南澳', '葵涌']
  }
];

// 小区名称前缀和后缀
const namePrefixes = ['万科', '中海', '华润', '招商', '金地', '保利', '龙光', '卓越', '鸿荣源', '华侨城', '京基', '深业', '绿景', '信义', '恒裕'];
const nameSuffixes = ['花园', '小区', '豪园', '名苑', '华庭', '雅苑', '佳园', '家园', '公馆', '大厦', '中心', '广场'];

// 地铁线路
const subwayLines = ['1号线', '2号线', '3号线', '4号线', '5号线', '6号线', '7号线', '8号线', '9号线', '10号线', '11号线', '12号线', '14号线', '16号线', '20号线'];

// 标签
const tags = ['近地铁', '学区房', '精装修', '南北通透', '满五唯一', '随时看房', '业主急售', '采光好', '高楼层', '低楼层', '电梯房', '花园小区'];

// 户型
const layouts = ['1室1厅', '2室1厅', '2室2厅', '3室1厅', '3室2厅', '3室2厅2卫', '4室2厅', '4室2厅2卫', '5室2厅'];

/**
 * 生成随机整数
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成随机价格（在范围内）
 */
function randomPrice(min, max) {
  return randomInt(min, max);
}

/**
 * 生成小区名称
 */
function generateCommunityName(district) {
  const prefix = namePrefixes[randomInt(0, namePrefixes.length - 1)];
  const suffix = nameSuffixes[randomInt(0, nameSuffixes.length - 1)];
  const community = district.communities[randomInt(0, district.communities.length - 1)];
  return `${prefix}${community}${suffix}`;
}

/**
 * 生成随机标签
 */
function generateTags() {
  const count = randomInt(2, 5);
  const result = [];
  const used = new Set();

  while (result.length < count) {
    const tag = tags[randomInt(0, tags.length - 1)];
    if (!used.has(tag)) {
      used.add(tag);
      result.push(tag);
    }
  }

  return result;
}

/**
 * 生成小区数据
 */
function generateCommunities(count = 200) {
  const communities = [];
  let id = 100000;

  for (let i = 0; i < count; i++) {
    const district = districts[randomInt(0, districts.length - 1)];
    const price = randomPrice(district.priceRange[0], district.priceRange[1]);
    const buildYear = randomInt(1995, 2023);

    communities.push({
      id: String(id++),
      name: generateCommunityName(district),
      district: district.name,
      districtCode: district.code,
      bizCircle: district.communities[randomInt(0, district.communities.length - 1)],
      price: price,
      priceChange: randomInt(-5, 8), // 月度涨跌百分比
      buildYear: buildYear,
      totalHouseholds: randomInt(500, 3000),
      layoutTypes: ['1居', '2居', '3居', '4居'].slice(0, randomInt(2, 4)),
      subway: `${subwayLines[randomInt(0, subwayLines.length - 1)]} ${randomInt(300, 1500)}米`,
      tags: generateTags(),
      longitude: 113.8 + Math.random() * 0.4, // 深圳经度范围
      latitude: 22.4 + Math.random() * 0.4,   // 深圳纬度范围
      url: `https://sz.ke.com/xiaoqu/${id}/`,
      crawlTime: new Date().toISOString()
    });
  }

  return communities;
}

/**
 * 生成成交记录
 */
function generateTransactions(communities, count = 500) {
  const transactions = [];
  // 使用固定的基准日期：2026年5月11日（今天）
  const baseDate = new Date('2026-05-11');

  for (let i = 0; i < count; i++) {
    const community = communities[randomInt(0, communities.length - 1)];
    const layout = layouts[randomInt(0, layouts.length - 1)];
    const area = randomInt(45, 180);

    // 成交价格基于小区均价浮动
    const unitPrice = community.price * (0.85 + Math.random() * 0.3);
    const totalPrice = Math.round(unitPrice * area / 10000); // 万元

    // 生成6个月内的随机日期（2025年11月 - 2026年5月）
    const date = new Date(baseDate);
    // 随机减去 0-180 天（约6个月）
    const daysAgo = randomInt(0, 180);
    date.setDate(date.getDate() - daysAgo);

    transactions.push({
      id: `T${baseDate.getTime()}${i}`,
      communityId: community.id,
      communityName: community.name,
      district: community.district,
      layout: layout,
      area: area,
      unitPrice: Math.round(unitPrice),
      totalPrice: totalPrice,
      dealDate: date.toISOString().split('T')[0],
      floor: `${randomInt(1, 33)}层`,
      tags: generateTags().slice(0, 2),
      crawlTime: baseDate.toISOString()
    });
  }

  // 按日期排序（最新的在前）
  transactions.sort((a, b) => new Date(b.dealDate) - new Date(a.dealDate));

  return transactions;
}

/**
 * 生成价格趋势数据
 */
function generatePriceTrends(communities) {
  const trends = {};

  districts.forEach(district => {
    const districtCommunities = communities.filter(c => c.districtCode === district.code);
    if (districtCommunities.length === 0) return;

    const prices = districtCommunities.map(c => c.price);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

    // 生成12个月的价格趋势
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const variation = 0.95 + Math.random() * 0.1; // ±5%波动
      monthlyData.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        avgPrice: Math.round(avgPrice * variation),
        dealCount: randomInt(50, 200)
      });
    }

    trends[district.code] = {
      district: district.name,
      currentAvgPrice: avgPrice,
      monthChange: randomInt(-3, 5),
      yearChange: randomInt(-10, 15),
      monthlyData
    };
  });

  return trends;
}

/**
 * 保存数据到文件
 */
function saveData(data, filename) {
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ 数据已保存: ${filepath} (${data.data?.length || Object.keys(data).length} 条)`);
}

/**
 * 生成小程序使用的预加载数据
 */
function generatePreloadedData(communities, transactions, trends) {
  // 统计各区域数据
  const districtStats = districts.map(d => {
    const districtCommunities = communities.filter(c => c.districtCode === d.code);
    const districtTransactions = transactions.filter(t => t.communityId && districtCommunities.some(c => c.id === t.communityId));

    return {
      name: d.name,
      code: d.code,
      avgPrice: d.avgPrice,
      communityCount: districtCommunities.length,
      transactionCount: districtTransactions.length,
      priceChange: randomInt(-5, 8)
    };
  });

  // 热门小区（按价格排序取前20）
  const hotCommunities = communities
    .sort((a, b) => b.price - a.price)
    .slice(0, 20)
    .map(c => ({
      id: c.id,
      name: c.name,
      district: c.district,
      price: c.price,
      tags: c.tags
    }));

  // 最新成交
  const latestTransactions = transactions.slice(0, 20).map(t => ({
    id: t.id,
    communityName: t.communityName,
    district: t.district,
    layout: t.layout,
    area: t.area,
    totalPrice: t.totalPrice,
    unitPrice: t.unitPrice,
    dealDate: t.dealDate
  }));

  const preloadedData = {
    meta: {
      totalCommunities: communities.length,
      totalTransactions: transactions.length,
      lastUpdate: new Date().toISOString(),
      source: '深圳房产数据（模拟数据）'
    },
    districts: districtStats,
    hotCommunities,
    latestTransactions,
    priceTrends: trends
  };

  return preloadedData;
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('生成深圳房产模拟数据');
  console.log('========================================\n');

  // 1. 生成小区数据
  console.log('1. 生成小区数据...');
  const communities = generateCommunities(200);
  saveData({
    meta: { total: communities.length, generatedAt: new Date().toISOString() },
    data: communities
  }, 'communities.json');

  // 2. 生成成交记录
  console.log('\n2. 生成成交记录...');
  const transactions = generateTransactions(communities, 500);
  saveData({
    meta: { total: transactions.length, generatedAt: new Date().toISOString() },
    data: transactions
  }, 'transactions.json');

  // 3. 生成价格趋势
  console.log('\n3. 生成价格趋势...');
  const trends = generatePriceTrends(communities);
  saveData(trends, 'price-trends.json');

  // 4. 生成预加载数据
  console.log('\n4. 生成预加载数据...');
  const preloadedData = generatePreloadedData(communities, transactions, trends);

  // 保存为 JSON
  saveData(preloadedData, 'preloaded-data.json');

  // 保存为 JS 模块（供小程序使用）
  const jsContent = `// 预加载的深圳房产数据
// 生成时间: ${new Date().toISOString()}
// 数据来源: 模拟数据（基于深圳真实市场情况）

module.exports = ${JSON.stringify(preloadedData, null, 2)};
`;
  fs.writeFileSync(path.join(outputDir, 'preloaded-data.js'), jsContent, 'utf8');
  console.log(`✅ JS模块已保存: ${path.join(outputDir, 'preloaded-data.js')}`);

  // 5. 打印统计
  console.log('\n========================================');
  console.log('数据生成完成！');
  console.log('========================================');
  console.log(`小区总数: ${communities.length}`);
  console.log(`成交记录: ${transactions.length}`);
  console.log(`区域数量: ${districts.length}`);
  console.log('\n各区域统计:');
  districts.forEach(d => {
    const count = communities.filter(c => c.districtCode === d.code).length;
    console.log(`  ${d.name}: ${count} 个小区，均价 ${d.avgPrice} 元/㎡`);
  });
  console.log('\n文件输出:');
  console.log(`  - communities.json: 小区详细数据`);
  console.log(`  - transactions.json: 成交记录`);
  console.log(`  - price-trends.json: 价格趋势`);
  console.log(`  - preloaded-data.js: 小程序预加载数据`);
  console.log('========================================');
}

// 运行
main().catch(console.error);
