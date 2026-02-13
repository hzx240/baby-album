/**
 * 快速回归测试 - 验证核心功能
 */

const http = require('http');

const API_URL = 'http://localhost:3001';

async function request(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
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
            reject(new Error(`${res.statusCode}: ${result.message || body}`));
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

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 快速回归测试');
  console.log('========================================\n');

  const results = { passed: 0, failed: 0, tests: [] };

  // 测试1: 用户注册
  try {
    console.log('[1/8] 测试用户注册...');
    const email = `test-${Date.now()}@example.com`;
    const registerRes = await request('POST', '/api/v1/auth/register', {
      email,
      password: 'TestPassword123!',
      displayName: '快速测试'
    });
    const token = registerRes.accessToken;
    console.log('  ✅ 注册成功\n');
    results.passed++;
    results.tests.push({ name: '用户注册', status: 'PASS' });

    // 测试2: 用户登录
    try {
      console.log('[2/8] 测试用户登录...');
      const loginRes = await request('POST', '/api/v1/auth/login', {
        email,
        password: 'TestPassword123!'
      });
      console.log('  ✅ 登录成功\n');
      results.passed++;
      results.tests.push({ name: '用户登录', status: 'PASS' });

      // 测试3: 获取用户信息
      try {
        console.log('[3/8] 测试获取用户信息...');
        await request('GET', '/api/v1/users/me', null, loginRes.accessToken);
        console.log('  ✅ 获取用户信息成功\n');
        results.passed++;
        results.tests.push({ name: '获取用户信息', status: 'PASS' });

        // 测试4: 刷新Token
        try {
          console.log('[4/8] 测试刷新Token...');
          await new Promise(r => setTimeout(r, 500));
          const refreshRes = await request('POST', '/api/v1/auth/refresh', {
            refreshToken: loginRes.refreshToken
          });
          console.log('  ✅ 刷新Token成功\n');
          results.passed++;
          results.tests.push({ name: '刷新Token', status: 'PASS' });
        } catch (error) {
          console.log(`  ⚠️  刷新Token失败: ${error.message}\n`);
          results.failed++;
          results.tests.push({ name: '刷新Token', status: 'SKIP', error: error.message });
        }

        // 测试5: 创建孩子
        try {
          console.log('[5/8] 测试创建孩子...');
          const childRes = await request('POST', '/api/v1/children', {
            name: '测试宝贝',
            birthDate: '2024-01-01',
            gender: 'MALE'
          }, loginRes.accessToken);
          console.log('  ✅ 创建孩子成功\n');
          results.passed++;
          results.tests.push({ name: '创建孩子', status: 'PASS' });

          // 测试6: 获取孩子列表
          try {
            console.log('[6/8] 测试获取孩子列表...');
            const listRes = await request('GET', '/api/v1/children', null, loginRes.accessToken);
                            const children = Array.isArray(listRes) ? listRes : Object.values(listRes).filter(v => v && typeof v === 'object' && v.id);
            console.log(`  ✅ 获取到 ${children.length} 个孩子\n`);
            results.passed++;
            results.tests.push({ name: '获取孩子列表', status: 'PASS' });

            // 测试7: 更新孩子
            try {
              console.log('[7/8] 测试更新孩子...');
              await request('PATCH', `/api/v1/children/${childRes.id}`, {
                name: '测试宝贝-已更新'
              }, loginRes.accessToken);
              console.log('  ✅ 更新孩子成功\n');
              results.passed++;
              results.tests.push({ name: '更新孩子', status: 'PASS' });
            } catch (error) {
              console.log(`  ❌ 更新孩子失败: ${error.message}\n`);
              results.failed++;
              results.tests.push({ name: '更新孩子', status: 'FAIL', error: error.message });
            }

            // 测试8: 删除孩子
            try {
              console.log('[8/8] 测试删除孩子...');
              await request('DELETE', `/api/v1/children/${childRes.id}`, null, loginRes.accessToken);
              console.log('  ✅ 删除孩子成功\n');
              results.passed++;
              results.tests.push({ name: '删除孩子', status: 'PASS' });
            } catch (error) {
              console.log(`  ❌ 删除孩子失败: ${error.message}\n`);
              results.failed++;
              results.tests.push({ name: '删除孩子', status: 'FAIL', error: error.message });
            }

          } catch (error) {
            console.log(`  ❌ 获取孩子列表失败: ${error.message}\n`);
            results.failed++;
            results.tests.push({ name: '获取孩子列表', status: 'FAIL', error: error.message });
          }

        } catch (error) {
          console.log(`  ❌ 创建孩子失败: ${error.message}\n`);
          results.failed++;
          results.tests.push({ name: '创建孩子', status: 'FAIL', error: error.message });
        }

      } catch (error) {
        console.log(`  ❌ 获取用户信息失败: ${error.message}\n`);
        results.failed++;
        results.tests.push({ name: '获取用户信息', status: 'FAIL', error: error.message });
      }

    } catch (error) {
      console.log(`  ❌ 登录失败: ${error.message}\n`);
      results.failed++;
      results.tests.push({ name: '用户登录', status: 'FAIL', error: error.message });
    }

  } catch (error) {
    console.log(`  ❌ 注册失败: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: '用户注册', status: 'FAIL', error: error.message });
  }

  // 打印结果
  console.log('========================================');
  console.log('📊 测试结果');
  console.log('========================================');
  console.log(`\n✅ 通过: ${results.passed} 个测试`);
  console.log(`❌ 失败: ${results.failed} 个测试`);
  console.log(`🎯 成功率: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`);

  if (results.passed === results.passed + results.failed) {
    console.log('🎉 所有测试通过！\n');
    process.exit(0);
  } else {
    console.log('⚠️  部分测试失败，请检查错误。\n');
    process.exit(1);
  }
}

runTests();
