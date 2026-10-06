import { useQuery } from '@tanstack/react-query';
import { Package, Users, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const token = localStorage.getItem('jwt');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Mock stats for now, since we didn't build a /api/admin/stats endpoint
      // We can fetch lists and take lengths
      const [usersRes, reportsRes, pendingRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/reports`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/listings/pending`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      
      const users = await usersRes.json();
      const reports = await reportsRes.json();
      const pending = await pendingRes.json();

      return {
        totalUsers: users.length || 0,
        pendingApprovals: pending.length || 0,
        openReports: reports.filter((r: any) => r.status === 'PENDING').length || 0,
      };
    }
  });

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-slate-900', bg: 'bg-slate-100' },
    { title: 'Pending Approvals', value: stats?.pendingApprovals || 0, icon: CheckCircle, color: 'text-slate-900', bg: 'bg-slate-100' },
    { title: 'Open Reports', value: stats?.openReports || 0, icon: AlertTriangle, color: 'text-slate-900', bg: 'bg-slate-100' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-black text-slate-900 mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 flex items-center shadow-sm">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mr-6`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-slate-500 font-medium text-sm uppercase tracking-wider mb-1">{stat.title}</p>
              <h2 className="text-4xl font-black text-slate-900">{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">Welcome to CampusCart Admin</h3>
        <p className="text-slate-500 font-medium">Use the sidebar to manage listings, moderate users, and resolve reports.</p>
      </div>
    </div>
  );
}
