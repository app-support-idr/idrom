import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, RefreshCw, Send, XCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import MissionList from './MissionList';
import MissionDetails from './MissionDetails';
import PrintableMission from './PrintableMission';

export default function RefacturationManagement({ currentUser }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('A faire');
  const [selectedMission, setSelectedMission] = useState(null);
  const [updating, setUpdating] = useState(false);

  const loadMissions = useCallback(async () => {
    setLoading(true);
    const all = await base44.entities.MissionOrder.list('-created_date');
    const refacturables = all.filter(m =>
      m.a_refacturer === true &&
      (m.status === 'Validée' || m.current_validator_level === 'RH')
    );
    setMissions(refacturables);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  const filteredMissions = statusFilter === 'Tous'
    ? missions
    : missions.filter(m => (m.statut_refacturation || 'A faire') === statusFilter);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const updates = { statut_refacturation: newStatus };
      if (newStatus === 'Annulé') {
        updates.refacturation_annulee_par = currentUser.user_name;
      }
      await base44.entities.MissionOrder.update(selectedMission.id, updates);
      toast.success(`Statut de refacturation mis à jour : ${newStatus}`);
      setSelectedMission(prev => ({ ...prev, ...updates }));
      loadMissions();
    } catch (e) {
      toast.error('Erreur lors de la mise à jour');
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const getRefacturationStatusColor = (status) => {
    switch (status) {
      case 'Envoyé': return 'bg-green-100 text-green-800 border-green-200';
      case 'Annulé': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  if (selectedMission) {
    const currentStatus = selectedMission.statut_refacturation || 'A faire';
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedMission(null)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la liste
        </Button>

        <MissionDetails mission={selectedMission} />

        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-600" />
              Gestion de la refacturation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-slate-700">Statut actuel :</span>
              <Badge className={`${getRefacturationStatusColor(currentStatus)} border px-4 py-1.5`}>
                {currentStatus}
              </Badge>
            </div>

            {currentStatus === 'Annulé' && selectedMission.refacturation_annulee_par && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  <strong>Refacturation annulée</strong> par {selectedMission.refacturation_annulee_par}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={() => handleStatusChange('A faire')}
                disabled={updating || currentStatus === 'A faire'}
                variant="outline"
                className="border-amber-500 text-amber-600 hover:bg-amber-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                A faire
              </Button>
              <Button
                onClick={() => handleStatusChange('Envoyé')}
                disabled={updating || currentStatus === 'Envoyé'}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                Envoyé
              </Button>
              <Button
                onClick={() => handleStatusChange('Annulé')}
                disabled={updating || currentStatus === 'Annulé'}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Annulé
              </Button>
            </div>
          </CardContent>
        </Card>

        <PrintableMission mission={selectedMission} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-800">Demandes à refacturer</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Filtrer :</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] h-9 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A faire">A faire</SelectItem>
              <SelectItem value="Envoyé">Envoyé</SelectItem>
              <SelectItem value="Annulé">Annulé</SelectItem>
              <SelectItem value="Tous">Tous</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <MissionList
          missions={filteredMissions}
          onSelect={setSelectedMission}
          emptyMessage="Aucune demande à refacturer pour ce filtre"
        />
      )}
    </div>
  );
}