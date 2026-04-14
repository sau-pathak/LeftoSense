import React, { useState, useEffect } from "react";
import { backendClient } from "@/api/backendClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle, Heart, Trash2, Calendar } from "lucide-react";
import { format, startOfWeek, startOfMonth } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";


export default function HistoryPage() {
  const [scans, setScans] = useState([]);
  const [user, setUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
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
      const sessionExpiry = new Date(sessionData.expiresAt);
      
      if (sessionExpiry < new Date()) {
        localStorage.removeItem('leftosense_session');
        navigate('/');
        return;
      }

      const { username } = sessionData;

      // Load from localStorage first
      const localScans = JSON.parse(localStorage.getItem('scan_history') || '[]');
      const userScans = localScans.filter(scan => scan.user_id === username);
      
      console.log('Loaded history:', userScans);
      setScans(userScans);

      // Sync from database in background
      try {
        const dbScans = await backendClient.entities.ScanHistory.filter(
          { user_id: username },
          '-created_date',
          50
        );
        
        if (dbScans.length > 0) {
          const mergedScans = [...userScans];
          dbScans.forEach(dbScan => {
            if (!mergedScans.find(s => s.id === dbScan.id)) {
              mergedScans.push(dbScan);
            }
          });
          
          const sortedScans = mergedScans.sort((a, b) => 
            new Date(b.created_at || b.created_date) - new Date(a.created_at || a.created_date)
          ).slice(0, 50);
          
          setScans(sortedScans);
          localStorage.setItem('scan_history', JSON.stringify(sortedScans));
        }
      } catch (dbError) {
        console.error('Database sync error:', dbError);
      }
    } catch (error) {
      console.error("Error loading scans:", error);
      navigate('/');
    }
  };

  const getSafetyBadge = (safeToConsume) => {
    if (safeToConsume) {
      return <Badge className="bg-emerald-100 text-emerald-700 text-xs">Safe</Badge>;
    }
    return <Badge className="bg-red-100 text-red-700 text-xs">Caution</Badge>;
  };

  const filterScans = (timeFrame) => {
    const now = new Date();
    let startDate;
    
    switch (timeFrame) {
      case 'week':
        startDate = startOfWeek(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      default:
        return scans;
    }
    
    return scans.filter(scan => {
      const scanDate = new Date(scan.created_at || scan.created_date);
      return scanDate >= startDate;
    });
  };

  const filteredScans = filterScans(activeFilter);
  
  const getStats = () => {
    const safe = filteredScans.filter(s => s.safe_to_consume).length;
    const caution = filteredScans.filter(s => !s.safe_to_consume).length;
    const lowSpoilage = filteredScans.filter(s => s.spoilage_level === 'LOW').length;
    
    return { safe, caution, lowSpoilage, total: filteredScans.length };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Scan History</h1>
          <p className="text-gray-600">View all your produce quality scans</p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Scan History</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.safe}</div>
                  <div className="text-emerald-100 text-sm">Safe to Eat</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-emerald-100 text-sm">Total Scans</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Time Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Tabs value={activeFilter} onValueChange={setActiveFilter}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Time</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Scan Items List */}
        <AnimatePresence>
          <div className="space-y-4">
            {filteredScans.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No scan history yet</p>
                <p className="text-sm text-gray-400">Start scanning to see your results!</p>
              </motion.div>
            ) : (
              filteredScans.map((scan, index) => {
                const hasDeepAnalysis = scan.analysis_result && scan.freshness_class;
                
                return (
                  <motion.div
                    key={scan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={`transition-all duration-200 ${
                        hasDeepAnalysis 
                          ? 'hover:shadow-md cursor-pointer' 
                          : 'opacity-75 cursor-not-allowed'
                      }`}
                      onClick={() => {
                        if (hasDeepAnalysis) {
                          navigate('/ScanDetail', { 
                            state: { scan } 
                          });
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {scan.image_url ? (
                              <img 
                                src={scan.image_url} 
                                alt={scan.food_name} 
                                className="w-12 h-12 rounded-lg object-cover bg-gray-100" 
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                                <span className="text-emerald-600 font-medium text-lg">
                                  {scan.food_name?.charAt(0).toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-900 capitalize">{scan.food_name}</h3>
                              <div className="flex items-center gap-2">
                                {scan.freshness_class && (
                                  <Badge variant="outline" className={
                                    scan.freshness_class === 'fresh' ? 'bg-emerald-50 text-emerald-700 text-xs' :
                                    scan.freshness_class === 'borderline' ? 'bg-amber-50 text-amber-700 text-xs' :
                                    'bg-red-50 text-red-700 text-xs'
                                  }>
                                    {scan.freshness_class}
                                  </Badge>
                                )}
                                {getSafetyBadge(scan.safe_to_consume)}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className={
                            scan.spoilage_level === 'LOW' ? 'bg-emerald-100 text-emerald-700' :
                            scan.spoilage_level === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {scan.spoilage_level}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          {scan.defect_severity_score !== undefined && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Defect Score:</span>
                              <span className={`font-semibold ${
                                scan.defect_severity_score < 30 ? 'text-emerald-600' :
                                scan.defect_severity_score < 60 ? 'text-amber-600' :
                                'text-red-600'
                              }`}>
                                {scan.defect_severity_score}/100
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              {format(new Date(scan.created_at || scan.created_date), 'MMM d, yyyy h:mm a')}
                            </span>
                            {!hasDeepAnalysis && (
                              <span className="text-xs text-gray-400">Basic scan</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
}