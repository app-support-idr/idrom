import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, KeyRound, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validatePassword, PASSWORD_RULES_TEXT } from '@/utils/passwordValidation';

export default function ResetPassword() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    const e = params.get('email');
    setToken(t || '');
    setEmail(e || '');

    (async () => {
      if (!t || !e) {
        setVerifying(false);
        setValidToken(false);
        return;
      }
      try {
        const users = await base44.entities.UserProfile.filter({ user_email: e });
        if (users.length === 0) {
          setVerifying(false);
          setValidToken(false);
          return;
        }
        const user = users[0];
        if (user.reset_token !== t) {
          setVerifying(false);
          setValidToken(false);
          return;
        }
        if (user.reset_token_expiry && new Date(user.reset_token_expiry) < new Date()) {
          setVerifying(false);
          setValidToken(false);
          return;
        }
        setValidToken(true);
        setVerifying(false);
      } catch {
        setVerifying(false);
        setValidToken(false);
      }
    })();
  }, []);

  const handleReset = async () => {
    setError('');

    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      setError(pwdError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const users = await base44.entities.UserProfile.filter({ user_email: email });
      if (users.length === 0) {
        setError('Erreur : compte introuvable');
        setLoading(false);
        return;
      }
      const user = users[0];
      if (user.reset_token !== token) {
        setError('Le lien de réinitialisation est invalide');
        setLoading(false);
        return;
      }
      await base44.entities.UserProfile.update(user.id, {
        password: newPassword,
        reset_token: '',
        reset_token_expiry: ''
      });
      setSuccess(true);
    } catch {
      setError('Une erreur est survenue lors de la réinitialisation');
    }
    setLoading(false);
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-600">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Réinitialisation du mot de passe</CardTitle>
          <CardDescription className="text-slate-500">
            Définissez votre nouveau mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!validToken && !success && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                Ce lien de réinitialisation est invalide ou a expiré. Veuillez refaire une demande de réinitialisation.
              </AlertDescription>
            </Alert>
          )}

          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <p className="text-slate-700">
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
              </p>
              <Link to="/">
                <Button className="w-full h-12 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium shadow-lg shadow-indigo-500/30">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          ) : validToken ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-slate-700 font-medium">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleReset()}
                  className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <p className="text-xs text-slate-500">{PASSWORD_RULES_TEXT}</p>

              <Button
                onClick={handleReset}
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium shadow-lg shadow-indigo-500/30"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Réinitialisation...
                  </span>
                ) : (
                  'Réinitialiser mon mot de passe'
                )}
              </Button>
            </>
          ) : (
            <Link to="/">
              <Button variant="outline" className="w-full h-12">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la connexion
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}