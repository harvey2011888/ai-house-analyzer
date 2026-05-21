/**
 * 深圳政府数据开放平台 - 房地产成交数据下载脚本
 * 下载最近半年的二手房和一手商品房成交信息
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// API配置
const BASE_URL = 'opendata.sz.gov.cn';
const APP_KEY = 'ab3cbc0e4b574adda096b3b47be57afa';

// 数据集ID
const SECOND_HAND_API_ID = '29200_01903513';  // 二手房成交信息
const NEW_HOUSE_API_ID = '29200_01903510';    // 一手商品房成交信息

// 请求参数
const PAGE_SIZE = 1000;  // 每页最大记录数

/**
 * 从深圳政府数据开放平台获取数据
 * @param {string} apiId - API接口ID
 * @param {number} page - 页码
 * @param {number} rows - 每页记录数
 * @returns {Promise<Object>} API响应数据
 */
function fetchData(apiId, page = 1, rows = 1000) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE_URL,
            path: `/api/${apiId}/1/service.xhtml?page=${page}&rows=${rows}&appKey=${APP_KEY}`,
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (e) {
                    reject(new Error(`JSON解析失败: ${e.message}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(new Error(`请求失败: ${e.message}`));
        });

        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('请求超时'));
        });

        req.end();
    });
}

/**
 * 获取所有数据（处理分页）
 * @param {string} apiId - API接口ID
 * @param {string} dataName - 数据名称（用于日志）
 * @returns {Promise<Array>} 所有记录列表
 */
async function fetchAllData(apiId, dataName) {
    const allData = [];
    let page = 1;

    console.log(`开始获取 ${dataName} 数据...`);

    while (true) {
        console.log(`  正在获取第 ${page} 页数据...`);
        
        try {
            const result = await fetchData(apiId, page, PAGE_SIZE);
            
            if (!result || !result.data) {
                console.log(`  第 ${page} 页无数据，停止获取`);
                break;
            }

            const data = result.data;
            if (!data || data.length === 0) {
                console.log(`  第 ${page} 页数据为空，停止获取`);
                break;
            }

            allData.push(...data);
            console.log(`  第 ${page} 页获取成功，本页 ${data.length} 条记录，总计 ${allData.length} 条`);

            // 如果本页数据少于PAGE_SIZE，说明已经获取完所有数据
            if (data.length < PAGE_SIZE) {
                break;
            }

            page++;
        } catch (error) {
            console.error(`  获取第 ${page} 页失败: ${error.message}`);
            break;
        }
    }

    console.log(`${dataName} 数据获取完成，共 ${allData.length} 条记录`);
    return allData;
}

/**
 * 筛选最近半年的数据
 * @param {Array} data - 原始数据列表
 * @param {string} dateField - 日期字段名
 * @returns {Array} 最近半年的数据列表
 */
function filterRecentHalfYear(data, dateField = 'TJ_DATE') {
    // 计算半年前的日期
    const halfYearAgo = new Date();
    halfYearAgo.setDate(halfYearAgo.getDate() - 180);

    const filteredData = [];
    for (const item of data) {
        let dateStr = item[dateField] || '';
        if (!dateStr) continue;

        try {
            // 尝试解析日期（格式可能是 YYYY-MM-DD 或 YYYY/MM/DD）
            dateStr = dateStr.replace(/\//g, '-');
            const itemDate = new Date(dateStr);

            if (itemDate >= halfYearAgo) {
                filteredData.push(item);
            }
        } catch (e) {
            // 日期格式不匹配，保留该记录
            filteredData.push(item);
        }
    }

    return filteredData;
}

/**
 * 将数据保存为CSV文件
 * @param {Array} data - 数据列表
 * @param {string} filename - 输出文件名
 */
function saveToCsv(data, filename) {
    if (!data || data.length === 0) {
        console.log(`警告: 没有数据可保存到 ${filename}`);
        return;
    }

    // 确保输出目录存在
    const outputDir = path.dirname(filename);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 获取所有字段名
    const fieldnames = Object.keys(data[0]);

    // 构建CSV内容
    let csvContent = '\uFEFF';  // BOM头，解决中文乱码
    csvContent += fieldnames.join(',') + '\n';

    for (const item of data) {
        const row = fieldnames.map(field => {
            let value = item[field] || '';
            // 处理包含逗号或换行符的字段
            if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvContent += row.join(',') + '\n';
    }

    fs.writeFileSync(filename, csvContent, 'utf-8');
    console.log(`数据已保存到: ${filename}`);
}

/**
 * 将数据保存为JSON文件
 * @param {Array} data - 数据列表
 * @param {string} filename - 输出文件名
 */
function saveToJson(data, filename) {
    if (!data || data.length === 0) {
        console.log(`警告: 没有数据可保存到 ${filename}`);
        return;
    }

    // 确保输出目录存在
    const outputDir = path.dirname(filename);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`数据已保存到: ${filename}`);
}

/**
 * 主函数
 */
async function main() {
    // 设置输出目录
    const outputDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 获取当前日期
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    console.log('=' .repeat(60));
    console.log('深圳房地产成交数据下载工具');
    console.log('=' .repeat(60));

    // 1. 获取二手房成交数据
    console.log('\n【1】获取二手房成交信息...');
    const secondHandData = await fetchAllData(SECOND_HAND_API_ID, '二手房成交信息');

    if (secondHandData && secondHandData.length > 0) {
        // 筛选最近半年数据
        const recentSecondHand = filterRecentHalfYear(secondHandData);
        console.log(`最近半年二手房成交数据: ${recentSecondHand.length} 条`);

        // 保存数据
        const secondHandCsv = path.join(outputDir, `second_hand_house_${today}.csv`);
        const secondHandJson = path.join(outputDir, `second_hand_house_${today}.json`);
        saveToCsv(recentSecondHand, secondHandCsv);
        saveToJson(recentSecondHand, secondHandJson);
    }

    // 2. 获取一手商品房成交数据
    console.log('\n【2】获取一手商品房成交信息...');
    const newHouseData = await fetchAllData(NEW_HOUSE_API_ID, '一手商品房成交信息');

    if (newHouseData && newHouseData.length > 0) {
        // 筛选最近半年数据
        const recentNewHouse = filterRecentHalfYear(newHouseData);
        console.log(`最近半年一手商品房成交数据: ${recentNewHouse.length} 条`);

        // 保存数据
        const newHouseCsv = path.join(outputDir, `new_house_${today}.csv`);
        const newHouseJson = path.join(outputDir, `new_house_${today}.json`);
        saveToCsv(recentNewHouse, newHouseCsv);
        saveToJson(recentNewHouse, newHouseJson);
    }

    console.log('\n' + '='.repeat(60));
    console.log('数据下载完成！');
    console.log(`输出目录: ${outputDir}`);
    console.log('='.repeat(60));
}

// 运行主函数
main().catch(error => {
    console.error('程序执行出错:', error);
    process.exit(1);
});
