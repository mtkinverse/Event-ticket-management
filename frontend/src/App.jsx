import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { Navbar } from './components/layout/Navbar.jsx';
import { Footer } from './components/layout/Footer.jsx';
import { AuthGuard } from './guards/AuthGuard.jsx';
import { RoleGuard } from './guards/RoleGuard.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import AllEvents from './pages/AllEvents.jsx';
import EventDetails from './pages/EventDetails.jsx';
import EventCreation from './pages/EventCreation.jsx';
import TicketBooking from './pages/TicketBooking.jsx';
import MainDashboard from './pages/MainDashboard.jsx';
import OrganizerDashboard from './pages/OrganizerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminApproval from './pages/AdminApproval.jsx';

import './styles/global.css';

function Layout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/events" element={<AllEvents />} />
              <Route path="/events/:id" element={<EventDetails />} />

              {/* Auth required */}
              <Route element={<AuthGuard />}>
                <Route path="/dashboard" element={<MainDashboard />} />
                <Route path="/events/:id/book" element={<TicketBooking />} />

                {/* Organizer only */}
                <Route element={<RoleGuard allow={['organizer']} />}>
                  <Route path="/events/new" element={<EventCreation />} />
                  <Route path="/organizer" element={<OrganizerDashboard />} />
                </Route>

                {/* Admin only */}
                <Route element={<RoleGuard allow={['admin']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/approvals" element={<AdminApproval />} />
                </Route>
              </Route>
            </Routes>
          </Layout>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
