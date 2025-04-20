// src/App.tsx
import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { ProtectedRoute } from "./auth/ProtectedRoute"; // Assuming ProtectedRoute handles role checks
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Details from "./pages/Details";
import History from "./pages/History";
import Review from "./pages/Review";
import { Auth0Provider } from "@auth0/auth0-react";
import { auth0Config } from "./auth/auth0-config";
import { AuthProvider } from "./auth/AuthContext";

// ScrollToTop component to handle scroll position on navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    // Scroll to top when pathname changes
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Wrapper component that includes Header and Routes
const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <ScrollToTop />
      <Header />
      <div className="container mx-auto px-4 py-6">
        <Routes>
          {/* Use key prop to force remount when path changes */}
          <Route path="/" element={<Dashboard key="dashboard" />} />
          <Route path="/details" element={<Details key="details" />} />

          {/* Admin-only routes protected by ProtectedRoute */}
          <Route 
            path="/history" 
            element={
              <ProtectedRoute requiredRole="admin">
                <History key="history" />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/review" 
            element={
              <ProtectedRoute requiredRole="admin">
                <Review key="review" />
              </ProtectedRoute>
            }
          />
          
          {/* Fallback route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <Auth0Provider {...auth0Config}>
      <AuthProvider>
        <AppProvider>
          <Router>
            <AppLayout /> { /* Use the layout component */ }
          </Router>
        </AppProvider>
      </AuthProvider>
    </Auth0Provider>
  );
}

export default App;
