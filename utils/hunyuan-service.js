/**
 * 腾讯混元AI服务模块
 * 调用腾讯云混元大模型API进行智能购房推荐
 * 让AI自行检索可靠数据
 */

// API配置
const API_URL = 'https://tokenhub.tencentmaas.com/v1/chat/completions';
// 使用deepseek-v4-pro模型，推理能力更强
const MODEL = 'deepseek-v4-pro';

// 尝试从配置文件读取API Key
let hunyuanApiKey = '';
try {
  const config = require('../config/config');
  hunyuanApiKey = config.hunyuanApiKey || '';
} catch (e) {
  console.warn('未找到配置文件，混元AI服务将不可用。请复制 config/config.template.js 为 config/config.js 并填写API Key');
}

/**
 * 构建系统提示词
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
 * @param {Object} requirements - 用户需求
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

  let prompt = `用户需求：
${reqText}

用户选择的区域是：${districtStr}${budgetHint}${areaHint}${layoutHint}

请根据用户需求，推荐${districtStr !== '未指定' ? '该区域内' : ''}的小区。

【强制要求 - 必须遵守】
1. 区域约束：推荐的小区必须严格位于"${districtStr}"区域内，绝对不能推荐其他区域的小区。
2. 预算约束：推荐小区的均价应在用户预算范围内，如果超出预算需要特别说明原因。
3. 真实性约束：只推荐你100%确定真实存在的小区。如果不确定，宁可返回error也不要编造。
4. 价格准确性：房价数据必须合理。如果不确定具体价格，请给出"约X万/㎡"的范围估计，并标注数据来源。
5. 输出格式：严格按照JSON格式输出，不要添加任何其他文字。`;

  return prompt;
}

/**
 * 调用混元AI推荐服务
 * @param {Object} requirements - 用户需求
 * @param {string} context - 上下文信息（用于多轮讨论）
 */
function getHunyuanRecommendation(requirements, context = '') {
  return new Promise((resolve, reject) => {
    const apiKey = hunyuanApiKey;

    if (!apiKey) {
      reject(new Error('未配置混元API Key，请在config/config.js中设置hunyuanApiKey'));
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

    console.log('========== 混元AI调用 ==========');
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
        stream: false
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.choices && res.data.choices.length > 0) {
          const content = res.data.choices[0].message.content;
          console.log('【混元AI原始响应】:', content);

          try {
            const result = parseAIResponse(content);
            console.log('【混元AI解析结果】:', JSON.stringify(result, null, 2));

            // 检查是否是错误响应
            if (result.error) {
              console.warn('混元AI返回错误:', result.error);
              resolve({
                advice: '混元AI无法确定推荐：' + result.error,
                recommendations: []
              });
              return;
            }

            resolve(result);
          } catch (error) {
            console.error('【解析混元AI响应失败】:', error);
            reject(error);
          }
        } else {
          console.error('【混元AI API返回错误】:', res);
          reject(new Error('混元AI API返回错误'));
        }
      },
      fail: (err) => {
        console.error('【混元AI请求失败】:', err);
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
    console.error('JSON解析失败，原始内容:', content);
    throw new Error('AI响应解析失败');
  }
}

module.exports = {
  getHunyuanRecommendation,
  buildSystemPrompt,
  buildUserPrompt,
  parseAIResponse
};
