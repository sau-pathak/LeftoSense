import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function ScanDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const scan = location.state?.scan;

  if (!scan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No scan data found</p>
          <Button onClick={() => navigate('/History')} className="mt-4">
            Back to History
          </Button>
        </div>
      </div>
    );
  }

  const getFreshnessIcon = () => {
    if (scan.freshness_class === 'fresh') return <CheckCircle className="w-6 h-6 text-emerald-600" />;
    if (scan.freshness_class === 'borderline') return <AlertTriangle className="w-6 h-6 text-amber-600" />;
    return <XCircle className="w-6 h-6 text-red-600" />;
  };

  const getSpoilageColor = () => {
    if (scan.spoilage_level === 'LOW') return 'bg-emerald-100 text-emerald-700';
    if (scan.spoilage_level === 'MEDIUM') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
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
          <Button 
            variant="ghost" 
            onClick={() => navigate('/History')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 capitalize">{scan.food_name}</h1>
          <p className="text-gray-600">
            Scanned on {format(new Date(scan.created_at || scan.created_date), 'MMMM d, yyyy at h:mm a')}
          </p>
        </motion.div>

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          {scan.image_url && (
            <img 
              src={scan.image_url} 
              alt={scan.food_name}
              className="w-full h-64 object-cover rounded-xl shadow-lg"
            />
          )}
        </motion.div>

        {/* Quick Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getFreshnessIcon()}
                  <div>
                    <h3 className="font-semibold text-gray-900">Freshness Assessment</h3>
                    <p className="text-sm text-gray-600 capitalize">{scan.freshness_class}</p>
                  </div>
                </div>
                <Badge className={getSpoilageColor()}>
                  {scan.spoilage_level} Spoilage
                </Badge>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-gray-600">Safe to Consume:</span>
                <Badge className={scan.safe_to_consume ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                  {scan.safe_to_consume ? 'Yes' : 'Caution Advised'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Defect Score */}
        {scan.defect_severity_score !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Defect Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Defect Severity Score</span>
                    <span className={`text-2xl font-bold ${
                      scan.defect_severity_score < 30 ? 'text-emerald-600' :
                      scan.defect_severity_score < 60 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {scan.defect_severity_score}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        scan.defect_severity_score < 30 ? 'bg-emerald-500' :
                        scan.defect_severity_score < 60 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${scan.defect_severity_score}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Model Confidence */}
        {scan.model_confidence !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Analysis Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Model Confidence</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {(scan.model_confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Full Analysis Data */}
        {scan.analysis_result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Complete Analysis Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scan.analysis_result.category && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-gray-600 font-medium">Category</span>
                      <Badge variant="secondary" className="capitalize">{scan.analysis_result.category}</Badge>
                    </div>
                  )}
                  
                  {scan.analysis_result.storage_location && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-gray-600 font-medium">Storage Location</span>
                      <span className="text-gray-900 font-semibold capitalize">
                        {scan.analysis_result.storage_location.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                  
                  {scan.analysis_result.safe_until && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-gray-600 font-medium">Safe Until</span>
                      <span className="text-gray-900 font-semibold">
                        {format(new Date(scan.analysis_result.safe_until), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  )}
                  
                  {scan.analysis_result.safety_recommendation && (
                    <div className="py-2 border-b">
                      <span className="text-gray-600 font-medium block mb-2">Safety Recommendation</span>
                      <p className="text-gray-900 bg-emerald-50 p-3 rounded-lg">
                        {scan.analysis_result.safety_recommendation}
                      </p>
                    </div>
                  )}
                  
                  {scan.analysis_result.confidence_score !== undefined && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-600 font-medium">Confidence Score</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{ width: `${scan.analysis_result.confidence_score}%` }}
                          />
                        </div>
                        <span className="text-gray-900 font-bold">{scan.analysis_result.confidence_score}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}