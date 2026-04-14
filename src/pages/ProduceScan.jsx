import React, { useState, useRef } from "react";
import { backendClient } from "@/api/backendClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Loader2, AlertCircle, CheckCircle2, XCircle, Info } from "lucide-react";
import ScanResultCard from "@/components/produce/ScanResultCard";
import UnsupportedProduceCard from "@/components/produce/UnsupportedProduceCard";

export default function ProduceScanPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      setScanResult(null);
      setDetectionResult(null);

      // Upload image
      const { file_url } = await backendClient.integrations.Core.UploadFile({ file });

      // Stage 1: Detect produce type
      const detection = await backendClient.functions.invoke('detectProduce', { image_url: file_url });

      if (detection.data.status === 'low_confidence') {
        setError({
          type: 'low_confidence',
          message: detection.data.message,
          suggestions: detection.data.suggestions
        });
        setIsProcessing(false);
        return;
      }

      setDetectionResult(detection.data);

      // Stage 2 & 3: If supported, analyze quality
      if (detection.data.analysis_supported) {
        const session = localStorage.getItem('leftosense_session');
        const username = session ? JSON.parse(session).username : null;
        
        const analysis = await backendClient.functions.invoke('analyzeQuality', {
          image_url: file_url,
          detected_produce: detection.data.detected_produce,
          username: username
        });

        setScanResult({
          ...analysis.data,
          image_url: file_url
        });
      } else {
        setScanResult({
          status: 'unsupported',
          detected_produce: detection.data.detected_produce,
          detection_confidence: detection.data.detection_confidence,
          message: detection.data.message,
          image_url: file_url
        });
      }

    } catch (err) {
      console.error('Scan error:', err);
      setError({
        type: 'error',
        message: err.message || 'Failed to analyze image. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCameraCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Produce Quality Scanner</h1>
          <p className="text-gray-600">AI-powered visual freshness analysis</p>
        </motion.div>

        {/* Scientific Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Visual Analysis Only</p>
                  <p className="text-blue-800">
                    This system analyzes visible freshness indicators and surface defects. 
                    It cannot detect bacteria or confirm microbial contamination from RGB images.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Scan Actions */}
        {!scanResult && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <Card className="bg-white shadow-lg">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Scan Your Produce
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Center one fruit or vegetable in good lighting
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-lg"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Take Photo
                  </Button>

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full h-14 text-lg"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Image
                  </Button>
                </div>

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCameraCapture}
                  className="hidden"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Supported Produce Types */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Supported Produce</h3>
                <div className="flex flex-wrap gap-2">
                  {['Apple', 'Banana', 'Orange', 'Tomato', 'Strawberry', 'Mango', 'Avocado', 'Lemon', 'Cucumber', 'Bell Pepper'].map(item => (
                    <Badge key={item} variant="secondary" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Processing State */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="bg-white shadow-lg">
                <CardContent className="p-12 text-center">
                  <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Analyzing Produce...
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Running CNN-based quality detection
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-6">
                  <div className="flex gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-red-900 mb-1">
                        {error.type === 'low_confidence' ? 'Image Quality Issue' : 'Analysis Failed'}
                      </h3>
                      <p className="text-sm text-red-800">{error.message}</p>
                    </div>
                  </div>

                  {error.suggestions && (
                    <div className="ml-9 space-y-1">
                      <p className="text-sm font-semibold text-red-900">Suggestions:</p>
                      <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                        {error.suggestions.map((suggestion, i) => (
                          <li key={i}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    onClick={() => setError(null)}
                    variant="outline"
                    className="mt-4 w-full"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {scanResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {scanResult.status === 'unsupported' ? (
                <UnsupportedProduceCard
                  result={scanResult}
                  onNewScan={() => setScanResult(null)}
                />
              ) : (
                <ScanResultCard
                  result={scanResult}
                  onNewScan={() => setScanResult(null)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}