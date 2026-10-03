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

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth & Setup */}
        <Route path="/login" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        
        {/* Core Marketplace */}
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/category/:id" element={<Marketplace />} />
        <Route path="/marketplace/item/:id" element={<ItemDetail />} />
        
        {/* Dashboards & Creation */}
        <Route path="/marketplace/create" element={<CreateListing />} />
        <Route path="/marketplace/you/selling" element={<SellerDashboard />} />
        <Route path="/marketplace/you/buying" element={<BuyerDashboard />} />
        
        {/* Inbox */}
        <Route path="/marketplace/inbox" element={<Inbox />} />
        
        {/* Profiles */}
        <Route path="/profile/:userId" element={<UserProfile />} />
        <Route path="/profile/edit" element={<UserProfile />} />

        {/* Legacy redirect for any old /home links */}
        <Route path="/home" element={<Navigate to="/marketplace" replace />} />
        
        {/* Default route points to Landing (mounted at /login so spring boot redirects work) */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
