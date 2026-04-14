import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Food, User } from "@/entities/all";
import { backendClient } from "@/api/backendClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { User as UserIcon, Bell, MapPin, Award, Settings, LogOut } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ itemsSaved: 0, lbsReduced: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // Get session data
      const sessionData = localStorage.getItem("leftosense_session");
      if (!sessionData) {
        navigate("/");
        return;
      }
      
      const { username } = JSON.parse(sessionData);
      setUser({ username });

      // Fetch and calculate stats
      const savedFoods = await backendClient.entities.Food.filter({ 
        created_by: username, 
        status: { $in: ['eaten', 'donated'] } 
      });

      const itemsSaved = savedFoods.length;
      const lbsReduced = savedFoods.reduce((total, food) => total + (food.weight_lbs || 0), 0);
      
      setStats({ itemsSaved, lbsReduced: lbsReduced.toFixed(1) });

    } catch (error) {
      console.error("Error loading user data:", error);
    }
    setIsLoading(false);
  };

  const updateNotificationSetting = async (setting, value) => {
    if (!user) return;
    
    try {
      const updatedSettings = {
        ...user.notification_settings,
        [setting]: value
      };
      
      await User.updateMyUserData({
        notification_settings: updatedSettings
      });
      
      setUser({
        ...user,
        notification_settings: updatedSettings
      });
    } catch (error) {
      console.error("Error updating notification settings:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("leftosense_session");
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </motion.div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{user?.username}</h2>
                  <Badge variant="secondary" className="mt-1 capitalize">
                    User
                  </Badge>
                </div>
              </div>
              

            </CardContent>
          </Card>
        </motion.div>

        {/* Impact Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                Your Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-emerald-600">{stats.itemsSaved}</div>
                  <div className="text-sm text-gray-600">Items Saved</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600">{stats.lbsReduced}</div>
                  <div className="text-sm text-gray-600">lbs Reduced</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Settings & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </motion.div>
      </div>
    </div>
  );
}