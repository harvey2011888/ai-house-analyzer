/**
 * 将 transactions.json 转换为 JS 模块
 * 微信小程序不支持直接 require JSON 文件
 */

const fs = require('fs');
const path = require('path');

// 读取 JSON 文件
const jsonPath = path.join(__dirname, '..', '..', 'data', 'transactions.json');
const jsPath = path.join(__dirname, '..', '..', 'data', 'transactions-data.js');

const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// 生成 JS 文件内容
const jsContent = `/**
 * 成交记录数据模块
 * 基于最新生成的近6个月成交数据（${jsonData.meta.total}条记录）
 * 时间范围: 2025-11-12 至 2026-05-11
 * 生成时间: ${jsonData.meta.generatedAt}
 */

// 直接嵌入成交数据（微信小程序不支持 require JSON）
const transactionsData = ${JSON.stringify(jsonData, null, 2)};

// 转换数据格式以兼容现有代码
const transactions = transactionsData.data.map(t => ({
  id: t.id,
  community_id: t.communityId,
  community_name: t.communityName,
  district: t.district.replace('区', ''),
  layout: t.layout,
  area: t.area,
  unit_price: t.unitPrice,
  total_price: t.totalPrice,
  deal_date: t.dealDate,
  floor: t.floor,
  tags: t.tags
}));

// 按日期排序（最新的在前）
transactions.sort((a, b) => new Date(b.deal_date) - new Date(a.deal_date));

module.exports = {
  transactions,
  meta: transactionsData.meta
};
`;

fs.writeFileSync(jsPath, jsContent, 'utf8');
console.log(`✅ 已生成: ${jsPath}`);
console.log(`   记录数: ${jsonData.meta.total}`);
