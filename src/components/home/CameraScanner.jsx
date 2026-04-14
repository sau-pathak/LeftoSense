import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Camera, Zap, RefreshCw, AlertCircle } from "lucide-react";
import { InvokeLLM, UploadFile } from "@/integrations/Core";

const mockFoods = [
  // American
  { name: "Leftover Burger", category: "protein", storage_location: "fridge" },
  { name: "Macaroni and Cheese", category: "mixed", storage_location: "fridge" },
  { name: "BBQ Pulled Pork", category: "protein", storage_location: "fridge" },
  { name: "Meatloaf Slice", category: "protein", storage_location: "fridge" },
  { name: "Fried Chicken Wing", category: "protein", storage_location: "fridge" },
  { name: "Clam Chowder", category: "mixed", storage_location: "fridge" },
  { name: "Shepherd's Pie", category: "mixed", storage_location: "fridge" },
  { name: "Cornbread", category: "grain", storage_location: "pantry" },

  // Italian
  { name: "Spaghetti Bolognese", category: "mixed", storage_location: "fridge" },
  { name: "Leftover Pizza Slice", category: "mixed", storage_location: "fridge" },
  { name: "Chicken Alfredo", category: "mixed", storage_location: "fridge" },
  { name: "Lasagna", category: "mixed", storage_location: "fridge" },
  { name: "Chicken Parmigiana", category: "protein", storage_location: "fridge" },
  { name: "Risotto", category: "grain", storage_location: "fridge" },
  { name: "Ravioli with Marinara", category: "mixed", storage_location: "fridge" },
  { name: "Garlic Bread", category: "grain", storage_location: "pantry" },
  
  // Mexican
  { name: "Beef Taco", category: "mixed", storage_location: "fridge" },
  { name: "Chicken Quesadilla", category: "mixed", storage_location: "fridge" },
  { name: "Bean Burrito", category: "mixed", storage_location: "fridge" },
  { name: "Chicken Enchiladas", category: "mixed", storage_location: "fridge" },
  { name: "Leftover Fajitas", category: "mixed", storage_location: "fridge" },
  { name: "Guacamole", category: "vegetable", storage_location: "fridge" },
  { name: "Spanish Rice", category: "grain", storage_location: "fridge" },
  { name: "Refried Beans", category: "protein", storage_location: "fridge" },

  // Indian
  { name: "Chicken Tikka Masala", category: "protein", storage_location: "fridge" },
  { name: "Vegetable Korma", category: "vegetable", storage_location: "fridge" },
  { name: "Dal Makhani", category: "protein", storage_location: "fridge" },
  { name: "Lamb Vindaloo", category: "protein", storage_location: "fridge" },
  { name: "Palak Paneer", category: "mixed", storage_location: "fridge" },
  { name: "Chana Masala", category: "protein", storage_location: "fridge" },
  { name: "Aloo Gobi", category: "vegetable", storage_location: "fridge" },
  { name: "Basmati Rice", category: "grain", storage_location: "fridge" },
  { name: "Naan Bread", category: "grain", storage_location: "pantry" },
  { name: "Samosa", category: "mixed", storage_location: "fridge" },
];

export default function CameraScanner({ onClose, onFoodScanned }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("Tap to start camera");
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [focusStabilized, setFocusStabilized] = useState(false);
  const [detectedFood, setDetectedFood] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const isScanningRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraReady(false);
    }
  }, [stream]);

  const checkCameraPermission = useCallback(async () => {
    try {
      setScanStatus("Checking camera permission...");
      const permission = await navigator.permissions.query({ name: 'camera' });
      
      if (permission.state === 'granted') {
        setPermissionGranted(true);
        return true;
      } else if (permission.state === 'prompt') {
        return null; // Will be handled by getUserMedia
      } else {
        setCameraError("Camera permission denied. Please enable in settings.");
        return false;
      }
    } catch (error) {
      console.warn("Permission API not supported, will try getUserMedia:", error);
      return null; // Fallback to getUserMedia
    }
  }, []);

  const startCamera = useCallback(async (isRetry = false) => {
    try {
      setCameraError(null);
      setDetectedFood(null);
      setScanStatus(isRetry ? "Retrying camera..." : "Opening camera...");
      
      // Check permissions first
      const permissionStatus = await checkCameraPermission();
      if (permissionStatus === false) {
        return;
      }
      
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          focusMode: 'continuous'
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setPermissionGranted(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Set up event handlers
        videoRef.current.oncanplay = () => {
          console.log("Video can play");
          setCameraReady(true);
          setScanStatus("Hold food steady...");
          
          // Wait for autofocus and exposure to stabilize
          setTimeout(() => {
            setFocusStabilized(true);
            setScanStatus("Ready - Tap to capture");
          }, 2000);
        };
        
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          videoRef.current.play().then(() => {
            console.log("Video playing successfully");
          }).catch(err => {
            console.log("Autoplay prevented:", err);
            setCameraReady(true);
          });
        };
        
        videoRef.current.onerror = (e) => {
          console.error("Video error:", e);
          setCameraError("Video display failed");
        };
      }
      
      setStream(mediaStream);
      setRetryCount(0);
      
    } catch (error) {
      console.error("Camera error:", error);
      let errorMessage = "Camera access failed";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera permission denied. Please allow access and refresh.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera found on device";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Camera is being used by another app";
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = "Camera doesn't support required settings";
      }
      
      setCameraError(errorMessage);
      setScanStatus("Camera unavailable");
      
      // Auto retry once if not a permission issue
      if (!isRetry && retryCount === 0 && error.name !== 'NotAllowedError') {
        setRetryCount(1);
        console.log("Retrying camera initialization...");
        setTimeout(() => startCamera(true), 1000);
      }
    }
  }, [checkCameraPermission, retryCount]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  const handleScan = async () => {
    // Prevent multiple simultaneous scans
    if (isScanningRef.current) {
      console.log("Scan already in progress");
      return;
    }

    if (!cameraReady) {
      await startCamera();
      return;
    }

    if (!focusStabilized) {
      setScanStatus("Wait for camera to focus...");
      return;
    }

    isScanningRef.current = true;
    setIsScanning(true);
    setCameraError(null);
    setDetectedFood(null);
    
    try {
      setScanStatus("Capturing photo...");
      const photoDataUrl = capturePhoto();
      setCapturedPhoto(photoDataUrl);
      
      if (!photoDataUrl) {
        throw new Error("Failed to capture photo");
      }

      // Convert base64 to proper File object for upload
      setScanStatus("Processing image...");
      const base64Response = await fetch(photoDataUrl);
      const blob = await base64Response.blob();
      
      // Create a proper File object from the blob
      const imageFile = new File([blob], "food-scan.jpg", { type: "image/jpeg" });
      
      // Upload the image file
      setScanStatus("Uploading image...");
      const { file_url } = await UploadFile({ file: imageFile });
      console.log("Image uploaded:", file_url);

      // Step 1: Food Identification (single-pass approach)
      setScanStatus("Identifying food...");
      console.log("Running food identification...");

      const identification = await InvokeLLM({
        prompt: `Analyze this captured image and identify the food item with maximum accuracy.

      ACCURACY-FIRST RULES:
      - ONLY identify the food if you can clearly see and confidently recognize it
      - Do NOT guess or approximate - accuracy is more important than accepting every scan
      - For similar foods, be very careful to distinguish correctly
      - If the image is blurry, poorly lit, or the food is unclear, lower your confidence score accordingly
      - Provide a confidence score that honestly reflects how certain you are about the SPECIFIC food name

      FOOD PRESENCE RULES (CRITICAL):
      - Set food_present to true ONLY if you can clearly see ACTUAL FOOD (the edible contents)
      - Set food_present to false if:
        * Only a wrapper, package, box, bag, or container is visible WITHOUT the actual food exposed
        * Empty plate, just background, or unclear objects
        * A candy bar wrapper (like a Butterfinger, Snickers, etc.) without the candy unwrapped/visible
        * A sealed bag, box, or packaging where no actual food is visible inside
        * The image shows branding/labels but no edible food is visible
      - Wrappers, packaging, and containers do NOT count as food - the CONTENTS must be visible

      GLOBAL CUISINE RECOGNITION (CRITICAL):
      - Recognize foods from ALL cuisines: Indian, American, Vietnamese, Asian, Middle Eastern, African, European, Latin American, etc.
      - Accept culturally specific dishes and prepared foods from any region
      - Use visual context (shape, texture, presentation, plating) to identify dishes accurately
      - Identify the actual dish name when possible (e.g., "Paratha with Chole", "Pad Thai", "Biryani", "Tacos")
      - Do NOT default to generic "mixed food" when you can identify the specific dish

      COMPOSITE vs SEPARATE FOODS (CRITICAL):
      - COMPOSITE FOODS (ALLOWED): Any dish that is served as one meal, regardless of ingredients count = mixed_food_types FALSE
      - This includes: Sandwiches, burgers, wraps, salads, bowls, pizza, curries with rice/bread, noodle dishes, stir-fries, mixed plates, etc.
      - SEPARATE FOODS (REJECT): Multiple distinct food items that are NOT part of the same dish = mixed_food_types TRUE
      - Multiple pieces of the SAME food = ONE food type, mixed_food_types FALSE

      Examples of ALLOWED composite foods:
      - Paratha with chickpea curry (chole) = ONE dish, mixed_food_types = FALSE
      - Biryani with raita = ONE dish, mixed_food_types = FALSE
      - Curry with rice = ONE dish, mixed_food_types = FALSE
      - Sandwich with fillings = ONE dish, mixed_food_types = FALSE
      - Noodles with vegetables and protein = ONE dish, mixed_food_types = FALSE
      - Tacos with toppings = ONE dish, mixed_food_types = FALSE
      - Salad with dressing and toppings = ONE dish, mixed_food_types = FALSE

      Examples of REJECTED separate foods:
      - Apple AND banana (two distinct fruits) = mixed_food_types = TRUE
      - Sandwich AND chips (two separate items) = mixed_food_types = TRUE
      - Pizza slice AND salad on the side = mixed_food_types = TRUE

      Return:
      - food_present: true only if food is clearly visible and recognizable
      - name: specific, accurate dish name from any cuisine (e.g., "Paratha with Chole", "Pad Thai", "Burrito Bowl", "Chicken Curry", or single food name)
      - category: protein, grain, vegetable, dairy, fruit, mixed, or other (use "mixed" for composite dishes)
      - storage_location: fridge, freezer, pantry, or room_temp
      - confidence: 0-100 (honest confidence in your SPECIFIC identification - be conservative)
      - mixed_food_types: true ONLY if multiple SEPARATE food items are present (NOT for composite dishes from any cuisine)`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            food_present: { type: "boolean" },
            name: { type: "string" },
            category: { type: "string", enum: ["protein", "grain", "vegetable", "dairy", "fruit", "mixed", "other"] },
            storage_location: { type: "string", enum: ["fridge", "freezer", "pantry", "room_temp"] },
            confidence: { type: "number" },
            mixed_food_types: { type: "boolean" }
          }
        }
      });

      console.log("Food identification result:", identification);

      // Check if food is present
      if (!identification.food_present) {
        console.error("NO_FOOD_DETECTED - Image contains no food items");
        const errorMsg = "No food detected. Please place a single food item in the frame and rescan.";
        console.error(errorMsg);
        setCameraError(errorMsg);
        setScanStatus("No food detected");
        setIsScanning(false);
        isScanningRef.current = false;
        return;
      }

      // Check for separate food items (not composite dishes)
      if (identification.mixed_food_types) {
        console.error("SEPARATE_FOOD_ITEMS_DETECTED");
        const errorMsg = "Please scan only one food item per image.";
        console.error(errorMsg);
        setCameraError(errorMsg);
        setScanStatus("Multiple items detected");
        setIsScanning(false);
        isScanningRef.current = false;
        return;
      }

      // High confidence threshold for accuracy
      if (identification.confidence < 70) {
        console.error("LOW_CONFIDENCE_DETECTION", identification.confidence);
        const errorMsg = `Cannot identify food with sufficient confidence (${Math.round(identification.confidence)}%). Please rescan with better lighting, clearer framing, or closer positioning.`;
        console.error(errorMsg);
        setCameraError(errorMsg);
        setScanStatus("Low confidence");
        setIsScanning(false);
        isScanningRef.current = false;
        return;
      }

      // Success! Display detected food
      const capitalizedName = identification.name.charAt(0).toUpperCase() + identification.name.slice(1);
      setDetectedFood({
        name: capitalizedName
      });
      setScanStatus(`Detected: ${capitalizedName}`);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // CRITICAL: Check for visible spoilage before proceeding
      setScanStatus("Checking for spoilage...");
      console.log("Running spoilage safety check...");

      const spoilageCheck = await InvokeLLM({
        prompt: `CRITICAL FOOD SAFETY ANALYSIS - Examine this image of "${identification.name}" for visible spoilage indicators.

      MANDATORY SPOILAGE DETECTION:
      - Actively look for VISIBLE mold, fungus, or fungal growth on the food
      - Check for decay, rot, slime, or discoloration indicating spoilage
      - Look for fuzzy growth, dark spots, white/green/black mold patches
      - Inspect for wilting, browning beyond normal ripeness, or texture breakdown

      SAFETY-FIRST RULES:
      - If ANY visible mold or fungus is present, set visible_spoilage to TRUE
      - If the food shows clear signs of decay or rot, set visible_spoilage to TRUE
      - Do NOT mark food as safe if mold or fungal growth is visible
      - Err on the side of caution - when in doubt, flag as unsafe
      - Base your decision ONLY on what you can see in THIS image

      IMPORTANT:
      - This is a safety check, not a freshness rating
      - Visible mold = unsafe to consume, no exceptions
      - Do not downplay or ignore visible spoilage signs

      Return:
      - visible_spoilage: true if ANY mold, fungus, or advanced decay is visible
      - spoilage_description: specific description of what you see (or "None detected" if clean)
      - safe_to_consume: false if visible_spoilage is true, true otherwise
      - confidence: 0-100 confidence in your spoilage assessment`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            visible_spoilage: { type: "boolean" },
            spoilage_description: { type: "string" },
            safe_to_consume: { type: "boolean" },
            confidence: { type: "number" }
          }
        }
      });

      console.log("Spoilage check result:", spoilageCheck);

      // If visible spoilage detected, reject the food
      if (spoilageCheck.visible_spoilage || !spoilageCheck.safe_to_consume) {
        console.error("UNSAFE_FOOD_DETECTED - Visible spoilage present");
        const errorMsg = `⚠️ Visible spoilage detected: ${spoilageCheck.spoilage_description}\n\nThis food is not safe to consume. Please discard it.`;
        console.error(errorMsg);
        setCameraError(errorMsg);
        setScanStatus("Unsafe food detected");
        setIsScanning(false);
        isScanningRef.current = false;
        return;
      }

      // Proceed with full analysis only if food is safe
      const foodData = {
        name: identification.name,
        category: identification.category,
        storage_location: identification.storage_location,
        photo_url: file_url,
        confidence_score: identification.confidence,
        spoilage_signs: false // Explicitly mark as no spoilage detected
      };

      console.log("Food scan successful:", foodData);
      onFoodScanned(foodData);
      stopCamera();
      
    } catch (error) {
      console.error("Scan error:", error);
      const errorMsg = error.message || "Scan failed. Please try again.";
      console.error("SCAN_ERROR:", errorMsg);
      setCameraError(errorMsg);
      setScanStatus("Scan failed");
    } finally {
      setIsScanning(false);
      isScanningRef.current = false;
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Camera Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="text-white hover:bg-white/10"
        >
          <X className="w-6 h-6" />
        </Button>
        <h2 className="text-lg font-semibold">Scan Your Food</h2>
        <div className="w-10" />
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden bg-gray-900">
        {/* Video Element - Always render but conditionally show */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${
            cameraReady && stream && !cameraError ? 'block' : 'hidden'
          }`}
          style={{
            transform: 'scaleX(-1)', // Mirror for selfie effect
          }}
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Loading/Error State */}
        {(!cameraReady || cameraError || !stream) && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white p-6">
              <Camera className="w-24 h-24 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">
                {cameraError ? "Camera Issue" : "Camera Ready"}
              </p>
              <p className="text-sm text-gray-400 mb-4">
                {cameraError || "Tap the button below to start your camera"}
              </p>
              <Button 
                variant="outline" 
                className="mt-4 text-white border-white hover:bg-white/10"
                onClick={startCamera}
              >
                {cameraError ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Scan Overlay - Only show when camera is ready */}
        {cameraReady && stream && !cameraError && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Bounding Box for food placement */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <motion.div
                animate={isScanning ? { 
                  scale: [1, 1.05, 1],
                  borderColor: ['#10B981', '#34D399', '#10B981']
                } : focusStabilized ? {
                  borderColor: ['#10B981', '#10B981']
                } : {
                  borderColor: ['#F59E0B', '#F59E0B']
                }}
                transition={{ repeat: isScanning ? Infinity : 0, duration: 2 }}
                className="w-72 h-72 border-4 rounded-2xl bg-transparent relative"
              >
                {/* Corner guides */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />
                
                {/* Center indicator */}
                {!isScanning && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
            
            {/* Status Text */}
            <div className="absolute bottom-32 left-0 right-0 text-center px-4">
              <p className="text-white text-lg font-medium bg-black/70 px-4 py-2 rounded-full mx-auto inline-block backdrop-blur-sm">
                {scanStatus}
              </p>
              
              {/* Detected food display */}
              {detectedFood && !isScanning && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 bg-emerald-600 text-white px-4 py-2 rounded-full mx-auto inline-block"
                >
                  ✓ Detected: {detectedFood.name}
                </motion.div>
              )}
              
              {/* Loading animation */}
              {isScanning && (
                <div className="flex justify-center space-x-1 mt-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        delay: i * 0.2
                      }}
                      className="w-2 h-2 bg-emerald-400 rounded-full"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {cameraError && cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center px-6 pointer-events-auto bg-black/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm"
            >
              {/* Green header bar */}
              <div className="bg-emerald-600 px-5 py-4 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-white flex-shrink-0" />
                <p className="text-white font-bold text-base">
                  {cameraError.includes('No food') || cameraError.includes('wrapper') ? 'No Food Detected' :
                   cameraError.includes('spoilage') || cameraError.includes('Visible spoilage') ? 'Spoilage Detected' :
                   cameraError.includes('Multiple') ? 'Multiple Items Detected' : 'Scan Error'}
                </p>
              </div>
              {/* Message body */}
              <div className="px-5 py-4">
                <p className="text-gray-700 text-sm leading-relaxed">{cameraError}</p>
                <Button
                  onClick={() => {
                    setCameraError(null);
                    setDetectedFood(null);
                    setScanStatus('Position food in the box');
                  }}
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Scan Button */}
      <div className="p-6 bg-black">
        <Button
          onClick={handleScan}
          disabled={isScanning || (cameraReady && !focusStabilized)}
          className="w-full h-16 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600"
        >
          {isScanning ? (
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 animate-pulse" />
              Analyzing...
            </div>
          ) : !cameraReady || !stream ? (
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Start Camera
            </div>
          ) : !focusStabilized ? (
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 animate-pulse" />
              Focusing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Capture & Analyze
            </div>
          )}
        </Button>
      </div>
    </motion.div>
  );
}