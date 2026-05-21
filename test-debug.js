/**
 * 调试脚本 - 检查数据流和筛选逻辑
 */

const dataLoader = require('./utils/data-loader.js');
const localRecommend = require('./utils/local-recommend.js');

// 获取数据
const communities = dataLoader.getCommunities();
const prices = dataLoader.getPrices();

console.log('=== 数据加载检查 ===');
console.log(`小区数量: ${communities.length}`);
console.log(`价格数量: ${prices.length}`);

// 检查第一个小区的数据
if (communities.length > 0) {
  const firstCommunity = communities[0];
  console.log('\n=== 第一个小区数据 ===');
  console.log('ID:', firstCommunity.id);
  console.log('名称:', firstCommunity.name);
  console.log('区域:', firstCommunity.district);
  console.log('户型:', firstCommunity.layout_types);
  console.log('平均面积:', firstCommunity.avg_area);
  
  // 查找对应的价格
  const priceInfo = prices.find(p => p.community_id === firstCommunity.id);
  if (priceInfo) {
    console.log('单价:', priceInfo.current_avg_price);
    const totalPrice = (priceInfo.current_avg_price * firstCommunity.avg_area) / 10000;
    console.log('总价:', totalPrice, '万元');
  } else {
    console.log('未找到价格数据！');
  }
}

// 检查坪山区的小区
const pingshanCommunities = communities.filter(c => c.district === '坪山');
console.log('\n=== 坪山区小区 ===');
console.log(`坪山区小区数量: ${pingshanCommunities.length}`);

if (pingshanCommunities.length > 0) {
  // 显示前3个坪山区小区
  pingshanCommunities.slice(0, 3).forEach(community => {
    const priceInfo = prices.find(p => p.community_id === community.id);
    const totalPrice = priceInfo ? (priceInfo.current_avg_price * community.avg_area) / 10000 : 0;
    console.log(`- ${community.name}: 区域=${community.district}, 户型=${community.layout_types.join(',')}, 面积=${community.avg_area}㎡, 单价=${priceInfo ? priceInfo.current_avg_price : 'N/A'}, 总价=${Math.round(totalPrice)}万`);
  });
}

// 测试用户提供的筛选条件
const userRequirements = {
  minBudget: 700,
  maxBudget: 900,
  minArea: 110,
  maxArea: 150,
  district: ['坪山'],
  layouts: ['3室', '4室+']
};

console.log('\n=== 测试筛选条件 ===');
console.log('条件:', JSON.stringify(userRequirements));

// 逐步检查每个条件
console.log('\n--- 逐步筛选检查 ---');

// 1. 检查所有小区
let step1 = communities;
console.log(`1. 所有小区: ${step1.length}个`);

// 2. 检查有价格数据的小区
let step2 = step1.filter(community => {
  const priceInfo = prices.find(p => p.community_id === community.id);
  return !!priceInfo;
});
console.log(`2. 有价格数据的小区: ${step2.length}个`);

// 3. 检查坪山区的小区
let step3 = step2.filter(community => {
  return community.district === '坪山';
});
console.log(`3. 坪山区的小区: ${step3.length}个`);

// 4. 检查有3室或4室户型的小区
let step4 = step3.filter(community => {
  return community.layout_types.some(lt => lt.includes('3室') || lt.includes('4室'));
});
console.log(`4. 有3室或4室户型的小区: ${step4.length}个`);

// 5. 检查面积在110-150之间的小区
let step5 = step4.filter(community => {
  return community.avg_area >= 110 && community.avg_area <= 150;
});
console.log(`5. 面积在110-150㎡的小区: ${step5.length}个`);

// 6. 检查总价在700-900万之间的小区
let step6 = step5.filter(community => {
  const priceInfo = prices.find(p => p.community_id === community.id);
  const totalPrice = (priceInfo.current_avg_price * community.avg_area) / 10000;
  return totalPrice >= 700 && totalPrice <= 900;
});
console.log(`6. 总价在700-900万的小区: ${step6.length}个`);

// 显示符合条件的坪山区小区
if (step6.length > 0) {
  console.log('\n=== 符合条件的坪山区小区 ===');
  step6.forEach(community => {
    const priceInfo = prices.find(p => p.community_id === community.id);
    const totalPrice = (priceInfo.current_avg_price * community.avg_area) / 10000;
    console.log(`- ${community.name}: 面积=${community.avg_area}㎡, 单价=${priceInfo.current_avg_price}, 总价=${Math.round(totalPrice)}万`);
  });
} else {
  console.log('\n=== 没有符合条件的坪山区小区 ===');
  console.log('让我们看看坪山区小区的总价范围:');
  step5.forEach(community => {
    const priceInfo = prices.find(p => p.community_id === community.id);
    const totalPrice = (priceInfo.current_avg_price * community.avg_area) / 10000;
    console.log(`- ${community.name}: 面积=${community.avg_area}㎡, 单价=${priceInfo.current_avg_price}, 总价=${Math.round(totalPrice)}万`);
  });
}

// 使用正式的筛选函数
console.log('\n=== 使用正式筛选函数 ===');
const filteredResults = localRecommend.filterByRequirements(communities, prices, userRequirements);
console.log(`筛选结果: ${filteredResults.length}个`);

// 测试其他区域
console.log('\n=== 测试其他区域（不限制预算） ===');
const allDistricts = ['福田', '南山', '罗湖', '宝安', '龙岗', '龙华', '盐田', '坪山', '光明', '大鹏'];
allDistricts.forEach(district => {
  const testRequirements = {
    district: [district],
    layouts: ['3室', '4室+']
  };
  const results = localRecommend.filterByRequirements(communities, prices, testRequirements);
  console.log(`${district}区: ${results.length}个小区`);
});