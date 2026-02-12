const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 设置 Git 钩子...\n');

try {
  const hooksDir = path.join(process.cwd(), '.git', 'hooks');

  // 确保 .git/hooks 目录存在
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
    console.log('✅ 创建 .git/hooks 目录');
  }

  // 复制 pre-commit 钩子
  const preCommitSource = path.join(process.cwd(), '.git', 'hooks', 'pre-commit');
  const preCommitTarget = path.join(process.cwd(), '.git', 'hooks', 'pre-commit');

  fs.copyFileSync(preCommitSource, preCommitTarget);
  fs.chmodSync(preCommitTarget, '755'); // rwxr-xr-x

  console.log('✅ pre-commit 钩子已安装\n');
  console.log('📝 现在每次 git commit 会自动运行回归测试\n');

} catch (error) {
  console.error('❌ 设置钩子失败:', error.message);
  process.exit(1);
}
