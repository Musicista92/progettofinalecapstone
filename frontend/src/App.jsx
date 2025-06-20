import React from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster, ToastBar, toast } from "react-hot-toast";
import { X } from "lucide-react";

// Components
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoadingSpinner from "./components/common/LoadingSpinner";

// Pages
import Home from "./pages/Home";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyRitmo from "./pages/MyRitmo";
import CreateEvent from "./pages/CreateEvent";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";

// Hooks
import { useAuth } from "./contexts/AuthContext";
import UserProfile from "./pages/UserProfile";

function App() {
  const { loading, isAdmin } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home isAdmin={isAdmin} />} />
          <Route path="/events" element={<Events />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes - require authentication */}
          <Route
            path="/my-ritmo"
            element={
              <ProtectedRoute>
                <MyRitmo />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users/:id"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:id"
            element={
              <ProtectedRoute>
                <EventDetail />
              </ProtectedRoute>
            }
          />

          {/* Organizer and Admin routes */}
          <Route
            path="/create-event"
            element={
              <ProtectedRoute requireOrganizer>
                <CreateEvent />
              </ProtectedRoute>
            }
          />

          {/* Admin only routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* Error pages */}
          <Route path="/forbidden" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />

      {/* Toast notifications - Configurazione corretta */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#2c3e50",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontSize: "14px",
            padding: "12px 16px",
          },
          success: {
            duration: 3000,
            iconTheme: { primary: "#27ae60", secondary: "#fff" },
          },
          error: {
            duration: 5000,
            iconTheme: { primary: "#e74c3c", secondary: "#fff" },
          },
          loading: {
            duration: Infinity,
          },
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                <div className="toast-message">{message}</div>

                {/* Mostra il pulsante di chiusura solo se non è un toast di 'loading' */}
                {t.type !== "loading" && (
                  <button
                    className="toast-close-button"
                    onClick={() => toast.dismiss(t.id)}
                  >
                    <X size={16} />
                  </button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
    </div>
  );
}

export default App;