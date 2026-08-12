import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Edit, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { sendValidatorNotifications, showNotificationToast } from '@/utils/notifyValidators';

const WORKFLOW_ORDER = ['RO', 'Directeur', 'Directeur des opérations', 'DGA', 'RH'];

export default function ValidationActions({ mission, currentUser, onActionComplete }) {
  const [comment, setComment] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [processing, setProcessing] = useState(false);

  const isRH = currentUser.currentProfile === 'RH';

  const getNextValidator = (currentLevel) => {
    const currentIndex = WORKFLOW_ORDER.indexOf(currentLevel);
    if (currentIndex >= WORKFLOW_ORDER.length - 1) return null;
    return WORKFLOW_ORDER[currentIndex + 1];
  };

  const getPreviousValidator = (currentLevel) => {
    const currentIndex = WORKFLOW_ORDER.indexOf(currentLevel);
    if (currentIndex <= 0) return null;
    return WORKFLOW_ORDER[currentIndex - 1];
  };



  const handleAction = async () => {
    if (isRH && (actionType === 'reject' || actionType === 'modification')) {
      toast.error("Cette action n'est pas autorisée pour le profil RH.");
      setShowDialog(false);
      setComment('');
      return;
    }
    try {
      setProcessing(true);

      const validationEntry = {
        validator_name: currentUser.user_name,
        validator_profile: currentUser.currentProfile,
        decision: actionType === 'validate' ? 'Validé' : actionType === 'reject' ? 'Rejeté' : 'Demande de modification',
        comment: comment,
        date: new Date().toISOString()
      };

      const updatedHistory = [...(mission.validation_history || []), validationEntry];
      let updates = { validation_history: updatedHistory };

      if (actionType === 'validate') {
        const nextValidator = getNextValidator(mission.current_validator_level);
        if (nextValidator) {
          updates.current_validator_level = nextValidator;
          updates.status = 'En cours de validation';
          await base44.entities.MissionOrder.update(mission.id, updates);
          try {
            const allUsers = await base44.entities.UserProfile.list();
            const nextValidators = allUsers.filter(u => u.profiles.includes(nextValidator));
            const emails = nextValidators.map(v => v.user_email);
            const subject = `Nouvelle demande à valider - OM N°${mission.numero_om}`;
            const body = `Bonjour,\n\nUne nouvelle demande d'ordre de mission nécessite votre validation.\n\nNuméro OM : ${mission.numero_om}\n\nPersonne en mission : ${mission.nom_prenom}\n\nDestination : ${mission.lieu_destination}\n\nDate de départ : ${new Date(mission.date_heure_depart).toLocaleString('fr-FR')}\n\nDate d'arrivée : ${new Date(mission.date_heure_arrivee).toLocaleString('fr-FR')}\n\nVeuillez vous connecter à l'application pour valider ou rejeter cette demande :\nhttps://idrom.base44.app/\n\nCordialement,\nSystème de gestion des ordres de mission`;
            const result = await sendValidatorNotifications(emails, subject, body);
            showNotificationToast(result);
          } catch (e) {
            console.error('Email non envoyé:', e);
            toast.warning('La notification par email n\'a pas pu être envoyée.');
          }
        } else {
          updates.status = 'Validée';
          updates.current_validator_level = null;
          await base44.entities.MissionOrder.update(mission.id, updates);
          try {
            await base44.integrations.Core.SendEmail({
              to: mission.demandeur_email,
              subject: `Demande validée - OM N°${mission.numero_om}`,
              body: `Bonjour ${mission.demandeur_name},\n\nVotre demande d'ordre de mission a été entièrement validée.\n\nNuméro OM : ${mission.numero_om}\n\nPersonne en mission : ${mission.nom_prenom}\n\nDestination : ${mission.lieu_destination}\n\nDate de départ : ${new Date(mission.date_heure_depart).toLocaleString('fr-FR')}\n\nDate d'arrivée : ${new Date(mission.date_heure_arrivee).toLocaleString('fr-FR')}\n\nL'ordre de mission est maintenant disponible pour impression :\nhttps://idrom.base44.app/\n\nCordialement,\nSystème de gestion des ordres de mission`
            });
          } catch (e) {
            console.error('Email non envoyé:', e);
            toast.warning('La notification par email n\'a pas pu être envoyée.');
          }
        }
      } else if (actionType === 'reject') {
        updates.status = 'Rejetée';
        updates.current_validator_level = null;
        await base44.entities.MissionOrder.update(mission.id, updates);
        try {
          await base44.integrations.Core.SendEmail({
            to: mission.demandeur_email,
            subject: `Demande rejetée - OM N°${mission.numero_om}`,
            body: `Bonjour ${mission.demandeur_name},\n\nVotre demande d'ordre de mission a été rejetée par ${currentUser.user_name} (${currentUser.currentProfile}).\n\nNuméro OM : ${mission.numero_om}\n\nPersonne en mission : ${mission.nom_prenom}\n\nDestination : ${mission.lieu_destination}\n\nDate de départ : ${new Date(mission.date_heure_depart).toLocaleString('fr-FR')}\n\nDate d'arrivée : ${new Date(mission.date_heure_arrivee).toLocaleString('fr-FR')}${comment ? `\n\nMotif du rejet :\n${comment}` : ''}\n\nConnectez-vous à l'application :\nhttps://idrom.base44.app/\n\nCordialement,\nSystème de gestion des ordres de mission`
          });
        } catch (e) {
          console.error('Email non envoyé:', e);
          toast.warning('La notification par email n\'a pas pu être envoyée.');
        }
      } else if (actionType === 'modification') {
        const previousValidator = getPreviousValidator(mission.current_validator_level);
        updates.status = 'Demande de modification';
        updates.current_validator_level = previousValidator;
        await base44.entities.MissionOrder.update(mission.id, updates);
        try {
          if (previousValidator) {
            const allUsers = await base44.entities.UserProfile.list();
            const previousValidators = allUsers.filter(u => u.profiles.includes(previousValidator));
            const emails = previousValidators.map(v => v.user_email);
            const subject = `Modification demandée - OM N°${mission.numero_om}`;
            const body = `Bonjour,\n\nUne modification a été demandée sur l'ordre de mission N°${mission.numero_om} par ${currentUser.user_name} (${currentUser.currentProfile}).\n\nNuméro OM : ${mission.numero_om}\n\nDemandeur : ${mission.demandeur_name}\n\nPersonne en mission : ${mission.nom_prenom}\n\nDestination : ${mission.lieu_destination}\n\nDate de départ : ${new Date(mission.date_heure_depart).toLocaleString('fr-FR')}\n\nDate d'arrivée : ${new Date(mission.date_heure_arrivee).toLocaleString('fr-FR')}${comment ? `\n\nCommentaire :\n${comment}` : ''}\n\nVeuillez vous connecter à l'application pour traiter cette demande :\nhttps://idrom.base44.app/\n\nCordialement,\nSystème de gestion des ordres de mission`;
            const result = await sendValidatorNotifications(emails, subject, body);
            showNotificationToast(result);
            } else {
            await base44.integrations.Core.SendEmail({
              to: mission.demandeur_email,
              subject: `Modification demandée - OM N°${mission.numero_om}`,
              body: `Bonjour ${mission.demandeur_name},\n\nUne modification a été demandée sur votre ordre de mission par ${currentUser.user_name} (${currentUser.currentProfile}).\n\nNuméro OM : ${mission.numero_om}\n\nPersonne en mission : ${mission.nom_prenom}\n\nDestination : ${mission.lieu_destination}\n\nDate de départ : ${new Date(mission.date_heure_depart).toLocaleString('fr-FR')}\n\nDate d'arrivée : ${new Date(mission.date_heure_arrivee).toLocaleString('fr-FR')}${comment ? `\n\nCommentaire :\n${comment}` : ''}\n\nVeuillez vous connecter à l'application pour modifier et renvoyer votre demande :\nhttps://idrom.base44.app/\n\nCordialement,\nSystème de gestion des ordres de mission`
            });
          }
        } catch (e) {
          console.error('Email non envoyé:', e);
          toast.warning('La notification par email n\'a pas pu être envoyée.');
        }
      }

      const actionMessages = {
        validate: 'Demande validée avec succès',
        reject: 'Demande rejetée avec succès',
        modification: 'Demande de modification envoyée avec succès'
      };
      toast.success(actionMessages[actionType]);
      onActionComplete?.();
    } catch (error) {
      toast.error('Erreur lors de l\'action');
      console.error(error);
    } finally {
      setProcessing(false);
      setShowDialog(false);
      setComment('');
    }
  };

  const isCommentRequired =
    actionType === 'reject' ||
    (actionType === 'modification' && mission.status === 'En cours de validation');

  const openDialog = (type) => {
    setActionType(type);
    setShowDialog(true);
  };

  const getDialogTitle = () => {
    switch (actionType) {
      case 'validate': return 'Confirmer la validation';
      case 'reject': return 'Confirmer le rejet';
      case 'modification': return 'Demander une modification';
      default: return '';
    }
  };

  const getDialogDescription = () => {
    switch (actionType) {
      case 'validate': return 'Êtes-vous sûr de vouloir valider cette demande ? Elle sera transmise au valideur suivant.';
      case 'reject': return 'Êtes-vous sûr de vouloir rejeter cette demande ? Elle sera retournée au demandeur.';
      case 'modification': return 'Êtes-vous sûr de vouloir demander une modification ? La demande sera retournée au valideur précédent ou au demandeur.';
      default: return '';
    }
  };

  return (
    <>
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
          <CardTitle className="text-lg font-semibold text-slate-800">
            Actions de validation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {mission.a_refacturer && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <RefreshCw className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-800 text-sm">À Refacturer</p>
                <p className="text-sm text-slate-600">Client : {mission.client_refacturation}</p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">
              Commentaire ({isCommentRequired ? 'obligatoire' : 'optionnel'})
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajoutez un commentaire..."
              className="border-slate-200 min-h-[100px]"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <Button
              onClick={() => openDialog('validate')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Valider
            </Button>
            <Button
              onClick={() => openDialog('modification')}
              variant="outline"
              disabled={isRH}
              className={`border-amber-500 text-amber-600 ${
                isRH
                  ? 'opacity-40 cursor-not-allowed hover:bg-transparent border-amber-300 text-amber-400'
                  : 'hover:bg-amber-50'
              }`}
            >
              <Edit className="w-4 h-4 mr-2" />
              Demande de modification
            </Button>
            <Button
              onClick={() => openDialog('reject')}
              variant="outline"
              disabled={isRH}
              className={`border-red-500 text-red-600 ${
                isRH
                  ? 'opacity-40 cursor-not-allowed hover:bg-transparent border-red-300 text-red-400'
                  : 'hover:bg-red-50'
              }`}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rejeter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>{getDialogDescription()}</DialogDescription>
          </DialogHeader>
          {isCommentRequired && !comment.trim() && (
            <p className="text-sm text-amber-600">
              Un commentaire est obligatoire pour cette action.
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleAction}
              disabled={processing || (isCommentRequired && !comment.trim())}
              className={
                actionType === 'validate' ? 'bg-green-600 hover:bg-green-700' :
                actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                'bg-amber-600 hover:bg-amber-700'
              }
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Traitement...
                </span>
              ) : (
                'Confirmer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}