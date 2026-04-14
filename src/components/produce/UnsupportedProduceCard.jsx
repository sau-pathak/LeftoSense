import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, Camera, Database } from "lucide-react";

export default function UnsupportedProduceCard({ result, onNewScan }) {
  return (
    <div className="space-y-4">
      {/* Image Preview */}
      <Card>
        <CardContent className="p-4">
          <img
            src={result.image_url}
            alt="Scanned produce"
            className="w-full h-auto rounded-lg"
          />
        </CardContent>
      </Card>

      {/* Recognition Success */}
      <Card className="bg-blue-50 border-blue-200 border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Produce Recognized
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Detected Item:</p>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-gray-900 capitalize">
                {result.detected_produce}
              </h3>
              <Badge className="bg-blue-100 text-blue-700">
                {Math.round(result.detection_confidence * 100)}% confident
              </Badge>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex gap-3">
              <Database className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 mb-1">
                  Deep Analysis Not Yet Available
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {result.message}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <p className="text-sm text-amber-900">
              <strong>Why is this happening?</strong> Our CNN-based quality analysis 
              requires a minimum number of validated training images with proper freshness 
              labels and defect annotations. This produce type has been recognized but doesn't 
              yet have enough training data for reliable spoilage detection.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900">What you can do:</p>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Use manual inspection for now</li>
              <li>Check expiration dates and storage time</li>
              <li>Look for visible signs of mold, bruising, or discoloration</li>
              <li>Follow standard food safety guidelines</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Button onClick={onNewScan} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700">
        <Camera className="w-5 h-5 mr-2" />
        Try Different Produce
      </Button>
    </div>
  );
}