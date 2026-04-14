import React, { useState, useEffect } from "react";
import { backendClient } from "@/api/backendClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Clock, AlertTriangle, CheckCircle, Bell } from "lucide-react";
import { differenceInHours, format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function AlertsPage() {
  const [foods, setFoods] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const session = localStorage.getItem('leftosense_session');
      if (!session) {
        navigate('/');
        return;
      }
      
      const sessionData = JSON.parse(session);
      const currentUser = await backendClient.entities.AppUser.get(sessionData.userId);
      setUser(currentUser);
      
      const storedFoods = await backendClient.entities.Food.filter({ 
        created_by: currentUser.username, 
        status: "stored" 
      }, "-created_date");
      setFoods(storedFoods);
    } catch (error) {
      console.error("Error loading foods:", error);
      navigate('/');
    }
  };

  const handleStatusUpdate = async (foodId, newStatus) => {
    try {
      await backendClient.entities.Food.update(foodId, { status: newStatus });
      loadData();
    } catch (error) {
      console.error("Error updating food status:", error);
    }
  };

  const getUrgencyLevel = (hoursLeft) => {
    if (hoursLeft <= 0) return 'expired';
    if (hoursLeft <= 6) return 'critical';
    if (hoursLeft <= 24) return 'warning';
    return 'normal';
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'expired': return 'bg-red-500';
      case 'critical': return 'bg-red-400';
      case 'warning': return 'bg-amber-400';
      default: return 'bg-emerald-400';
    }
  };

  const sortedFoods = foods
    .map(food => ({
      ...food,
      hoursLeft: differenceInHours(new Date(food.safe_until), new Date())
    }))
    .sort((a, b) => a.hoursLeft - b.hoursLeft);

  const criticalAlerts = sortedFoods.filter(food => food.hoursLeft <= 6);
  const upcomingAlerts = sortedFoods.filter(food => food.hoursLeft > 6 && food.hoursLeft <= 48);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Food Alerts</h1>
          <p className="text-gray-600">Stay on top of expiring food items</p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <Card className="text-center">
            <CardContent className="p-4">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
              <div className="text-sm text-gray-600">Critical Alerts</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-4">
              <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-amber-600">{upcomingAlerts.length}</div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Critical Alerts
            </h2>
            
            <div className="space-y-3">
              {criticalAlerts.map((food, index) => (
                <motion.div
                  key={food.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getUrgencyColor(getUrgencyLevel(food.hoursLeft))}`} />
                          <div>
                            <h3 className="font-semibold text-gray-900">{food.name}</h3>
                            <p className="text-sm text-gray-600">
                              {food.hoursLeft <= 0 ? 'Expired' : `${food.hoursLeft}h left`}
                            </p>
                          </div>
                        </div>
                        <Badge variant="destructive">
                          {food.hoursLeft <= 0 ? 'Expired' : 'Urgent'}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(food.id, 'eaten')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ate It
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(food.id, 'donated')}
                          className="flex-1"
                        >
                          Donated
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Upcoming Alerts */}
        {upcomingAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-lg font-semibold text-amber-600 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Upcoming Expiry
            </h2>
            
            <div className="space-y-3">
              {upcomingAlerts.map((food, index) => (
                <motion.div
                  key={food.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getUrgencyColor(getUrgencyLevel(food.hoursLeft))}`} />
                          <div>
                            <h3 className="font-semibold text-gray-900">{food.name}</h3>
                            <p className="text-sm text-gray-600">
                              Expires in {food.hoursLeft}h ({format(new Date(food.safe_until), 'MMM d, h:mm a')})
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-amber-600 border-amber-200">
                          {food.hoursLeft <= 24 ? 'Soon' : 'Upcoming'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* No Alerts */}
        {sortedFoods.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No food alerts</p>
            <p className="text-sm text-gray-400">Scan some food to get notifications!</p>
          </motion.div>
        )}

        {/* All Good State */}
        {sortedFoods.length > 0 && criticalAlerts.length === 0 && upcomingAlerts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <p className="text-emerald-600 font-semibold mb-2">All Good!</p>
            <p className="text-sm text-gray-500">Your food is safe for now.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}