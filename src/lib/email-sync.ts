import type { EmailConfig } from "@prisma/client";
import type { OutlookEmail } from "./microsoft-graph";
import { getGraphAccessToken, getUnreadEmails, markEmailAsRead } from "./microsoft-graph";
import { fetchUnreadImapEmails, markImapEmailAsRead } from "./imap-client";

export interface SyncResult {
  emails: OutlookEmail[];
  markAsRead: (messageId: string) => Promise<void>;
}

export async function fetchEmailsForSync(config: EmailConfig): Promise<SyncResult> {
  if (config.provider === "IMAP") {
    if (!config.imapHost || !config.imapPort || !config.imapUser || !config.imapPassword) {
      throw new Error("IMAP yapılandırması eksik: host, port, kullanıcı ve şifre gerekli.");
    }

    const imapConfig = {
      host: config.imapHost,
      port: config.imapPort,
      user: config.imapUser,
      password: config.imapPassword,
    };

    const emails = await fetchUnreadImapEmails(imapConfig);
    return {
      emails,
      markAsRead: (messageId) => markImapEmailAsRead(imapConfig, messageId),
    };
  }

  // Microsoft Graph
  if (!config.tenantId || !config.clientId || !config.clientSecret || !config.mailbox) {
    throw new Error("Microsoft Graph yapılandırması eksik: tenantId, clientId, clientSecret ve mailbox gerekli.");
  }

  process.env.AZURE_AD_TENANT_ID = config.tenantId;
  process.env.AZURE_AD_CLIENT_ID = config.clientId;
  process.env.AZURE_AD_CLIENT_SECRET = config.clientSecret;
  process.env.OUTLOOK_USER_EMAIL = config.mailbox;

  const accessToken = await getGraphAccessToken();
  const emails = await getUnreadEmails(accessToken);
  return {
    emails,
    markAsRead: (messageId) => markEmailAsRead(accessToken, messageId),
  };
}
