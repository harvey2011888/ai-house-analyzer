/**
 * 测试筛选逻辑的脚本
 * 用于验证 filterByRequirements 函数的正确性
 */

const localRecommend = require('../utils/local-recommend');
const dataLoader = require('../utils/data-loader');

// 获取数据
const communities = dataLoader.getCommunities();
const prices = dataLoader.getPrices();

console.log('=== 数据加载检查 ===');
console.log('小区数量:', communities.length);
console.log('价格数量:', prices.length);

if (communities.length > 0) {
  console.log('\n第一个小区示例:');
  console.log('  ID:', communities[0].id);
  console.log('  名称:', communities[0].name);
  console.log('  区域:', communities[0].district);
  console.log('  户型:', communities[0].layout_types);
  console.log('  平均面积:', communities[0].avg_area);
}

if (prices.length > 0) {
  console.log('\n第一个价格示例:');
  console.log('  小区ID:', prices[0].community_id);
  console.log('  当前均价:', prices[0].current_avg_price);
}

// 检查区域分布
console.log('\n=== 区域分布检查 ===');
const districtCount = {};
communities.forEach(c => {
  districtCount[c.district] = (districtCount[c.district] || 0) + 1;
});
Object.entries(districtCount).forEach(([district, count]) => {
  console.log(`  ${district}: ${count}个小区`);
});

// 检查坪山区数据
console.log('\n=== 坪山区数据检查 ===');
const pingshanCommunities = communities.filter(c => c.district === '坪山');
console.log('坪山区小区数量:', pingshanCommunities.length);

if (pingshanCommunities.length > 0) {
  console.log('\n坪山区小区详情:');
  pingshanCommunities.forEach(c => {
    const price = prices.find(p => p.community_id === c.id);
    const unitPrice = price ? price.current_avg_price : 0;
    const totalPrice = (unitPrice * c.avg_area) / 10000;
    console.log(`  ${c.name}: 单价${unitPrice}元/㎡, 面积${c.avg_area}㎡, 总价${totalPrice.toFixed(1)}万, 户型:[${c.layout_types.join(',')}]`);
  });
}

// 测试用户提供的筛选条件
console.log('\n=== 测试用户筛选条件 ===');
const userRequirements = {
  minBudget: 700,
  maxBudget: 900,
  minArea: 110,
  maxArea: 150,
  district: ['坪山'],
  layouts: ['3室', '4室+']
};
console.log('筛选条件:', JSON.stringify(userRequirements));

// 逐步检查每个条件
console.log('\n逐步筛选分析:');

// 1. 检查区域匹配
const districtMatch = communities.filter(c => {
  return userRequirements.district.some(d => {
    const userDistrict = d.replace('区', '').replace('新区', '');
    return userDistrict === c.district;
  });
});
console.log('1. 区域匹配:', districtMatch.length, '个小区');

// 2. 检查户型匹配
const layoutMatch = districtMatch.filter(c => {
  return userRequirements.layouts.some(layout => {
    if (layout === '4室+') {
      return c.layout_types.some(lt => lt.includes('4室') || lt.includes('5室'));
    }
    return c.layout_types.includes(layout);
  });
});
console.log('2. 户型匹配:', layoutMatch.length, '个小区');

// 3. 检查面积匹配
const areaMatch = layoutMatch.filter(c => {
  return c.avg_area >= userRequirements.minArea && c.avg_area <= userRequirements.maxArea;
});
console.log('3. 面积匹配:', areaMatch.length, '个小区');

// 4. 检查预算匹配
const budgetMatch = areaMatch.filter(c => {
  const price = prices.find(p => p.community_id === c.id);
  if (!price) return false;
  const totalPrice = (price.current_avg_price * c.avg_area) / 10000;
  return totalPrice >= userRequirements.minBudget && totalPrice <= userRequirements.maxBudget;
});
console.log('4. 预算匹配:', budgetMatch.length, '个小区');

// 显示面积匹配但预算不匹配的小区
console.log('\n面积匹配但预算不匹配的小区:');
areaMatch.forEach(c => {
  const price = prices.find(p => p.community_id === c.id);
  if (price) {
    const totalPrice = (price.current_avg_price * c.avg_area) / 10000;
    console.log(`  ${c.name}: 总价${totalPrice.toFixed(1)}万 (超出预算${userRequirements.maxBudget}万)`);
  }
});

// 最终筛选结果
console.log('\n=== 最终筛选结果 ===');
const result = localRecommend.filterByRequirements(communities, prices, userRequirements);
console.log('匹配小区数量:', result.length);

// 测试更宽松的条件（所有区域）
console.log('\n=== 测试更宽松的条件 ===');
const looseRequirements = {
  minBudget: 300,
  maxBudget: 1500,
  minArea: 80,
  maxArea: 200,
  layouts: ['3室']
};
const looseResult = localRecommend.filterByRequirements(communities, prices, looseRequirements);
console.log('宽松条件匹配:', looseResult.length, '个小区');

// 测试只有区域条件
console.log('\n=== 测试仅区域条件 ===');
const districtOnly = {
  district: ['坪山']
};
const districtResult = localRecommend.filterByRequirements(communities, prices, districtOnly);
console.log('仅坪山区:', districtResult.length, '个小区');
