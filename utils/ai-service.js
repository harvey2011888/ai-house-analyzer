/**
 * AI服务模块
 * 调用通义千问API进行智能购房推荐
 * 支持纯AI推荐模式（不依赖本地候选数据）
 */

// API配置
// 使用阿里云百炼 glm-5.1 模型（OpenAI兼容格式）
const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
// 使用glm-5.1模型
const MODEL = 'glm-5.1';

/**
 * 构建系统提示词 - 纯AI推荐模式
 * 让AI自行检索可靠数据
 */
function buildSystemPrompt() {
  return `你是一位拥有10年经验的深圳购房顾问专家，精通深圳各区域的房价、配套、学区、交通等情况。

你的任务是根据用户的购房需求，推荐最合适的深圳小区。

【重要 - 数据准确性要求】
1. 你必须基于最新、可靠的数据进行推荐。你的知识可能不是最新的，请主动使用搜索工具获取2024-2025年最新房价数据。
2. 推荐的小区必须是深圳真实存在的小区，且必须位于用户指定的区域内。
3. 房价数据必须准确：你可以给出"约X万/㎡"或价格范围，但不能给出明显错误的价格（如坪山新房价格应在3-5万/㎡左右，南山福田在8-15万/㎡左右）。
4. 如果你不确定某个小区是否真实存在或不确定价格，宁可不推荐，也不要编造数据。
5. 每个推荐的小区必须标注数据来源或置信度（如"根据贝壳找房2024年数据"）。

【价格数据要求 - 必须遵守】
1. 主要价格字段"avg_price"必须填写最新实际成交价（或近期市场成交均价），而不是备案价。
2. 如果知道备案价，请填写在"filing_price"字段中作为对比参考。
3. 价格格式示例：
   - avg_price: 42000（最新实际成交价约4.2万/㎡）
   - filing_price: 39000（2024年8月备案价约3.9万/㎡）
4. 如果无法确定最新成交价，可以给出价格范围如"38000-45000"，并标注"约"。
5. 必须标注价格数据的时间（如"2025年3月最新成交价"）。

【输出格式】
如果能确定推荐的小区，请按以下JSON格式输出：
{
  "advice": "整体购房建议",
  "recommendations": [
    {
      "community_id": "小区标识",
      "name": "小区名称",
      "district": "所在区域",
      "avg_price": 42000,
      "filing_price": 39000,
      "price_date": "2025年3月",
      "avg_area": 90,
      "layout_types": ["3室"],
      "build_year": 2018,
      "match_score": 90,
      "reasons": ["理由1", "理由2"],
      "pros": ["优点1"],
      "cons": ["缺点1"],
      "data_source": "数据来源说明"
    }
  ]
}

如果不确定某小区，请返回：
{"error": "无法确定推荐的小区信息，请用户提供更多线索"}`;
}

/**
 * 构建用户提示词
 */
function buildUserPrompt(requirements) {
  const reqText = JSON.stringify(requirements, null, 2);

  const districts = requirements.district || [];
  const districtStr = districts.length > 0 ? districts.join('、') : '未指定';

  // 计算预算范围提示
  let budgetHint = '';
  if (requirements.minBudget && requirements.maxBudget) {
    budgetHint = `\n用户预算范围：${requirements.minBudget}万 - ${requirements.maxBudget}万`;
  }

  // 计算面积范围提示
  let areaHint = '';
  if (requirements.minArea && requirements.maxArea) {
    areaHint = `\n用户面积需求：${requirements.minArea}㎡ - ${requirements.maxArea}㎡`;
  }

  // 户型提示
  let layoutHint = '';
  if (requirements.layouts && requirements.layouts.length > 0) {
    layoutHint = `\n用户户型需求：${requirements.layouts.join('、')}`;
  }

  return `用户需求：
${reqText}

用户选择的区域是：${districtStr}${budgetHint}${areaHint}${layoutHint}

请根据用户需求，推荐${districtStr !== '未指定' ? '该区域内' : ''}的小区。

【强制要求 - 必须遵守】
1. 区域约束：推荐的小区必须严格位于"${districtStr}"区域内，绝对不能推荐其他区域的小区。
2. 预算约束：推荐小区的均价应在用户预算范围内，如果超出预算需要特别说明原因。
3. 真实性约束：只推荐你100%确定真实存在的小区。如果不确定，宁可返回error也不要编造。
4. 价格准确性：房价数据必须合理。如果不确定具体价格，请给出"约X万/㎡"的范围估计，并标注数据来源。
5. 输出格式：严格按照JSON格式输出，不要添加任何其他文字。`;
}

/**
 * 验证推荐结果
 */
function validateDistrict(result, targetDistricts) {
  if (!targetDistricts || targetDistricts.length === 0) {
    return result;
  }

  const validRecommendations = [];
  result.recommendations.forEach(rec => {
    const recDistrict = rec.district || '';
    const isValid = targetDistricts.some(target => {
      const normalizedTarget = target.replace('新区', '').replace('区', '');
      const normalizedRec = recDistrict.replace('新区', '').replace('区', '');
      return normalizedTarget === normalizedRec;
    });
    if (isValid) {
      validRecommendations.push(rec);
    }
  });

  return {
    ...result,
    recommendations: validRecommendations
  };
}

/**
 * 调用AI推荐服务
 * @param {Object} requirements - 用户需求
 * @param {string|Array} context - 上下文信息（用于多轮讨论）
 */
function getAIRecommendation(requirements, context) {
  return new Promise((resolve, reject) => {
    const app = getApp();
    const apiKey = app.globalData.qianwenApiKey;

    if (!apiKey) {
      reject(new Error('未配置API Key'));
      return;
    }

    const systemPrompt = buildSystemPrompt();
    let userPrompt = buildUserPrompt(requirements);

    // 如果有上下文（多轮讨论），追加到用户提示词中
    if (context) {
      if (typeof context === 'string') {
        userPrompt += '\n\n【讨论上下文】\n' + context;
      } else if (Array.isArray(context)) {
        userPrompt += '\n\n【讨论上下文】\n' + context.join('\n');
      }
    }

    console.log('========== 千问AI调用 ==========');
    console.log('【系统提示词】:', systemPrompt);
    console.log('【用户提示词】:', userPrompt);
    console.log('用户要求区域:', requirements.district);

    wx.request({
      url: API_URL,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      data: {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.3
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.choices && res.data.choices.length > 0) {
          const content = res.data.choices[0].message.content;
          console.log('【千问AI原始响应】:', content);
          try {
            const result = parseAIResponse(content);
            console.log('【千问AI解析结果】:', JSON.stringify(result, null, 2));
            if (result.error) {
              // AI无法确定，返回友好提示
              resolve({
                advice: '抱歉，我无法确定该区域的小区信息。建议您：1）使用贝壳找房等平台自行查询；2）联系专业房产中介获取最新信息。',
                recommendations: []
              });
            } else {
              const validatedResult = validateDistrict(result, requirements.district);
              console.log('【千问AI验证后结果】:', JSON.stringify(validatedResult, null, 2));
              resolve(validatedResult);
            }
          } catch (error) {
            reject(error);
          }
        } else {
          console.error('【千问AI API返回错误】:', res);
          reject(new Error(`AI API返回错误: ${res.statusCode} - ${JSON.stringify(res.data)}`));
        }
      },
      fail: (err) => {
        console.error('【千问AI请求失败】:', err);
        reject(err);
      }
    });
  });
}

/**
 * 解析AI响应
 */
function parseAIResponse(content) {
  let jsonStr = content;
  
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    throw new Error('AI响应解析失败');
  }
}

module.exports = {
  getAIRecommendation,
  buildSystemPrompt,
  buildUserPrompt,
  parseAIResponse,
  validateDistrict
};
