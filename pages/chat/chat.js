/**
 * AI需求填写页 - 核心页面
 * 卡片式逐步收集用户购房需求（7个核心问题）
 */

// 问题配置 - 8个核心购房问题
const QUESTIONS = [
  {
    id: 'budget',
    title: '您的购房预算是多少？',
    subtitle: '选择预算范围（最小值从0开始）',
    type: 'rangeSlider',
    min: 0,
    max: 1500,
    step: 50,
    unit: '万',
    defaultValue: [300, 800]
  },
  {
    id: 'area',
    title: '期望的房屋面积？',
    subtitle: '选择面积范围（最小值从0开始）',
    type: 'rangeSlider',
    min: 0,
    max: 200,
    step: 5,
    unit: '㎡',
    defaultValue: [60, 120]
  },
  {
    id: 'propertyType',
    title: '您想购买什么类型的住房？',
    subtitle: '选择住房类型',
    type: 'multiSelect',
    options: ['商品房', '公寓', '别墅', '经济适用房', '不限']
  },
  {
    id: 'buildingAge',
    title: '期望的楼龄范围？',
    subtitle: '选择楼龄范围',
    type: 'multiSelect',
    options: ['5年以内', '5-10年', '10-20年', '20年以上']
  },
  {
    id: 'bathroom',
    title: '需要几个卫生间？',
    subtitle: '选择卫生间数量',
    type: 'multiSelect',
    options: ['1卫', '2卫', '3卫及以上']
  },
  {
    id: 'layout',
    title: '偏好哪些户型？',
    subtitle: '可多选',
    type: 'multiSelect',
    options: ['1室', '2室', '3室', '4室+']
  },
  {
    id: 'district',
    title: '目标区域？',
    subtitle: '可多选（深圳所有行政区）',
    type: 'multiSelect',
    options: ['福田', '南山', '罗湖', '宝安', '龙岗', '龙华', '盐田', '坪山', '光明', '大鹏新区', '深汕合作区']
  },
  {
    id: 'priorities',
    title: '核心诉求是什么？',
    subtitle: '选择最看重的因素，可多选',
    type: 'multiSelect',
    options: ['学区', '地铁', '商业', '医疗', '环境', '升值潜力']
  }
];

Page({
  data: {
    currentStep: 0,
    totalSteps: Math.ceil(QUESTIONS.length / 2), // 每页2个问题
    answers: {},
    currentQuestions: [], // 当前显示的问题数组（2个）
    progress: 0,
    showSummary: false,
    summaryList: [],
    dragging: {}, // 记录正在拖动的滑块 { questionId: 'min' | 'max' }
    trackRects: {} // 缓存轨道位置 { questionId: { left, width } }
  },

  onLoad() {
    console.log('AI需求填写页加载');
    this.loadQuestions(0);
  },

  /**
   * 加载指定步骤的问题（每页2个）
   */
  loadQuestions(step) {
    const startIndex = step * 2;
    if (startIndex >= QUESTIONS.length) {
      this.showSummary();
      return;
    }

    // 获取当前页面的2个问题
    const endIndex = Math.min(startIndex + 2, QUESTIONS.length);
    const currentQuestions = QUESTIONS.slice(startIndex, endIndex).map(question => {
      // 初始化默认值（如果还没有答案）
      const currentAnswer = this.data.answers[question.id];
      if (currentAnswer === undefined && question.defaultValue !== undefined) {
        this.setData({
          [`answers.${question.id}`]: question.defaultValue
        });
      }
      
      // 将选项转换为带 selected 属性的对象数组（仅对多选类型）
      let questionWithSelected = { ...question };
      
      if (question.type === 'multiSelect' && question.options) {
        const currentAnswers = this.data.answers[question.id] || [];
        const optionsWithSelected = question.options.map(opt => ({
          value: opt,
          selected: currentAnswers.includes(opt)
        }));
        questionWithSelected.options = optionsWithSelected;
      }

      return questionWithSelected;
    });

    const progress = Math.round((startIndex / QUESTIONS.length) * 100);

    this.setData({
      currentStep: step,
      currentQuestions: currentQuestions,
      progress: progress
    });

    // 预缓存轨道位置
    setTimeout(() => {
      this.cacheTrackRects(currentQuestions);
    }, 100);
  },

  /**
   * 缓存轨道位置
   */
  cacheTrackRects(questions) {
    const query = wx.createSelectorQuery().in(this);
    let rectIndex = 0;
    questions.forEach(question => {
      if (question.type === 'rangeSlider') {
        query.select(`#range-track-${question.id}`).boundingClientRect();
        rectIndex++;
      }
    });
    query.exec(rects => {
      if (rects) {
        let idx = 0;
        questions.forEach(question => {
          if (question.type === 'rangeSlider' && rects[idx]) {
            this.setData({
              [`trackRects.${question.id}`]: { 
                left: rects[idx].left, 
                width: rects[idx].width 
              }
            });
            idx++;
          }
        });
      }
    });
  },

  /**
   * 范围滑块触摸开始
   */
  onRangeTouchStart(event) {
    const { questionId } = event.currentTarget.dataset;
    const touch = event.touches[0];
    const trackRect = this.data.trackRects[questionId];
    
    if (!trackRect) return;
    
    const touchX = touch.clientX;
    const trackLeft = trackRect.left;
    const trackWidth = trackRect.width;
    
    // 计算触摸点在轨道上的百分比
    const percent = (touchX - trackLeft) / trackWidth;
    const currentAnswer = this.data.answers[questionId] || [0, 100];
    const question = QUESTIONS.find(q => q.id === questionId);
    if (!question) return;
    
    const value = question.min + percent * (question.max - question.min);
    const minVal = currentAnswer[0];
    const maxVal = currentAnswer[1];
    
    // 判断拖动哪个滑块（离哪个近就拖动哪个）
    const distToMin = Math.abs(value - minVal);
    const distToMax = Math.abs(value - maxVal);
    
    this.setData({
      [`dragging.${questionId}`]: distToMin <= distToMax ? 'min' : 'max'
    });
  },

  /**
   * 范围滑块触摸移动
   */
  onRangeTouchMove(event) {
    const { questionId } = event.currentTarget.dataset;
    const draggingType = this.data.dragging[questionId];
    
    if (!draggingType) return;
    
    const touch = event.touches[0];
    const trackRect = this.data.trackRects[questionId];
    
    if (!trackRect) return;
    
    const touchX = touch.clientX;
    const trackLeft = trackRect.left;
    const trackWidth = trackRect.width;
    
    // 计算触摸点在轨道上的百分比
    let percent = (touchX - trackLeft) / trackWidth;
    percent = Math.max(0, Math.min(1, percent)); // 限制在0-1之间
    
    const question = QUESTIONS.find(q => q.id === questionId);
    if (!question) return;
    
    let newValue = question.min + percent * (question.max - question.min);
    // 对齐到step
    newValue = Math.round(newValue / question.step) * question.step;
    
    const currentAnswer = this.data.answers[questionId] || [0, 100];
    
    if (draggingType === 'min') {
      // 最小值不能超过最大值
      const newMin = Math.min(newValue, currentAnswer[1]);
      this.setData({
        [`answers.${questionId}`]: [newMin, currentAnswer[1]]
      });
    } else {
      // 最大值不能小于最小值
      const newMax = Math.max(newValue, currentAnswer[0]);
      this.setData({
        [`answers.${questionId}`]: [currentAnswer[0], newMax]
      });
    }
  },

  /**
   * 范围滑块触摸结束
   */
  onRangeTouchEnd(event) {
    const { questionId } = event.currentTarget.dataset;
    this.setData({
      [`dragging.${questionId}`]: null
    });
  },

  /**
   * 滑块值变化（单值滑块）
   */
  onSliderChange(event) {
    const { questionId } = event.currentTarget.dataset;
    const value = event.detail.value;

    this.setData({
      [`answers.${questionId}`]: value
    });
  },

  /**
   * 多选变化
   */
  onMultiSelect(event) {
    const { questionId } = event.currentTarget.dataset;
    const { value } = event.currentTarget.dataset;
    const currentValues = this.data.answers[questionId] || [];
    
    let newValues;
    if (currentValues.includes(value)) {
      newValues = currentValues.filter(v => v !== value);
    } else {
      newValues = [...currentValues, value];
    }

    // 更新答案
    this.setData({
      [`answers.${questionId}`]: newValues
    });
    
    // 更新当前问题的选项选中状态
    const { currentQuestions } = this.data;
    const questionIndex = currentQuestions.findIndex(q => q.id === questionId);
    if (questionIndex !== -1) {
      const updatedOptions = currentQuestions[questionIndex].options.map(opt => ({
        ...opt,
        selected: newValues.includes(opt.value)
      }));
      
      this.setData({
        [`currentQuestions[${questionIndex}].options`]: updatedOptions
      });
    }
  },

  /**
   * 点击下一步
   */
  onNext() {
    const { currentStep, currentQuestions, answers } = this.data;
    
    // 验证当前页面的所有问题
    for (const question of currentQuestions) {
      const answer = answers[question.id];
      
      // 验证必填项
      if (question.required !== false && !answer) {
        wx.showToast({
          title: `请填写: ${question.title}`,
          icon: 'none'
        });
        return;
      }

      // 验证多选至少选一项
      if (question.type === 'multiSelect' && (!answer || answer.length === 0)) {
        wx.showToast({
          title: `请至少选择一项: ${question.title}`,
          icon: 'none'
        });
        return;
      }
    }

    this.loadQuestions(currentStep + 1);
  },

  /**
   * 点击上一步
   */
  onPrev() {
    const { currentStep } = this.data;
    if (currentStep > 0) {
      this.loadQuestions(currentStep - 1);
    }
  },

  /**
   * 显示汇总
   */
  showSummary() {
    const { answers } = this.data;

    // 构建汇总列表数据
    // 处理范围值显示
    const budgetValue = Array.isArray(answers.budget) 
      ? `${answers.budget[0]}-${answers.budget[1]}万` 
      : `${answers.budget || 500}万`;
    const areaValue = Array.isArray(answers.area) 
      ? `${answers.area[0]}-${answers.area[1]}㎡` 
      : `${answers.area || 90}㎡`;

    const summaryList = [
      { id: 'budget', label: '购房预算', value: budgetValue, icon: '💰' },
      { id: 'area', label: '房屋面积', value: areaValue, icon: '📐' },
      { id: 'propertyType', label: '住房类型', value: (answers.propertyType || []).join('、') || '未填写', icon: '🏢' },
      { id: 'buildingAge', label: '楼龄范围', value: (answers.buildingAge || []).join('、') || '未填写', icon: '🏗️' },
      { id: 'bathroom', label: '卫生间数量', value: (answers.bathroom || []).join('、') || '未填写', icon: '🚿' },
      { id: 'layout', label: '户型偏好', value: (answers.layout || []).join('、') || '未填写', icon: '🏠' },
      { id: 'district', label: '目标区域', value: (answers.district || []).join('、') || '未填写', icon: '📍' },
      { id: 'priorities', label: '核心诉求', value: (answers.priorities || []).join('、') || '未填写', icon: '⭐' }
    ];

    this.setData({
      showSummary: true,
      progress: 100,
      summaryList: summaryList
    });
  },

  /**
   * 修改某个答案
   */
  onEditAnswer(event) {
    const { index } = event.currentTarget.dataset;
    this.setData({ showSummary: false });
    // 计算该问题所在的页面（每页2个）
    const pageIndex = Math.floor(index / 2);
    this.loadQuestions(pageIndex);
  },

  /**
   * 提交需求，开始AI推荐
   */
  onSubmit() {
    const { answers } = this.data;
    
    // 保存需求到本地
    wx.setStorageSync('last_requirement', answers);

    // 跳转到推荐结果页
    wx.navigateTo({
      url: '/pages/recommendation/recommendation'
    });
  }
});
