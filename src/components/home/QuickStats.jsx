import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Clock, Heart } from "lucide-react";
import { differenceInHours } from "date-fns";

export default function QuickStats({ foods }) {
  const expiringCount = foods.filter(food => {
    const hoursLeft = differenceInHours(new Date(food.safe_until), new Date());
    return hoursLeft <= 24 && hoursLeft > 0;
  }).length;

  const totalSaved = foods.filter(food => food.status === 'eaten' || food.status === 'donated').length;

  const stats = [
    {
      icon: Clock,
      label: "Expiring Soon",
      value: expiringCount,
      color: "text-amber-600",
      bgColor: "bg-amber-100"
    },
    {
      icon: TrendingUp,
      label: "Active Items",
      value: foods.filter(f => f.status === 'stored').length,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100"
    },
    {
      icon: Heart,
      label: "Food Saved",
      value: totalSaved,
      color: "text-rose-600",
      bgColor: "bg-rose-100"
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="text-center">
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-full ${stat.bgColor} flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-xs text-gray-600">{stat.label}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}