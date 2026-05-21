/**
 * 测试 HTTP 请求
 */

const https = require('https');
const zlib = require('zlib');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      }
    };

    console.log(`请求: ${url}`);
    console.log('请求头:', options.headers);

    https.get(url, options, (res) => {
      console.log(`状态码: ${res.statusCode}`);
      console.log(`响应头:`, res.headers);

      let data = [];
      const encoding = res.headers['content-encoding'];
      let stream = res;

      if (encoding === 'gzip') {
        stream = res.pipe(zlib.createGunzip());
      } else if (encoding === 'deflate') {
        stream = res.pipe(zlib.createInflate());
      }

      stream.on('data', (chunk) => {
        data.push(chunk);
      });

      stream.on('end', () => {
        const buffer = Buffer.concat(data);
        const html = buffer.toString('utf8');
        console.log(`响应长度: ${html.length} 字符`);
        console.log(`前500字符: ${html.substring(0, 500)}`);
        resolve(html);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  try {
    await httpGet('https://sz.ke.com/xiaoqu/futian/pg1/');
  } catch (error) {
    console.error('错误:', error.message);
  }
}

main();
