import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// 404 page shown whenever a user visits a non-existent URL
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      {/* Big gradient 404 number */}
      <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
        404
      </h1>

      {/* Subheading */}
      <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>

      {/* Help message */}
      <p className="text-gray-600 mb-8 max-w-md">
        Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      {/* Button to navigate back to home */}
      <Link href="/">
        <Button className="bg-purple-700 hover:bg-purple-800 text-white cursor-pointer px-6">
          Return Home
        </Button>
      </Link>
    </div>
  );
}
