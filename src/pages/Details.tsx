// src/pages/Details.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Details = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Details Page</h1>
      <button
        className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
        onClick={() => navigate("/")}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default Details;
