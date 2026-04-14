import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, Phone, Send } from "lucide-react";

export default function DonationCenterCard({ center, onProceedToConfirm, isRecommended = false }) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-gray-900">{center.name}</h3>
            {isRecommended && (
              <Badge className="bg-emerald-100 text-emerald-700 mt-1">
                <Star className="w-3 h-3 mr-1" /> Recommended
              </Badge>
            )}
          </div>
          <Badge variant="outline" className="capitalize">{center.type?.replace('_', ' ')}</Badge>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mt-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{center.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{center.hours}</span>
          </div>
          {center.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{center.phone}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={onProceedToConfirm}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Donate Here
          </Button>
          <Button variant="outline" className="flex-1">
            Directions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}