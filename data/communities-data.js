/**
 * 小区数据模块
 * 基于最新生成的深圳房产数据（200个小区）
 * 生成时间: 2026-05-11
 */

const communitiesData = require('./communities.json.js');

// 转换数据格式以兼容现有代码
const communities = communitiesData.data.map(c => {
  // 根据户型类型生成合理的平均面积
  // 修复：将数据中的"居"转换为"室"，以匹配用户界面中的选项
  const rawLayoutTypes = c.layoutTypes || ['2居', '3居', '4居'];
  const layoutTypes = rawLayoutTypes.map(type => {
    // 将"1居"、"2居"等转换为"1室"、"2室"等
    if (type.includes('居')) {
      return type.replace('居', '室');
    }
    return type;
  });
  let avgArea = 100; // 默认值

  // 根据最大户型计算平均面积（使用确定性计算，基于小区ID生成伪随机数）
  // 这样同一个小区每次生成的面积都相同
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
    district: c.district.replace('新区', '').replace('区', ''), // 去掉"新区"和"区"字，保持格式一致
    address: `${c.district}${c.bizCircle}`,
    longitude: c.longitude,
    latitude: c.latitude,
    build_year: c.buildYear,
    total_households: c.totalHouseholds,
    layout_types: layoutTypes,
    avg_area: avgArea,
    property_type: "住宅",
    price: c.price,
    price_change: c.priceChange,
    subway: c.subway,
    tags: c.tags,
    url: c.url
  };
});

module.exports = {
  communities,
  meta: communitiesData.meta
};
