import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="animate-fade-in">
        {/* Hero Section */}
        <div className="text-center py-16 px-4">
          <div className="mb-8">
            <span className="text-7xl animate-bounce-soft inline-block">👶</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gradient">
            宝宝成长相册
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            用爱记录宝宝的每一个珍贵瞬间，分享成长的喜悦
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="btn-primary text-lg px-8 py-3"
            >
              开始记录 ✨
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-outline text-lg px-8 py-3"
            >
              已有账号？登录
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
          <FeatureCard
            icon="👶"
            title="宝贝管理"
            description="为您的宝贝创建专属的成长记录"
            delay="0"
          />
          <FeatureCard
            icon="📷"
            title="照片管理"
            description="安全存储宝宝的照片，支持多格式、高清保存"
            delay="100"
          />
          <FeatureCard
            icon="🔒"
            title="安全私密"
            description="完全私密的个人空间，安全记录成长点滴"
            delay="200"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Welcome Banner */}
      <div className="card-gradient mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              欢迎回来，{user?.displayName || '亲爱的'}！👋
            </h1>
            <p className="text-gray-600">
              今天也是记录美好的一天呢 ✨
            </p>
          </div>
          <div className="text-6xl animate-bounce-soft hidden sm:block">
            🎉
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard
          icon="👶"
          title="我的宝贝"
          description="查看和管理您的宝贝"
          action={() => navigate('/children')}
          color="primary"
          delay="0"
        />
        <ActionCard
          icon="📷"
          title="照片墙"
          description="浏览和上传宝宝的照片"
          action={() => navigate('/photos')}
          color="accent"
          delay="100"
        />
        <ActionCard
          icon="✨"
          title="上传照片"
          description="记录宝宝的精彩瞬间"
          action={() => navigate('/photos')}
          color="warm"
          delay="200"
        />
      </div>

      {/* Quick Start */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">快速开始</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickAction
            icon="➕"
            title="添加宝贝"
            description="添加您的宝贝信息"
            onClick={() => navigate('/children')}
          />
          <QuickAction
            icon="📤"
            title="上传照片"
            description="记录宝宝的精彩瞬间"
            onClick={() => navigate('/photos')}
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: {
  icon: string;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div
      className="card text-center animate-slide-up"
      style={{ animationDelay: delay }}
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function ActionCard({ icon, title, description, action, color, delay }: {
  icon: string;
  title: string;
  description: string;
  action: () => void;
  color: 'primary' | 'accent' | 'warm';
  delay: string;
}) {
  const colorClasses = {
    primary: 'hover:bg-primary-50 hover:shadow-glow hover:border-primary-200',
    accent: 'hover:bg-accent-50 hover:shadow-glow hover:border-accent-200',
    warm: 'hover:bg-warm-50 hover:shadow-glow hover:border-warm-200',
  };

  return (
    <div
      onClick={action}
      className={`card cursor-pointer border-2 border-transparent ${colorClasses[color]} animate-scale-in`}
      style={{ animationDelay: delay }}
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function QuickAction({ icon, title, description, onClick }: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="card cursor-pointer hover:shadow-glow border-2 border-transparent hover:border-primary-200 transition-all"
    >
      <div className="flex items-center space-x-4">
        <div className="text-4xl">{icon}</div>
        <div>
          <h4 className="font-semibold mb-1">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}
