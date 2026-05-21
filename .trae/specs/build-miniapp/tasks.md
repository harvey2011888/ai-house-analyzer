# Tasks

## Phase 1: 项目初始化与数据准备
- [x] Task 1: 初始化微信小程序项目结构
  - [x] SubTask 1.1: 创建小程序基础目录结构（pages、utils、data、components）
  - [x] SubTask 1.2: 配置 app.json（页面路由、window、tabBar）
  - [x] SubTask 1.3: 配置 app.js（全局数据、启动逻辑）
  - [x] SubTask 1.4: 配置 app.wxss（全局样式、主题色）
  - [x] SubTask 1.5: 集成 Vant Weapp UI组件库

- [x] Task 2: 准备本地数据文件
  - [x] SubTask 2.1: 创建 communities.json（小区基础信息，包含id、name、district、address、longitude、latitude、build_year、total_households等字段）
  - [x] SubTask 2.2: 创建 prices.json（房价数据，包含community_id、current_avg_price、price_history、yoy_change、mom_change等字段）
  - [x] SubTask 2.3: 创建 facilities.json（配套数据，包含community_id、metro、schools、hospitals、malls等字段）
  - [x] SubTask 2.4: 创建 districts.json（区域统计，各区房价、成交量统计）
  - [x] SubTask 2.5: 创建 meta.json（元数据，data_version、update_date、total_communities等）

## Phase 2: 核心页面开发
- [x] Task 3: 开发首页（pages/index/）
  - [x] SubTask 3.1: 实现数据版本提示组件
  - [x] SubTask 3.2: 实现快速入口（开始匹配按钮）
  - [x] SubTask 3.3: 实现热门小区列表（本地排序TOP10）
  - [x] SubTask 3.4: 实现市场概况统计（均价、成交量等）

- [x] Task 4: 开发需求填写页（pages/requirement/）
  - [x] SubTask 4.1: 实现预算设置双滑块组件（单位：万元）
  - [x] SubTask 4.2: 实现面积需求双滑块组件（单位：平方米）
  - [x] SubTask 4.3: 实现户型选择grid组件（1室、2室、3室、4室+）
  - [x] SubTask 4.4: 实现核心诉求tag多选组件
  - [x] SubTask 4.5: 实现工作地点输入（可选）
  - [x] SubTask 4.6: 实现表单验证与提交逻辑

## Phase 3: 推荐功能开发
- [x] Task 5: 开发本地推荐算法（utils/local-recommend.js）
  - [x] SubTask 5.1: 实现硬性条件筛选函数（预算、面积、户型）
  - [x] SubTask 5.2: 实现匹配度评分算法（预算30%、面积25%、户型20%、配套25%）
  - [x] SubTask 5.3: 实现推荐理由生成本地函数
  - [x] SubTask 5.4: 实现候选小区排序与截断（TOP10）

- [x] Task 6: 集成AI服务（utils/ai-service.js）
  - [x] SubTask 6.1: 实现System Prompt模板（购房顾问角色）
  - [x] SubTask 6.2: 实现User Prompt构建函数（需求+候选小区）
  - [x] SubTask 6.3: 实现DeepSeek API调用函数
  - [x] SubTask 6.4: 实现AI返回结果解析函数
  - [x] SubTask 6.5: 实现AI降级逻辑（失败时切换本地算法）

- [x] Task 7: 开发推荐结果页（pages/recommendation/）
  - [x] SubTask 7.1: 实现AI分析中加载状态UI
  - [x] SubTask 7.2: 实现推荐小区列表展示（TOP10）
  - [x] SubTask 7.3: 实现每个小区的匹配度分数和推荐理由展示
  - [x] SubTask 7.4: 实现AI购房建议展示
  - [x] SubTask 7.5: 实现重新匹配按钮
  - [x] SubTask 7.6: 实现点击小区跳转详情页

## Phase 4: 详情与辅助功能
- [x] Task 8: 开发小区详情页（pages/community-detail/）
  - [x] SubTask 8.1: 实现基本信息展示（名称、区域、地址、建造年份、总户数）
  - [x] SubTask 8.2: 集成ECharts-for-weixin绘制房价走势图（近6个月）
  - [x] SubTask 8.3: 实现周边配套展示（地铁、学校、医院、商场）
  - [x] SubTask 8.4: 实现AI优缺点分析（可选，调用AI接口）
  - [x] SubTask 8.5: 实现收藏按钮与收藏逻辑
  - [x] SubTask 8.6: 实现浏览历史记录

- [x] Task 9: 开发对比页（pages/compare/）
  - [x] SubTask 9.1: 实现小区选择器（从收藏或搜索）
  - [x] SubTask 9.2: 实现对比表格展示（价格、面积、配套、评分）
  - [x] SubTask 9.3: 实现AI对比分析（可选）

- [x] Task 10: 开发我的页面（pages/profile/）
  - [x] SubTask 10.1: 实现收藏列表展示与取消收藏
  - [x] SubTask 10.2: 实现浏览历史展示（最多50条）
  - [x] SubTask 10.3: 实现数据版本信息展示
  - [x] SubTask 10.4: 实现关于我们页面

## Phase 5: 工具与优化
- [x] Task 11: 开发数据加载工具（utils/data-loader.js）
  - [x] SubTask 11.1: 实现JSON数据加载函数
  - [x] SubTask 11.2: 实现数据缓存机制（避免重复加载）
  - [x] SubTask 11.3: 实现数据版本检测函数

- [x] Task 12: 开发本地存储工具（utils/storage.js）
  - [x] SubTask 12.1: 实现收藏列表CRUD
  - [x] SubTask 12.2: 实现浏览历史CRUD
  - [x] SubTask 12.3: 实现数据版本号存储

- [x] Task 13: 性能优化与测试
  - [x] SubTask 13.1: 优化数据加载性能（按需加载、分页）
  - [x] SubTask 13.2: 优化小程序包体积（数据压缩）
  - [x] SubTask 13.3: 进行真机测试与Bug修复

# Task Dependencies
- Task 3 依赖 Task 1、Task 2
- Task 4 依赖 Task 1
- Task 5 依赖 Task 2
- Task 6 依赖 Task 5
- Task 7 依赖 Task 5、Task 6
- Task 8 依赖 Task 2、Task 11
- Task 9 依赖 Task 8
- Task 10 依赖 Task 12
- Task 11 依赖 Task 2
- Task 12 无依赖
- Task 13 依赖所有前面任务
