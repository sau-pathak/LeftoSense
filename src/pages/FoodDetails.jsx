import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { backendClient } from "@/api/backendClient";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, Refrigerator, Heart, ChefHat, Loader2, Tag, CheckCircle, Trash2, Microscope } from "lucide-react";
import { format, differenceInHours } from "date-fns";

import DonationFlow from "../components/donations/DonationFlow";
import RecipeSuggestion from "../components/recipes/RecipeSuggestion";
import SpoilageAnalysis from "../components/analysis/SpoilageAnalysis";

export default function FoodDetailsPage() {
  const [food, setFood] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDonations, setShowDonations] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);
  const [showSpoilageAnalysis, setShowSpoilageAnalysis] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const foodId = searchParams.get("foodId");
  const fromPage = searchParams.get("from") || "Home";

  const loadFood = useCallback(async () => {
    setIsLoading(true);
    try {
      const foodItem = await backendClient.entities.Food.get(foodId);
      setFood(foodItem);
    } catch (error) {
      console.error("Error loading food details:", error);
      navigate(createPageUrl(fromPage));
    }
    setIsLoading(false);
  }, [foodId, navigate, fromPage]);

  useEffect(() => {
    if (!foodId) {
      navigate(createPageUrl("Home"));
      return;
    }
    loadFood();
  }, [foodId, navigate, loadFood]);

  const handleUpdateStatus = async (newStatus) => {
    if (!food) return;
    try {
      // Assign default weight if item is eaten and has no weight
      const foodUpdate = { status: newStatus };
      if (newStatus === 'eaten' && !food.weight_lbs) {
        foodUpdate.weight_lbs = 0.5;
      }
      await backendClient.entities.Food.update(food.id, foodUpdate);
      navigate(createPageUrl(fromPage));
    } catch (error) {
      console.error("Error updating food status:", error);
    }
  };

  const handleDonationComplete = async (donationCenter, weight) => {
    if (!food || !donationCenter) return;
    try {
      await backendClient.entities.Food.update(food.id, {
        status: 'donated',
        donated_at: new Date().toISOString(),
        donation_center_name: donationCenter.name,
        weight_lbs: weight,
      });
      navigate(createPageUrl(fromPage));
    } catch (error) {
      console.error("Error updating food status after donation:", error);
    }
  };

  const handleRecipeComplete = () => {
    if (!food) return;
    const foodUpdate = { status: 'eaten' };
    if (!food.weight_lbs) {
      foodUpdate.weight_lbs = 0.5;
    }
    backendClient.entities.Food.update(food.id, foodUpdate).then(() => {
      navigate(createPageUrl(fromPage));
    }).catch(error => console.error("Error updating food status:", error));
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!food) {
    return null;
  }
  
  // Add validation for safe_until date
  const getHoursLeft = () => {
    if (!food.safe_until) return 0;
    
    try {
      const expiryDate = new Date(food.safe_until);
      if (isNaN(expiryDate.getTime())) return 0; // Invalid date
      
      return Math.max(0, differenceInHours(expiryDate, new Date()));
    } catch (error) {
      console.error("Error calculating hours left:", error);
      return 0;
    }
  };
  
  const hoursLeft = getHoursLeft();

  const getStatusInfo = (status) => {
    switch (status) {
      case 'stored': return { text: 'Stored', icon: Refrigerator, color: 'bg-blue-100 text-blue-800' };
      case 'eaten': return { text: 'Eaten', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800' };
      case 'donated': return { text: 'Donated', icon: Heart, color: 'bg-rose-100 text-rose-800' };
      case 'discarded': return { text: 'Discarded', icon: Trash2, color: 'bg-gray-100 text-gray-800' };
      default: return { text: 'Unknown', icon: Tag, color: 'bg-gray-100 text-gray-800' };
    }
  };
  const statusInfo = getStatusInfo(food.status);
  const StatusIcon = statusInfo.icon;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
        <div className="max-w-md mx-auto pb-6">
          {/* Header */}
          <header className="p-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl(fromPage))}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Food Details</h1>
          </header>

          <main>
            {/* Food Image */}
            {food.photo_url && (
              <div className="w-full h-48 bg-gray-200">
                <img src={food.photo_url} alt={food.name} className="w-full h-full object-cover"/>
              </div>
            )}
            
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold mb-2">{food.name}</h2>
                <Badge className={`capitalize text-sm flex items-center gap-1.5 ${statusInfo.color}`}>
                  <StatusIcon className="w-4 h-4" /> {statusInfo.text}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="capitalize text-sm flex items-center gap-1">
                  <Tag className="w-3 h-3"/> {food.category}
                </Badge>
                <Badge variant="outline" className="text-sm flex items-center gap-1">
                  <Refrigerator className="w-3 h-3"/> Stored in {food.storage_location}
                </Badge>
              </div>

              <Separator className="my-6" />

              {/* Donation Details Card */}
              {food.status === 'donated' && food.donated_at && food.donation_center_name && (
                <Card className="mb-6 bg-rose-50 border-rose-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-5 h-5 text-rose-600" />
                      <span className="font-medium text-rose-800">Donation Details</span>
                    </div>
                    <p className="text-rose-700 text-sm">
                      Donated to <strong>{food.donation_center_name}</strong>
                      {food.weight_lbs && (
                        <span>, weighing <strong>{food.weight_lbs} lbs</strong></span>
                      )}
                    </p>
                    <p className="text-rose-600 text-sm mt-1">
                      on {format(new Date(food.donated_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons - Only for stored items */}
              {food.status === 'stored' && (
                <div className="mb-6 grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRecipe(true)}
                    className="flex items-center justify-center gap-2"
                  >
                    <ChefHat className="w-4 h-4" />
                    Get Recipe
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDonations(true)}
                    className="flex items-center justify-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    Donate
                  </Button>
                </div>
              )}

              {/* Safety Info */}
              {food.safety_recommendation && (
                <Card className="mb-6 bg-emerald-50 border-emerald-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium text-emerald-800">Safety Information</span>
                    </div>
                    <p className="text-emerald-700 text-sm">{food.safety_recommendation}</p>
                    {hoursLeft > 0 && food.status === 'stored' && (
                      <p className="text-emerald-600 font-medium mt-2">
                        Safe for {hoursLeft} more hours
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Deep Analysis Button Card */}
              <Card className="mb-6">
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <h4 className="font-medium text-gray-900">Advanced Analysis</h4>
                        <p className="text-sm text-gray-600">AI-powered pathogen detection.</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowSpoilageAnalysis(true)}
                        className="gap-2"
                    >
                        <Microscope className="w-4 h-4" />
                        Deep Analysis
                    </Button>
                </CardContent>
              </Card>

              {/* Spoilage Signs */}
              {food.foodkeeper_data?.spoilage_signs && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Watch for these spoilage signs:</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {food.foodkeeper_data.spoilage_signs.slice(0, 6).map((sign, index) => (
                      <Badge key={index} variant="outline" className="text-xs text-amber-700 border-amber-300">
                        {sign}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingredients */}
              {food.ingredients && food.ingredients.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Detected Ingredients</h3>
                  <div className="flex flex-wrap gap-2">
                    {food.ingredients.map((ingredient, index) => (
                      <Badge key={index} variant="secondary">
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      
      {/* Modals */}
      <AnimatePresence>
        {showDonations && (
          <DonationFlow
            food={food}
            onComplete={handleDonationComplete}
            onBack={() => setShowDonations(false)}
          />
        )}
        {showRecipe && (
          <RecipeSuggestion
            food={food}
            onComplete={handleRecipeComplete}
            onBack={() => setShowRecipe(false)}
          />
        )}
        {showSpoilageAnalysis && (
          <SpoilageAnalysis
            food={food}
            onBack={() => setShowSpoilageAnalysis(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}