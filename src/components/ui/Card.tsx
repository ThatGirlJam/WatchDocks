// src/components/ui/Card.tsx

import React from "react";
import CardContent from "./CardContent";

interface CardProps {
  title: string;
  footer?: string;
  children: React.ReactNode; // Children will be passed as content to CardContent
  className?: string; // Allow className to be passed as a prop
}

const Card: React.FC<CardProps> = ({ title, footer, children }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <CardContent>{children}</CardContent>
      {footer && <div className="mt-4 text-gray-500 p-4">{footer}</div>}
    </div>
  );
};

export default Card;
