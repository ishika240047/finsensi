"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

// Hero section at the top of the home page
const HeroSection = () => {
  const imageRef = useRef<HTMLDivElement>(null);

  // When scrolling down, straighten the tilted dashboard image
  useEffect(() => {
    const imageElement = imageRef.current;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;

      // After scrolling 100px down, make the image flat
      if (scrollPosition > 100) {
        imageElement?.classList.add("scrolled");
      } else {
        imageElement?.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="pb-20 px-4">
      <div className="container mx-auto text-center">
        {/* Main title */}
        <h1 className="text-5xl md:text-8xl lg:text-[100px] pb-6 font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Manage Your Finances <br className="hidden sm:inline" /> with Finsensi
        </h1>

        {/* Subtitle text */}
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          An AI-powered financial management platform that helps you track,
          analyze, and optimize your spending with real-time insights.
        </p>

        {/* Action buttons */}
        <div className="flex justify-center space-x-4 mb-12">
          <Link href="/dashboard">
            <Button size="lg" className="px-8 bg-purple-700 hover:bg-purple-800 text-white cursor-pointer">
              Get Started
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline" className="px-8 cursor-pointer">
              Watch Demo
            </Button>
          </Link>
        </div>

        {/* Dashboard preview image with 3D effect */}
        <div className="hero-image-wrapper">
          <div ref={imageRef} className="hero-image">
            <Image
              src="/hero_img2.jpeg"
              width={1280}
              height={720}
              alt="dashboard preview"
              className="rounded-2xl shadow-2xl border mx-auto"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
