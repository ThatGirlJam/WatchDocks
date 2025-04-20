// components/AlertModal.tsx
import React from "react";
import { Alert } from "../types";
import { X } from "lucide-react";

type Props = {
  alert: Alert;
  onClose: () => void;
};

const AlertModal: React.FC<Props> = ({ alert, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          onClick={onClose}
        >
          <X />
        </button>
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
          Alert Details
        </h3>
        <img
          src={alert.imageUrl}
          alt="Alert"
          className="rounded-md mb-4 max-h-60 w-full object-cover"
        />
        <div className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
          <p>
            <strong>ID:</strong> {alert.id}
          </p>
          <p>
            <strong>Location:</strong> {alert.location}
          </p>
          <p>
            <strong>Status:</strong> {alert.status}
          </p>
          <p>
            <strong>Confidence:</strong> {(alert.confidence * 100).toFixed(1)}%
          </p>
          <p>
            <strong>Timestamp:</strong> {alert.timestamp.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
