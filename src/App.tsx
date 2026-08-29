import { Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import WhatsAppButton from './components/layout/WhatsAppButton';
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import PortfolioDetail from './pages/PortfolioDetail';
import Services from './pages/Services';
import Training from './pages/Training';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLeads from './pages/admin/AdminLeads';
import AdminPortfolio from './pages/admin/AdminPortfolio';
import AdminServices from './pages/admin/AdminServices';
import AdminReels from './pages/admin/AdminReels';
import AdminTraining from './pages/admin/AdminTraining';
import AdminTestimonials from './pages/admin/AdminTestimonials';
import AdminLogin from './pages/admin/AdminLogin';
import ScrollToTop from './components/layout/ScrollToTop';

export default function App() {
  const { isAuthenticated, signIn, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-saffron border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/admin/login" element={<AdminLogin onLogin={signIn} />} />
        <Route path="/admin/*" element={
          isAuthenticated ? (
            <AdminLayout onLogout={signOut}>
              <Routes>
                <Route index element={<AdminDashboard />} />
                <Route path="leads" element={<AdminLeads />} />
                <Route path="portfolio" element={<AdminPortfolio />} />
                <Route path="services" element={<AdminServices />} />
                <Route path="reels" element={<AdminReels />} />
                <Route path="training" element={<AdminTraining />} />
                <Route path="testimonials" element={<AdminTestimonials />} />
              </Routes>
            </AdminLayout>
          ) : (
            <AdminLogin onLogin={signIn} />
          )
        } />
        <Route path="*" element={
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route index element={<Home />} />
                <Route path="portfolio" element={<Portfolio />} />
                <Route path="portfolio/:id" element={<PortfolioDetail />} />
                <Route path="services" element={<Services />} />
                <Route path="training" element={<Training />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
              </Routes>
            </main>
            <Footer />
            <WhatsAppButton />
          </div>
        } />
      </Routes>
    </>
  );
}
