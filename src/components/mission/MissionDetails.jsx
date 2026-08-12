import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, MapPin, Calendar, User, Briefcase, Clock, FileCheck, ExternalLink, Car, RefreshCw } from 'lucide-react';
import IndemnityCalculator from './IndemnityCalculator';
import moment from 'moment';

export default function MissionDetails({ mission }) {
  if (!mission) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Validée': return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejetée': return 'bg-red-100 text-red-800 border-red-200';
      case 'Demande de modification': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getDecisionColor = (decision) => {
    switch (decision) {
      case 'Validé': return 'text-green-600';
      case 'Rejeté': return 'text-red-600';
      case 'Demande de modification': return 'text-amber-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statut */}
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Ordre de Mission N° {mission.numero_om}
              </CardTitle>
              <p className="text-slate-500 mt-1">Demandé par {mission.demandeur_name} ({mission.demandeur_profile})</p>
            </div>
            <Badge className={`${getStatusColor(mission.status)} border px-4 py-1.5 text-sm font-medium`}>
              {mission.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Personne en mission */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Personne en mission</p>
                <p className="font-semibold text-slate-800">{mission.nom_prenom}</p>
                <p className="text-sm text-slate-600">Matricule: {mission.matricule}</p>
              </div>
            </div>

            {/* Fonction */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Fonction</p>
                <p className="font-semibold text-slate-800">{mission.fonction}</p>
              </div>
            </div>

            {/* Destination */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Destination</p>
                <p className="font-semibold text-slate-800">{mission.lieu_destination}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Départ</p>
                <p className="font-semibold text-slate-800">
                  {moment(mission.date_heure_depart).format('DD/MM/YYYY HH:mm')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Arrivée</p>
                <p className="font-semibold text-slate-800">
                  {moment(mission.date_heure_arrivee).format('DD/MM/YYYY HH:mm')}
                </p>
              </div>
            </div>

            {/* Catégorie */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FileCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Catégorie</p>
                <p className="font-semibold text-slate-800">{mission.categorie_mission}</p>
              </div>
            </div>
          </div>

          {/* Moyen de transport */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Car className="w-4 h-4 text-indigo-600" />
              <h4 className="font-semibold text-slate-700">Moyen de transport</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-500">Moyen de transport</p>
                <p className="font-semibold text-slate-800">{mission.moyen_transport}</p>
              </div>
              {mission.moyen_transport === 'Véhicule' && (
                <>
                  <div>
                    <p className="text-sm text-slate-500">Immatriculation</p>
                    <p className="font-semibold text-slate-800">{mission.immatriculation || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Couchette</p>
                    <Badge variant="outline" className={mission.avec_couchette ? 'border-green-500 text-green-600' : 'border-slate-400'}>
                      {mission.avec_couchette ? 'Avec couchette' : 'Sans couchette'}
                    </Badge>
                  </div>
                </>
              )}
              {mission.moyen_transport === 'Autres' && mission.type_transport_autre && (
                <div>
                  <p className="text-sm text-slate-500">Type de transport</p>
                  <p className="font-semibold text-slate-800">{mission.type_transport_autre}</p>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Motif */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-700 mb-2">Motif de la mission</h4>
              <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{mission.motif_mission}</p>
            </div>

            {mission.condition_particuliere && (
              <div>
                <h4 className="font-semibold text-slate-700 mb-2">Condition particulière</h4>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{mission.condition_particuliere}</p>
              </div>
            )}

            {mission.observation && (
              <div>
                <h4 className="font-semibold text-slate-700 mb-2">Observation</h4>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{mission.observation}</p>
              </div>
            )}

            <div className="flex items-center gap-4">
              <span className="font-semibold text-slate-700">Régularisation:</span>
              <Badge variant="outline" className={mission.regularisation === 'OUI' ? 'border-green-500 text-green-600' : 'border-slate-400'}>
                {mission.regularisation}
              </Badge>
            </div>
          </div>

          {/* Refacturation */}
          {mission.a_refacturer && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-4 h-4 text-amber-600" />
                <h4 className="font-semibold text-slate-700">Refacturation</h4>
                <Badge className={
                  (mission.statut_refacturation || 'A faire') === 'Envoyé' ? 'bg-green-100 text-green-800 border-green-200' :
                  (mission.statut_refacturation || 'A faire') === 'Annulé' ? 'bg-red-100 text-red-800 border-red-200' :
                  'bg-amber-100 text-amber-800 border-amber-200'
                } variant="outline">
                  {mission.statut_refacturation || 'A faire'}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Client à refacturer :</span> {mission.client_refacturation}
                </p>
                {mission.statut_refacturation === 'Annulé' && mission.refacturation_annulee_par && (
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ Refacturation annulée par {mission.refacturation_annulee_par}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Pièces justificatives */}
          {mission.pieces_justificatives && mission.pieces_justificatives.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-slate-700 mb-2">Pièces justificatives</h4>
              <div className="flex flex-wrap gap-2">
                {mission.pieces_justificatives.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Fichier {index + 1}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tableau des indemnités */}
      <IndemnityCalculator
        fonction={mission.fonction}
        categorie={mission.categorie_mission}
        dateDepart={mission.date_heure_depart}
        dateArrivee={mission.date_heure_arrivee}
        matricule={mission.matricule}
        avecCouchette={mission.avec_couchette}
      />

      {/* Historique des validations */}
      {mission.validation_history && mission.validation_history.length > 0 && (
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
            <CardTitle className="text-lg font-semibold text-slate-800">
              Historique des validations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {mission.validation_history.map((validation, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-semibold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-800">{validation.validator_name}</p>
                        <p className="text-sm text-slate-500">{validation.validator_profile}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-semibold ${getDecisionColor(validation.decision)}`}>
                          {validation.decision}
                        </span>
                        <p className="text-sm text-slate-500">
                          {moment(validation.date).format('DD/MM/YYYY HH:mm')}
                        </p>
                      </div>
                    </div>
                    {validation.comment && (
                      <p className="mt-2 text-slate-600 italic">"{validation.comment}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}