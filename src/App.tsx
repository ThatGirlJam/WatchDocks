// src/App.tsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Details from "./pages/Details";
import History from "./pages/History";

function App() {
  return (
    <Router>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </Router>
  );
}

// Separate component to handle route changes
const MainContent = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  
  // Log navigation for debugging
  useEffect(() => {
    console.log(`Navigation to: ${location.pathname}, type: ${navigationType}`);
  }, [location, navigationType]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header />
      <Routes>
        <Route path="/" element={<Dashboard key="dashboard" />} />
        <Route path="/details" element={<Details key="details" />} />
        <Route path="/history" element={<History key="history" />} />
      </Routes>
    </div>
  );
}

export default App;
