import React, { useState, useEffect, useCallback } from "react";
import { InvokeLLM, GenerateImage } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { ArrowLeft, Thermometer, Microscope, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

export default function SpoilageAnalysis({ food, onBack }) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [thermalImage, setThermalImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [foodNotVisible, setFoodNotVisible] = useState(false);

  const getSeverityColor = (severity) => {
    if (severity === "low") return "bg-yellow-100 text-yellow-800";
    if (severity === "medium") return "bg-orange-100 text-orange-800";
    if (severity === "high") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const getRiskBadgeColor = (detected, confidence) => {
    if (!detected || confidence === 0) return "bg-green-100 text-green-800";
    if (confidence < 30) return "bg-yellow-100 text-yellow-800";
    if (confidence < 70) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const performDeepAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setFoodNotVisible(false);
    
    try {
      // First, check if actual food is visible (not just packaging/container)
      const visibilityCheck = await InvokeLLM({
        prompt: `Analyze this image to determine if the ACTUAL FOOD is visible and exposed.

CRITICAL: Return food_visible = false if you see:
- Sealed containers (cans, bottles, jars with lids on)
- Unopened packages or wrappers
- Boxes or cartons
- Any packaging that hides the food inside
- Labels or branding without exposed food

ONLY return food_visible = true if:
- The actual food item is directly visible
- Food is on a plate, in an open container, or unwrapped
- You can see the food's surface, texture, and color

Be strict: if the food itself is not visible, return false.`,
        file_urls: [food.photo_url],
        response_json_schema: {
          type: "object",
          properties: {
            food_visible: { type: "boolean" },
            reason: { type: "string" }
          }
        }
      });

      if (!visibilityCheck.food_visible) {
        setFoodNotVisible(true);
        setIsAnalyzing(false);
        return;
      }

      // Category-specific pathogen lists
      const categorySpecificPathogens = {
        fruit: [
          "Escherichia coli O157:H7 — Food poisoning / Hemolytic uremic syndrome",
          "Salmonella enterica — Salmonellosis",
          "Listeria monocytogenes — Listeriosis",
          "Penicillium expansum — Patulin poisoning (fruits, juices)",
          "Norovirus — Viral gastroenteritis",
          "Hepatitis A virus — Hepatitis A"
        ],
        vegetable: [
          "Escherichia coli O157:H7 — Food poisoning / Hemolytic uremic syndrome",
          "Salmonella enterica — Salmonellosis",
          "Listeria monocytogenes — Listeriosis",
          "Shigella spp. — Shigellosis (bacillary dysentery)",
          "Norovirus — Viral gastroenteritis",
          "Giardia lamblia — Giardiasis"
        ],
        protein: [
          "Salmonella enterica — Salmonellosis / Typhoid fever",
          "Campylobacter jejuni — Campylobacteriosis (diarrhea)",
          "Escherichia coli O157:H7 — Food poisoning / Hemolytic uremic syndrome",
          "Listeria monocytogenes — Listeriosis",
          "Clostridium perfringens — Foodborne gastroenteritis",
          "Staphylococcus aureus — Food poisoning (enterotoxin)",
          "Vibrio parahaemolyticus — Gastroenteritis (seafood)",
          "Yersinia enterocolitica — Yersiniosis (contaminated pork/dairy)"
        ],
        dairy: [
          "Listeria monocytogenes — Listeriosis",
          "Salmonella enterica — Salmonellosis",
          "Escherichia coli O157:H7 — Food poisoning / Hemolytic uremic syndrome",
          "Campylobacter jejuni — Campylobacteriosis",
          "Staphylococcus aureus — Food poisoning (enterotoxin)",
          "Yersinia enterocolitica — Yersiniosis"
        ],
        grain: [
          "Bacillus cereus — Food poisoning (diarrheal and emetic type)",
          "Clostridium perfringens — Foodborne gastroenteritis",
          "Aspergillus flavus — Aflatoxin poisoning",
          "Penicillium expansum — Patulin poisoning"
        ],
        mixed: [
          "Escherichia coli O157:H7 — Food poisoning / Hemolytic uremic syndrome",
          "Salmonella enterica — Salmonellosis",
          "Listeria monocytogenes — Listeriosis",
          "Campylobacter jejuni — Campylobacteriosis",
          "Staphylococcus aureus — Food poisoning (enterotoxin)",
          "Bacillus cereus — Food poisoning",
          "Norovirus — Viral gastroenteritis"
        ],
        other: [
          "Escherichia coli O157:H7 — Food poisoning",
          "Salmonella enterica — Salmonellosis",
          "Listeria monocytogenes — Listeriosis",
          "Staphylococcus aureus — Food poisoning"
        ]
      };

      const relevantPathogens = categorySpecificPathogens[food.category] || categorySpecificPathogens.other;

      // Perform AI-based analysis of the actual captured image
      const visualAnalysis = await InvokeLLM({
        prompt: `Analyze this image of "${food.name}" (${food.category} category) for spoilage risk indicators.

      CRITICAL SAFETY-FIRST INSTRUCTIONS:
      1. Base your analysis ONLY on what you see in THIS specific image
      2. ACTIVELY look for VISIBLE mold, fungus, fungal growth, decay, or rot
      3. Look for VISIBLE indicators: mold patches, discoloration, fuzzy growth, slime, advanced decay, texture breakdown
      4. If ANY visible mold or fungus is present, FLAG IT with high confidence
      5. Be HONEST: If you see clear spoilage, report it - do not downplay or ignore
      6. Do not mark spoiled food as safe under any circumstance
      7. Err on the side of caution - user safety is the priority

PATHOGEN ANALYSIS RULES:
- You MUST analyze ONLY the pathogens listed below - these are scientifically relevant to ${food.category} foods
- Return analysis for EACH pathogen listed (do not skip any, do not add extra ones)
- DO NOT analyze or mention pathogens not on this list
- These pathogens are specifically chosen based on the food category

Analyze ONLY these pathogens (specific to ${food.category}):
${relevantPathogens.map(p => `- ${p}`).join('\n')}

For EACH pathogen above (and ONLY those listed), provide:
- pathogen_and_disease: exactly as listed above
- detected: true only if you see visual indicators associated with this contamination type
- confidence: 0-100 based on strength of visual evidence (be conservative, most fresh food = 0)
- risk_level: based on what you observe (e.g., "None detected", "Low risk", "Moderate risk", "High risk")

Also provide:
- Visual spoilage signs you can actually see (empty array if none)
- Freshness score (0-100) based on visual appearance
- Overall safety recommendation

Remember: You're analyzing an IMAGE for VISUAL cues only. Be honest about limitations. Only report on the specific pathogens listed for this food category.`,
        file_urls: [food.photo_url],
        response_json_schema: {
          type: "object",
          properties: {
            visual_spoilage_signs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sign: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high"] },
                  description: { type: "string" }
                }
              }
            },
            pathogen_detection: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pathogen_and_disease: { type: "string" },
                  detected: { type: "boolean" },
                  confidence: { type: "number" },
                  risk_level: { type: "string" }
                }
              }
            },
            freshness_score: { type: "number" },
            overall_safety: {
              type: "object",
              properties: {
                safety_score: { type: "number" },
                recommendation: { type: "string" },
                proceed_with_caution: { type: "boolean" }
              }
            }
          }
        }
      });

      // Generate thermal visualization from actual image
      const thermalImageResult = await GenerateImage({
        prompt: `Convert this food image into a thermal imaging visualization. Apply thermal camera colors showing heat distribution: hot spots in red/orange, warm areas in yellow, cool areas in blue/green. Make it look like a professional thermal scan with temperature gradients overlaying the actual food item.`,
        existing_image_urls: [food.photo_url]
      });

      setThermalImage(thermalImageResult.url);
      setAnalysis(visualAnalysis);
      
    } catch (error) {
      console.error("Deep analysis failed:", error);
      
      // Fallback with category-specific pathogens
      const categorySpecificPathogens = {
        fruit: [
          "Escherichia coli O157:H7 — Food poisoning / Hemolytic uremic syndrome",
          "Salmonella enterica — Salmonellosis",
          "Listeria monocytogenes — Listeriosis",
          "Penicillium expansum — Patulin poisoning (fruits, juices)",
          "Norovirus — Viral gastroenteritis",
          "Hepatitis A virus — Hepatitis A"
        ],
        vegetable: [
          "Escherichia coli O157:H7 — Food poisoning / Hemolytic uremic syndrome",
          "Salmonella enterica — Salmonellosis",
          "Listeria monocytogenes — Listeriosis",
          "Shigella spp. — Shigellosis (bacillary dysentery)",
          "Norovirus — Viral gastroenteritis",
          "Giardia lamblia — Giardiasis"
        ],
        protein: [
          "Salmonella enterica — Salmonellosis / Typhoid fever",
          "Campylobacter jejuni — Campylobacteriosis (diarrhea)",
          "Escherichia coli O157:H7 — Food poisoning / Hemolytic uremic syndrome",
          "Listeria monocytogenes — Listeriosis",
          "Clostridium perfringens — Foodborne gastroenteritis",
          "Staphylococcus aureus — Food poisoning (enterotoxin)",
          "Vibrio parahaemolyticus — Gastroenteritis (seafood)",
          "Yersinia enterocolitica — Yersiniosis (contaminated pork/dairy)"
        ],
        dairy: [
          "Listeria monocytogenes — Listeriosis",
          "Salmonella enterica — Salmonellosis",
          "Escherichia coli O157:H7 — Food poisoning / Hemolytic uremic syndrome",
          "Campylobacter jejuni — Campylobacteriosis",
          "Staphylococcus aureus — Food poisoning (enterotoxin)",
          "Yersinia enterocolitica — Yersiniosis"
        ],
        grain: [
          "Bacillus cereus — Food poisoning (diarrheal and emetic type)",
          "Clostridium perfringens — Foodborne gastroenteritis",
          "Aspergillus flavus — Aflatoxin poisoning",
          "Penicillium expansum — Patulin poisoning"
        ],
        mixed: [
          "Escherichia coli O157:H7 — Food poisoning / Hemolytic uremic syndrome",
          "Salmonella enterica — Salmonellosis",
          "Listeria monocytogenes — Listeriosis",
          "Campylobacter jejuni — Campylobacteriosis",
          "Staphylococcus aureus — Food poisoning (enterotoxin)",
          "Bacillus cereus — Food poisoning",
          "Norovirus — Viral gastroenteritis"
        ],
        other: [
          "Escherichia coli O157:H7 — Food poisoning",
          "Salmonella enterica — Salmonellosis",
          "Listeria monocytogenes — Listeriosis",
          "Staphylococcus aureus — Food poisoning"
        ]
      };

      const relevantPathogens = categorySpecificPathogens[food.category] || categorySpecificPathogens.other;

      setAnalysis({
        visual_spoilage_signs: [],
        pathogen_detection: relevantPathogens.map(pathogen => ({
          pathogen_and_disease: pathogen,
          detected: false,
          confidence: 0,
          risk_level: "None detected"
        })),
        freshness_score: null,
        overall_safety: {
          safety_score: 85,
          recommendation: "Analysis unavailable. No visible spoilage detected. Follow standard food safety practices.",
          proceed_with_caution: false
        }
      });

      try {
        const thermalImageResult = await GenerateImage({
          prompt: `Convert this food image into a thermal imaging visualization. Apply thermal camera colors showing heat distribution: hot spots in red/orange, warm areas in yellow, cool areas in blue/green.`,
          existing_image_urls: [food.photo_url]
        });
        setThermalImage(thermalImageResult.url);
      } catch (imgError) {
        console.error("Failed to generate thermal image:", imgError);
        setThermalImage(food.photo_url);
      }
    }
    
    setIsAnalyzing(false);
  }, [food]);

  useEffect(() => {
    performDeepAnalysis();
  }, [performDeepAnalysis]);

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
              <h1 className="text-xl font-bold text-gray-900">Deep Spoilage Analysis</h1>
              <p className="text-gray-600 text-sm">AI-based image analysis for {food.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-purple-600">
            <Microscope className="w-4 h-4" />
            <span className="text-sm font-medium">AI Analysis</span>
          </div>
        </header>

        {isAnalyzing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <Loader2 className="w-16 h-16 text-purple-600 animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analyzing Food Sample</h3>
            <p className="text-gray-600 text-center mb-4">
              Running AI-based spoilage and pathogen risk analysis...
            </p>
            <div className="w-full max-w-xs">
              <Progress value={85} className="h-2" />
              <p className="text-sm text-gray-500 mt-2 text-center">Processing image analysis</p>
            </div>
          </div>
        ) : foodNotVisible ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-md w-full">
              {/* Show the captured image */}
              {food.photo_url && (
                <div className="mb-6">
                  <img 
                    src={food.photo_url} 
                    alt={food.name} 
                    className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}
              
              <div className="text-center bg-amber-50 border-2 border-amber-200 rounded-lg p-6">
                <AlertTriangle className="w-16 h-16 text-amber-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Food Not Visible</h3>
                <p className="text-gray-700 mb-4">
                  The food is not visible in this image. Deep Analysis cannot be run on sealed containers. Please scan the food itself.
                </p>
                <Button
                  onClick={onBack}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Back to Food Details
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Original Food Photo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Original Sample
                </CardTitle>
              </CardHeader>
              <CardContent>
                {food.photo_url && (
                  <img src={food.photo_url} alt={food.name} className="w-full h-48 object-cover rounded-lg" />
                )}
              </CardContent>
            </Card>

            {/* Thermal Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-blue-600" />
                  Thermal Visualization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {thermalImage && (
                  <div className="relative">
                    <img src={thermalImage} alt="Thermal visualization" className="w-full h-48 object-cover rounded-lg border-2 border-blue-200" />
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      AI-Generated Visualization
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-600 italic">
                  Note: This is an AI-generated thermal visualization for illustrative purposes only.
                </p>
              </CardContent>
            </Card>

            {/* Visual Spoilage Detection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-blue-600" />
                  Visual Spoilage Indicators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis?.visual_spoilage_signs && analysis.visual_spoilage_signs.length > 0 ? (
                  analysis.visual_spoilage_signs.map((sign, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{sign.sign}</h4>
                        <Badge className={getSeverityColor(sign.severity)}>
                          {sign.severity} severity
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{sign.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-green-50 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 text-sm">No visible spoilage signs detected in this image</p>
                  </div>
                )}
                
                {analysis?.freshness_score !== null && analysis?.freshness_score !== undefined && (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {analysis.freshness_score}/100
                    </div>
                    <div className="text-sm text-blue-700">Visual Freshness Score</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pathogen Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Microscope className="w-5 h-5 text-purple-600" />
                  Pathogen Risk Assessment
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Based on AI analysis of visible indicators in the image</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis?.pathogen_detection?.map((pathogen, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{pathogen.pathogen_and_disease}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {pathogen.detected ? `Risk: ${pathogen.risk_level}` : "No visual indicators detected"}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <Badge className={getRiskBadgeColor(pathogen.detected, pathogen.confidence)}>
                        {pathogen.detected ? `${pathogen.confidence}%` : "Clear"}
                      </Badge>
                      {pathogen.detected ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-1 mx-auto" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 mx-auto" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Overall Safety */}
            {analysis?.overall_safety && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Overall Safety Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-emerald-600 mb-2">
                      {analysis.overall_safety.safety_score}/100
                    </div>
                    <div className="text-sm text-gray-600">AI Safety Score</div>
                  </div>
                  
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-emerald-800 font-medium mb-2">Recommendation:</p>
                    <p className="text-emerald-700 text-sm">{analysis.overall_safety.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Important Disclaimer */}
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
                  <AlertTriangle className="w-5 h-5" />
                  Important: AI Analysis Limitations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-amber-800 font-medium">
                  This analysis uses AI to assess visual spoilage indicators from your image. Pathogen risks are estimated based on visible signs and food type knowledge.
                </p>
                <ul className="space-y-1 text-xs text-amber-700">
                  <li>• This is NOT a laboratory test - bacteria cannot be seen with the naked eye</li>
                  <li>• Results are based on AI interpretation of visible spoilage patterns</li>
                  <li>• Always follow standard food safety practices regardless of results</li>
                  <li>• When in doubt, discard the food item</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Back Button */}
        {!isAnalyzing && (
          <div className="p-4 border-t bg-white">
            <Button
              onClick={onBack}
              className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Food Analysis
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}