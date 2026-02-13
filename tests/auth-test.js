/**
 * 超简化的认证测试脚本
 */

const http = require('http');
const path = require('path');

const API_BASE = 'http://localhost:3001';

async function request(method, endpoint, data, token) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: url.split('/')[3] || '',
      method: method,
      headers: headers
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
      options.data = postData;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.write(options.data || '');
    req.end();
  });
}

async function main() {
  console.log('\n🧪 快速认证测试\n');
  console.log('='.repeat(50));

  try {
    // 注册
    console.log('📝 [1/3] 注册...');
    const registerRes = await request('POST', '/api/v1/auth/register', {
      email: `simple-test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      displayName: '快速测试'
    });

    if (registerRes.error) {
      throw new Error(`注册失败: ${registerRes.error}`);
    }
    console.log('   ✅ 注册成功');

    // 登录
    console.log('📝 [2/3] 登录...');
    const loginRes = await request('POST', '/api/v1/auth/login', {
      email: `simple-test-${Date.now()}@example.com`,
      password: 'TestPassword123!'
    });

    if (loginRes.error) {
      throw new Error(`登录失败: ${loginRes.error}`);
    }
    console.log('   ✅ 登录成功');

    // 获取用户信息
    console.log('📝 [3/3] 获取用户信息...');
    const meRes = await request('GET', '/api/v1/users/me', null, loginRes.data);

    if (meRes.error) {
      throw new Error(`获取用户信息失败: ${meRes.error}`);
    }
    console.log('   ✅ 获取用户信息成功');

    console.log('\n' + '='.repeat(50));
    console.log('✅ 所有认证测试通过！\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
