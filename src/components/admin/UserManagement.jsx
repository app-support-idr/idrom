import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Users, Loader2, Search, Mail } from 'lucide-react';
import { toast } from 'sonner';

const ALL_PROFILES = ['RO', 'Directeur', 'Directeur des opérations', 'DGA', 'RH', 'Admin'];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ user_name: '', user_email: '', profiles: [] });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [invitingId, setInvitingId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await base44.entities.UserProfile.list('-created_date');
    setUsers(data);
    setLoading(false);
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        user_name: user.user_name,
        user_email: user.user_email,
        profiles: user.profiles || []
      });
    } else {
      setEditingUser(null);
      setFormData({ user_name: '', user_email: '', profiles: [] });
    }
    setShowDialog(true);
  };

  const handleProfileToggle = (profile) => {
    setFormData(prev => ({
      ...prev,
      profiles: prev.profiles.includes(profile)
        ? prev.profiles.filter(p => p !== profile)
        : [...prev.profiles, profile]
    }));
  };

  const handleSave = async () => {
    if (!formData.user_name || !formData.user_email || formData.profiles.length === 0) {
      toast.error('Veuillez remplir tous les champs et sélectionner au moins un profil');
      return;
    }

    try {
      setSaving(true);

      if (editingUser) {
        await base44.entities.UserProfile.update(editingUser.id, formData);
        toast.success('Utilisateur modifié avec succès');
      } else {
        await base44.entities.UserProfile.create(formData);
        // Inviter l'utilisateur dans le système d'auth Base44 pour permettre l'envoi d'emails
        try {
          await base44.users.inviteUser(formData.user_email, 'user');
        } catch (inviteErr) {
          console.warn('Invitation Base44 non envoyée:', inviteErr);
        }
        toast.success('Utilisateur créé avec succès');
      }

      loadUsers();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
      console.error(error);
    } finally {
      setSaving(false);
      setShowDialog(false);
    }
  };

  const handleDelete = async () => {
    if (userToDelete) {
      await base44.entities.UserProfile.delete(userToDelete.id);
      toast.success('Utilisateur supprimé avec succès');
      setShowDeleteDialog(false);
      setUserToDelete(null);
      loadUsers();
    }
  };

  const handleInvite = async (user) => {
    setInvitingId(user.id);
    try {
      await base44.users.inviteUser(user.user_email, 'user');
      toast.success(`Invitation envoyée à ${user.user_email}`);
    } catch (e) {
      console.error('Erreur invitation:', e);
      toast.error(`Impossible d'inviter ${user.user_email} : ${e.message || 'erreur inconnue'}`);
    } finally {
      setInvitingId(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Gestion des Utilisateurs
            </CardTitle>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-white text-indigo-600 hover:bg-indigo-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvel utilisateur
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Recherche */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-200"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">Nom</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Profils</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{user.user_name}</TableCell>
                      <TableCell className="text-slate-600">{user.user_email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.profiles?.map((profile) => (
                            <Badge key={profile} variant="secondary" className="bg-indigo-100 text-indigo-700">
                              {profile}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleInvite(user)}
                            disabled={invitingId === user.id}
                            title="Inviter dans le système (activer les emails)"
                            className="text-slate-500 hover:text-blue-600"
                          >
                            {invitingId === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(user)}
                            className="text-slate-500 hover:text-indigo-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setUserToDelete(user);
                              setShowDeleteDialog(true);
                            }}
                            className="text-slate-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Création/Modification */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom complet *</Label>
              <Input
                value={formData.user_name}
                onChange={(e) => setFormData(prev => ({ ...prev, user_name: e.target.value }))}
                placeholder="Nom et prénom"
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.user_email}
                onChange={(e) => setFormData(prev => ({ ...prev, user_email: e.target.value }))}
                placeholder="email@exemple.com"
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Profils *</Label>
              <div className="grid grid-cols-2 gap-2 p-4 bg-slate-50 rounded-lg">
                {ALL_PROFILES.map((profile) => (
                  <div key={profile} className="flex items-center space-x-2">
                    <Checkbox
                      id={profile}
                      checked={formData.profiles.includes(profile)}
                      onCheckedChange={() => handleProfileToggle(profile)}
                    />
                    <label
                      htmlFor={profile}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {profile}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </span>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userToDelete?.user_name}</strong> ?
            Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}