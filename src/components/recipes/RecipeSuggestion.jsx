import React, { useState, useEffect } from "react";
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Users, ChefHat, Loader2, CheckCircle, Sparkles } from "lucide-react";

export default function RecipeSuggestion({ food, onComplete, onBack }) {
  const [recipe, setRecipe] = useState(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    generateRecipe();
  }, [food]);

  const generateRecipe = async () => {
    setIsGenerating(true);
    
    try {
      const response = await InvokeLLM({
        prompt: `Generate 1 quick, delicious, and practical recipe using "${food.name}" as the main ingredient. The food category is "${food.category}". Make it perfect for using leftovers - something that can be made in 30 minutes or less. Include cooking time, servings, difficulty level, and step-by-step instructions. Make it appealing and easy to follow.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            cooking_time: { type: "string" },
            servings: { type: "string" },
            difficulty: { type: "string" },
            ingredients: { type: "array", items: { type: "string" } },
            instructions: { type: "array", items: { type: "string" } },
            tips: { type: "string" }
          }
        }
      });
      
      setRecipe(response);
    } catch (error) {
      console.error("Error generating recipe:", error);
      setRecipe({
        name: `Quick ${food.name} Stir-fry`,
        description: "A simple and delicious way to transform your leftovers into a new meal",
        cooking_time: "15 minutes",
        servings: "2-3 people",
        difficulty: "Easy",
        ingredients: [
          `1 serving of ${food.name}`,
          "2 tbsp cooking oil",
          "1 onion, sliced",
          "2 cloves garlic, minced",
          "Salt and pepper to taste",
          "Fresh herbs (optional)"
        ],
        instructions: [
          "Heat oil in a large pan over medium-high heat",
          "Add onion and garlic, cook until fragrant",
          `Add your ${food.name} and stir-fry for 5-7 minutes`,
          "Season with salt, pepper, and herbs",
          "Serve hot and enjoy!"
        ],
        tips: "Feel free to add any vegetables you have on hand to make it more nutritious!"
      });
    }
    
    setIsGenerating(false);
  };

  if (isGenerating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-emerald-600 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Creating Your Recipe</h3>
            <p className="text-gray-600">AI Chef is crafting the perfect dish with {food.name}...</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex flex-col"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex-1 bg-gradient-to-br from-emerald-50 via-white to-green-50 rounded-t-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <header className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Recipe Suggestion</h1>
              <p className="text-gray-600">Perfect dish for your {food.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-600">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI Generated</span>
          </div>
        </header>

        {/* Recipe Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <Card className="overflow-hidden">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">{recipe?.name}</CardTitle>
              <p className="text-gray-600 mt-2">{recipe?.description}</p>
              
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{recipe?.cooking_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{recipe?.servings}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {recipe?.difficulty}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Ingredients */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-emerald-600" />
                  Ingredients
                </h3>
                <ul className="space-y-2">
                  {recipe?.ingredients?.map((ingredient, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <span className="text-gray-700">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Instructions</h3>
                <ol className="space-y-3">
                  {recipe?.instructions?.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-gray-700 pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Tips */}
              {recipe?.tips && (
                <div className="p-4 bg-amber-50 rounded-lg">
                  <h4 className="font-medium text-amber-800 mb-2">💡 Chef's Tip</h4>
                  <p className="text-amber-700 text-sm">{recipe.tips}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              Not This Time
            </Button>
            <Button
              onClick={() => onComplete(food)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Let's Cook This!
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}