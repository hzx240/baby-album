import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export default function RootLayout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      navigate('/login');
    }
  };

  const navLinks = [
    { path: '/timeline', label: '时光轴', icon: 'auto_stories' },
    { path: '/children', label: '宝贝档案', icon: 'child_care' },
    { path: '/albums', label: '智能相册', icon: 'auto_awesome' },
    { path: '/members', label: '家庭空间', icon: 'family_restroom' },
    { path: '/upload', label: '上传中心', icon: 'cloud_upload' },
  ];

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  if (!isAuthenticated) {
    // Basic layout for non-authenticated pages like login/register
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-grow flex items-center justify-center p-4">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col">
      {/* SideNavBar */}
      <aside className="h-screen w-72 fixed left-0 top-0 rounded-r-[3rem] bg-rose-50/60 dark:bg-stone-900/60 backdrop-blur-xl flex flex-col py-10 px-8 shadow-[32px_0_64px_-12px_rgba(159,64,67,0.04)] z-50">
        <div className="mb-12">
          <Link to="/">
            <h1 className="text-2xl font-semibold text-rose-900 dark:text-rose-100 italic font-headline">宝宝成长相册</h1>
            <p className="font-notoSerif tracking-tight font-light text-stone-500 mt-1">成长记录</p>
          </Link>
        </div>
        <nav className="flex-grow space-y-4">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-4 py-3 px-4 font-medium transition-colors rounded-full ${
                  active
                    ? 'text-rose-900 dark:text-rose-50 font-bold border-r-4 border-rose-800 dark:border-rose-300 pr-4 hover:bg-rose-100/40 bg-rose-100/20'
                    : 'text-stone-500 dark:text-stone-400 hover:text-rose-700 hover:bg-rose-100/40 dark:hover:bg-stone-800/40'
                }`}
              >
                <span className="material-symbols-outlined">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2 pt-8 border-t border-rose-100/20">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 py-2 px-4 text-stone-400 hover:text-rose-700 transition-colors">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-xs uppercase tracking-widest font-bold">退出登录</span>
          </button>
        </div>
      </aside>

      {/* TopNavBar */}
      <header className="flex justify-between items-center ml-72 px-12 h-20 w-[calc(100%-18rem)] bg-white/40 dark:bg-stone-950/40 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <span className="font-spaceGrotesk text-sm uppercase tracking-widest text-rose-800 dark:text-rose-300 font-bold border-b-2 border-rose-900">相册管理</span>
          <div className="relative">
            <input className="bg-surface-container-highest border-none rounded-full py-2 px-6 text-xs font-bold tracking-widest focus:ring-2 focus:ring-secondary/20 w-64" placeholder="搜索档案..." type="text"/>
            <span className="material-symbols-outlined absolute right-4 top-2 text-stone-400 text-sm">search</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-4">
            <button onClick={() => navigate('/timeline')} className="material-symbols-outlined text-rose-800 hover:opacity-80 transition-opacity" title="时光轴">history_edu</button>
          </div>
          <div className="h-8 w-[1px] bg-outline-variant/30"></div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">监护人</p>
              <p className="text-xs font-bold text-rose-900">{user?.displayName || user?.email || 'User'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-200 flex items-center justify-center text-rose-800 font-bold shadow-sm">
              {(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-72 p-12 flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="flex justify-between items-center px-12 py-4 w-[calc(100%-18rem)] ml-72 bg-stone-100 dark:bg-stone-900 text-teal-700 dark:text-teal-400 font-spaceGrotesk text-[10px] uppercase font-bold mt-auto">
        <div className="text-stone-400">© 2024 宝宝成长相册 | 记录生命的点滴</div>
        <div className="flex gap-8">
          <Link className="text-stone-400 hover:text-teal-500 transition-all duration-500" to="/children">宝贝档案</Link>
          <Link className="text-stone-400 hover:text-teal-500 transition-all duration-500" to="/albums">智能相册</Link>
          <Link className="text-stone-400 hover:text-teal-500 transition-all duration-500" to="/members">家庭空间</Link>
        </div>
      </footer>
    </div>
  );
}