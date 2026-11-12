import React, { Suspense } from "react";
import { BarLoader } from "react-spinners";

// Dashboard layout wrapping the dashboard page inside a Suspense boundary with a BarLoader
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="px-5">
      {/* Dashboard title with gradient effect */}
      <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-5">
        Dashboard
      </h1>

      {/* Shows BarLoader indicator while server data is loading */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        {children}
      </Suspense>
    </div>
  );
}

