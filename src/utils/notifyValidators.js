import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Sends notification emails to validators.
 * SendEmail only works for users who have ACCEPTED their Base44 invitation.
 * - Registered users: SendEmail is used to send the mission notification.
 * - Unregistered users: inviteUser sends a Base44 invitation email.
 *   They will receive mission notifications only AFTER they register.
 *
 * @param {string[]} emails - validator email addresses
 * @param {string} subject - email subject
 * @param {string} body - email body
 * @returns {Promise<{sent: number, failed: number, failedEmails: string[], newlyInvited: string[]}>}
 */
export async function sendValidatorNotifications(emails, subject, body) {
  if (!emails || emails.length === 0) {
    return { sent: 0, failed: 0, failedEmails: [], newlyInvited: [] };
  }

  // Fetch registered Base44 users (only those who accepted their invitation)
  const registeredUsers = await base44.entities.User.list();
  const registeredEmails = new Set(
    registeredUsers.map(u => u.email?.toLowerCase()).filter(Boolean)
  );

  // Split emails into registered and unregistered
  const registeredToNotify = emails.filter(e => registeredEmails.has(e.toLowerCase()));
  const toInvite = emails.filter(e => !registeredEmails.has(e.toLowerCase()));

  // Invite unregistered validators — inviteUser sends the Base44 invitation email
  await Promise.allSettled(
    toInvite.map(email => base44.users.inviteUser(email, 'user'))
  );

  // Send notification emails only to already-registered users
  const results = await Promise.allSettled(
    registeredToNotify.map(email =>
      base44.integrations.Core.SendEmail({ to: email, subject, body })
    )
  );

  const failedEmails = [];
  let sent = 0;
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      sent++;
    } else {
      failedEmails.push(registeredToNotify[i]);
    }
  });

  return {
    sent,
    failed: failedEmails.length,
    failedEmails,
    newlyInvited: toInvite,
    totalEmails: emails.length
  };
}

/**
 * Displays a toast message summarising the notification result.
 * - If some validators were emailed and some were invited, shows an info toast.
 * - If nobody was emailed (all needed inviting), shows a warning.
 * - If SendEmail failed for some registered users, shows an error.
 */
export function showNotificationToast(result) {
  const { sent, failed, failedEmails, newlyInvited, totalEmails } = result;

  if (totalEmails === 0) return;

  const invitedCount = newlyInvited.length;

  if (sent > 0 && invitedCount > 0) {
    toast.success(
      `${sent} email(s) de notification envoyé(s). ${invitedCount} invitation(s) Base44 envoyée(s) — ces utilisateurs recevront les notifications après avoir accepté leur invitation.`
    );
  } else if (sent > 0 && invitedCount === 0) {
    toast.success(`${sent} email(s) de notification envoyé(s) avec succès.`);
  } else if (sent === 0 && invitedCount > 0) {
    toast.warning(
      `${invitedCount} invitation(s) Base44 envoyée(s) à : ${newlyInvited.join(', ')}. Ces utilisateurs doivent accepter leur invitation pour recevoir les notifications par email.`
    );
  } else if (sent === 0 && invitedCount === 0 && failed > 0) {
    toast.error(
      `Échec d'envoi pour : ${failedEmails.join(', ')}. Vérifiez que ces utilisateurs sont bien inscrits.`
    );
  }
}