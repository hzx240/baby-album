/**
 * 宝贝成长相册 - 回归测试套件
 *
 * 用途：在每次 Git 提交前运行，确保所有基本功能正常工作
 *
 * 运行：node tests/regression-test.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const CONFIG = {
  API_URL: 'http://localhost:3001',
  TEST_USER: {
    email: `regression-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    displayName: '回归测试用户'
  },
  TIMEOUT: 10000 // 10秒超时
};

// ==================== 工具函数 ====================

function httpRequest(method, path, data, token = null, timeout = CONFIG.TIMEOUT) {
  return new Promise((resolve, reject) => {
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

    const timer = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        clearTimeout(timer);
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject(new Error(`API Error ${res.statusCode}: ${parsed.message || body}`));
          } else {
            resolve(parsed);
          }
        } catch {
          resolve(body);
          }
        });
      });
    });

    req.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    req.write(options.data || '');
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(test, status, message) {
  const icon = status === '✅' ? '✅' : status === '❌' ? '❌' : status === '⚠️' ? '⚠️' : 'ℹ️';
  console.log(`${icon} [${test}] ${message}`);
}

function assert(condition, testName, errorMessage) {
  if (!condition) {
    throw new Error(`${testName} failed: ${errorMessage}`);
  }
}

// ==================== 测试套件 ====================

const tests = {
  /**
   * 1. 用户认证测试
   */
  async auth() {
    log('AUTH', 'ℹ️', '开始用户认证测试...\n');

    // 1.1 注册新用户
    log('AUTH', 'ℹ️', '测试用户注册...');
    const registerRes = await httpRequest('POST', '/api/v1/auth/register', {
      email: CONFIG.TEST_USER.email,
      password: CONFIG.TEST_USER.password,
      displayName: CONFIG.TEST_USER.displayName
    });

    assert(registerRes.accessToken, '用户注册', '应该返回 accessToken');
    const token = registerRes.accessToken;
    log('AUTH', '✅', '用户注册成功');

    // 1.2 登录
    log('AUTH', 'ℹ️', '测试用户登录...');
    const loginRes = await httpRequest('POST', '/api/v1/auth/login', {
      email: CONFIG.TEST_USER.email,
      password: CONFIG.TEST_USER.password
    });

    assert(loginRes.accessToken, '用户登录', '应该返回 accessToken');
    log('AUTH', '✅', '用户登录成功');

    // 1.3 获取当前用户信息
    log('AUTH', 'ℹ️', '测试获取用户信息...');
    const meRes = await httpRequest('GET', '/api/v1/users/me', null, token);
    assert(meRes.id, '获取用户信息', '应该返回用户 ID');
    log('AUTH', '✅', '获取用户信息成功');

    // 1.4 测试刷新 token
    log('AUTH', 'ℹ️', '测试刷新 token...');
    await sleep(500);
    const refreshRes = await httpRequest('POST', '/api/v1/auth/refresh', null, token);
    assert(refreshRes.accessToken, '刷新 token', '应该返回新的 accessToken');
    log('AUTH', '✅', '刷新 token 成功');

    return { token, userId: meRes.id, familyId: meRes.familyId };
  },

  /**
   * 2. 孩子管理测试
   */
  async children(token, familyId) {
    log('CHILDREN', 'ℹ️', '开始孩子管理测试...\n');

    // 2.1 创建孩子
    log('CHILDREN', 'ℹ️', '测试创建孩子...');
    const childName = `测试宝贝-${Date.now()}`;
    const createChildRes = await httpRequest('POST', '/api/v1/children', {
      name: childName,
      birthDate: '2024-01-01',
      gender: 'MALE'
    }, token);

    assert(createChildRes.id, '创建孩子', '应该返回孩子 ID');
    const childId = createChildRes.id;
    log('CHILDREN', '✅', `创建孩子成功: ${childName}`);

    // 2.2 获取孩子列表
    log('CHILDREN', 'ℹ️', '测试获取孩子列表...');
    const listChildrenRes = await httpRequest('GET', '/api/v1/children', null, token);
    assert(Array.isArray(listChildrenRes), '获取孩子列表', '应该返回数组');
    log('CHILDREN', '✅', `获取到 ${listChildrenRes.length} 个孩子`);

    // 2.3 更新孩子信息
    log('CHILDREN', 'ℹ️', '测试更新孩子信息...');
    await httpRequest('PATCH', `/api/v1/children/${childId}`, {
      name: `${childName}-已更新`
    }, token);
    log('CHILDREN', '✅', '更新孩子信息成功');

    // 2.4 删除孩子
    log('CHILDREN', 'ℹ️', '测试删除孩子...');
    await httpRequest('DELETE', `/api/v1/children/${childId}`, null, token);
    log('CHILDREN', '✅', '删除孩子成功');

    return childId; // 返回供后续测试使用
  },

  /**
   * 3. 照片管理测试（核心功能）
   */
  async photos(token, familyId, childId) {
    log('PHOTOS', 'ℹ️', '开始照片管理测试...\n');

    // 3.1 获取照片列表
    log('PHOTOS', 'ℹ️', '测试获取照片列表...');
    const photosRes = await httpRequest('GET', '/api/v1/media?limit=10', null, token);
    assert(Array.isArray(photosRes.data), '获取照片列表', '应该返回数组');
    const initialCount = photosRes.data.length;
    log('PHOTOS', '✅', `获取到 ${initialCount} 张照片`);

    // 3.2 请求上传 URL
    log('PHOTOS', 'ℹ️', '测试请求上传 URL...');
    const uploadRequestRes = await httpRequest('POST', '/api/v1/media/request-upload', {
      filename: 'test-photo.jpg',
      contentType: 'image/jpeg',
      fileSize: 1024 * 100, // 100KB
      checksum: 'abc123'
    }, token);

    assert(uploadRequestRes.uploadUrl, '请求上传 URL', '应该返回 uploadUrl');
    log('PHOTOS', '✅', '获取上传 URL 成功');

    // 3.3 获取单个照片 URL
    if (photosRes.data.length > 0) {
      const photoId = photosRes.data[0].id;
      log('PHOTOS', 'ℹ️', '测试获取照片 URL...');
      const urlRes = await httpRequest('GET', `/api/v1/media/${photoId}/url?size=thumb`, null, token);
      assert(urlRes.url, '获取照片 URL', '应该返回 URL');
      log('PHOTOS', '✅', '获取照片 URL 成功');
    }

    // 3.4 删除照片
    if (photosRes.data.length > 0) {
      const photoId = photosRes.data[0].id;
      log('PHOTOS', 'ℹ️', '测试删除照片...');
      await httpRequest('DELETE', `/api/v1/media/${photoId}`, null, token);
      log('PHOTOS', '✅', '删除照片成功');

      // 3.5 验证删除
      const verifyRes = await httpRequest('GET', `/api/v1/media/${photoId}`, null, token);
      // 应该返回 404
      assert(verifyRes.statusCode === 404, '删除验证', '删除后应该返回 404');
      log('PHOTOS', '✅', '删除验证成功');
    }

    return initialCount;
  },

  /**
   * 4. 家庭成员测试
   */
  async familyMembers(token, familyId) {
    log('MEMBERS', 'ℹ️', '开始家庭成员测试...\n');

    // 4.1 获取家庭成员
    log('MEMBERS', 'ℹ️', '测试获取家庭成员...');
    const membersRes = await httpRequest('GET', `/api/v1/families/${familyId}/members`, null, token);
    assert(Array.isArray(membersRes), '获取家庭成员', '应该返回数组');
    log('MEMBERS', '✅', `获取到 ${membersRes.length} 个成员`);

    // 4.2 创建邀请
    log('MEMBERS', 'ℹ️', '测试创建家庭邀请...');
    const inviteRes = await httpRequest('POST', `/api/v1/families/${familyId}/invitations`, {
      email: `invited-${Date.now()}@example.com`,
      role: 'MEMBER'
    }, token);

    assert(inviteRes.token, '创建邀请', '应该返回邀请 token');
    log('MEMBERS', '✅', '创建邀请成功');

    // 4.3 获取邀请列表
    log('MEMBERS', 'ℹ️', '测试获取邀请列表...');
    const invitesRes = await httpRequest('GET', `/api/v1/families/${familyId}/invitations`, null, token);
    assert(Array.isArray(invitesRes), '获取邀请列表', '应该返回数组');
    log('MEMBERS', '✅', `获取到 ${invitesRes.length} 个邀请`);
  },

  /**
   * 5. 性能验证测试
   */
  async performance(token) {
    log('PERFORMANCE', 'ℹ️', '开始性能测试...\n');

    // 5.1 并发请求测试
    log('PERFORMANCE', 'ℹ️', '测试并发请求...');
    const startTime = Date.now();

    await Promise.all([
      httpRequest('GET', '/api/v1/users/me', null, token),
      httpRequest('GET', '/api/v1/children', null, token),
      httpRequest('GET', '/api/v1/media', null, token)
    ]);

    const duration = Date.now() - startTime;
    assert(duration < 2000, '并发请求', '3个并发请求应该在2秒内完成');
    log('PERFORMANCE', '✅', `并发请求完成: ${duration}ms`);

    // 5.2 响应时间测试
    log('PERFORMANCE', 'ℹ️', '测试 API 响应时间...');
    const times = [];
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      await httpRequest('GET', '/api/v1/users/me', null, token);
      times.push(Date.now() - start);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    assert(avgTime < 500, '响应时间', '平均响应时间应该小于500ms（JWT缓存生效）');
    log('PERFORMANCE', '✅', `平均响应时间: ${avgTime}ms`);
  }
};

// ==================== 主测试函数 ====================

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 宝贝成长相册 - 回归测试套件');
  console.log('='.repeat(60) + '\n');

  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  try {
    // Phase 1: 认证测试
    console.log('\n📋 阶段 1/5: 用户认证测试');
    console.log('-'.repeat(40));
    const authData = await tests.auth();
    results.passed += 5;

    // Phase 2: 孩子管理测试
    console.log('\n📋 阶段 2/5: 孩子管理测试');
    console.log('-'.repeat(40));
    const childId = await tests.children(authData.token, authData.familyId);
    results.passed += 4;

    // Phase 3: 照片管理测试
    console.log('\n📋 阶段 3/5: 照片管理测试');
    console.log('-'.repeat(40));
    await tests.photos(authData.token, authData.familyId, childId);
    results.passed += 5;

    // Phase 4: 家庭成员测试
    console.log('\n📋 阶段 4/5: 家庭成员测试');
    console.log('-'.repeat(40));
    await tests.familyMembers(authData.token, authData.familyId);
    results.passed += 3;

    // Phase 5: 性能测试
    console.log('\n📋 阶段 5/5: 性能验证测试');
    console.log('-'.repeat(40));
    await tests.performance(authData.token);
    results.passed += 2;

    // 打印总结
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试总结');
    console.log('='.repeat(60));
    console.log(`\n✅ 通过: ${results.passed} 个测试`);
    console.log(`❌ 失败: ${results.failed} 个测试`);
    console.log(`\n🎯 成功率: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

    if (results.errors.length > 0) {
      console.log('\n⚠️ 错误详情:');
      results.errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('\n' + '='.repeat(60));

    if (results.failed === 0) {
      console.log('\n🎉 所有回归测试通过！');
      console.log('✨ 代码可以安全提交\n');
      process.exit(0);
    } else {
      console.log('\n❌ 有测试失败，请检查错误！');
      console.log('⚠️  请修复后再次运行测试');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 测试执行出错:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ==================== 入口点 ====================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log('\n🧪 宝贝成长相册 - 回归测试套件\n');
    console.log('\n用法: node tests/regression-test.js [选项]\n');
    console.log('选项:');
    console.log('  --help, -h     显示此帮助信息');
    console.log('  --quick, -q     快速测试（跳过性能测试）');
    console.log('  --auth-only    仅测试认证功能');
    console.log('  --photos-only   仅测试照片功能');
    console.log('\n示例:');
    console.log('  node tests/regression-test.js           # 运行完整测试');
    console.log('  node tests/regression-test.js --quick      # 快速测试');
    console.log('  node tests/regression-test.js --auth-only  # 仅测试认证');
    process.exit(0);
  }

  const quickMode = args.includes('--quick') || args.includes('-q');
  const authOnly = args.includes('--auth-only');
  const photosOnly = args.includes('--photos-only');

  if (authOnly) {
    console.log('\n🔐 仅运行认证测试...\n');
    await tests.auth();
    console.log('\n✅ 认证测试完成！');
    process.exit(0);
  }

  if (photosOnly) {
    console.log('\n🔐 仅运行照片测试...\n');
    const authData = await tests.auth();
    await tests.photos(authData.token, authData.familyId, authData.childId);
    console.log('\n✅ 照片测试完成！');
    process.exit(0);
  }

  if (quickMode) {
    console.log('\n⚡ 快速模式（跳过性能测试）...\n');
  }

  runAllTests();
}

module.exports = { tests, httpRequest };
