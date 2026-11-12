import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import Header from "@/components/ui/header";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finsensi",
  description: "Personal finance app",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          {/* Header is wrapped in Suspense so Next.js 16 can prerender the page shell while streaming dynamic user auth */}
          <Suspense fallback={null}>
            <Header />
          </Suspense>

          <main className="min-h-screen">{children}</main>

          {/* Toast notifications across the app */}
          <Toaster richColors />

          {/* Footer shown at the bottom of all pages */}
          <footer className="bg-blue-50 py-12">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>Made with love</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
