import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, LogIn, Briefcase, KeyRound, ArrowLeft, Mail } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validatePassword } from '@/utils/passwordValidation';
import { toast } from 'sonner';

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [availableProfiles, setAvailableProfiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // 1 = email + mot de passe, 2 = sélection profil, 3 = mot de passe oublié, 4 = email envoyé
  const [step, setStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleLoginSubmit = async () => {
    setLoading(true);
    setError('');

    if (!email) {
      setError('Veuillez saisir votre email');
      setLoading(false);
      return;
    }
    if (!password) {
      setError('Veuillez saisir votre mot de passe');
      setLoading(false);
      return;
    }

    const allUsers = await base44.entities.UserProfile.list();
    const user = allUsers.find(u => u.user_email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      setError('Aucun utilisateur trouvé avec cet email');
      setLoading(false);
      return;
    }

    if (!user.password) {
      setError('Aucun mot de passe n\'est défini pour ce compte. Veuillez réinitialiser votre mot de passe.');
      setLoading(false);
      return;
    }
    if (user.password !== password) {
      setError('Mot de passe incorrect');
      setLoading(false);
      return;
    }

    // Si l'utilisateur n'a qu'un seul profil, on le sélectionne automatiquement
    if (user.profiles.length === 1) {
      onLogin({
        user_email: email,
        user_name: user.user_name,
        profiles: user.profiles,
        currentProfile: user.profiles[0]
      });
      setLoading(false);
      return;
    }

    setAvailableProfiles(user.profiles);
    setStep(2);
    setLoading(false);
  };

  const handleProfileSubmit = async () => {
    if (!selectedProfile) {
      setError('Veuillez sélectionner un profil');
      return;
    }

    const allUsers = await base44.entities.UserProfile.list();
    const user = allUsers.find(u => u.user_email?.toLowerCase() === email.toLowerCase());

    onLogin({
      user_email: email,
      user_name: user.user_name,
      profiles: availableProfiles,
      currentProfile: selectedProfile
    });
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setError('');
    const targetEmail = resetEmail || email;

    if (!targetEmail) {
      setError('Veuillez saisir votre email');
      setLoading(false);
      return;
    }

    try {
      const allUsers = await base44.entities.UserProfile.list();
      const user = allUsers.find(u => u.user_email?.toLowerCase() === targetEmail.toLowerCase());

      if (user) {
        // Générer un token de réinitialisation
        const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
        const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 heure

        await base44.entities.UserProfile.update(user.id, {
          reset_token: token,
          reset_token_expiry: expiry
        });

        const link = `${window.location.origin}/ResetPassword?token=${token}&email=${encodeURIComponent(targetEmail)}`;
        setResetLink(link);

        // Tenter l'envoi par email
        let sent = false;
        try {
          await base44.integrations.Core.SendEmail({
            to: targetEmail,
            subject: 'Réinitialisation de votre mot de passe',
            body: `Bonjour ${user.user_name},\n\nVous avez demandé la réinitialisation de votre mot de passe pour accéder à la plateforme de gestion des ordres de mission.\n\nCliquez sur le lien suivant pour réinitialiser votre mot de passe :\n${link}\n\nCe lien expirera dans 1 heure.\n\nSi vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.\n\nCordialement,\nL'équipe de gestion des ordres de mission`
          });
          sent = true;
        } catch (emailErr) {
          console.error('Envoi email échoué:', emailErr);
        }
        setEmailSent(sent);
      } else {
        setEmailSent(false);
        setResetLink('');
      }

      // Toujours afficher la confirmation (ne pas révéler si l'email existe)
      setStep(4);
    } catch (e) {
      console.error('Erreur lors de la réinitialisation:', e);
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Gestion des Ordres de Mission</CardTitle>
          <CardDescription className="text-slate-500">
            {step === 1 && 'Connectez-vous pour continuer'}
            {step === 2 && 'Sélectionnez votre profil'}
            {step === 3 && 'Réinitialisation du mot de passe'}
            {step === 4 && 'Vérifiez votre boîte mail'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre.email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLoginSubmit()}
                  className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLoginSubmit()}
                  className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setStep(3); setError(''); setResetEmail(email); }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <Button
                onClick={handleLoginSubmit}
                disabled={loading || !email || !password}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium shadow-lg shadow-indigo-500/30 transition-all duration-300"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connexion...
                  </span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Se connecter
                  </>
                )}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="profile" className="text-slate-700 font-medium">Profil</Label>
                <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                  <SelectTrigger className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500">
                    <SelectValue placeholder="Sélectionnez votre profil" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProfiles.map((profile) => (
                      <SelectItem key={profile} value={profile}>
                        {profile}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => { setStep(1); setSelectedProfile(''); setError(''); setPassword(''); }}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                <Button
                  onClick={handleProfileSubmit}
                  disabled={!selectedProfile}
                  className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium shadow-lg shadow-indigo-500/30"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Se connecter
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex items-center gap-2 text-slate-600">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <p className="text-sm">
                  Saisissez votre email. Vous recevrez un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resetEmail" className="text-slate-700 font-medium">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="votre.email@exemple.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleForgotPassword()}
                  className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => { setStep(1); setError(''); }}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                <Button
                  onClick={handleForgotPassword}
                  disabled={loading || !resetEmail}
                  className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium shadow-lg shadow-indigo-500/30"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi...
                    </span>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Envoyer le lien
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {step === 4 && (
            <div className="text-center space-y-4">
              <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${emailSent ? 'bg-green-100' : 'bg-amber-100'}`}>
                <Mail className={`w-7 h-7 ${emailSent ? 'text-green-600' : 'text-amber-600'}`} />
              </div>
              {emailSent ? (
                <>
                  <p className="text-slate-700">
                    Si un compte existe avec l'adresse <span className="font-semibold">{resetEmail || email}</span>,
                    un email contenant le lien de réinitialisation vient de vous être envoyé.
                  </p>
                  <p className="text-sm text-slate-500">
                    Pensez à vérifier vos spams. Le lien expirera dans 1 heure.
                  </p>
                </>
              ) : resetLink ? (
                <>
                  <p className="text-slate-700">
                    Un lien de réinitialisation a été généré pour <span className="font-semibold">{resetEmail || email}</span>.
                  </p>
                  <p className="text-sm text-amber-600 font-medium">
                    L'envoi par email n'est pas disponible. Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe.
                  </p>
                  <a href={resetLink} className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-md bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium shadow-lg shadow-indigo-500/30 transition-all duration-300">
                    <KeyRound className="w-4 h-4" />
                    Réinitialiser mon mot de passe
                  </a>
                  <p className="text-xs text-slate-400">
                    Ce lien expirera dans 1 heure.
                  </p>
                </>
              ) : (
                <p className="text-slate-700">
                  Si un compte existe avec l'adresse <span className="font-semibold">{resetEmail || email}</span>,
                  un email contenant le lien de réinitialisation vient de vous être envoyé.
                </p>
              )}
              <Button
                onClick={() => { setStep(1); setError(''); setResetEmail(''); setResetLink(''); setEmailSent(false); }}
                variant="outline"
                className="w-full h-12"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la connexion
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}