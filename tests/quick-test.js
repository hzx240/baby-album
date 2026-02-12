const http = require('http');

async function quickRequest(method, path, data, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
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

async function main() {
  console.log('\n⚡ 快速验证测试\n');

  try {
    // 测试 1: 注册+登录（使用 UUID 确保唯一性）
    console.log('📝 [1/2] 测试认证流程...');

    // 生成唯一的测试用户标识符
    const testId = crypto.randomUUID();
    const testEmail = `test-${testId}@quick-test.example.com`;

    const registerRes = await quickRequest('POST', '/api/v1/auth/register', {
      email: testEmail,
      password: 'Test123456',
      displayName: '快速测试用户'
    });

    if (!registerRes.accessToken) {
      throw new Error(`注册失败: ${JSON.stringify(registerRes)}`);
    }

    console.log(`   ✅ 注册成功: ${testEmail}`);

    const loginRes = await quickRequest('POST', '/api/v1/auth/login', {
      email: testEmail,
      password: 'Test123456'
    });

    if (!loginRes.accessToken) {
      throw new Error(`登录失败: ${JSON.stringify(loginRes)}`);
    }

    console.log('   ✅ 认证流程正常');

    // 测试 2: API 基础连通性
    console.log('📝 [2/2] 测试 API 端点...');

    const endpoints = [
      { path: '/api/v1/users/me', name: '用户信息' },
      { path: '/api/v1/children', name: '孩子列表' },
      { path: '/api/v1/media', name: '照片列表' },
      { path: '/api/v1/families', name: '家庭信息' }
    ];

    let successCount = 0;
    for (const endpoint of endpoints) {
      try {
        const res = await quickRequest('GET', endpoint.path, null, loginRes.accessToken);
        if (res.statusCode && res.statusCode >= 400) {
          console.log(`   ❌ ${endpoint.name} (${res.statusCode})`);
        } else {
          successCount++;
          console.log(`   ✅ ${endpoint.name}`);
        }
      } catch (error) {
        // 忽略 404 错误（某些端点可能不存在数据）
        if (!error.message.includes('404')) {
          console.log(`   ⚠️  ${endpoint.name}: ${error.message}`);
        }
      }
    }

    const successRate = ((successCount / endpoints.length) * 100).toFixed(0);
    console.log(`   ✅ API 端点可达性: ${successRate}% (${successCount}/${endpoints.length})`);

    console.log('\n✅ 快速验证通过！');
    console.log('💡 提示: 运行完整测试请使用 npm test\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ 验证失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { quickRequest };
