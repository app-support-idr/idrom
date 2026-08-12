// Règles de validation des mots de passe
// Le mot de passe doit avoir au moins: 8 caractères, un majuscule, un minuscule, un caractère spécial

export function validatePassword(password) {
  if (!password || password.length < 8) {
    return "Le mot de passe doit contenir au moins 8 caractères";
  }
  if (!/[A-Z]/.test(password)) {
    return "Le mot de passe doit contenir au moins une lettre majuscule";
  }
  if (!/[a-z]/.test(password)) {
    return "Le mot de passe doit contenir au moins une lettre minuscule";
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/~`';]/.test(password)) {
    return "Le mot de passe doit contenir au moins un caractère spécial";
  }
  return null;
}

export const PASSWORD_RULES_TEXT = "Au moins 8 caractères, une majuscule, une minuscule et un caractère spécial";