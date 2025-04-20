// src/components/ui/Card.tsx

import React from "react";
import CardContent from "./CardContent";

interface CardProps {
  title: string;
  footer?: string;
  children: React.ReactNode; // Children will be passed as content to CardContent
  className?: string; // Allow className to be passed as a prop
}

// Update the title renderer in the Card component
const Card: React.FC<CardProps> = ({ title, footer, children, className }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg ${className || ''}`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      </div>
      <CardContent>{children}</CardContent>
      {footer && <div className="mt-4 text-gray-500 dark:text-gray-400 p-4">{footer}</div>}
    </div>
  );
};

export default Card;
