import Sidebar from "./components/Sidebar";
import Header from "./components/Header"; 
import Footer from "./components/Footer";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Blog & Notes App",
  description: "Smart blog and notes application",
};

function Layout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <Header />
          <div className="flex flex-1">

          {/* Sidebar */}

            {/* Sidebar */}
            <Sidebar />

            {/* Main content */}
            <main className="flex-1 p-6">{children}</main>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </body>
    </html>
  );
}

export default Layout;