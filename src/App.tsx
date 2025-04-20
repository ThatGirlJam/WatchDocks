// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Details from "./pages/Details";
import History from "./pages/History";
import Review from "./pages/Review";
import { Auth0Provider } from "@auth0/auth0-react";
import { auth0Config } from "./auth/auth0-config";
import { AuthProvider } from "./auth/AuthContext";

function App() {
  return (
    <Auth0Provider {...auth0Config}>
      <AuthProvider>
        <AppProvider>
          <Router>
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <Header />
              <Routes>
                <Route path="/" element={
                  <ProtectedRoute requiredRole="bikeuser">
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/details" element={
                  <ProtectedRoute requiredRole="bikeuser">
                    <Details />
                  </ProtectedRoute>
                } />
                <Route path="/history" element={
                  <ProtectedRoute requiredRole="admin">
                    <History />
                  </ProtectedRoute>
                } />
                <Route path="/review" element={
                  <ProtectedRoute requiredRole="admin">
                    <Review />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </Router>
        </AppProvider>
      </AuthProvider>
    </Auth0Provider>
  );
}

export default App;
