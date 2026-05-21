# 深圳购房助手小程序 Spec

## Why
用户需要一个纯前端的微信小程序来帮助深圳购房决策。该小程序基于本地数据+AI智能推荐，零服务器成本，离线可用。

## What Changes
- 创建微信小程序项目结构（原生框架）
- 实现6个核心页面：首页、需求填写页、推荐结果页、小区详情页、对比页、我的页面
- 实现本地数据加载与管理（communities.json、prices.json、facilities.json、meta.json）
- 实现本地推荐算法（硬性条件筛选+匹配度评分）
- 集成DeepSeek AI API进行智能推荐（含降级方案）
- 实现收藏、浏览历史、数据版本检测等辅助功能
- 使用Vant Weapp UI组件库
- 使用ECharts-for-weixin绘制房价走势图

## Impact
- 纯前端架构，无后端依赖
- 数据打包在小程序内，需控制体积在20MB以内
- AI调用失败时必须有本地降级方案

## ADDED Requirements

### Requirement: 首页功能
The system SHALL provide a home page with the following capabilities:

#### Scenario: 首页加载
- **WHEN** 用户打开小程序
- **THEN** 显示数据版本提示（如有更新）、快速入口（开始匹配）、热门小区列表、市场概况统计

#### Scenario: 数据版本检测
- **WHEN** 小程序启动
- **THEN** 对比本地存储的数据版本与当前数据版本，不一致时显示更新提示弹窗

### Requirement: 需求填写页
The system SHALL provide a requirement input page:

#### Scenario: 填写购房需求
- **WHEN** 用户点击"开始匹配"
- **THEN** 进入需求填写页，包含：
  - 预算设置（双滑块，单位：万元）
  - 面积需求（双滑块，单位：平方米）
  - 户型选择（grid多选：1室、2室、3室、4室+）
  - 核心诉求（tag多选：学区、地铁、商业、医疗、环境、升值潜力）
  - 工作地点（可选，用于通勤评估）

#### Scenario: 提交需求
- **WHEN** 用户点击"获取推荐"
- **THEN** 验证必填项（预算、面积、户型），验证通过后进入推荐结果页

### Requirement: 推荐结果页
The system SHALL provide a recommendation result page:

#### Scenario: 本地初步筛选
- **WHEN** 用户提交需求
- **THEN** 根据预算、面积、区域等硬性条件筛选候选小区（20-50个）

#### Scenario: AI智能推荐
- **WHEN** 本地筛选完成
- **THEN** 调用DeepSeek API，发送用户需求+候选小区列表，显示"AI分析中..."加载状态
- **AND** AI返回TOP10推荐小区，每个附带匹配度分数和推荐理由

#### Scenario: AI降级方案
- **WHEN** AI API调用失败或超时
- **THEN** 自动切换到本地推荐算法，基于匹配度评分排序返回TOP10

#### Scenario: 重新匹配
- **WHEN** 用户点击"重新匹配"
- **THEN** 返回需求填写页

### Requirement: 小区详情页
The system SHALL provide a community detail page:

#### Scenario: 查看小区详情
- **WHEN** 用户点击推荐列表中的小区
- **THEN** 显示：基本信息（名称、区域、地址、建造年份、总户数）、房价走势图（近6个月，ECharts）、周边配套（地铁、学校、医院、商场）、AI优缺点分析

#### Scenario: 收藏小区
- **WHEN** 用户点击收藏按钮
- **THEN** 将小区ID保存到本地存储收藏列表，按钮状态切换

### Requirement: 对比页
The system SHALL provide a community comparison page:

#### Scenario: 选择对比小区
- **WHEN** 用户进入对比页
- **THEN** 支持从收藏列表或搜索选择2-3个小区进行对比

#### Scenario: 查看对比结果
- **WHEN** 用户选择小区后
- **THEN** 以表格形式对比各小区的价格、面积、配套、评分等维度

### Requirement: 我的页面
The system SHALL provide a profile page:

#### Scenario: 查看个人信息
- **WHEN** 用户进入"我的"页面
- **THEN** 显示收藏列表、浏览历史、数据版本信息、关于我们

#### Scenario: 查看收藏列表
- **WHEN** 用户点击"我的收藏"
- **THEN** 显示所有已收藏的小区列表，支持取消收藏

#### Scenario: 查看浏览历史
- **WHEN** 用户点击"浏览历史"
- **THEN** 显示最近浏览过的小区列表（最多50条）

### Requirement: 本地数据管理
The system SHALL manage local data efficiently:

#### Scenario: 数据加载
- **WHEN** 小程序启动或进入相关页面
- **THEN** 从本地JSON文件加载数据，使用缓存避免重复加载

#### Scenario: 数据存储结构
- **GIVEN** 数据目录 /data/
- **THEN** 包含 communities.json（小区基础信息）、prices.json（房价数据）、facilities.json（配套数据）、districts.json（区域统计）、meta.json（元数据）

### Requirement: AI服务集成
The system SHALL integrate with DeepSeek AI API:

#### Scenario: AI推荐调用
- **WHEN** 需要AI推荐时
- **THEN** 构建System Prompt（购房顾问角色）+ User Prompt（需求+候选小区），调用 https://api.deepseek.com/v1/chat/completions
- **AND** 返回JSON格式：{recommendations: [{community_id, match_score, reasons}], advice: string}

#### Scenario: API密钥管理
- **GIVEN** API密钥敏感信息
- **THEN** 建议从安全位置获取，不硬编码在代码中（小程序端可考虑云函数或用户自行配置）

### Requirement: 本地推荐算法
The system SHALL provide a local recommendation algorithm as fallback:

#### Scenario: 硬性条件筛选
- **WHEN** 用户提交需求
- **THEN** 根据预算范围、面积范围、户型要求过滤不符合条件的小区

#### Scenario: 匹配度评分
- **WHEN** 需要计算匹配度时
- **THEN** 基于预算匹配度（30%）、面积匹配度（25%）、户型匹配度（20%）、配套匹配度（25%）计算综合评分

#### Scenario: 推荐理由生成
- **WHEN** 使用本地算法时
- **THEN** 根据小区特点和用户需求生成2-3条推荐理由（如"符合预算范围"、"靠近地铁站"、"学区优质"等）

## MODIFIED Requirements
无

## REMOVED Requirements
无
