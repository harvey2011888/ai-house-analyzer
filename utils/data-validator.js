/**
 * 数据验证和清洗模块
 * 验证房产数据的完整性和合理性
 * 清洗异常数据，确保数据质量
 */

// 深圳各区域合理价格范围（元/㎡）
const REASONABLE_PRICE_RANGES = {
  '福田': { min: 60000, max: 150000 },
  '南山': { min: 70000, max: 180000 },
  '罗湖': { min: 40000, max: 100000 },
  '宝安': { min: 35000, max: 90000 },
  '龙岗': { min: 25000, max: 60000 },
  '龙华': { min: 35000, max: 80000 },
  '盐田': { min: 30000, max: 60000 },
  '坪山': { min: 25000, max: 50000 },
  '光明': { min: 30000, max: 55000 },
  '大鹏': { min: 20000, max: 45000 }
};

// 合理面积范围（㎡）
const REASONABLE_AREA_RANGE = { min: 20, max: 300 };

// 合理楼龄范围
const REASONABLE_BUILD_YEAR_RANGE = { min: 1980, max: new Date().getFullYear() + 1 };

/**
 * 验证小区数据
 * @param {Object} community - 小区数据
 * @returns {Object} 验证结果 { isValid, errors, warnings }
 */
function validateCommunity(community) {
  const errors = [];
  const warnings = [];

  if (!community) {
    return { isValid: false, errors: ['数据为空'], warnings: [] };
  }

  // 必填字段检查
  if (!community.name) {
    errors.push('缺少小区名称');
  }

  if (!community.district) {
    errors.push('缺少区域信息');
  }

  // 价格合理性检查
  if (community.avg_price) {
    const priceRange = REASONABLE_PRICE_RANGES[community.district];
    if (priceRange) {
      if (community.avg_price < priceRange.min) {
        warnings.push(`价格过低：${community.avg_price}元/㎡，区域合理范围${priceRange.min}-${priceRange.max}元/㎡`);
      } else if (community.avg_price > priceRange.max) {
        warnings.push(`价格过高：${community.avg_price}元/㎡，区域合理范围${priceRange.min}-${priceRange.max}元/㎡`);
      }
    }
  }

  // 面积合理性检查
  if (community.avg_area) {
    if (community.avg_area < REASONABLE_AREA_RANGE.min) {
      warnings.push(`面积过小：${community.avg_area}㎡`);
    } else if (community.avg_area > REASONABLE_AREA_RANGE.max) {
      warnings.push(`面积过大：${community.avg_area}㎡`);
    }
  }

  // 楼龄合理性检查
  if (community.build_year) {
    if (community.build_year < REASONABLE_BUILD_YEAR_RANGE.min) {
      warnings.push(`楼龄过老：${community.build_year}年`);
    } else if (community.build_year > REASONABLE_BUILD_YEAR_RANGE.max) {
      warnings.push(`楼龄异常：${community.build_year}年（未来年份）`);
    }
  }

  // 经纬度检查
  if (community.longitude && community.latitude) {
    if (community.longitude < 113.5 || community.longitude > 114.5) {
      warnings.push(`经度异常：${community.longitude}`);
    }
    if (community.latitude < 22.2 || community.latitude > 22.8) {
      warnings.push(`纬度异常：${community.latitude}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 批量验证小区数据
 * @param {Array} communities - 小区数据数组
 * @returns {Object} 验证结果
 */
function validateCommunities(communities) {
  if (!Array.isArray(communities)) {
    return { valid: [], invalid: [], warnings: [] };
  }

  const valid = [];
  const invalid = [];
  const warnings = [];

  communities.forEach((community, index) => {
    const result = validateCommunity(community);
    
    if (result.isValid) {
      valid.push(community);
    } else {
      invalid.push({
        index,
        community,
        errors: result.errors
      });
    }

    if (result.warnings.length > 0) {
      warnings.push({
        index,
        name: community.name || `小区${index + 1}`,
        warnings: result.warnings
      });
    }
  });

  return { valid, invalid, warnings };
}

/**
 * 清洗小区数据
 * @param {Object} community - 小区数据
 * @returns {Object} 清洗后的数据
 */
function cleanCommunity(community) {
  if (!community) return null;

  const cleaned = { ...community };

  // 清理字符串字段
  if (cleaned.name) {
    cleaned.name = cleaned.name.trim();
  }

  if (cleaned.district) {
    cleaned.district = cleaned.district.replace('新区', '').replace('区', '').trim();
  }

  if (cleaned.address) {
    cleaned.address = cleaned.address.trim();
  }

  // 确保数值字段有效
  if (cleaned.avg_price && typeof cleaned.avg_price === 'string') {
    cleaned.avg_price = parseFloat(cleaned.avg_price) || 0;
  }

  if (cleaned.avg_area && typeof cleaned.avg_area === 'string') {
    cleaned.avg_area = parseFloat(cleaned.avg_area) || 0;
  }

  if (cleaned.build_year && typeof cleaned.build_year === 'string') {
    cleaned.build_year = parseInt(cleaned.build_year) || 0;
  }

  // 确保数组字段有效
  if (cleaned.layout_types && !Array.isArray(cleaned.layout_types)) {
    if (typeof cleaned.layout_types === 'string') {
      cleaned.layout_types = cleaned.layout_types.split(/[、,，]/).map(s => s.trim());
    } else {
      cleaned.layout_types = [];
    }
  }

  return cleaned;
}

/**
 * 批量清洗小区数据
 * @param {Array} communities - 小区数据数组
 * @returns {Array} 清洗后的数据
 */
function cleanCommunities(communities) {
  if (!Array.isArray(communities)) return [];

  return communities
    .map(community => cleanCommunity(community))
    .filter(community => community !== null);
}

/**
 * 验证并清洗数据
 * @param {Array} communities - 小区数据数组
 * @returns {Object} 处理结果
 */
function validateAndClean(communities) {
  // 先清洗
  const cleaned = cleanCommunities(communities);
  
  // 再验证
  const validation = validateCommunities(cleaned);

  return {
    ...validation,
    cleaned,
    summary: {
      total: communities.length,
      cleaned: cleaned.length,
      valid: validation.valid.length,
      invalid: validation.invalid.length,
      warnings: validation.warnings.length
    }
  };
}

/**
 * 获取区域合理价格范围
 * @param {string} district - 区域名称
 * @returns {Object} 价格范围
 */
function getReasonablePriceRange(district) {
  const normalizedDistrict = district.replace('新区', '').replace('区', '');
  return REASONABLE_PRICE_RANGES[normalizedDistrict] || { min: 30000, max: 100000 };
}

/**
 * 检查价格是否合理
 * @param {number} price - 价格
 * @param {string} district - 区域
 * @returns {boolean} 是否合理
 */
function isPriceReasonable(price, district) {
  const range = getReasonablePriceRange(district);
  return price >= range.min && price <= range.max;
}

/**
 * 修正不合理价格
 * @param {number} price - 原始价格
 * @param {string} district - 区域
 * @returns {number} 修正后的价格
 */
function fixUnreasonablePrice(price, district) {
  const range = getReasonablePriceRange(district);
  
  if (price < range.min) {
    return range.min;
  } else if (price > range.max) {
    return range.max;
  }
  
  return price;
}

module.exports = {
  validateCommunity,
  validateCommunities,
  cleanCommunity,
  cleanCommunities,
  validateAndClean,
  getReasonablePriceRange,
  isPriceReasonable,
  fixUnreasonablePrice,
  REASONABLE_PRICE_RANGES
};
