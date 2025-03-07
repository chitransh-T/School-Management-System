"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from './context/AuthContext';
import React, { memo } from 'react';
import { LandingNavbar } from "./components/LandingNavbar";
import DashboardNavbar from "./components/dashboardNavbar";
import Footer from "./components/footer";
import { useAuth } from "./context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

const NavbarWrapper = memo(function NavbarWrapper() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <DashboardNavbar /> : <LandingNavbar />;
});

NavbarWrapper.displayName = 'NavbarWrapper';

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="en" 
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body 
        className="flex flex-col min-h-screen"
        style={{
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        }}
      >
        <AuthProvider>
          <NavbarWrapper />
          <main className="flex-grow w-full max-w-screen-2xl mx-auto">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

