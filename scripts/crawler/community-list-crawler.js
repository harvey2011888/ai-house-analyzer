/**
 * 小区列表爬虫
 * 爬取贝壳找房小区列表页面
 */

const BaseCrawler = require('./base-crawler');
const config = require('./config');
const cheerio = require('cheerio');
const antiDetect = require('./anti-detect');

class CommunityListCrawler extends BaseCrawler {
  constructor(options = {}) {
    super(options);
    this.district = null;
    this.communities = [];
  }

  /**
   * 解析小区列表页面
   * @param {string} html HTML内容
   * @returns {Array} 小区列表
   */
  parse(html) {
    const $ = cheerio.load(html);
    const communities = [];
    const selectors = config.selectors.communityList;

    $(selectors.items).each((index, element) => {
      try {
        const $item = $(element);
        
        // 获取小区名称和ID
        const $title = $item.find(selectors.name);
        const name = $title.text().trim();
        const href = $title.attr('href');
        const id = this.extractIdFromUrl(href);
        
        if (!id || !name) {
          console.warn(`跳过无效小区数据: name=${name}, id=${id}`);
          return;
        }

        // 获取价格
        const priceText = $item.find(selectors.price).text().trim();
        const avgPrice = antiDetect.parsePrice(priceText);

        // 获取区域和商圈
        const district = $item.find(selectors.district).text().trim();
        const bizCircle = $item.find(selectors.bizCircle).text().trim();

        // 获取标签
        const tags = [];
        $item.find(selectors.tags).each((i, tag) => {
          tags.push($(tag).text().trim());
        });

        communities.push({
          id: `bk_${id}`,
          name,
          district: district || this.district,
          bizCircle,
          avgPrice,
          tags,
          source: config.target.name,
          listUrl: href,
          crawlTime: new Date().toISOString()
        });
      } catch (error) {
        console.error(`解析小区数据失败: ${error.message}`);
      }
    });

    console.log(`解析到 ${communities.length} 个小区`);
    return communities;
  }

  /**
   * 从URL中提取小区ID
   * @param {string} url URL
   * @returns {string} 小区ID
   */
  extractIdFromUrl(url) {
    if (!url) return null;
    const match = url.match(/xiaoqu\/(\d+)\//);
    return match ? match[1] : null;
  }

  /**
   * 获取总页数
   * @param {string} html HTML内容
   * @returns {number} 总页数
   */
  getTotalPages(html) {
    const $ = cheerio.load(html);
    
    // 尝试从分页信息获取
    const pageData = $('.house-lst-page-box').attr('page-data');
    if (pageData) {
      try {
        const data = JSON.parse(pageData);
        return data.totalPage || 1;
      } catch (e) {
        console.warn('解析分页数据失败');
      }
    }

    // 备选方案：从分页链接获取
    let maxPage = 1;
    $('.pagination a').each((i, elem) => {
      const text = $(elem).text().trim();
      const pageNum = parseInt(text);
      if (!isNaN(pageNum) && pageNum > maxPage) {
        maxPage = pageNum;
      }
    });

    return maxPage;
  }

  /**
   * 爬取单个区域的小区列表
   * @param {Object} district 区域对象 {name, code}
   * @returns {Promise<Array>} 小区列表
   */
  async crawlDistrict(district) {
    this.district = district.name;
    console.log(`\n开始爬取 ${district.name}区 的小区列表...`);

    const allCommunities = [];
    
    // 先获取第一页，确定总页数
    const firstPageUrl = config.urls.communityList(district.code, 1);
    const html = await this.fetch(firstPageUrl);
    const firstPageData = this.parse(html);
    allCommunities.push(...firstPageData);

    // 获取总页数
    const totalPages = this.getTotalPages(html);
    console.log(`${district.name}区 共 ${totalPages} 页`);

    // 爬取剩余页面
    for (let page = 2; page <= totalPages; page++) {
      const url = config.urls.communityList(district.code, page);
      
      try {
        const pageHtml = await this.fetch(url);
        const pageData = this.parse(pageHtml);
        allCommunities.push(...pageData);
        
        console.log(`第 ${page}/${totalPages} 页完成，当前共 ${allCommunities.length} 个小区`);
        
        // 页面间延迟
        if (page < totalPages) {
          await new Promise(resolve => setTimeout(resolve, antiDetect.getRandomDelay()));
        }
      } catch (error) {
        console.error(`爬取第 ${page} 页失败: ${error.message}`);
      }
    }

    console.log(`${district.name}区 爬取完成，共 ${allCommunities.length} 个小区`);
    return allCommunities;
  }

  /**
   * 爬取所有区域
   * @param {Array} districts 区域列表，默认为全部
   * @returns {Promise<Array>} 所有小区
   */
  async crawl(districts = config.districts) {
    this.stats.startTime = Date.now();
    
    await this.init();

    const allCommunities = [];

    for (const district of districts) {
      try {
        const communities = await this.crawlDistrict(district);
        allCommunities.push(...communities);
        
        // 区域间延迟
        await new Promise(resolve => setTimeout(resolve, antiDetect.getRandomDelay() * 2));
      } catch (error) {
        console.error(`爬取 ${district.name}区 失败: ${error.message}`);
      }
    }

    this.stats.endTime = Date.now();
    
    // 保存数据
    await this.save(allCommunities, 'communities.json');
    
    this.printStats();
    
    await this.close();
    
    return allCommunities;
  }

  /**
   * 爬取指定区域
   * @param {string} districtName 区域名称
   * @returns {Promise<Array>} 小区列表
   */
  async crawlByName(districtName) {
    const district = config.districts.find(d => d.name === districtName);
    if (!district) {
      throw new Error(`未知区域: ${districtName}`);
    }
    
    await this.init();
    const communities = await this.crawlDistrict(district);
    await this.save(communities, 'communities.json');
    await this.close();
    
    return communities;
  }
}

module.exports = CommunityListCrawler;
