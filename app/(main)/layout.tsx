import React from "react";

// Layout wrapper for all dashboard and authenticated app pages
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Adds top margin for the fixed header and centers content
    <div className="container mx-auto my-32 px-4">
      {children}
    </div>
  );
}

