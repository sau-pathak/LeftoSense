import React, { useState, useEffect } from "react";
import { backendClient } from "@/api/backendClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Search, Clock, Users, Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RecipesPage() {
  const [foods, setFoods] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadStoredFoods();
  }, []);

  const loadStoredFoods = async () => {
    try {
      const session = localStorage.getItem('leftosense_session');
      if (!session) {
        navigate('/');
        return;
      }
      
      const sessionData = JSON.parse(session);
      const storedFoods = await backendClient.entities.Food.filter({ 
        created_by: sessionData.username, 
        status: "stored" 
      }, "-created_date");
      setFoods(storedFoods);
    } catch (error) {
      console.error("Error loading foods:", error);
      navigate('/');
    }
  };

  const generateRecipes = async (food) => {
    setIsGenerating(true);
    setSelectedFood(food);
    
    try {
      const response = await backendClient.integrations.Core.InvokeLLM({
        prompt: `Generate 3 creative, quick, and healthy recipes using "${food.name}" as the main ingredient. The food category is "${food.category}". Include cooking time, servings, and a brief description for each recipe. Make them practical for using leftovers.`,
        response_json_schema: {
          type: "object",
          properties: {
            recipes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  cooking_time: { type: "string" },
                  servings: { type: "string" },
                  difficulty: { type: "string" },
                  ingredients: { type: "array", items: { type: "string" } },
                  instructions: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });
      
      setRecipes(response.recipes || []);
    } catch (error) {
      console.error("Error generating recipes:", error);
    }
    
    setIsGenerating(false);
  };

  const filteredFoods = foods.filter(food => 
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Recipes</h1>
          <p className="text-gray-600">Transform your leftovers into delicious meals</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search your food items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Available Foods */}
        {!selectedFood && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Stored Food</h2>
            
            {filteredFoods.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No stored food items</p>
                  <p className="text-sm text-gray-400">Scan some food to get recipe suggestions!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredFoods.map((food, index) => (
                  <motion.div
                    key={food.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                      onClick={() => generateRecipes(food)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                              <ChefHat className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{food.name}</h3>
                              <p className="text-sm text-gray-500 capitalize">{food.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span className="text-sm text-gray-600">Get Recipes</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Loading State */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI Chef at Work</h3>
              <p className="text-gray-600">Creating delicious recipes for {selectedFood?.name}...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generated Recipes */}
        <AnimatePresence>
          {recipes.length > 0 && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recipes for {selectedFood?.name}
                </h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedFood(null);
                    setRecipes([]);
                  }}
                >
                  Back
                </Button>
              </div>

              {recipes.map((recipe, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">{recipe.name}</CardTitle>
                      <p className="text-gray-600 text-sm">{recipe.description}</p>
                      
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{recipe.cooking_time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{recipe.servings}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {recipe.difficulty}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Ingredients:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {recipe.ingredients?.slice(0, 5).map((ingredient, i) => (
                              <li key={i}>• {ingredient}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Instructions:</h4>
                          <ol className="text-sm text-gray-600 space-y-1">
                            {recipe.instructions?.slice(0, 3).map((step, i) => (
                              <li key={i}>{i + 1}. {step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}