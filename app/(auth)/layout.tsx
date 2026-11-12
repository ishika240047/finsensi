import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center pt-36 pb-16">
      {children}
    </div>
  );
}

