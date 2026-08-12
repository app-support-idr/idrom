import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Upload, X, FileText, Loader2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import IndemnityCalculator from './IndemnityCalculator';
import { toast } from 'sonner';
import moment from 'moment';
import { sendValidatorNotifications, showNotificationToast } from '@/utils/notifyValidators';

const WORKFLOW_ORDER = ['RO', 'Directeur', 'Directeur des opérations', 'DGA', 'RH'];

export default function MissionForm({ currentUser, onSuccess, editingMission }) {
  const [formData, setFormData] = useState(editingMission ? {
    nom_prenom: editingMission.nom_prenom || '',
    matricule: editingMission.matricule || '',
    fonction: editingMission.fonction || '',
    numero_om: editingMission.numero_om || '',
    lieu_destination: editingMission.lieu_destination || '',
    motif_mission: editingMission.motif_mission || '',
    categorie_mission: editingMission.categorie_mission || '',
    date_heure_depart: editingMission.date_heure_depart || '',
    date_heure_arrivee: editingMission.date_heure_arrivee || '',
    condition_particuliere: editingMission.condition_particuliere || '',
    observation: editingMission.observation || '',
    regularisation: editingMission.regularisation || '',
    moyen_transport: editingMission.moyen_transport || '',
    immatriculation: editingMission.immatriculation || '',
    avec_couchette: editingMission.avec_couchette || false,
    type_transport_autre: editingMission.type_transport_autre || '',
    a_refacturer: editingMission.a_refacturer || false,
    client_refacturation: editingMission.client_refacturation || ''
  } : {
    nom_prenom: '',
    matricule: '',
    fonction: '',
    numero_om: '',
    lieu_destination: '',
    motif_mission: '',
    categorie_mission: '',
    date_heure_depart: '',
    date_heure_arrivee: '',
    condition_particuliere: '',
    observation: '',
    regularisation: '',
    moyen_transport: '',
    immatriculation: '',
    avec_couchette: false,
    type_transport_autre: '',
    a_refacturer: false,
    client_refacturation: ''
  });
  const [files, setFiles] = useState(editingMission?.pieces_justificatives || []);
  const [uploading, setUploading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    setUploading(true);
    
    const uploadedUrls = [];
    for (const file of selectedFiles) {
      const result = await base44.integrations.Core.UploadFile({ file });
      uploadedUrls.push(result.file_url);
    }
    
    setFiles(prev => [...prev, ...uploadedUrls]);
    setUploading(false);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getNextValidator = () => {
    const submitterProfile = editingMission
      ? editingMission.demandeur_profile
      : currentUser.currentProfile;
    const currentIndex = WORKFLOW_ORDER.indexOf(submitterProfile);
    if (currentIndex === -1) return WORKFLOW_ORDER[0];
    if (currentIndex < WORKFLOW_ORDER.length - 1) return WORKFLOW_ORDER[currentIndex + 1];
    return WORKFLOW_ORDER[WORKFLOW_ORDER.length - 1];
  };

  const calculateIndemnites = () => {
    if (!formData.fonction || !formData.categorie_mission || !formData.date_heure_depart || !formData.date_heure_arrivee) {
      return { data: null, total: 0 };
    }
    // Le calcul détaillé est géré par IndemnityCalculator
    return { data: formData, total: 0 };
  };



  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      const nextValidator = getNextValidator();
      
      if (editingMission) {
        const updatedMission = {
          ...formData,
          pieces_justificatives: files,
          status: 'En cours de validation',
          current_validator_level: nextValidator,
          indemnites_data: calculateIndemnites().data,
          total_indemnites: calculateIndemnites().total
        };

        await base44.entities.MissionOrder.update(editingMission.id, updatedMission);
        
        try {
          const allUsers = await base44.entities.UserProfile.list();
          const validators = allUsers.filter(u => u.profiles.includes(nextValidator));
          const emails = validators.map(v => v.user_email);
          const subject = `Demande modifiée à valider - OM N°${formData.numero_om}`;
          const body = `Bonjour,\n\nUne demande d'ordre de mission a été modifiée et nécessite votre validation.\n\nNuméro OM : ${formData.numero_om}\n\nDemandeur : ${currentUser.user_name}\n\nPersonne en mission : ${formData.nom_prenom}\n\nDestination : ${formData.lieu_destination}\n\nDate de départ : ${new Date(formData.date_heure_depart).toLocaleString('fr-FR')}\n\nDate d'arrivée : ${new Date(formData.date_heure_arrivee).toLocaleString('fr-FR')}\n\nVeuillez vous connecter à l'application pour valider cette demande :\nhttps://idrom.base44.app/\n\nCordialement,\nSystème de gestion des ordres de mission`;
          const result = await sendValidatorNotifications(emails, subject, body);
          showNotificationToast(result);
        } catch (e) {
          console.error('Email non envoyé:', e);
          toast.warning('La notification par email n\'a pas pu être envoyée aux validateurs.');
        }

        toast.success('Demande mise à jour et renvoyée en validation');
      } else {
        const missionOrder = {
          ...formData,
          demandeur_email: currentUser.user_email,
          demandeur_name: currentUser.user_name,
          demandeur_profile: currentUser.currentProfile,
          pieces_justificatives: files,
          status: 'En cours de validation',
          current_validator_level: nextValidator,
          validation_history: [],
          indemnites_data: calculateIndemnites().data,
          total_indemnites: calculateIndemnites().total
        };

        await base44.entities.MissionOrder.create(missionOrder);
        
        try {
          const allUsers = await base44.entities.UserProfile.list();
          const validators = allUsers.filter(u => u.profiles.includes(nextValidator));
          const emails = validators.map(v => v.user_email);
          const subject = `Nouvelle demande à valider - OM N°${formData.numero_om}`;
          const body = `Bonjour,\n\nUne nouvelle demande d'ordre de mission nécessite votre validation.\n\nNuméro OM : ${formData.numero_om}\n\nDemandeur : ${currentUser.user_name}\n\nPersonne en mission : ${formData.nom_prenom}\n\nDestination : ${formData.lieu_destination}\n\nDate de départ : ${new Date(formData.date_heure_depart).toLocaleString('fr-FR')}\n\nDate d'arrivée : ${new Date(formData.date_heure_arrivee).toLocaleString('fr-FR')}\n\nVeuillez vous connecter à l'application pour valider ou rejeter cette demande :\nhttps://idrom.base44.app/\n\nCordialement,\nSystème de gestion des ordres de mission`;
          const result = await sendValidatorNotifications(emails, subject, body);
          showNotificationToast(result);
        } catch (e) {
          console.error('Email non envoyé:', e);
          toast.warning('La notification par email n\'a pas pu être envoyée aux validateurs.');
        }

        toast.success('Demande envoyée avec succès');
      }
      
      onSuccess?.();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
      console.error(error);
    } finally {
      setSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  const isFormValid = () => {
    const base = formData.nom_prenom && formData.matricule && formData.fonction &&
      formData.numero_om && formData.lieu_destination && formData.motif_mission &&
      formData.categorie_mission && formData.date_heure_depart &&
      formData.date_heure_arrivee && formData.regularisation && formData.moyen_transport;

    if (formData.a_refacturer && !formData.client_refacturation) return false;

    if (formData.moyen_transport === 'Véhicule') return base && formData.immatriculation;
    if (formData.moyen_transport === 'Autres') return base && formData.type_transport_autre;
    return base;
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
      {editingMission && editingMission.validation_history && editingMission.validation_history.length > 0 && (
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
            <CardTitle className="text-lg font-semibold text-slate-800">
              Historique des validations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {editingMission.validation_history.map((validation, index) => (
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
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {editingMission ? 'Modifier la Demande d\'Ordre de Mission' : 'Nouvelle Demande d\'Ordre de Mission'}
          </CardTitle>
          {editingMission && (
            <p className="text-sm text-blue-100 mt-2">
              Modifiez les informations demandées et renvoyez la demande en validation
            </p>
          )}
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Demandeur */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <Label className="text-slate-600 font-medium">Demandeur</Label>
            <p className="text-lg font-semibold text-slate-800 mt-1">{currentUser.user_name} ({currentUser.currentProfile})</p>
          </div>

          {/* Informations personnelles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Nom et Prénom *</Label>
              <Input
                value={formData.nom_prenom}
                onChange={(e) => handleInputChange('nom_prenom', e.target.value)}
                placeholder="Nom et prénom de la personne en mission"
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Matricule *</Label>
              <Input
                value={formData.matricule}
                onChange={(e) => handleInputChange('matricule', e.target.value)}
                placeholder="Matricule"
                className="border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Fonction *</Label>
              <Select value={formData.fonction} onValueChange={(v) => handleInputChange('fonction', v)}>
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Sélectionnez la fonction" />
                </SelectTrigger>
                <SelectContent>
                  {['Directeur', 'Responsable', 'Agent spécialisé', 'Agent'].map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">N° OM *</Label>
              <Input
                value={formData.numero_om}
                onChange={(e) => handleInputChange('numero_om', e.target.value)}
                placeholder="Numéro de l'ordre de mission"
                className="border-slate-200"
              />
            </div>
          </div>

          {/* Détails mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Lieu de destination *</Label>
              <Input
                value={formData.lieu_destination}
                onChange={(e) => handleInputChange('lieu_destination', e.target.value)}
                placeholder="Lieu de destination"
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Catégorie de la mission *</Label>
              <Select value={formData.categorie_mission} onValueChange={(v) => handleInputChange('categorie_mission', v)}>
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Sélectionnez la catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {['Interne', 'Evenement(foire, salon)', 'Tiers à charge'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Motif de la mission *</Label>
            <Textarea
              value={formData.motif_mission}
              onChange={(e) => handleInputChange('motif_mission', e.target.value)}
              placeholder="Décrivez le motif de la mission"
              className="border-slate-200 min-h-[80px]"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Date et heure de départ *</Label>
              <Input
                type="datetime-local"
                value={formData.date_heure_depart}
                onChange={(e) => handleInputChange('date_heure_depart', e.target.value)}
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Date et heure d'arrivée *</Label>
              <Input
                type="datetime-local"
                value={formData.date_heure_arrivee}
                onChange={(e) => handleInputChange('date_heure_arrivee', e.target.value)}
                className="border-slate-200"
              />
            </div>
          </div>

          {/* Moyen de transport */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Moyen de transport *</Label>
              <Select value={formData.moyen_transport} onValueChange={(v) => handleInputChange('moyen_transport', v)}>
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Sélectionnez le moyen de transport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Véhicule">Véhicule</SelectItem>
                  <SelectItem value="Autres">Autres</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.moyen_transport === 'Véhicule' && (
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">N° d'immatriculation *</Label>
                <Input
                  value={formData.immatriculation}
                  onChange={(e) => handleInputChange('immatriculation', e.target.value)}
                  placeholder="Ex: 1234 ABC"
                  className="border-slate-200"
                />
              </div>
            )}

            {formData.moyen_transport === 'Autres' && (
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Type de transport *</Label>
                <Input
                  value={formData.type_transport_autre}
                  onChange={(e) => handleInputChange('type_transport_autre', e.target.value)}
                  placeholder="Précisez le type de transport"
                  className="border-slate-200"
                />
              </div>
            )}
          </div>

          {formData.moyen_transport === 'Véhicule' && formData.immatriculation && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <Checkbox
                id="avec-couchette"
                checked={formData.avec_couchette}
                onCheckedChange={(checked) => handleInputChange('avec_couchette', checked)}
              />
              <Label htmlFor="avec-couchette" className="text-slate-700 font-medium cursor-pointer">
                Avec couchette
              </Label>
              {formData.avec_couchette && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  RG3 : pas d'indemnité d'hébergement
                </span>
              )}
            </div>
          )}

          {/* Indemnités */}
          {formData.fonction && formData.categorie_mission && formData.date_heure_depart && formData.date_heure_arrivee && (
            <IndemnityCalculator
              fonction={formData.fonction}
              categorie={formData.categorie_mission}
              dateDepart={formData.date_heure_depart}
              dateArrivee={formData.date_heure_arrivee}
              matricule={formData.matricule}
              avecCouchette={formData.avec_couchette}
            />
          )}

          {/* Champs additionnels */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Condition particulière de la mission</Label>
            <Textarea
              value={formData.condition_particuliere}
              onChange={(e) => handleInputChange('condition_particuliere', e.target.value)}
              placeholder="Conditions particulières (optionnel)"
              className="border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Observation</Label>
            <Textarea
              value={formData.observation}
              onChange={(e) => handleInputChange('observation', e.target.value)}
              placeholder="Observations (optionnel)"
              className="border-slate-200"
            />
          </div>

          {/* Pièces justificatives */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Pièces justificatives</Label>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-slate-400" />
                )}
                <span className="mt-2 text-sm text-slate-500">Cliquez pour télécharger des fichiers</span>
              </label>
            </div>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {files.map((url, index) => (
                  <div key={index} className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full text-sm">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="max-w-[150px] truncate">Fichier {index + 1}</span>
                    <button onClick={() => removeFile(index)}>
                      <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Régularisation */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Régularisation *</Label>
            <Select value={formData.regularisation} onValueChange={(v) => handleInputChange('regularisation', v)}>
              <SelectTrigger className="border-slate-200 w-32">
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OUI">OUI</SelectItem>
                <SelectItem value="NON">NON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Refacturation */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <Checkbox
                id="a-refacturer"
                checked={formData.a_refacturer}
                onCheckedChange={(checked) => handleInputChange('a_refacturer', checked)}
              />
              <Label htmlFor="a-refacturer" className="text-slate-700 font-medium cursor-pointer">
                A Refacturer
              </Label>
            </div>
            {formData.a_refacturer && (
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Client à refacturer *</Label>
                <Input
                  value={formData.client_refacturation}
                  onChange={(e) => handleInputChange('client_refacturation', e.target.value)}
                  placeholder="Nom du client à refacturer"
                  className="border-slate-200"
                />
              </div>
            )}
          </div>

          {/* Bouton soumettre */}
          <div className="pt-4">
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={!isFormValid()}
              className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium h-12 px-8 shadow-lg shadow-indigo-500/30"
            >
              <Send className="w-4 h-4 mr-2" />
              {editingMission ? 'Mettre à jour et renvoyer' : 'Envoyer la demande'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmation */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMission ? 'Confirmer la mise à jour' : 'Confirmer l\'envoi'}</DialogTitle>
            <DialogDescription>
              {editingMission 
                ? 'Êtes-vous sûr de vouloir mettre à jour cette demande ? Elle sera renvoyée au début du circuit de validation.'
                : 'Êtes-vous sûr de vouloir envoyer cette demande d\'ordre de mission ? Une fois envoyée, elle sera transmise pour validation.'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi en cours...
                </span>
              ) : (
                'Confirmer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}