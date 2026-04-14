import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/all";
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { ArrowLeft, Map, List, Loader2, MapPin, Weight, Send } from "lucide-react";
import DonationMap from "./DonationMap";
import DonationCenterCard from "./DonationCenterCard";

export default function DonationFlow({ food, onComplete, onBack }) {
  const [centers, setCenters] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("map");
  const [locationError, setLocationError] = useState(null);
  const [step, setStep] = useState('selection'); // 'selection' or 'confirmation'
  const [weight, setWeight] = useState(0.5);

  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }, []);

  const generateNearbyDonationCenters = useCallback(async (latitude, longitude) => {
    try {
      const response = await InvokeLLM({
        prompt: `Find 8 real donation centers (food banks, shelters, community fridges, nonprofits) near coordinates ${latitude}, ${longitude}.

CRITICAL LOCATION ACCURACY REQUIREMENTS:
- Use real, existing donation centers in that geographic area
- Provide EXACT latitude and longitude coordinates that match the actual physical address
- Verify each center's coordinates correspond to its real street address
- Do NOT use approximate, offset, or placeholder coordinates
- Coordinates must be precise enough to navigate to the exact building location
- Within 5 miles radius of user location

For each center, provide:
- name: Real organization name
- type: food_bank, shelter, community_fridge, or nonprofit
- address: Complete, accurate street address
- latitude: Exact GPS latitude matching the address
- longitude: Exact GPS longitude matching the address
- phone: Real contact number
- hours: Current operating hours
- needed_food_types: Array of food categories they accept
- accepts_prepared_food: Boolean

The latitude/longitude must be accurate enough that map markers appear at the correct real-world location without offset or drift.`,
        response_json_schema: {
          type: "object",
          properties: {
            centers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string", enum: ["food_bank", "shelter", "community_fridge", "nonprofit"] },
                  address: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  phone: { type: "string" },
                  hours: { type: "string" },
                  needed_food_types: { type: "array", items: { type: "string" } },
                  accepts_prepared_food: { type: "boolean" }
                },
                required: ["name", "type", "address", "latitude", "longitude", "phone", "hours", "needed_food_types", "accepts_prepared_food"]
              }
            }
          },
          required: ["centers"]
        }
      });

      return response.centers || [];
    } catch (error) {
      console.error("Error generating donation centers:", error);
      // Fallback to some default centers around the user's location
      return [
        {
          id: "fallback1", // Add a unique ID for keys
          name: "Local Food Bank",
          type: "food_bank",
          address: "Community Center nearby",
          latitude: latitude + 0.01,
          longitude: longitude + 0.01,
          phone: "(555) 123-4567",
          hours: "Mon-Fri 9AM-5PM",
          needed_food_types: ["all"],
          accepts_prepared_food: true
        },
        {
          id: "fallback2", // Add a unique ID for keys
          name: "Community Shelter",
          type: "shelter",
          address: "Main Street location",
          latitude: latitude - 0.01,
          longitude: longitude - 0.01,
          phone: "(555) 987-6543",
          hours: "Daily 8AM-8PM",
          needed_food_types: ["protein", "mixed"],
          accepts_prepared_food: true
        },
        {
          id: "fallback3",
          name: "Green Community Fridge",
          type: "community_fridge",
          address: "Park Avenue",
          latitude: latitude + 0.005,
          longitude: longitude - 0.005,
          phone: "N/A",
          hours: "24/7",
          needed_food_types: ["fruit", "vegetable", "baked_goods"],
          accepts_prepared_food: true
        }
      ];
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLocationError(null);

    try {
      const currentUser = await User.me();

      // Try to get current location
      let userLocation = currentUser.location;

      try {
        const currentLocation = await getCurrentLocation();
        userLocation = currentLocation;

        // Update user location in database
        await User.updateMyUserData({
          location: {
            ...currentUser.location,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
          }
        });

        // Update local user state
        setUser({
          ...currentUser,
          location: {
            ...currentUser.location,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
          }
        });
      } catch (locationErr) {
        console.warn("Could not get current location:", locationErr);
        setLocationError("Location access denied. Using default area.");
        setUser(currentUser);

        // Use default location if user location not available or if geolocation fails
        if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
          userLocation = { latitude: 40.7589, longitude: -73.9851 }; // NYC fallback
        }
      }

      // Generate nearby donation centers
      const nearbyDonationCenters = await generateNearbyDonationCenters(
        userLocation.latitude,
        userLocation.longitude
      );

      // Ensure each center has a unique identifier
      const centersWithIds = nearbyDonationCenters.map((center, index) => ({
        ...center,
        id: `center-${Date.now()}-${index}` // This will overwrite any existing 'id' from fallbacks or LLM
      }));

      setCenters(centersWithIds);
      // setSelectedCenter is now handled by handleProceedToConfirm
    } catch (error) {
      console.error("Error loading donation data:", error);
      setLocationError("Unable to load donation centers.");
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentLocation, generateNearbyDonationCenters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProceedToConfirm = (center) => {
    setSelectedCenter(center);
    setStep('confirmation');
  };

  const handleConfirmDonation = () => {
    if (selectedCenter) {
      // Pass the selected donation center and weight to the parent
      onComplete(selectedCenter, weight);
    } else {
      console.error("No center selected for donation");
    }
  };

  const getRecommendedCenters = () => {
    if (!food) return [];
    return centers.filter(center =>
      center.needed_food_types?.includes(food.category) ||
      center.needed_food_types?.includes('all') ||
      center.accepts_prepared_food
    );
  };

  const recommendedCenters = getRecommendedCenters();

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
            <Button variant="ghost" size="icon" onClick={step === 'selection' ? onBack : () => setStep('selection')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {step === 'selection' ? 'Donate Your Food' : 'Confirm Donation'}
              </h1>
              <p className="text-gray-600">
                {step === 'selection'
                  ? (locationError ? "Showing nearby centers" : "Based on your current location")
                  : `to ${selectedCenter?.name}`
                }
              </p>
            </div>
          </div>
        </header>

        {/* Location Error Banner */}
        {locationError && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700">{locationError}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
            <p className="text-gray-600">Finding nearby donation centers...</p>
            <p className="text-sm text-gray-500 mt-1">Getting your location...</p>
          </div>
        ) : step === 'confirmation' ? (
          <div className="flex-1 flex flex-col justify-between p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-center">How much does the food weigh?</h3>
              <div className="flex items-center gap-3 justify-center">
                <Weight className="w-6 h-6 text-gray-500" />
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  className="w-24 text-center text-lg"
                  step="0.1"
                />
                <span className="text-lg font-medium text-gray-700">lbs</span>
              </div>
            </div>
            <Button
              onClick={handleConfirmDonation}
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg mt-auto"
            >
              <Send className="w-5 h-5 mr-2" />
              Confirm & Complete Donation
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="p-4 flex justify-between items-center">
              <Badge variant="secondary" className="text-lg py-1 px-3">
                Donating: <span className="font-semibold ml-1">{food?.name}</span>
              </Badge>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'map' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                >
                  <Map className="w-4 h-4 mr-2" />Map
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4 mr-2" />List
                </Button>
              </div>
            </div>

            {viewMode === 'map' && (
              <div className="flex-1 relative">
                <DonationMap
                  userLocation={user?.location}
                  centers={centers}
                  selectedCenter={selectedCenter}
                  onCenterSelect={handleProceedToConfirm}
                />
                {selectedCenter && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <DonationCenterCard
                      center={selectedCenter}
                      onProceedToConfirm={() => handleProceedToConfirm(selectedCenter)}
                      isRecommended={recommendedCenters.some(c => c.name === selectedCenter.name)}
                    />
                  </div>
                )}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {recommendedCenters.length > 0 && (
                  <>
                    <h3 className="font-semibold text-emerald-700">Recommended for {food?.category}</h3>
                    {recommendedCenters.map(center => (
                      <div
                        key={center.id}
                      >
                        <DonationCenterCard
                          center={center}
                          onProceedToConfirm={() => handleProceedToConfirm(center)}
                          isRecommended={true}
                        />
                      </div>
                    ))}
                    <h3 className="font-semibold text-gray-700 pt-4">Other Locations</h3>
                  </>
                )}
                {centers.filter(c => !recommendedCenters.some(rc => rc.name === c.name)).map(center => (
                  <div
                    key={center.id}
                  >
                    <DonationCenterCard
                      center={center}
                      onProceedToConfirm={() => handleProceedToConfirm(center)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}