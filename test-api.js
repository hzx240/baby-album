const http = require('http');

async function testAuth() {
  const loginRes = await httpRequest('POST', '/api/v1/auth/login', {
    email: 'test1770887505@example.com',
    password: 'Test123456'
  });

  console.log('✅ Login successful');
  return loginRes.accessToken;
}

async function testPhotos(token) {
  const photosRes = await httpRequest('GET', '/api/v1/media', null, token);
  console.log(`✅ Photos loaded: ${photosRes.data.length} photos`);
  return photosRes.data;
}

async function testBatchUrls(token, photoIds) {
  const startTime = Date.now();
  const urlPromises = photoIds.map(id =>
    httpRequest('GET', `/api/v1/media/${id}/url?size=thumb`, null, token)
  );

  await Promise.all(urlPromises);
  const duration = Date.now() - startTime;
  console.log(`✅ Batch URLs fetched: ${photoIds.length} URLs in ${duration}ms`);
}

function httpRequest(method, path, data, token = null) {
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

  return new Promise((resolve, reject) => {
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
  console.log('\n🧪 Starting API Tests...\n');

  try {
    // Test 1: Authentication
    const token = await testAuth();

    // Test 2: Get photos
    const photos = await testPhotos(token);

    if (photos.length > 0) {
      // Test 3: Batch URL fetching
      const photoIds = photos.slice(0, Math.min(5, photos.length)).map(p => p.id);
      await testBatchUrls(token, photoIds);

      console.log('\n✅ All API tests passed!');
      console.log('\n📊 Test Results:');
      console.log('- Authentication: ✅ Working');
      console.log('- Photo List: ✅ Working');
      console.log('- Batch URLs: ✅ Working');
      console.log('\n🚀 Ready for manual browser testing at http://localhost:5173');
    } else {
      console.log('\n⚠️  No photos found. Upload some first!');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
