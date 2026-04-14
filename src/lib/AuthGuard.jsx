import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthGuard({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const sessionData = localStorage.getItem("leftosense_session");
      
      if (!sessionData) {
        navigate("/");
        return;
      }

      try {
        const { timestamp } = JSON.parse(sessionData);
        const now = Date.now();
        const thirtyMinutes = 30 * 60 * 1000;
        
        if (now - timestamp >= thirtyMinutes) {
          // Session expired
          localStorage.removeItem("leftosense_session");
          navigate("/");
          return;
        }
        
        // Session valid
        setIsChecking(false);
      } catch (e) {
        localStorage.removeItem("leftosense_session");
        navigate("/");
      }
    };

    checkAuth();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}