import React from "react";

const PageLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background/50 backdrop-blur-sm">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
    <p className="mt-4 text-sm font-medium text-amber-600/80 animate-pulse">Loading DineFlow...</p>
  </div>
);

export default PageLoader;
