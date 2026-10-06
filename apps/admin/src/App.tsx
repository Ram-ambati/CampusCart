import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LayoutDashboard, CheckSquare, Flag, Users as UsersIcon, LogOut } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Approvals from './pages/Approvals';
import Reports from './pages/Reports';
import Users from './pages/Users';

const queryClient = new QueryClient();

function Sidebar() {
  const location = useLocation();
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Approvals', path: '/approvals', icon: CheckSquare },
    { name: 'Reports', path: '/reports', icon: Flag },
    { name: 'Users', path: '/users', icon: UsersIcon },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col">
      <div className="flex items-center gap-3 mb-10 px-2 mt-4">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
          <span className="text-xl font-black text-slate-900">A</span>
        </div>
        <span className="text-xl font-bold tracking-tight">Admin Console</span>
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
              location.pathname === item.path ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        ))}
      </nav>
      
      <button 
        onClick={() => {
          localStorage.removeItem('jwt');
          window.location.href = '/login';
        }}
        className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors font-medium mt-auto"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('jwt');
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/approvals" element={<Layout><Approvals /></Layout>} />
          <Route path="/reports" element={<Layout><Reports /></Layout>} />
          <Route path="/users" element={<Layout><Users /></Layout>} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
