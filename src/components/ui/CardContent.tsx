// src/components/ui/CardContent.tsx

import React from "react";

interface CardContentProps {
  children: React.ReactNode;
  className?: string; // Allow className to be passed as a prop
}

const CardContent: React.FC<CardContentProps> = ({ children }) => {
  return <div className="p-4">{children}</div>;
};

export default CardContent;
