import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import PublicLayout from './components/PublicLayout.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Plan from './pages/Plan.jsx';
import Tasks from './pages/Tasks.jsx';
import Approvals from './pages/Approvals.jsx';
import Risks from './pages/Risks.jsx';
import Knowledge from './pages/Knowledge.jsx';
import ServicesAdminPage from './pages/admin/ServicesAdminPage.jsx';
import ProductsAdminPage from './pages/admin/ProductsAdminPage.jsx';
import ServiceEditPage from './pages/admin/ServiceEditPage.jsx';
import ProductEditPage from './pages/admin/ProductEditPage.jsx';
import ProjectsAdminPage from './pages/admin/ProjectsAdminPage.jsx';
import ProjectEditPage from './pages/admin/ProjectEditPage.jsx';
import BillingPage from './pages/admin/BillingPage.jsx';
import Home from './pages/public/Home.jsx';
import Services from './pages/public/Services.jsx';
import ServiceDetail from './pages/public/ServiceDetail.jsx';
import About from './pages/public/About.jsx';
import CaseStudies from './pages/public/CaseStudies.jsx';
import CaseStudy from './pages/public/CaseStudy.jsx';
import Contact from './pages/public/Contact.jsx';
import Pricing from './pages/public/Pricing.jsx';
import Products from './pages/public/Products.jsx';
import ProductDetail from './pages/public/ProductDetail.jsx';
import ProductLandingPage from './pages/public/ProductLandingPage.jsx';
import ServiceLandingPage from './pages/public/ServiceLandingPage.jsx';
import AuthLayout from './pages/auth/AuthLayout.jsx';
import SignIn from './pages/auth/SignIn.jsx';
import CreateAccount from './pages/auth/CreateAccount.jsx';
import { useAuth } from './context/AuthContext.jsx';

function GuestOnly({ children }) {
  const { isAuthenticated, checking } = useAuth();
  if (!checking && isAuthenticated) return <Navigate to="/app/dashboard" replace />;
  return children;
}

function RequireStaff({ children }) {
  const { user, isAuthenticated, checking } = useAuth();
  if (checking) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.is_staff) return <Navigate to="/app/dashboard" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes - no authentication required */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:serviceSlug" element={<ServiceDetail />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:productSlug" element={<ProductDetail />} />
        <Route path="/p/:productSlug" element={<ProductLandingPage />} />
        <Route path="/s/:serviceSlug" element={<ServiceLandingPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/case-studies" element={<CaseStudies />} />
        <Route path="/case-studies/:caseStudyId" element={<CaseStudy />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* Auth routes - signed out users only */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<GuestOnly><SignIn /></GuestOnly>} />
        <Route path="/signup" element={<GuestOnly><CreateAccount /></GuestOnly>} />
      </Route>

      {/* Protected routes - dashboard app */}
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/app/dashboard" element={<Dashboard />} />
        <Route path="/app/plan" element={<Plan />} />
        <Route path="/app/tasks" element={<Tasks />} />
        <Route path="/app/approvals" element={<Approvals />} />
        <Route path="/app/risks" element={<Risks />} />
        <Route path="/app/knowledge" element={<Knowledge />} />

        {/* Project administration - staff only */}
        <Route element={<RequireStaff />}>
          <Route path="/app/projects" element={<ProjectsAdminPage />} />
          <Route path="/app/projects/new" element={<ProjectEditPage />} />
          <Route path="/app/projects/:id/edit" element={<ProjectEditPage />} />
          <Route path="/app/billing" element={<BillingPage />} />
        </Route>

        {/* Catalog administration - staff only */}
        <Route element={<RequireStaff />}>
          <Route path="/app/admin/services" element={<ServicesAdminPage />} />
          <Route path="/app/admin/services/new" element={<ServiceEditPage />} />
          <Route path="/app/admin/services/:slug/edit" element={<ServiceEditPage />} />
          <Route path="/app/admin/products" element={<ProductsAdminPage />} />
          <Route path="/app/admin/products/new" element={<ProductEditPage />} />
          <Route path="/app/admin/products/:slug/edit" element={<ProductEditPage />} />
        </Route>
      </Route>

      {/* Redirect old routes */}
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/plan" element={<Navigate to="/app/plan" replace />} />
      <Route path="/tasks" element={<Navigate to="/app/tasks" replace />} />
      <Route path="/approvals" element={<Navigate to="/app/approvals" replace />} />
      <Route path="/risks" element={<Navigate to="/app/risks" replace />} />
      <Route path="/knowledge" element={<Navigate to="/app/knowledge" replace />} />
    </Routes>
  );
}