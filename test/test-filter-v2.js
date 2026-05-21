/**
 * 测试筛选逻辑的脚本 v2
 * 验证修复后的筛选逻辑
 */

const localRecommend = require('../utils/local-recommend');
const dataLoader = require('../utils/data-loader');

// 获取数据
const communities = dataLoader.getCommunities();
const prices = dataLoader.getPrices();

console.log('=== 修复后筛选逻辑测试 ===\n');

// 测试1: 用户原始条件（坪山 + 700-900万）
console.log('测试1: 用户原始条件（坪山 + 700-900万 + 110-150㎡）');
const test1 = {
  minBudget: 700,
  maxBudget: 900,
  minArea: 110,
  maxArea: 150,
  district: ['坪山'],
  layouts: ['3室', '4室+']
};
const result1 = localRecommend.filterByRequirements(communities, prices, test1);
console.log('  结果:', result1.length, '个小区（预期: 0，因为坪山最高总价约662万）');

// 测试2: 调整预算为300-600万（坪山合理范围）
console.log('\n测试2: 坪山 + 300-600万预算 + 110-150㎡');
const test2 = {
  minBudget: 300,
  maxBudget: 600,
  minArea: 110,
  maxArea: 150,
  district: ['坪山'],
  layouts: ['3室', '4室+']
};
const result2 = localRecommend.filterByRequirements(communities, prices, test2);
console.log('  结果:', result2.length, '个小区');
result2.forEach(c => {
  const totalPrice = ((c.price_info.current_avg_price * c.avg_area) / 10000).toFixed(1);
  console.log(`    - ${c.name}: ${c.avg_area}㎡, ${totalPrice}万, [${c.layout_types.join(',')}]`);
});

// 测试3: 福田区 + 700-900万（应该能匹配到）
console.log('\n测试3: 福田 + 700-900万预算 + 110-150㎡');
const test3 = {
  minBudget: 700,
  maxBudget: 900,
  minArea: 110,
  maxArea: 150,
  district: ['福田'],
  layouts: ['3室', '4室+']
};
const result3 = localRecommend.filterByRequirements(communities, prices, test3);
console.log('  结果:', result3.length, '个小区');
result3.slice(0, 5).forEach(c => {
  const totalPrice = ((c.price_info.current_avg_price * c.avg_area) / 10000).toFixed(1);
  console.log(`    - ${c.name}: ${c.avg_area}㎡, ${totalPrice}万, [${c.layout_types.join(',')}]`);
});

// 测试4: 仅区域条件
console.log('\n测试4: 仅区域条件 - 坪山区');
const test4 = { district: ['坪山'] };
const result4 = localRecommend.filterByRequirements(communities, prices, test4);
console.log('  结果:', result4.length, '个小区');

// 测试5: 仅户型条件
console.log('\n测试5: 仅户型条件 - 3室');
const test5 = { layouts: ['3室'] };
const result5 = localRecommend.filterByRequirements(communities, prices, test5);
console.log('  结果:', result5.length, '个小区');

// 测试6: 仅预算条件
console.log('\n测试6: 仅预算条件 - 500-800万');
const test6 = { minBudget: 500, maxBudget: 800 };
const result6 = localRecommend.filterByRequirements(communities, prices, test6);
console.log('  结果:', result6.length, '个小区');

// 测试7: 仅面积条件
console.log('\n测试7: 仅面积条件 - 110-150㎡');
const test7 = { minArea: 110, maxArea: 150 };
const result7 = localRecommend.filterByRequirements(communities, prices, test7);
console.log('  结果:', result7.length, '个小区');

// 测试8: 全深圳 + 宽松条件
console.log('\n测试8: 全深圳 + 300-1500万 + 80-200㎡ + 3室/4室+');
const test8 = {
  minBudget: 300,
  maxBudget: 1500,
  minArea: 80,
  maxArea: 200,
  layouts: ['3室', '4室+']
};
const result8 = localRecommend.filterByRequirements(communities, prices, test8);
console.log('  结果:', result8.length, '个小区');

console.log('\n=== 测试完成 ===');
