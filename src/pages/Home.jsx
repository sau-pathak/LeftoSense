import React, { useState, useEffect } from "react";
import { backendClient } from "@/api/backendClient";
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Clock, Leaf } from "lucide-react";
import { differenceInHours } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import CameraScanner from "../components/home/CameraScanner";
import FoodAnalysis from "../components/home/FoodAnalysis";
import QuickStats from "../components/home/QuickStats";
import DonationFlow from "../components/donations/DonationFlow";
import RecipeSuggestion from "../components/recipes/RecipeSuggestion";

export default function HomePage() {
  const [foods, setFoods] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [scanningFood, setScanningFood] = useState(null);
  const [showDonations, setShowDonations] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);
  const [donatingFood, setDonatingFood] = useState(null);
  const [recipeFood, setRecipeFood] = useState(null);
  const [user, setUser] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get session data
      const sessionData = localStorage.getItem("leftosense_session");
      if (!sessionData) return;
      
      const { username } = JSON.parse(sessionData);
      
      // Load foods for this username (stored in created_by field as username)
      const userFoods = await backendClient.entities.Food.filter({ 
        created_by: username,
        status: "stored" 
      }, "-created_date");
      setFoods(userFoods);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleFoodScanned = async (mockFoodData) => {
    setIsAnalyzing(true);
    setScanningFood(mockFoodData);
    
    try {
      
      const analysis = await InvokeLLM({
        prompt: `You are the USDA FoodKeeper App AI. Analyze this food item: "${mockFoodData.name}" (category: ${mockFoodData.category}). 

        Find the closest match from USDA FoodKeeper database and provide:
        1. Storage recommendations (refrigerator/freezer/pantry)
        2. Safe storage duration in hours for leftovers
        3. Food safety tips specific to this food type
        4. Confidence percentage (0-100) of how closely this matches a FoodKeeper entry
        5. The specific FoodKeeper category you matched it to

        Base recommendations on official USDA guidelines for food safety.`,
        response_json_schema: {
          type: "object",
          properties: {
            foodkeeper_match: { type: "string" },
            confidence_percentage: { type: "number" },
            storage_recommendation: { type: "string" },
            safe_duration_hours: { type: "number" },
            safety_tips: { type: "string" },
            storage_temp: { type: "string" },
            spoilage_signs: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Validate and ensure safe_duration_hours is a valid number
      let safeDurationHours = analysis.safe_duration_hours;
      if (!safeDurationHours || typeof safeDurationHours !== 'number' || isNaN(safeDurationHours) || safeDurationHours <= 0) {
        // Default based on food category
        switch(mockFoodData.category) {
          case 'protein':
            safeDurationHours = 72; // 3 days for cooked protein
            break;
          case 'dairy':
            safeDurationHours = 48; // 2 days for dairy
            break;
          case 'mixed':
            safeDurationHours = 72; // 3 days for mixed dishes
            break;
          default:
            safeDurationHours = 96; // 4 days default
        }
      }

      const safeUntil = new Date();
      safeUntil.setHours(safeUntil.getHours() + safeDurationHours);

      const analyzedFood = {
        ...mockFoodData,
        safety_recommendation: `${analysis.safety_tips || 'Store properly and consume within recommended time'} (FoodKeeper Match: ${analysis.foodkeeper_match || 'General Guidelines'})`,
        safe_until: safeUntil.toISOString(),
        ingredients: [],
        confidence_score: analysis.confidence_percentage || 85,
        foodkeeper_data: {
          match: analysis.foodkeeper_match || 'Cooked Leftovers',
          confidence: analysis.confidence_percentage || 85,
          storage_temp: analysis.storage_temp || 'Refrigerate at 40°F or below',
          spoilage_signs: analysis.spoilage_signs || ['Off odor', 'Mold growth', 'Slimy texture']
        }
      };

      setScanningFood(analyzedFood);
    } catch (error) {
      console.error("Error analyzing food:", error);
      
      // Fallback with default USDA-based values if AI analysis fails
      const safeUntil = new Date();
      safeUntil.setHours(safeUntil.getHours() + 72); // Default 72 hours for leftovers
      
      const fallbackFood = {
        ...mockFoodData,
        safety_recommendation: `Store in refrigerator at 40°F or below and consume within 3-4 days for best quality (USDA Guidelines)`,
        safe_until: safeUntil.toISOString(),
        ingredients: [],
        confidence_score: 70,
        foodkeeper_data: {
          match: 'Cooked Leftovers - General',
          confidence: 70,
          storage_temp: 'Refrigerate at 40°F or below',
          spoilage_signs: ['Off odor', 'Mold growth', 'Texture changes']
        }
      };
      
      setScanningFood(fallbackFood);
    }
    
    setIsAnalyzing(false);
  };

  const handleSaveFood = async (foodData, action) => {
    try {
      const sessionData = localStorage.getItem("leftosense_session");
      const { username } = sessionData ? JSON.parse(sessionData) : {};
      
      await backendClient.entities.Food.create({
        ...foodData,
        status: action === 'store' ? 'stored' : action,
        created_by: username
      });

      // Save to scan history
      const scanData = {
        id: `scan_${Date.now()}`,
        user_id: username,
        image_url: foodData.photo_url || '',
        food_name: foodData.name,
        analysis_result: {
          category: foodData.category,
          storage_location: foodData.storage_location,
          safe_until: foodData.safe_until,
          safety_recommendation: foodData.safety_recommendation,
          confidence_score: foodData.confidence_score
        },
        safe_to_consume: true,
        spoilage_level: 'LOW',
        freshness_class: 'fresh',
        defect_severity_score: 0,
        model_confidence: (foodData.confidence_score || 85) / 100,
        created_at: new Date().toISOString()
      };

      const existingScans = JSON.parse(localStorage.getItem('scan_history') || '[]');
      const updatedScans = [scanData, ...existingScans].slice(0, 50);
      localStorage.setItem('scan_history', JSON.stringify(updatedScans));
      console.log('Scan saved:', scanData);

      try {
        await backendClient.entities.ScanHistory.create(scanData);
      } catch (dbError) {
        console.error('Database save error:', dbError);
      }
      
      setScanningFood(null);
      setShowCamera(false);
      loadData();
    } catch (error) {
      console.error("Error saving food:", error);
    }
  };

  const handleMakeRecipe = (foodData) => {
    setRecipeFood(foodData);
    setShowRecipe(true);
  };

  const handleDonate = (foodData) => {
    setDonatingFood(foodData);
    setShowDonations(true);
  };

  const handleRecipeComplete = async (foodData) => {
    try {
      const sessionData = localStorage.getItem("leftosense_session");
      const { username } = sessionData ? JSON.parse(sessionData) : {};
      
      // Create the food record as eaten
      await backendClient.entities.Food.create({
        ...foodData,
        status: 'eaten',
        weight_lbs: 0.5,
        created_by: username
      });
      
      setScanningFood(null);
      setShowCamera(false);
      setShowRecipe(false);
      setRecipeFood(null);
      loadData();
    } catch (error) {
      console.error("Error completing recipe:", error);
    }
  };

  const handleDonationComplete = async (donationCenter, weight) => {
    if (!scanningFood || !donationCenter) return;
    try {
      const sessionData = localStorage.getItem("leftosense_session");
      const { username } = sessionData ? JSON.parse(sessionData) : {};
      
      // Create a new food record with status 'donated'
      await backendClient.entities.Food.create({
        ...scanningFood,
        status: 'donated',
        donated_at: new Date().toISOString(),
        donation_center_name: donationCenter.name,
        weight_lbs: weight,
        created_by: username
      });
      
      setScanningFood(null);
      setShowCamera(false);
      setShowDonations(false);
      setDonatingFood(null);
      loadData();
    } catch (error) {
      console.error("Error completing donation:", error);
    }
  };

  const handleBackFromDonations = () => {
    setShowDonations(false);
    // Keep donatingFood and scanningFood so user can go back to analysis
  };

  const handleBackFromRecipe = () => {
    setShowRecipe(false);
    // Keep recipeFood and scanningFood so user can go back to analysis
  };

  const getExpiringFoods = () => {
    return foods.filter(food => {
      const hoursLeft = differenceInHours(new Date(food.safe_until), new Date());
      return hoursLeft <= 24 && hoursLeft > 0;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">LeftoSense</h1>
          </div>
          <p className="text-gray-600">AI-powered food waste reduction</p>
        </motion.div>

        {/* Quick Stats */}
        <QuickStats foods={foods} />

        {/* Main Scan Button */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <Button
            onClick={() => setShowCamera(true)}
            className="w-40 h-40 rounded-full bg-black hover:bg-gray-900 shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            <div className="flex flex-col items-center gap-3">
              <Camera className="w-12 h-12 text-white" />
              <span className="text-white font-semibold text-lg">Scan Food</span>
            </div>
          </Button>
        </motion.div>

        {/* Expiring Soon */}
        {getExpiringFoods().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-2 border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-800">Expiring Soon</h3>
                </div>
                <div className="space-y-2">
                  {getExpiringFoods().slice(0, 3).map((food, index) => {
                    const hoursLeft = differenceInHours(new Date(food.safe_until), new Date());
                    return (
                      <div key={food.id} className="flex items-center justify-between">
                        <span className="text-amber-700">{food.name}</span>
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          {hoursLeft}h left
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Activity */}
        {foods.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Scans</h3>
            <div className="space-y-3">
              {foods.slice(0, 3).map((food, index) => (
                <Link key={food.id} to={createPageUrl(`FoodDetails?foodId=${food.id}&from=Home`)}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {food.photo_url ? (
                              <img src={food.photo_url} alt={food.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                                <span className="text-emerald-600 font-medium">
                                  {food.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{food.name}</p>
                              <p className="text-sm text-gray-500 capitalize">{food.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-700">
                              {differenceInHours(new Date(food.safe_until), new Date())}h left
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {food.storage_location}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Camera Scanner Modal */}
      <AnimatePresence>
        {showCamera && (
          <CameraScanner
            onClose={() => {
              setShowCamera(false);
              setScanningFood(null);
            }}
            onFoodScanned={handleFoodScanned}
          />
        )}
      </AnimatePresence>

      {/* Food Analysis Modal */}
      <AnimatePresence>
        {scanningFood && !showDonations && !showRecipe && (
          <FoodAnalysis
            food={scanningFood}
            isAnalyzing={isAnalyzing}
            onSave={handleSaveFood}
            onClose={() => setScanningFood(null)}
            onDonate={handleDonate}
            onMakeRecipe={handleMakeRecipe}
          />
        )}
      </AnimatePresence>

      {/* Recipe Suggestion Modal */}
      <AnimatePresence>
        {showRecipe && recipeFood && (
          <RecipeSuggestion
            food={recipeFood}
            onComplete={handleRecipeComplete}
            onBack={handleBackFromRecipe}
          />
        )}
      </AnimatePresence>

      {/* Donation Flow Modal */}
      <AnimatePresence>
        {showDonations && donatingFood && (
          <DonationFlow
            food={donatingFood}
            onComplete={handleDonationComplete}
            onBack={handleBackFromDonations}
          />
        )}
      </AnimatePresence>
    </div>
  );
}