"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

interface LandingPageProps {
  onOrderNow: () => void;
}

export function LandingPage({ onOrderNow }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 relative overflow-hidden">
      {/* Decorative Background Patterns */}
      <div className="absolute inset-0 opacity-20">
        {/* Top Left Circles */}
        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-orange-300 rounded-full"></div>
        <div className="absolute top-20 left-20 w-16 h-16 border-2 border-orange-300 rounded-full"></div>
        <div className="absolute top-32 left-8 w-8 h-8 bg-orange-300 rounded-full"></div>

        {/* Top Right Circles */}
        <div className="absolute top-16 right-16 w-24 h-24 border-3 border-orange-300 rounded-full"></div>
        <div className="absolute top-8 right-32 w-12 h-12 border-2 border-orange-300 rounded-full"></div>
        <div className="absolute top-40 right-8 w-6 h-6 bg-orange-300 rounded-full"></div>

        {/* Bottom Left Circles */}
        <div className="absolute bottom-20 left-12 w-28 h-28 border-3 border-orange-300 rounded-full"></div>
        <div className="absolute bottom-32 left-32 w-10 h-10 border-2 border-orange-300 rounded-full"></div>
        <div className="absolute bottom-8 left-8 w-4 h-4 bg-orange-300 rounded-full"></div>

        {/* Bottom Right Circles */}
        <div className="absolute bottom-24 right-20 w-20 h-20 border-2 border-orange-300 rounded-full"></div>
        <div className="absolute bottom-12 right-12 w-14 h-14 border-3 border-orange-300 rounded-full"></div>
        <div className="absolute bottom-40 right-40 w-6 h-6 bg-orange-300 rounded-full"></div>

        {/* Center Area Circles */}
        <div className="absolute top-1/3 left-1/4 w-16 h-16 border-2 border-orange-300 rounded-full"></div>
        <div className="absolute top-2/3 right-1/4 w-12 h-12 border-2 border-orange-300 rounded-full"></div>
        <div className="absolute top-1/2 left-1/6 w-8 h-8 bg-orange-300 rounded-full"></div>
        <div className="absolute top-1/4 right-1/3 w-6 h-6 bg-orange-300 rounded-full"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-md mx-auto">
          {/* Logo/Image Container */}
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center border border-orange-200">
              <Image
                src="/placeholder.svg?height=80&width=80"
                alt="DYU Art Cafe"
                width={80}
                height={80}
                className="rounded-lg"
              />
            </div>
          </div>

          {/* Cafe Name */}
          <h1 className="text-3xl font-bold text-gray-800 mb-12 tracking-wide">
            dyu art cafe
          </h1>

          {/* Order Now Button */}
          <Button
            onClick={onOrderNow}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            size="lg"
          >
            Order Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Subtle Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-200/30 to-transparent"></div>
    </div>
  );
}
