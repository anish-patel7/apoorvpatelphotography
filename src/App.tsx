import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import WhatsAppButton from './components/layout/WhatsAppButton';
import ScrollToTop from './components/layout/ScrollToTop';

// Critical Homepage statically imported for immediate initial render
import Home from './pages/Home';

// Lazy-loaded public secondary routes
const Portfolio = lazy(() => import('./pages/Portfolio'));
const PortfolioDetail = lazy(() => import('./pages/PortfolioDetail'));
const Services = lazy(() => import('./pages/Services'));
const Training = lazy(() => import('./pages/Training'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

// Lazy-loaded Admin dashboard routes (split completely from public bundle)
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminLeads = lazy(() => import('./pages/admin/AdminLeads'));
const AdminPortfolio = lazy(() => import('./pages/admin/AdminPortfolio'));
const AdminServices = lazy(() => import('./pages/admin/AdminServices'));
const AdminReels = lazy(() => import('./pages/admin/AdminReels'));
const AdminTraining = lazy(() => import('./pages/admin/AdminTraining'));
const AdminTestimonials = lazy(() => import('./pages/admin/AdminTestimonials'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));

function PageFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AdminFallback() {
  return (
    <div className="min-h-screen bg-surface-container flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const { isAuthenticated, signIn, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-tertiary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Administrative Routes Protected by Supabase Auth */}
        <Route path="/admin/login" element={
          isAuthenticated ? (
            <Navigate to="/admin" replace />
          ) : (
            <Suspense fallback={<AdminFallback />}>
              <AdminLogin onLogin={signIn} />
            </Suspense>
          )
        } />

        <Route path="/admin/*" element={
          isAuthenticated ? (
            <Suspense fallback={<AdminFallback />}>
              <AdminLayout onLogout={signOut}>
                <Routes>
                  <Route index element={<AdminDashboard />} />
                  <Route path="leads" element={<AdminLeads />} />
                  <Route path="portfolio" element={<AdminPortfolio />} />
                  <Route path="services" element={<AdminServices />} />
                  <Route path="reels" element={<AdminReels />} />
                  <Route path="training" element={<AdminTraining />} />
                  <Route path="testimonials" element={<AdminTestimonials />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </AdminLayout>
            </Suspense>
          ) : (
            <Navigate to="/admin/login" replace />
          )
        } />

        <Route path="*" element={
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route index element={<Home />} />
                  <Route path="portfolio" element={<Portfolio />} />
                  <Route path="portfolio/:id" element={<PortfolioDetail />} />
                  <Route path="services" element={<Services />} />
                  <Route path="training" element={<Training />} />
                  <Route path="about" element={<About />} />
                  <Route path="contact" element={<Contact />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
            <WhatsAppButton />
          </div>
        } />
      </Routes>
    </>
  );
}
