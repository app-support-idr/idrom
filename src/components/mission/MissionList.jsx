import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, MapPin, Calendar, ChevronRight, User } from 'lucide-react';
import moment from 'moment';

export default function MissionList({ missions, onSelect, emptyMessage = "Aucune demande trouvée" }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Validée': return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejetée': return 'bg-red-100 text-red-800 border-red-200';
      case 'Demande de modification': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (missions.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {missions.map((mission) => (
        <Card 
          key={mission.id} 
          className="border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
          onClick={() => onSelect(mission)}
        >
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-100 rounded-xl flex-shrink-0">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-800 text-lg">
                        OM N° {mission.numero_om}
                      </h3>
                      <Badge className={`${getStatusColor(mission.status)} border`}>
                        {mission.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{mission.nom_prenom}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{mission.lieu_destination}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{moment(mission.date_heure_depart).format('DD/MM/YYYY')}</span>
                      </div>
                    </div>
                    
                    {mission.current_validator_level && (
                      <div className="mt-2 text-xs text-indigo-600 font-medium">
                        📋 Assigné à : {mission.current_validator_level}
                      </div>
                    )}

                    <p className="text-sm text-slate-500 mt-2 line-clamp-1">
                     {mission.motif_mission}
                    </p>

                    {mission.status === 'Demande de modification' && (
                     <div className="mt-2 text-xs text-orange-600 font-medium">
                       ⚠️ Modification demandée - Cliquez pour éditer
                     </div>
                    )}
                    </div>
                    </div>
                    </div>

                    <div className="flex items-center gap-2">
                    {mission.status === 'Demande de modification' && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                    À modifier
                    </Badge>
                    )}
                    <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-slate-400 group-hover:text-indigo-600 transition-colors"
                    >
                    <ChevronRight className="w-5 h-5" />
                    </Button>
                    </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}