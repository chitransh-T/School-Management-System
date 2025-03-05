"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from './context/AuthContext';
import React from 'react';
import { LandingNavbar } from "./components/LandingNavbar";
import DashboardNavbar from "./components/dashboardNavbar";
import Footer from "./components/footer";
import { useAuth } from "./context/AuthContext";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <NavbarWrapper />
          <main className="flex-grow">
            {children}
            
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

function NavbarWrapper() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <DashboardNavbar /> : <LandingNavbar />;
}

