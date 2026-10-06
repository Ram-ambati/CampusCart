import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Marketplace from './pages/Marketplace';
import CreateListing from './pages/CreateListing';
import SellerDashboard from './pages/SellerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import Inbox from './pages/Inbox';
import UserProfile from './pages/UserProfile';
import ItemDetail from './pages/ItemDetail';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('jwt');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth & Setup */}
        <Route path="/login" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        
        {/* Core Marketplace */}
        <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
        <Route path="/marketplace/category/:id" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
        <Route path="/marketplace/item/:id" element={<ProtectedRoute><ItemDetail /></ProtectedRoute>} />
        
        {/* Dashboards & Creation */}
        <Route path="/marketplace/create" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
        <Route path="/marketplace/you/selling" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
        <Route path="/marketplace/you/buying" element={<ProtectedRoute><BuyerDashboard /></ProtectedRoute>} />
        
        {/* Inbox */}
        <Route path="/marketplace/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
        
        {/* Profiles */}
        <Route path="/profile/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

        {/* Legacy redirect for any old /home links */}
        <Route path="/home" element={<Navigate to="/marketplace" replace />} />
        
        {/* Default route points to Landing (mounted at /login so spring boot redirects work) */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
