// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Details from "./pages/Details";
import History from "./pages/History"; // Import the new History page

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <Header />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/details" element={<Details />} />
            <Route path="/history" element={<History />} /> {/* Add the new route */}
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
