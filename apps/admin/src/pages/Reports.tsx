import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function Reports() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('jwt');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/admin/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    }
  });

  const updateReportStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await fetch(`${API_URL}/api/admin/reports/${id}?status=${status}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to update status');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500 font-medium">Loading reports...</div>;

  return (
    <div>
      <h1 className="text-3xl font-black text-slate-900 mb-8">Reports Queue</h1>
      
      {reports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-slate-500 font-medium">No reports filed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-bold text-slate-700">ID</th>
                <th className="p-4 font-bold text-slate-700">Reporter</th>
                <th className="p-4 font-bold text-slate-700">Target</th>
                <th className="p-4 font-bold text-slate-700">Reason</th>
                <th className="p-4 font-bold text-slate-700">Status</th>
                <th className="p-4 font-bold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report: any) => (
                <tr key={report.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-900">#{report.id}</td>
                  <td className="p-4 text-slate-600">{report.reporter?.realName || 'Unknown'}</td>
                  <td className="p-4 text-slate-600">
                    {report.targetType === 'LISTING' ? (
                      <a href={`http://localhost:5173/marketplace/item/${report.targetId}`} target="_blank" rel="noopener noreferrer" className="text-slate-900 hover:underline font-bold">
                        {report.targetType} #{report.targetId}
                      </a>
                    ) : report.targetType === 'USER' ? (
                      <a href={`http://localhost:5173/profile/${report.targetId}`} target="_blank" rel="noopener noreferrer" className="text-slate-900 hover:underline font-bold">
                        {report.targetType} #{report.targetId}
                      </a>
                    ) : (
                      <span className="font-bold">{report.targetType} #{report.targetId}</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-600 max-w-xs truncate">{report.reason}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                      report.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      report.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {report.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            if (window.confirm("Are you sure you want to resolve this report? If the target is a listing, it will be automatically DELETED.")) {
                              updateReportStatus.mutate({ id: report.id, status: 'RESOLVED' });
                            }
                          }}
                          disabled={updateReportStatus.isPending}
                          className="px-3 py-1 bg-slate-900 text-white rounded font-bold text-xs hover:bg-slate-800 disabled:opacity-50 transition-colors"
                        >
                          {updateReportStatus.isPending ? 'Working...' : 'Resolve'}
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm("Dismiss this report? No action will be taken.")) {
                              updateReportStatus.mutate({ id: report.id, status: 'DISMISSED' });
                            }
                          }}
                          disabled={updateReportStatus.isPending}
                          className="px-3 py-1 bg-slate-200 text-slate-700 rounded font-bold text-xs hover:bg-slate-300 disabled:opacity-50 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
