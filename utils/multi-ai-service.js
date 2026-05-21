/**
 * 多AI讨论服务模块
 * 结合千问和混元两个AI的回答，进行三轮讨论后综合推荐
 * 包含区域验证机制，确保推荐的小区在用户指定区域内
 */

const qianwenService = require('./ai-service');
const hunyuanService = require('./hunyuan-service');

/**
 * 验证推荐结果的区域是否正确
 * @param {Object} result - AI推荐结果
 * @param {Array} targetDistricts - 用户目标区域
 * @returns {Object} 验证后的结果
 */
function validateRecommendations(result, targetDistricts) {
  // 防御性检查：确保result是有效对象
  if (!result || typeof result !== 'object') {
    console.warn('validateRecommendations: result无效');
    return {
      advice: '数据格式错误',
      recommendations: [],
      _invalidRecommendations: [],
      _isValid: true
    };
  }

  if (!targetDistricts || targetDistricts.length === 0) {
    return result; // 用户未指定区域，不验证
  }

  const validRecommendations = [];
  const invalidRecommendations = [];

  // 防御性检查：确保recommendations是数组
  const recommendations = result.recommendations || [];
  if (!Array.isArray(recommendations)) {
    console.warn('validateRecommendations: recommendations不是数组');
    return {
      ...result,
      recommendations: [],
      _invalidRecommendations: [],
      _isValid: true
    };
  }

  recommendations.forEach((rec, index) => {
    // 防御性检查：确保rec是对象
    if (!rec || typeof rec !== 'object') {
      console.warn(`validateRecommendations: 第${index}个推荐项无效`);
      return;
    }

    const recDistrict = rec.district || '';
    const recName = rec.name || rec.community_name || `未知小区${index + 1}`;

    // 检查推荐的小区区域是否在用户选择的区域内
    const isValid = targetDistricts.some(target => {
      // 处理"新区"的情况
      const normalizedTarget = target.replace('新区', '').replace('区', '');
      const normalizedRec = recDistrict.replace('新区', '').replace('区', '');
      return normalizedTarget === normalizedRec ||
             recDistrict.includes(target) ||
             target.includes(recDistrict);
    });

    if (isValid) {
      validRecommendations.push(rec);
    } else {
      console.warn(`区域验证失败: ${recName} 的区域 ${recDistrict} 不在用户选择的 ${targetDistricts.join('、')} 中`);
      invalidRecommendations.push(rec);
    }
  });

  return {
    ...result,
    recommendations: validRecommendations,
    _invalidRecommendations: invalidRecommendations,
    _isValid: invalidRecommendations.length === 0
  };
}

/**
 * 将推荐结果转换为文本格式（用于AI间交流）
 * @param {Object} result - AI推荐结果
 * @param {string} aiName - AI名称
 * @returns {string} 格式化文本
 */
function resultToText(result, aiName) {
  // 防御性检查：确保result是有效对象
  if (!result || typeof result !== 'object') {
    return `${aiName}未返回有效结果\n`;
  }

  let text = `${aiName}的推荐：\n`;
  text += `整体建议：${result.advice || '未提供整体建议'}\n\n`;

  // 防御性检查：确保recommendations是数组
  const recommendations = result.recommendations || [];
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    text += '未提供具体小区推荐\n';
    return text;
  }

  recommendations.forEach((rec, index) => {
    // 防御性检查：确保rec是对象
    if (!rec || typeof rec !== 'object') {
      text += `推荐${index + 1}：数据格式错误\n\n`;
      return;
    }

    const name = rec.name || rec.community_name || '未知小区';
    const district = rec.district || '未知区域';
    const price = rec.avg_price || rec.price || '未知';
    const area = rec.avg_area || rec.area || '未知';
    const layouts = (rec.layout_types || rec.layouts || []);
    const matchScore = rec.match_score || '未知';
    const reasons = (rec.reasons || []);
    const pros = (rec.pros || []);
    const cons = (rec.cons || []);

    text += `推荐${index + 1}：${name}\n`;
    text += `- 区域：${district}\n`;
    text += `- 均价：${price}元/㎡\n`;
    text += `- 面积：${area}㎡\n`;
    text += `- 户型：${Array.isArray(layouts) ? layouts.join('、') : layouts}\n`;
    text += `- 匹配度：${matchScore}分\n`;
    text += `- 推荐理由：${Array.isArray(reasons) ? reasons.join('；') : reasons}\n`;
    text += `- 优点：${Array.isArray(pros) ? pros.join('、') : pros}\n`;
    text += `- 缺点：${Array.isArray(cons) ? cons.join('、') : cons}\n\n`;
  });

  return text;
}

/**
 * 第一轮：两个AI独立给出推荐
 * @param {Object} requirements - 用户需求
 * @returns {Promise} {qianwenResult, hunyuanResult}
 */
async function roundOne(requirements) {
  console.log('\n========== 第一轮：独立推荐 ==========');
  console.log('【用户需求】:', JSON.stringify(requirements, null, 2));

  const [qianwenResult, hunyuanResult] = await Promise.all([
    qianwenService.getAIRecommendation(requirements, []).catch(err => {
      console.error('千问AI调用失败:', err);
      return null;
    }),
    hunyuanService.getHunyuanRecommendation(requirements).catch(err => {
      console.error('混元AI调用失败:', err);
      return null;
    })
  ]);

  // 验证区域正确性
  const targetDistricts = requirements.district || [];
  const validatedQianwen = qianwenResult ? validateRecommendations(qianwenResult, targetDistricts) : null;
  const validatedHunyuan = hunyuanResult ? validateRecommendations(hunyuanResult, targetDistricts) : null;

  console.log('\n========== 第一轮结果汇总 ==========');
  console.log('【千问AI推荐】:', JSON.stringify(validatedQianwen, null, 2));
  console.log('【混元AI推荐】:', JSON.stringify(validatedHunyuan, null, 2));

  if (validatedQianwen && !validatedQianwen._isValid) {
    console.warn(`千问AI有 ${validatedQianwen._invalidRecommendations.length} 个推荐区域不正确`);
  }
  if (validatedHunyuan && !validatedHunyuan._isValid) {
    console.warn(`混元AI有 ${validatedHunyuan._invalidRecommendations.length} 个推荐区域不正确`);
  }

  return { qianwenResult: validatedQianwen, hunyuanResult: validatedHunyuan };
}

/**
 * 第二轮：两个AI互相评审对方推荐
 * @param {Object} requirements - 用户需求
 * @param {Object} qianwenResult - 千问推荐结果
 * @param {Object} hunyuanResult - 混元推荐结果
 * @returns {Promise} {qianwenReview, hunyuanReview}
 */
async function roundTwo(requirements, qianwenResult, hunyuanResult) {
  console.log('\n========== 第二轮：互相评审 ==========');

  const qianwenText = qianwenResult ? resultToText(qianwenResult, '千问AI') : '千问AI未给出推荐';
  const hunyuanText = hunyuanResult ? resultToText(hunyuanResult, '混元AI') : '混元AI未给出推荐';

  // 千问评审混元的推荐
  const qianwenReviewContext = `请评审另一位AI顾问的推荐意见，并给出你的专业看法：\n\n${hunyuanText}\n\n请分析以上推荐的优缺点，并说明你是否同意这些推荐。特别注意检查推荐的小区是否都在用户指定的区域内。`;
  console.log('\n【千问评审提示词】:', qianwenReviewContext);

  const qianwenReviewPromise = qianwenResult ?
    qianwenService.getAIRecommendation(requirements, qianwenReviewContext).catch(err => {
      console.error('千问评审失败:', err);
      return null;
    }) : Promise.resolve(null);

  // 混元评审千问的推荐
  const hunyuanReviewContext = `请评审另一位AI顾问的推荐意见，并给出你的专业看法：\n\n${qianwenText}\n\n请分析以上推荐的优缺点，并说明你是否同意这些推荐。特别注意检查推荐的小区是否都在用户指定的区域内。`;
  console.log('\n【混元评审提示词】:', hunyuanReviewContext);

  const hunyuanReviewPromise = hunyuanResult ?
    hunyuanService.getHunyuanRecommendation(requirements, hunyuanReviewContext).catch(err => {
      console.error('混元评审失败:', err);
      return null;
    }) : Promise.resolve(null);

  const [qianwenReview, hunyuanReview] = await Promise.all([qianwenReviewPromise, hunyuanReviewPromise]);

  console.log('\n========== 第二轮结果汇总 ==========');
  console.log('【千问评审结果】:', JSON.stringify(qianwenReview, null, 2));
  console.log('【混元评审结果】:', JSON.stringify(hunyuanReview, null, 2));

  return { qianwenReview, hunyuanReview };
}

/**
 * 第三轮：综合讨论，形成最终推荐
 * @param {Object} requirements - 用户需求
 * @param {Object} qianwenResult - 千问推荐结果
 * @param {Object} hunyuanResult - 混元推荐结果
 * @param {Object} qianwenReview - 千问评审意见
 * @param {Object} hunyuanReview - 混元评审意见
 * @returns {Promise} 最终推荐结果
 */
async function roundThree(requirements, qianwenResult, hunyuanResult, qianwenReview, hunyuanReview) {
  console.log('\n========== 第三轮：综合决策 ==========');

  // 构建综合讨论的上下文
  let discussionContext = '经过两轮讨论，两位AI顾问的意见如下：\n\n';

  if (qianwenResult) {
    discussionContext += resultToText(qianwenResult, '千问AI（第一轮）');
  }

  if (hunyuanResult) {
    discussionContext += resultToText(hunyuanResult, '混元AI（第一轮）');
  }

  // 防御性检查：qianwenReview可能是字符串或对象
  if (qianwenReview) {
    if (typeof qianwenReview === 'string') {
      discussionContext += `\n千问AI的评审意见：${qianwenReview}\n\n`;
    } else if (qianwenReview.advice) {
      discussionContext += `\n千问AI的评审意见：${qianwenReview.advice}\n\n`;
    } else if (qianwenReview.recommendations) {
      discussionContext += `\n千问AI的评审意见：${resultToText(qianwenReview, '千问AI')}\n\n`;
    }
  }

  // 防御性检查：hunyuanReview可能是字符串或对象
  if (hunyuanReview) {
    if (typeof hunyuanReview === 'string') {
      discussionContext += `\n混元AI的评审意见：${hunyuanReview}\n\n`;
    } else if (hunyuanReview.advice) {
      discussionContext += `\n混元AI的评审意见：${hunyuanReview.advice}\n\n`;
    } else if (hunyuanReview.recommendations) {
      discussionContext += `\n混元AI的评审意见：${resultToText(hunyuanReview, '混元AI')}\n\n`;
    }
  }

  discussionContext += '\n请作为最终决策者，综合以上两位AI顾问的推荐和评审意见，给出最终的3个小区推荐。要求：\n';
  discussionContext += '1. 综合考虑两位AI的意见，选择最优的3个小区\n';
  discussionContext += '2. 如果两位AI推荐了相同的小区，优先选择（说明共识）\n';
  discussionContext += '3. 必须确保所有推荐的小区都在用户指定的区域内\n';
  discussionContext += '4. 给出最终的整体购房建议\n';
  discussionContext += '5. 严格按照JSON格式输出\n';

  console.log('\n【第三轮决策提示词】:', discussionContext);

  // 使用千问作为最终决策者
  const finalResult = await qianwenService.getAIRecommendation(requirements, discussionContext).catch(err => {
    console.error('最终决策失败:', err);
    return null;
  });

  console.log('\n========== 第三轮结果 ==========');
  console.log('【千问最终决策】:', JSON.stringify(finalResult, null, 2));

  if (finalResult) {
    // 验证最终结果的区域
    const validatedFinal = validateRecommendations(finalResult, requirements.district || []);
    if (!validatedFinal._isValid) {
      console.warn('最终推荐仍有区域不正确的，过滤掉');
    }
    return validatedFinal;
  }

  // 如果千问失败，尝试使用混元
  const hunyuanFinal = await hunyuanService.getHunyuanRecommendation(requirements, discussionContext).catch(err => {
    console.error('混元最终决策失败:', err);
    return null;
  });

  console.log('【混元最终决策】:', JSON.stringify(hunyuanFinal, null, 2));

  if (hunyuanFinal) {
    const validatedFinal = validateRecommendations(hunyuanFinal, requirements.district || []);
    return validatedFinal;
  }

  // 如果都失败，返回其中一个的结果
  return qianwenResult || hunyuanResult || {
    advice: 'AI讨论过程中出现错误，请稍后重试。',
    recommendations: []
  };
}

/**
 * 多AI讨论推荐主函数
 * 进行三轮讨论后给出最终推荐
 * @param {Object} requirements - 用户需求
 * @returns {Promise} 最终推荐结果
 */
async function getMultiAIRecommendation(requirements) {
  console.log('\n========================================');
  console.log('启动多AI讨论推荐模式');
  console.log('用户要求区域:', requirements.district);
  console.log('========================================');
  
  try {
    // 第一轮：独立推荐
    const { qianwenResult, hunyuanResult } = await roundOne(requirements);
    
    // 检查是否至少有一个AI成功
    if (!qianwenResult && !hunyuanResult) {
      throw new Error('两个AI都调用失败');
    }
    
    // 第二轮：互相评审
    const { qianwenReview, hunyuanReview } = await roundTwo(requirements, qianwenResult, hunyuanResult);
    
    // 第三轮：综合决策
    const finalResult = await roundThree(requirements, qianwenResult, hunyuanResult, qianwenReview, hunyuanReview);
    
    console.log('\n========================================');
    console.log('多AI讨论完成');
    const finalRecs = finalResult && finalResult.recommendations ? finalResult.recommendations : [];
    console.log('最终推荐数量:', finalRecs.length);
    console.log('========================================');
    
    return finalResult;
    
  } catch (error) {
    console.error('多AI讨论失败:', error);
    // 降级到单个AI
    console.log('降级到单个AI推荐...');
    
    // 先尝试千问
    try {
      const qianwenResult = await qianwenService.getAIRecommendation(requirements, []);
      const validated = validateRecommendations(qianwenResult, requirements.district || []);
      return validated;
    } catch (qianwenErr) {
      console.error('千问也失败了:', qianwenErr);
    }
    
    // 再尝试混元
    try {
      const hunyuanResult = await hunyuanService.getHunyuanRecommendation(requirements);
      const validated = validateRecommendations(hunyuanResult, requirements.district || []);
      return validated;
    } catch (hunyuanErr) {
      console.error('混元也失败了:', hunyuanErr);
    }
    
    // 都失败了
    return {
      advice: 'AI服务暂时不可用，请稍后重试。',
      recommendations: []
    };
  }
}

module.exports = {
  getMultiAIRecommendation,
  roundOne,
  roundTwo,
  roundThree,
  resultToText,
  validateRecommendations
};
