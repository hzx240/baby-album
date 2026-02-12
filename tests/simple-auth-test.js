/**
 * 简化的认证测试脚本
 * 直接使用绝对路径，避免模块解析问题
 */

const path = require('path');

// 使用绝对路径加载模块
const http = require(path.resolve(__dirname, 'node_modules', 'http'));
const fs = require('fs');

const CONFIG = {
  API_URL: 'http://localhost:3001',
  TEST_USER: {
    email: `regression-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    displayName: '回归测试用户'
  },
  TIMEOUT: 10000
};

async function testAuth() {
  console.log('\n🧪 认证测试\n');
  console.log('='.repeat(50));

  const http = require('http');

  try {
    // 注册
    console.log('📝 [1/2] 注册测试用户...');
    const registerRes = await httpRequest('POST', '/api/v1/auth/register', {
      email: CONFIG.TEST_USER.email,
      password: CONFIG.TEST_USER.password,
      displayName: CONFIG.TEST_USER.displayName
    });

    if (!registerRes.accessToken) {
      console.error(`❌ 注册失败: ${JSON.stringify(registerRes)}`);
      return false;
    }
    console.log('✅ 注册成功');

    // 登录
    console.log('📝 [2/2] 登录测试用户...');
    const loginRes = await httpRequest('POST', '/api/v1/auth/login', {
      email: CONFIG.TEST_USER.email,
      password: CONFIG.TEST_USER.password
    });

    if (!loginRes.accessToken) {
      console.error(`❌ 登录失败: ${JSON.stringify(loginRes)}`);
      return false;
    }
    console.log('✅ 登录成功');

    // 获取用户信息
    console.log('📝 [3/3] 获取用户信息测试...');
    const meRes = await httpRequest('GET', '/api/v1/users/me', null, loginRes.accessToken);
    console.log('✅ 获取用户信息成功');

    console.log('\n' + '='.repeat(50));
    console.log('✅ 所有认证测试通过！\n');
    return true;

  } catch (error) {
    console.error('\n❌ 认证测试失败:', error.message);
    return false;
  }
}

async function httpRequest(method, path, data, token = null, timeout = CONFIG.TIMEOUT) {
  return new Promise((resolve, reject) => {
    const url = `${CONFIG.API_URL}${path}`;
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: timeout
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

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
          const result = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject(new Error(`API Error ${res.statusCode}: ${result.message || body}`));
          } else {
            resolve(result);
          }
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

// 运行测试
if (require.main === module) {
  const success = testAuth();
  process.exit(success ? 0 : 1);
}

module.exports = { testAuth };
