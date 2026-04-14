import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, History as HistoryIcon, ChefHat, Bell, User } from "lucide-react";

const navigationItems = [
  {
    title: "Scan",
    url: createPageUrl("Home"),
    icon: Home,
  },

  {
    title: "History",
    url: createPageUrl("History"),
    icon: HistoryIcon,
  },
  {
    title: "Recipes", 
    url: createPageUrl("Recipes"),
    icon: ChefHat,
  },
  {
    title: "Profile",
    url: createPageUrl("Profile"),
    icon: User,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex flex-col">
      <style>
        {`
          :root {
            --primary-green: #10B981;
            --secondary-green: #059669;
            --accent-green: #D1FAE5;
            --text-dark: #1F2937;
            --text-light: #6B7280;
            --surface-white: #FFFFFF;
            --surface-gray: #F9FAFB;
          }
        `}
      </style>
      
      {/* Main Content */}
      <main className="flex-1 pb-20 overflow-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-3">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navigationItems.map((item, index) => {
            const isActive = location.pathname === item.url;
            return (
              <Link
                key={item.title}
                to={item.url}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-emerald-100 text-emerald-700 scale-105' 
                    : 'text-gray-500 hover:text-emerald-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-2' : 'stroke-1.5'}`} />
                <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {item.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}