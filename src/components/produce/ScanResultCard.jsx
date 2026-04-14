import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { backendClient } from "@/api/backendClient";
import { 
  CheckCircle2, AlertTriangle, XCircle, Eye, EyeOff,
  Camera, TrendingUp, AlertCircle, Leaf
} from "lucide-react";

export default function ScanResultCard({ result, onNewScan }) {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    saveScanToHistory();
  }, []);

  const saveScanToHistory = async () => {
    if (isSaved) return;

    try {
      const session = localStorage.getItem('leftosense_session');
      const username = session ? JSON.parse(session).username : 'anonymous';

      const spoilageLevel = 
        result.defect_severity_score < 30 ? 'LOW' :
        result.defect_severity_score < 60 ? 'MEDIUM' : 'HIGH';

      const safeToConsume = result.safe_to_consume_visual_estimate === 'likely_ok';

      const scanData = {
        id: `scan_${Date.now()}`,
        user_id: username,
        image_url: result.image_url,
        food_name: result.detected_produce,
        analysis_result: {
          freshness_class: result.freshness_class,
          defect_labels: JSON.parse(result.defect_labels_json || '[]'),
          explanation: result.explanation_text,
          recommendation: result.final_recommendation,
          limitations: result.limitations,
          model_version: result.model_version,
          visual_regions: result.visual_regions_analyzed
        },
        safe_to_consume: safeToConsume,
        spoilage_level: spoilageLevel,
        freshness_class: result.freshness_class,
        defect_severity_score: result.defect_severity_score,
        model_confidence: result.model_confidence,
        created_at: new Date().toISOString()
      };

      // Save to localStorage
      const existingScans = JSON.parse(localStorage.getItem('scan_history') || '[]');
      const updatedScans = [scanData, ...existingScans].slice(0, 50);
      localStorage.setItem('scan_history', JSON.stringify(updatedScans));
      console.log('Scan saved:', scanData);

      // Also save to database
      await backendClient.entities.ScanHistory.create(scanData);

      setIsSaved(true);
    } catch (error) {
      console.error('Error saving scan to history:', error);
    }
  };

  const getFreshnessConfig = (freshnessClass) => {
    switch (freshnessClass) {
      case 'fresh':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          label: 'Fresh',
          labelColor: 'bg-emerald-100 text-emerald-700'
        };
      case 'borderline':
        return {
          icon: AlertTriangle,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          label: 'Borderline',
          labelColor: 'bg-amber-100 text-amber-700'
        };
      case 'spoiled':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Spoiled',
          labelColor: 'bg-red-100 text-red-700'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Unknown',
          labelColor: 'bg-gray-100 text-gray-700'
        };
    }
  };

  const getSafetyConfig = (estimate) => {
    switch (estimate) {
      case 'likely_ok':
        return { label: 'Likely Safe', color: 'bg-emerald-600' };
      case 'inspect_more':
        return { label: 'Inspect Carefully', color: 'bg-amber-500' };
      case 'avoid':
        return { label: 'Avoid Consumption', color: 'bg-red-600' };
      default:
        return { label: 'Uncertain', color: 'bg-gray-500' };
    }
  };

  const defectLabels = JSON.parse(result.defect_labels_json || '[]');
  const freshnessConfig = getFreshnessConfig(result.freshness_class);
  const safetyConfig = getSafetyConfig(result.safe_to_consume_visual_estimate);
  const FreshnessIcon = freshnessConfig.icon;

  const getDefectLabel = (defect) => {
    const labels = {
      'bruise': 'Bruising',
      'mold_like_surface': 'Mold-like Surface',
      'discoloration': 'Discoloration',
      'shriveling': 'Shriveling',
      'cut_or_crack': 'Cut/Crack',
      'soft_spot_appearance': 'Soft Spots',
      'none': 'None Detected'
    };
    return labels[defect] || defect;
  };

  return (
    <div className="space-y-4">
      {/* Image Preview */}
      <Card>
        <CardContent className="p-4">
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            <img
              src={result.image_url}
              alt="Scanned produce"
              className="w-full h-auto"
            />
            {showHeatmap && result.heatmap_url && (
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 via-yellow-500/30 to-green-500/30 pointer-events-none" />
            )}
          </div>
          {result.heatmap_url && (
            <Button
              onClick={() => setShowHeatmap(!showHeatmap)}
              variant="outline"
              size="sm"
              className="w-full mt-3"
            >
              {showHeatmap ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showHeatmap ? 'Hide' : 'Show'} Analysis Overlay
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Detection Info */}
      <Card className={`${freshnessConfig.bgColor} ${freshnessConfig.borderColor} border-2`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FreshnessIcon className={`w-8 h-8 ${freshnessConfig.color}`} />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 capitalize">
                {result.detected_produce}
              </h3>
              <Badge className={freshnessConfig.labelColor}>
                {freshnessConfig.label}
              </Badge>
            </div>
          </div>

          {/* Confidence Meter */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 font-medium">Model Confidence</span>
              <span className="text-gray-900 font-semibold">
                {Math.round(result.model_confidence * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.model_confidence * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full ${
                  result.model_confidence >= 0.8 ? 'bg-emerald-600' :
                  result.model_confidence >= 0.6 ? 'bg-amber-500' :
                  'bg-red-500'
                }`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Defect Analysis */}
      {defectLabels.length > 0 && !defectLabels.includes('none') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Visible Defects Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {defectLabels.filter(d => d !== 'none').map((defect, i) => (
                <Badge key={i} variant="outline" className="text-amber-700 border-amber-300">
                  {getDefectLabel(defect)}
                </Badge>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">Severity Score</span>
                <span className="text-gray-900 font-semibold">
                  {result.defect_severity_score}/100
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    result.defect_severity_score < 30 ? 'bg-emerald-500' :
                    result.defect_severity_score < 60 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${result.defect_severity_score}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-600" />
            Analysis Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            {result.explanation_text}
          </p>

          {result.visual_regions_analyzed && result.visual_regions_analyzed.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-900">Regions Analyzed:</p>
              <ul className="space-y-1">
                {result.visual_regions_analyzed.map((region, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-emerald-600">•</span>
                    <span><strong>{region.region}:</strong> {region.finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendation */}
      <Card className={`${safetyConfig.color} text-white`}>
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-2">Recommendation</h3>
          <p className="mb-4">{result.final_recommendation}</p>
          <div className="bg-white/20 rounded-lg p-3 text-sm">
            <p className="font-semibold mb-1">Important Limitation:</p>
            <p className="text-white/90">{result.limitations}</p>
          </div>
        </CardContent>
      </Card>

      {/* Model Info */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span>
              Model: {result.model_version} • Validation F1: {(result.model_validation_f1 * 100).toFixed(1)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Button onClick={onNewScan} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700">
        <Camera className="w-5 h-5 mr-2" />
        Scan Another Item
      </Button>
    </div>
  );
}