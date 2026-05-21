/**
 * 调试过滤功能的测试脚本
 */

const localRecommend = require('./utils/local-recommend.js');
const dataLoader = require('./utils/data-loader.js');

// 获取数据
const communities = dataLoader.getCommunities();
const prices = dataLoader.getPrices();

console.log(`总共有 ${communities.length} 个小区`);
console.log(`总共有 ${prices.length} 个价格数据`);

// 测试一些基本的过滤条件
const testRequirements = {
  minBudget: 2,  // 2万元
  maxBudget: 1000, // 1000万元
  minArea: 40,   // 40平米
  maxArea: 200,  // 200平米
  layouts: [],   // 不限制户型
  district: []   // 不限制区域
};

console.log('\n测试不过滤任何条件:');
const allResults = localRecommend.filterByRequirements(communities, prices, {
  layouts: [],
  district: []
});
console.log(`不过滤条件的结果数量: ${allResults.length}`);

console.log('\n测试只按预算过滤 (2-1000万):');
const budgetResults = localRecommend.filterByRequirements(communities, prices, {
  minBudget: 2,
  maxBudget: 1000,
  layouts: [],
  district: []
});
console.log(`预算过滤的结果数量: ${budgetResults.length}`);

console.log('\n测试只按区域过滤 (例如: 龙岗):');
const districtResults = localRecommend.filterByRequirements(communities, prices, {
  layouts: [],
  district: ['龙岗']
});
console.log(`区域过滤的结果数量: ${districtResults.length}`);

console.log('\n测试只按户型过滤 (例如: 2室):');
const layoutResults = localRecommend.filterByRequirements(communities, prices, {
  layouts: ['2室'],
  district: []
});
console.log(`户型过滤的结果数量: ${layoutResults.length}`);

console.log('\n测试综合过滤:');
const combinedResults = localRecommend.filterByRequirements(communities, prices, testRequirements);
console.log(`综合过滤的结果数量: ${combinedResults.length}`);

// 输出前几个结果作为示例
if (combinedResults.length > 0) {
  console.log('\n前3个结果示例:');
  combinedResults.slice(0, 3).forEach((result, index) => {
    const priceInfo = result.price_info;
    const totalPrice = Math.round((priceInfo.current_avg_price * result.avg_area) / 10000);
    console.log(`${index + 1}. ${result.name} - ${result.district}区 - ${totalPrice}万元 - ${result.avg_area}㎡ - 单价${priceInfo.current_avg_price}元/㎡`);
  });
} else {
  console.log('\n没有找到符合条件的结果');
}

// 检查数据结构
console.log('\n数据结构检查:');
if (communities.length > 0) {
  const sampleCommunity = communities[0];
  console.log('样本小区数据结构:', Object.keys(sampleCommunity));
  console.log('样本小区:', {
    id: sampleCommunity.id,
    name: sampleCommunity.name,
    district: sampleCommunity.district,
    avg_area: sampleCommunity.avg_area,
    layout_types: sampleCommunity.layout_types
  });
}

if (prices.length > 0) {
  const samplePrice = prices[0];
  console.log('样本价格数据结构:', Object.keys(samplePrice));
  console.log('样本价格:', {
    community_id: samplePrice.community_id,
    current_avg_price: samplePrice.current_avg_price
  });
}