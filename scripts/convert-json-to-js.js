/**
 * 将 communities.json 转换为 communities.json.js
 * 用于微信小程序（小程序不支持直接 require JSON）
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../data/communities.json');
const jsPath = path.join(__dirname, '../data/communities.json.js');

// 读取JSON文件
const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
const data = JSON.parse(jsonContent);

// 转换为JS模块格式
const jsContent = `/**
 * 小区数据JSON文件（转换为JS模块以供小程序require）
 * 生成时间: ${new Date().toISOString()}
 * 小区数量: ${data.meta?.total || data.data?.length || 0}
 */

module.exports = ${JSON.stringify(data, null, 2)};
`;

// 写入JS文件
fs.writeFileSync(jsPath, jsContent, 'utf-8');

console.log('转换完成:', jsPath);
console.log('小区数量:', data.data?.length || 0);
