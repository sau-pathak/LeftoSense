import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Clock, Refrigerator, Heart, ChefHat, Loader2, Thermometer, Microscope } from "lucide-react";
import { differenceInHours } from "date-fns";
// New import for Progress component

// Dummy implementations for InvokeLLM and GenerateImage to ensure the file is functional.
// In a real application, these would be actual API calls or utility functions.
const InvokeLLM = async ({ prompt, response_json_schema }) => {
  console.log("Simulating LLM invocation with prompt:", prompt);
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

  // Simulate a positive analysis for demonstration
  return {
    thermal_analysis: {
      hot_spots: ["Minor warm spot detected on the surface"],
      cold_spots: ["Even temperature distribution"],
      temperature_variance: "Minimal",
      thermal_risk_level: "Low"
    },
    microorganism_detection: [
      { pathogen: "Escherichia coli O157:H7", detected: false, confidence: 0, disease_risk: "None", symptoms: [] },
      { pathogen: "Salmonella enterica", detected: true, confidence: 25, disease_risk: "Potential risk", symptoms: ["Fever", "Diarrhea", "Abdominal cramps"] },
      { pathogen: "Listeria monocytogenes", detected: false, confidence: 0, disease_risk: "None", symptoms: [] },
      { pathogen: "Staphylococcus aureus", detected: true, confidence: 15, disease_risk: "Low risk", symptoms: ["Nausea", "Vomiting", "Diarrhea"] },
      { pathogen: "Bacillus cereus", detected: false, confidence: 0, disease_risk: "None", symptoms: [] }
    ],
    overall_safety: {
      safety_score: 75,
      recommendation: "Some potential microbial activity detected at low confidence. Exercise caution, ensure thorough cooking if applicable.",
      proceed_with_caution: true
    }
  };
};

const GenerateImage = async ({ prompt }) => {
  console.log("Simulating image generation with prompt:", prompt);
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

  // Return a placeholder image URL
  return { url: "https://via.placeholder.com/400x200/ADD8E6/0000FF?text=Thermal+Image+of+Food" };
};


// SpoilageAnalysis Component - Renders a detailed view of spoilage signs
// This component has been moved to its own file: ../analysis/SpoilageAnalysis.js
// It will now be imported from there.
import SpoilageAnalysis from "../analysis/SpoilageAnalysis";


export default function FoodAnalysis({ food, isAnalyzing, onSave, onClose, onDonate, onMakeRecipe }) {
  const [showSpoilageAnalysis, setShowSpoilageAnalysis] = React.useState(false);
  const hoursLeft = food.safe_until ? differenceInHours(new Date(food.safe_until), new Date()) : 0;

  if (isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      >
        <Card className="w-full max-w-sm">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-emerald-600 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Analyzing Food</h3>
            <p className="text-gray-600">Consulting USDA FoodKeeper database...</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (showSpoilageAnalysis) {
    return (
      <SpoilageAnalysis
        food={food}
        onBack={() => setShowSpoilageAnalysis(false)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center p-4"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="w-full max-w-md"
      >
        <Card className="overflow-hidden">
          {food.photo_url && (
            <div className="w-full h-40 bg-gray-200">
                <img src={food.photo_url} alt={food.name} className="w-full h-full object-cover"/>
            </div>
          )}
          <CardHeader className="pb-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{food.name}</CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {food.category}
              </Badge>
              {food.confidence_score && (
                <Badge variant="outline">
                  {food.confidence_score}% match
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* FoodKeeper Match Info */}
            {food.foodkeeper_data && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-800">USDA FoodKeeper Match</h4>
                    <p className="text-blue-700 text-sm font-medium">{food.foodkeeper_data.match}</p>
                    <Badge variant="outline" className="text-blue-600 border-blue-300 mt-1">
                      {food.foodkeeper_data.confidence}% confidence
                    </Badge>
                  </div>
                </div>
                {food.foodkeeper_data.storage_temp && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-200">
                    <Thermometer className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-600 text-sm">{food.foodkeeper_data.storage_temp}</span>
                  </div>
                )}
              </div>
            )}

            {/* Safety Information */}
            {food.safety_recommendation && (
              <div className="p-4 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-emerald-800">Safety Guidelines</span>
                </div>
                <p className="text-emerald-700 text-sm">{food.safety_recommendation}</p>
                {hoursLeft > 0 && (
                  <p className="text-emerald-600 font-medium mt-2">
                    Safe for {hoursLeft} more hours
                  </p>
                )}
              </div>
            )}

            {/* Spoilage Signs */}
            {food.foodkeeper_data?.spoilage_signs && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Watch for these spoilage signs:</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSpoilageAnalysis(true)}
                    className="text-xs gap-1"
                  >
                    <Microscope className="w-3 h-3" />
                    Deep Analysis
                  </Button>
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

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => onSave(food, 'store')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                <Refrigerator className="w-4 h-4" />
                Store in {food.storage_location === 'room_temp' ? 'Fridge' : food.storage_location}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => onMakeRecipe(food)}
                  className="gap-2"
                >
                  <ChefHat className="w-4 h-4" />
                  Make Recipe
                </Button>

                <Button
                  variant="outline"
                  onClick={() => onDonate(food)}
                  className="gap-2"
                >
                  <Heart className="w-4 h-4" />
                  Donate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}