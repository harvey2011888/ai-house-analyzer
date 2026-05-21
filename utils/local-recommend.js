/**
 * 本地推荐算法模块
 * 根据用户购房需求，基于规则计算匹配度并生成推荐结果
 */

// 引入数据加载模块获取基础数据
const dataLoader = require('./data-loader');

/**
 * 根据硬性条件筛选小区
 * @param {Array} communities - 小区列表
 * @param {Array} prices - 价格列表
 * @param {Object} requirements - 用户需求条件
 * @returns {Array} 符合条件的小区对象数组
 */
function filterByRequirements(communities, prices, requirements) {
  const { minBudget, maxBudget, minArea, maxArea, layouts, district } = requirements;

  return communities.filter(community => {
    const priceInfo = prices.find(p => p.community_id === community.id);
    if (!priceInfo) return false;

    const unitPrice = priceInfo.current_avg_price;
    const totalPriceMin = (unitPrice * community.avg_area) / 10000;

    // 预算筛选
    if (minBudget !== undefined && totalPriceMin < minBudget) return false;
    if (maxBudget !== undefined && totalPriceMin > maxBudget) return false;

    // 面积筛选
    if (minArea !== undefined && community.avg_area < minArea) return false;
    if (maxArea !== undefined && community.avg_area > maxArea) return false;

    // 户型筛选 - 修复：处理"4室+"匹配"4室"的情况
    if (layouts && layouts.length > 0) {
      const hasMatchingLayout = layouts.some(layout => {
        // 如果用户选择"4室+"，匹配"4室"或"5室"
        if (layout === '4室+') {
          return community.layout_types.some(lt => lt.includes('4室') || lt.includes('5室'));
        }
        // 否则直接匹配
        return community.layout_types.includes(layout);
      });
      if (!hasMatchingLayout) return false;
    }

    // 区域筛选 - 修复：社区数据已经去除了"区"字，只需匹配即可
    if (district && district.length > 0) {
      const isDistrictMatch = district.some(d => {
        // 社区数据已经去掉了"区"字，直接比较
        const userDistrict = d.replace('区', '').replace('新区', '');
        return userDistrict === community.district;
      });
      if (!isDistrictMatch) return false;
    }

    return true;
  }).map(community => {
    const priceInfo = prices.find(p => p.community_id === community.id);
    return { ...community, price_info: priceInfo };
  });
}

/**
 * 计算匹配度分数
 * @returns {number} 匹配度分数（0-100）
 */
function calculateMatchScore(community, price, facilities, requirements) {
  const { minBudget, maxBudget, minArea, maxArea, layouts } = requirements;
  let score = 0;

  // 预算匹配度（30%）
  const unitPrice = price.current_avg_price;
  const totalPrice = (unitPrice * community.avg_area) / 10000;
  const budgetMid = (minBudget + maxBudget) / 2;
  const budgetRange = maxBudget - minBudget;
  let budgetScore = budgetRange > 0 ? Math.max(0, 1 - Math.abs(totalPrice - budgetMid) / (budgetRange / 2)) : 1;
  score += budgetScore * 30;

  // 面积匹配度（25%）
  let areaScore = 0;
  if (minArea !== undefined && maxArea !== undefined) {
    const areaMid = (minArea + maxArea) / 2;
    const areaRange = maxArea - minArea;
    areaScore = areaRange > 0 ? Math.max(0, 1 - Math.abs(community.avg_area - areaMid) / (areaRange / 2)) : 1;
  } else if (minArea !== undefined) {
    areaScore = Math.min(1, community.avg_area / (minArea * 1.5));
  } else if (maxArea !== undefined) {
    areaScore = community.avg_area / maxArea;
  } else {
    areaScore = 0.8;
  }
  score += areaScore * 25;

  // 户型匹配度（20%）
  let layoutScore = 0;
  if (layouts && layouts.length > 0) {
    const matchedLayouts = layouts.filter(layout => {
      // 修复：处理"4室+"匹配"4室"的情况
      if (layout === '4室+') {
        return community.layout_types.some(lt => lt.includes('4室') || lt.includes('5室'));
      }
      return community.layout_types.includes(layout);
    });
    layoutScore = matchedLayouts.length / layouts.length;
    if (layoutScore >= 1) layoutScore = 1;
  } else {
    layoutScore = 0.8;
  }
  score += layoutScore * 20;

  // 配套匹配度（25%）
  let facilityScore = 0;
  if (facilities) {
    let facilityPoints = 0;
    let maxPoints = 4;

    if (facilities.metro && facilities.metro.name) {
      facilityPoints += 1;
      if (facilities.metro.distance < 500) facilityPoints += 0.5;
    }

    if (facilities.schools && facilities.schools.length > 0) {
      facilityPoints += 1;
      if (facilities.schools.length >= 2) facilityPoints += 0.5;
    }

    if (facilities.hospitals && facilities.hospitals.length > 0) facilityPoints += 0.5;

    if (facilities.malls && facilities.malls.length > 0) {
      facilityPoints += 0.5;
      if (facilities.malls.length >= 2) facilityPoints += 0.5;
    }

    facilityScore = Math.min(1, facilityPoints / maxPoints);
  }
  score += facilityScore * 25;

  return Math.round(score);
}

/**
 * 生成推荐理由
 * @returns {Array} 推荐理由字符串数组
 */
function generateReasons(community, price, facilities, requirements) {
  const reasons = [];
  const { minBudget, maxBudget, minArea, maxArea, layouts } = requirements;
  const totalPrice = Math.round((price.current_avg_price * community.avg_area) / 10000);

  if (minBudget !== undefined && maxBudget !== undefined) {
    const budgetMid = (minBudget + maxBudget) / 2;
    if (totalPrice <= maxBudget && totalPrice >= minBudget) {
      if (totalPrice <= budgetMid) {
        reasons.push(`总价约${totalPrice}万元，在您的预算范围内性价比较高`);
      } else {
        reasons.push(`总价约${totalPrice}万元，符合您的预算预期`);
      }
    }
  }

  if (minArea !== undefined && maxArea !== undefined) {
    if (community.avg_area >= minArea && community.avg_area <= maxArea) {
      reasons.push(`平均面积${community.avg_area}㎡，符合您的面积需求`);
    } else if (community.avg_area > maxArea) {
      reasons.push(`平均面积${community.avg_area}㎡，空间宽敞舒适`);
    }
  }

  if (layouts && layouts.length > 0) {
    const matchedLayouts = layouts.filter(layout => {
      // 修复：处理"4室+"匹配"4室"的情况
      if (layout === '4室+') {
        return community.layout_types.some(lt => lt.includes('4室') || lt.includes('5室'));
      }
      return community.layout_types.includes(layout);
    });
    if (matchedLayouts.length > 0) {
      reasons.push(`提供${matchedLayouts.join('、')}户型，满足您的居住需求`);
    }
  }

  if (facilities) {
    if (facilities.metro && facilities.metro.name && facilities.metro.distance < 500) {
      reasons.push(`距${facilities.metro.name}仅${facilities.metro.distance}米，交通便利`);
    } else if (facilities.metro && facilities.metro.name) {
      reasons.push(`靠近${facilities.metro.name}，出行方便`);
    }

    if (facilities.schools && facilities.schools.length > 0) {
      const schoolNames = facilities.schools.slice(0, 2).map(s => s.name).join('、');
      reasons.push(`周边教育资源丰富，有${schoolNames}等`);
    }

    if (facilities.malls && facilities.malls.length > 0) {
      const mallNames = facilities.malls.slice(0, 2).map(m => m.name).join('、');
      reasons.push(`生活配套完善，临近${mallNames}`);
    }
  }

  if (price.yoy_change > 0) {
    reasons.push(`房价同比上涨${price.yoy_change}%，保值增值潜力较好`);
  } else if (price.yoy_change < 0) {
    reasons.push(`房价同比下降${Math.abs(price.yoy_change)}%，入手时机较好`);
  }

  const currentYear = new Date().getFullYear();
  const buildingAge = currentYear - community.build_year;
  if (buildingAge <= 5) {
    reasons.push('次新小区，房屋状况较新');
  } else if (buildingAge <= 15) {
    reasons.push('小区成熟，配套设施完善');
  }

  const finalReasons = reasons.slice(0, 3);
  if (finalReasons.length < 2) {
    finalReasons.push(`${community.district}区优质小区，${community.total_households}户大型社区`);
  }

  return finalReasons;
}

/**
 * 主推荐函数
 * @param {Object} requirements - 用户需求条件
 * @returns {Object} 推荐结果
 */
function recommend(requirements) {
  const communities = dataLoader.getCommunities();
  const prices = dataLoader.getPrices();
  const facilitiesList = dataLoader.getFacilities();

  const filteredCommunities = filterByRequirements(communities, prices, requirements);

  if (filteredCommunities.length === 0) {
    return {
      recommendations: [],
      advice: '抱歉，根据您的需求条件，暂未找到匹配的小区。建议您适当放宽预算范围或面积要求，以便获得更多选择。'
    };
  }

  const recommendations = filteredCommunities.map(community => {
    const price = prices.find(p => p.community_id === community.id);
    const facilities = facilitiesList.find(f => f.community_id === community.id);

    const matchScore = calculateMatchScore(community, price, facilities, requirements);
    const reasons = generateReasons(community, price, facilities, requirements);

    return {
      community: community,
      match_score: matchScore,
      reasons: reasons
    };
  });

  recommendations.sort((a, b) => b.match_score - a.match_score);

  let advice = '';
  const topRecommendation = recommendations[0];

  if (topRecommendation.match_score >= 85) {
    advice = `根据您的需求，为您找到${recommendations.length}个高匹配度小区。其中${topRecommendation.community.name}匹配度最高（${topRecommendation.match_score}分），建议优先考虑。`;
  } else if (topRecommendation.match_score >= 70) {
    advice = `为您筛选出${recommendations.length}个符合条件的小区，${topRecommendation.community.name}整体匹配度较好（${topRecommendation.match_score}分）。建议您结合自身实际情况进一步考察。`;
  } else {
    advice = `根据您的条件找到${recommendations.length}个小区，但整体匹配度一般。建议您适当调整需求条件，或联系专业顾问获取更精准的推荐。`;
  }

  return {
    recommendations: recommendations,
    advice: advice
  };
}

module.exports = {
  filterByRequirements,
  calculateMatchScore,
  generateReasons,
  recommend
};
