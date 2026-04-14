import React, { useState, useEffect } from "react";
import { backendClient } from "@/api/backendClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Database, TrendingUp, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function DatasetAdminPage() {
  const [models, setModels] = useState([]);
  const [coverage, setCoverage] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [modelsRes, coverageRes] = await Promise.all([
        backendClient.functions.invoke('getModelRegistry', {}),
        backendClient.functions.invoke('getDatasetCoverage', {})
      ]);

      setModels(modelsRes.data.models || []);
      setCoverage(coverageRes.data.coverage || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'production_ready':
        return { label: 'Production Ready', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 };
      case 'needs_validation':
        return { label: 'Needs Validation', color: 'bg-amber-100 text-amber-700', icon: AlertCircle };
      case 'insufficient_data':
        return { label: 'Insufficient Data', color: 'bg-red-100 text-red-700', icon: AlertCircle };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-700', icon: AlertCircle };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dataset Coverage & Model Registry</h1>
          <p className="text-gray-600">Training data status and model validation metrics</p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {models.filter(m => m.status === 'production_ready').length}
                  </p>
                  <p className="text-sm text-gray-600">Production Ready</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {models.filter(m => m.status === 'needs_validation').length}
                  </p>
                  <p className="text-sm text-gray-600">Needs Validation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {models.filter(m => m.status === 'insufficient_data').length}
                  </p>
                  <p className="text-sm text-gray-600">Insufficient Data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Models Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-700" />
                Model Registry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {models.map((model, index) => {
                  const statusConfig = getStatusConfig(model.status);
                  const StatusIcon = statusConfig.icon;
                  const coverageData = coverage.find(c => c.produce_type === model.produce_type);

                  return (
                    <motion.div
                      key={model.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-gray-50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <StatusIcon className={`w-5 h-5 ${
                                model.status === 'production_ready' ? 'text-emerald-600' :
                                model.status === 'needs_validation' ? 'text-amber-600' :
                                'text-red-600'
                              }`} />
                              <div>
                                <h3 className="font-semibold text-gray-900 capitalize">
                                  {model.produce_type}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {model.model_name} • v{model.model_version}
                                </p>
                              </div>
                            </div>
                            <Badge className={statusConfig.color}>
                              {statusConfig.label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Training Images</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {model.current_num_images}/{model.min_required_images}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Validation F1</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {model.validation_f1 ? (model.validation_f1 * 100).toFixed(1) + '%' : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Accuracy</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {model.validation_accuracy ? (model.validation_accuracy * 100).toFixed(1) + '%' : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Status</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {model.supported ? 'Enabled' : 'Disabled'}
                              </p>
                            </div>
                          </div>

                          {coverageData && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-700 mb-2">Dataset Distribution</p>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-600">Fresh:</span>{' '}
                                  <span className="font-semibold text-emerald-600">
                                    {coverageData.freshness_distribution.fresh}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Borderline:</span>{' '}
                                  <span className="font-semibold text-amber-600">
                                    {coverageData.freshness_distribution.borderline}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Spoiled:</span>{' '}
                                  <span className="font-semibold text-red-600">
                                    {coverageData.freshness_distribution.spoiled}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2">
                                <span className="text-gray-600">Defect Samples:</span>{' '}
                                <span className="font-semibold text-gray-900">
                                  {coverageData.defect_distribution.total}
                                </span>
                              </div>
                            </div>
                          )}

                          {model.notes && (
                            <div className="mt-3 p-2 bg-white rounded text-xs text-gray-600">
                              {model.notes}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}