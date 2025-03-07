import Sidebar from "../src/app/components/Sidebar";
import Header from "../src/app/components/Header"; 
import Footer from "../src/app/components/Footer";
import { Geist, Geist_Mono } from "next/font/google";
//import Page from"./src/app/components/home/page";
import Page from "../src/page.js";
import "../src/globals.css";
//import Login from "../src/app/components/login/login";

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

export default function Layout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <Header />

          {/* Sidebar + Content */}
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 p-6">{children}</main>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </body>
    </html>
  );
}
