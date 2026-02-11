import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export default function RootLayout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/children', label: '宝贝', icon: '👶' },
    { path: '/photos', label: '照片墙', icon: '📷' },
    { path: '/members', label: '家庭成员', icon: '👨‍👩‍👧‍👦', auth: true },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass sticky top-0 z-50 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 group">
                <span className="text-3xl group-hover:animate-bounce-soft">👶</span>
                <span className="text-xl font-bold text-gradient">
                  宝宝成长相册
                </span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks
                .filter((link) => !link.auth || isAuthenticated)
                .map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isActive(link.path)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-1">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              {isAuthenticated && user ? (
                <>
                  <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-primary-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
                      {user.displayName?.[0] || user.email[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user.displayName || user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="btn-ghost text-sm"
                  >
                    退出
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/login" className="btn-primary text-sm">
                    登录
                  </Link>
                  <Link to="/register" className="btn-secondary text-sm">
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>💕 用爱记录宝宝的每一个瞬间</p>
            <p className="mt-2">© 2024 宝宝成长相册</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
