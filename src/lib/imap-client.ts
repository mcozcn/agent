import { ImapFlow } from "imapflow";
import type { OutlookEmail } from "./microsoft-graph";

interface ImapConfig {
  host: string;
  port: number;
  user: string;
  password: string;
}

// imapflow mesajını OutlookEmail formatına normalize eder
// böylece mevcut parseEmailToTicket() değişiklik gerektirmez
function normalizeToOutlookEmail(uid: number, envelope: Record<string, unknown>, bodyText: string): OutlookEmail {
  const from = envelope.from as Array<{ name?: string; address?: string }> | undefined;
  const fromAddr = from?.[0];

  return {
    id: `imap-${uid}`,
    subject: (envelope.subject as string) || "",
    bodyPreview: bodyText.slice(0, 255),
    body: { content: bodyText, contentType: "text" },
    from: {
      emailAddress: {
        name: fromAddr?.name || fromAddr?.address || "",
        address: fromAddr?.address || "",
      },
    },
    receivedDateTime: (envelope.date as Date)?.toISOString() || new Date().toISOString(),
    isRead: false,
  };
}

export async function fetchUnreadImapEmails(config: ImapConfig): Promise<OutlookEmail[]> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: true,
    auth: { user: config.user, pass: config.password },
    logger: false,
  });

  await client.connect();
  const emails: OutlookEmail[] = [];

  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      for await (const msg of client.fetch("1:*", {
        envelope: true,
        bodyStructure: true,
        source: true,
      })) {
        if (msg.flags?.has("\\Seen")) continue;

        const source = msg.source?.toString() ?? "";
        // Ham kaynaktan düz metni çıkar (headers'ı atla)
        const bodyText = source.split(/\r?\n\r?\n/).slice(1).join("\n").trim();

        emails.push(normalizeToOutlookEmail(
          msg.uid,
          msg.envelope as unknown as Record<string, unknown>,
          bodyText || source,
        ));
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  return emails;
}

export async function markImapEmailAsRead(config: ImapConfig, messageId: string): Promise<void> {
  // messageId formatı: "imap-{uid}"
  const uid = parseInt(messageId.replace("imap-", ""), 10);
  if (isNaN(uid)) return;

  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: true,
    auth: { user: config.user, pass: config.password },
    logger: false,
  });

  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      await client.messageFlagsAdd({ uid }, ["\\Seen"], { uid: true });
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}
