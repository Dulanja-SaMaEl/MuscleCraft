import crypto from 'crypto';

/**
 * MuscleCraft Fitness Platform — Resend Email Service (Sending & Receiving)
 * Official REST API integration with https://api.resend.com
 *
 * Environment Variables (set in Vercel / .env.local — NEVER commit secrets):
 * - RESEND_API_KEY:        Resend secret API key (starts with re_...)
 * - RESEND_FROM_EMAIL:     Verified sender address (e.g. "MuscleCraft <admin@musclecraftlk.com>")
 * - RESEND_ADMIN_EMAIL:    Admin notification inbox (e.g. "admin@musclecraftlk.com")
 * - RESEND_REPLY_TO:       Reply-to address for inbound receiving (e.g. "admin@musclecraftlk.com")
 * - RESEND_WEBHOOK_SECRET: Optional Svix signing secret (whsec_...) for inbound webhook verification
 */

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  from?: string;
  tags?: { name: string; value: string }[];
}

export interface EmailSendResult {
  success: boolean;
  recipientCount: number;
  deliveredCount?: number;
  failedCount?: number;
  messageId?: string;
  status?: 'delivered' | 'simulated_unconfigured' | 'unconfigured' | 'failed';
  error?: string;
  rawResponse?: any;
}

export interface EmailGatewayStatus {
  isConfigured: boolean;
  provider: string;
  fromEmail: string;
  adminEmail: string;
  replyToEmail: string;
  webhookSecretConfigured: boolean;
  verifiedDomains: string[];
  status: 'online' | 'offline' | 'unconfigured';
  error?: string;
}

export interface InboundEmailRecord {
  id: string;
  resendEmailId: string;
  from: string;
  to: string[];
  subject: string;
  text: string;
  html?: string;
  receivedAt: string;
  replied?: boolean;
}

// In-memory ring buffer fallback for received emails alongside Supabase audit_logs persistence
const inboundFallbackStore: InboundEmailRecord[] = [];

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getAppBaseUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_APP_URL || '').trim();
  if (configured && !configured.includes('localhost') && !configured.includes('musclecraft.lk')) {
    return configured.replace(/\/+$/, '');
  }
  return 'https://www.musclecraftlk.com';
}

function renderBrandedHtml({
  eyebrow,
  heading,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  footerNote,
}: {
  eyebrow: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const baseUrl = getAppBaseUrl();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:#070709;color:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#070709;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#111116;border:1px solid #262630;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px;background:linear-gradient(135deg,#1a0a0c 0%,#111116 100%);border-bottom:1px solid #262630;">
              <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#ef4444;font-weight:700;margin-bottom:6px;">
                ${escapeHtml(eyebrow)}
              </div>
              <div style="font-size:22px;font-weight:800;letter-spacing:0.5px;color:#ffffff;">
                MUSCLE<span style="color:#dc2626;">CRAFT</span>
              </div>
              <div style="font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:#9ca3af;margin-top:2px;">
                Build Discipline. Sculpt Strength.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 14px 0;font-size:20px;line-height:1.3;color:#ffffff;font-weight:700;">
                ${escapeHtml(heading)}
              </h1>
              <div style="font-size:14px;line-height:1.65;color:#d1d5db;">
                ${bodyHtml}
              </div>
              ${
                ctaLabel && ctaUrl
                  ? `<div style="margin-top:24px;">
                      <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:12px 24px;background-color:#ba1a1a;color:#ffffff;text-decoration:none;border-radius:10px;font-size:13px;font-weight:700;letter-spacing:0.4px;">
                        ${escapeHtml(ctaLabel)} &rarr;
                      </a>
                    </div>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background-color:#0b0b0f;border-top:1px solid #1f1f29;font-size:11px;color:#6b7280;line-height:1.5;">
              ${footerNote ? `<div style="margin-bottom:6px;color:#9ca3af;">${escapeHtml(footerNote)}</div>` : ''}
              <div>MuscleCraft Athletic Facility · 245, Kotugoda Road, Seeduwa · Coach Adeesha Kumarasingha</div>
              <div style="margin-top:4px;">
                <a href="${baseUrl}" style="color:#ef4444;text-decoration:none;">${baseUrl}</a> · <a href="mailto:admin@musclecraftlk.com" style="color:#9ca3af;text-decoration:none;">admin@musclecraftlk.com</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export class EmailService {
  private static apiBase = 'https://api.resend.com';
  private static cachedVerifiedDomain: string | null = null;

  public static getApiKey(): string {
    const clean = (val?: string) => (val || '').trim().replace(/^["']|["']$/g, '');
    const explicit =
      clean(process.env.RESEND_API_KEY) ||
      clean(process.env.RESEND_TOKEN) ||
      clean(process.env.RESEND_API_TOKEN) ||
      clean(process.env.RESEND_SECRET_KEY) ||
      clean(process.env.NEXT_PUBLIC_RESEND_API_KEY);
    if (explicit) return explicit;

    // Auto-discover any Vercel/Resend integration env variable holding a `re_` key
    if (typeof process !== 'undefined' && process.env) {
      for (const [key, val] of Object.entries(process.env)) {
        if (!val) continue;
        const c = clean(val);
        if (key.toLowerCase().includes('resend') && c.startsWith('re_') && c.length > 12) {
          return c;
        }
      }
      for (const [, val] of Object.entries(process.env)) {
        if (!val) continue;
        const c = clean(val);
        if (c.startsWith('re_') && c.length >= 24 && !c.includes('your_resend')) {
          return c;
        }
      }
    }
    return '';
  }

  public static getFromEmail(): string {
    const clean = (val?: string) => (val || '').trim().replace(/^["']|["']$/g, '');
    const envFrom = clean(process.env.RESEND_FROM_EMAIL) || clean(process.env.EMAIL_FROM);
    if (envFrom && !envFrom.includes('musclecraft.lk')) {
      return envFrom;
    }
    if (this.cachedVerifiedDomain) {
      return `MuscleCraft <admin@${this.cachedVerifiedDomain}>`;
    }
    return 'MuscleCraft <admin@musclecraftlk.com>';
  }

  public static getAdminEmail(): string {
    const clean = (val?: string) => (val || '').trim().replace(/^["']|["']$/g, '');
    const envAdmin = clean(process.env.RESEND_ADMIN_EMAIL) || clean(process.env.ADMIN_NOTIFICATION_EMAIL);
    if (envAdmin && !envAdmin.includes('adeesha@musclecraft.lk')) {
      return envAdmin;
    }
    return 'admin@musclecraftlk.com';
  }

  public static getReplyToEmail(): string {
    const clean = (val?: string) => (val || '').trim().replace(/^["']|["']$/g, '');
    const envReply = clean(process.env.RESEND_REPLY_TO) || clean(process.env.RESEND_ADMIN_EMAIL);
    if (envReply && !envReply.includes('musclecraft.lk')) {
      return envReply;
    }
    return 'admin@musclecraftlk.com';
  }

  public static isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.startsWith('re_') && key.length > 10 && !key.includes('your_resend'));
  }

  public static addInboundFallback(record: InboundEmailRecord) {
    inboundFallbackStore.unshift(record);
    if (inboundFallbackStore.length > 50) {
      inboundFallbackStore.pop();
    }
  }

  public static getInboundFallback(): InboundEmailRecord[] {
    return inboundFallbackStore;
  }

  /**
   * Checks live Resend gateway configuration and verified sending domains.
   */
  public static async getGatewayStatus(): Promise<EmailGatewayStatus> {
    const apiKey = this.getApiKey();
    const fromEmail = this.getFromEmail();
    const adminEmail = this.getAdminEmail();
    const replyToEmail = this.getReplyToEmail();
    const webhookSecretConfigured = Boolean(process.env.RESEND_WEBHOOK_SECRET?.trim());

    if (!apiKey) {
      return {
        isConfigured: false,
        provider: 'Resend Email API',
        fromEmail,
        adminEmail,
        replyToEmail,
        webhookSecretConfigured,
        verifiedDomains: [],
        status: 'unconfigured',
        error: 'RESEND_API_KEY not found in server environment variables.',
      };
    }

    try {
      const res = await fetch(`${this.apiBase}/domains`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        // Sending-only scoped API keys may get 401/403 on /domains while still valid for /emails
        if (res.status === 401 || res.status === 403) {
          return {
            isConfigured: true,
            provider: 'Resend Email API',
            fromEmail,
            adminEmail,
            replyToEmail,
            webhookSecretConfigured,
            verifiedDomains: [],
            status: 'online',
          };
        }
        return {
          isConfigured: true,
          provider: 'Resend Email API',
          fromEmail,
          adminEmail,
          replyToEmail,
          webhookSecretConfigured,
          verifiedDomains: [],
          status: 'offline',
          error: `Resend API returned HTTP ${res.status}`,
        };
      }

      const json = await res.json().catch(() => null);
      const domains = Array.isArray(json?.data)
        ? json.data
            .filter((d: any) => d.status === 'verified')
            .map((d: any) => String(d.name))
        : [];

      return {
        isConfigured: true,
        provider: 'Resend Email API',
        fromEmail,
        adminEmail,
        replyToEmail,
        webhookSecretConfigured,
        verifiedDomains: domains,
        status: 'online',
      };
    } catch (err: any) {
      return {
        isConfigured: true,
        provider: 'Resend Email API',
        fromEmail,
        adminEmail,
        replyToEmail,
        webhookSecretConfigured,
        verifiedDomains: [],
        status: 'offline',
        error: err.message || 'Network error reaching Resend API',
      };
    }
  }

  /**
   * Sends single or multi-recipient email via Resend REST API.
   * For multi-recipient blasts, dispatches individually via Promise.allSettled so
   * recipients stay private (no CC exposure) and one bad email never blocks delivery.
   */
  public static async sendEmail({
    to,
    subject,
    html,
    text,
    replyTo,
    from,
    tags,
  }: SendEmailParams): Promise<EmailSendResult> {
    const rawList = Array.isArray(to) ? to : [to];
    const validEmails = Array.from(
      new Set(
        rawList
          .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
          .filter((e) => e.includes('@') && e.includes('.'))
      )
    );

    if (validEmails.length === 0) {
      return {
        success: false,
        recipientCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        status: 'failed',
        error: 'No valid recipient email addresses provided.',
      };
    }

    const apiKey = this.getApiKey();
    let resolvedFrom = from || this.getFromEmail();
    const resolvedReplyTo = replyTo || this.getReplyToEmail();

    if (!apiKey || apiKey.includes('your_resend')) {
      console.warn('[Resend Email] RESEND_API_KEY not configured for recipients:', validEmails);
      return {
        success: false,
        recipientCount: validEmails.length,
        deliveredCount: 0,
        failedCount: validEmails.length,
        status: 'unconfigured',
        error:
          'RESEND_API_KEY is not configured in server environment variables. Add RESEND_API_KEY in Vercel -> Project Settings -> Environment Variables (Production & Preview) and Redeploy.',
      };
    }

    const postToResend = async (recipient: string, senderAddress: string) => {
      const payload: Record<string, any> = {
        from: senderAddress,
        to: [recipient],
        subject: subject.trim(),
        html,
      };
      if (resolvedReplyTo && resolvedReplyTo.includes('@')) {
        payload.reply_to = resolvedReplyTo;
      }
      if (text) payload.text = text;
      if (tags && tags.length > 0) payload.tags = tags;

      const res = await fetch(`${this.apiBase}/emails`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

      const data = await res.json().catch(() => null);
      return { res, data };
    };

    const dispatchOne = async (recipient: string) => {
      let { res, data } = await postToResend(recipient, resolvedFrom);

      // Auto-recover if configured `from` domain doesn't match the user's verified Resend domain (e.g. subdomain or apex)
      const errMsgRaw = String(data?.message || data?.error || '');
      if (
        !res.ok &&
        (res.status === 403 || res.status === 422) &&
        errMsgRaw.toLowerCase().includes('domain')
      ) {
        try {
          const domRes = await fetch(`${this.apiBase}/domains`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              Accept: 'application/json',
            },
            cache: 'no-store',
          });
          if (domRes.ok) {
            const domJson = await domRes.json().catch(() => null);
            const verified = Array.isArray(domJson?.data)
              ? domJson.data.find((d: any) => d.status === 'verified')
              : null;
            if (verified?.name) {
              this.cachedVerifiedDomain = String(verified.name);
              const fallbackSender = `MuscleCraft <admin@${verified.name}>`;
              if (fallbackSender.toLowerCase() !== resolvedFrom.toLowerCase()) {
                resolvedFrom = fallbackSender;
                const retry = await postToResend(recipient, fallbackSender);
                res = retry.res;
                data = retry.data;
              }
            }
          }
        } catch (_) {}
      }

      if (!res.ok || data?.statusCode >= 400) {
        const finalErr = data?.message || data?.error || `HTTP ${res.status}: Resend email failed`;
        throw new Error(`${finalErr} (From: ${resolvedFrom})`);
      }
      return data;
    };

    if (validEmails.length === 1) {
      try {
        const resData = await dispatchOne(validEmails[0]);
        return {
          success: true,
          recipientCount: 1,
          deliveredCount: 1,
          failedCount: 0,
          status: 'delivered',
          messageId: resData?.id,
          rawResponse: resData,
        };
      } catch (err: any) {
        console.error('[Resend Email Single Error]:', err.message);
        return {
          success: false,
          recipientCount: 1,
          deliveredCount: 0,
          failedCount: 1,
          status: 'failed',
          error: err.message || 'Email delivery failed',
        };
      }
    }

    const settled = await Promise.allSettled(validEmails.map((email) => dispatchOne(email)));
    const delivered = settled.filter((r) => r.status === 'fulfilled');
    const failed = settled.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

    return {
      success: delivered.length > 0,
      recipientCount: validEmails.length,
      deliveredCount: delivered.length,
      failedCount: failed.length,
      status: delivered.length > 0 ? 'delivered' : 'failed',
      messageId:
        delivered.length > 0
          ? (delivered[0] as PromiseFulfilledResult<any>).value?.id
          : undefined,
      error:
        delivered.length === 0
          ? failed[0]?.reason?.message || 'All email deliveries failed'
          : undefined,
    };
  }

  /**
   * Fetches full inbound received email details (text/html/headers) from Resend Receiving API.
   */
  public static async fetchReceivedEmail(emailId: string): Promise<{
    text?: string;
    html?: string;
    from?: string;
    to?: string[];
    subject?: string;
  } | null> {
    const apiKey = this.getApiKey();
    if (!apiKey || !emailId) return null;

    try {
      const res = await fetch(`${this.apiBase}/emails/receiving/${encodeURIComponent(emailId)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      return data || null;
    } catch {
      return null;
    }
  }

  /**
   * Verifies Svix webhook signature sent by Resend on inbound webhooks.
   * Returns true if RESEND_WEBHOOK_SECRET is not set (dev/unconfigured mode) OR signature is valid.
   */
  public static verifyWebhookSignature(
    rawBody: string,
    headers: { svixId?: string | null; svixTimestamp?: string | null; svixSignature?: string | null }
  ): { valid: boolean; reason?: string } {
    const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
    if (!secret) {
      return { valid: true };
    }

    const { svixId, svixTimestamp, svixSignature } = headers;
    if (!svixId || !svixTimestamp || !svixSignature) {
      return { valid: false, reason: 'Missing Svix webhook signature headers.' };
    }

    // Reject replays older than 5 minutes
    const tsSeconds = Number(svixTimestamp);
    if (!Number.isFinite(tsSeconds) || Math.abs(Date.now() / 1000 - tsSeconds) > 300) {
      return { valid: false, reason: 'Webhook timestamp outside allowed tolerance window.' };
    }

    const secretBase64 = secret.startsWith('whsec_') ? secret.slice(6) : secret;
    const keyBytes = Buffer.from(secretBase64, 'base64');
    const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
    const expectedSig = crypto.createHmac('sha256', keyBytes).update(signedPayload).digest('base64');

    const providedSigs = svixSignature
      .split(' ')
      .map((s) => s.trim())
      .filter((s) => s.startsWith('v1,'))
      .map((s) => s.slice(3));

    for (const candidate of providedSigs) {
      try {
        const a = Buffer.from(candidate);
        const b = Buffer.from(expectedSig);
        if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
          return { valid: true };
        }
      } catch {}
    }

    return { valid: false, reason: 'Invalid webhook HMAC signature.' };
  }

  // ============================================================================
  // AUTOMATIC BUSINESS LIFECYCLE EMAILS
  // ============================================================================

  public static async notifyWelcomeRegistered({ email, name }: { email: string; name: string }) {
    const baseUrl = getAppBaseUrl();
    const html = renderBrandedHtml({
      eyebrow: 'Welcome to the Roster',
      heading: `Welcome to MuscleCraft, ${name}!`,
      bodyHtml: `
        <p style="margin:0 0 12px 0;">Your athlete account has been created successfully.</p>
        <p style="margin:0 0 12px 0;">To unlock your Client Portal, body analytics dashboard, and custom coaching vault, select your preferred membership tier and upload your bank transfer slip.</p>
        <div style="padding:14px 16px;background-color:#181822;border:1px solid #2b2b38;border-radius:12px;margin-top:16px;font-size:13px;">
          <strong style="color:#ffffff;">Next Step:</strong> Choose Sole, Couple, or 90-Day Better Me Coaching on the Pricing page and submit your transfer receipt.
        </div>
      `,
      ctaLabel: 'Choose Your Membership Package',
      ctaUrl: `${baseUrl}/pricing`,
    });

    return this.sendEmail({
      to: email,
      subject: 'Welcome to MuscleCraft — Activate Your Athlete Portal',
      html,
      text: `Welcome to MuscleCraft, ${name}! Your account is ready. Select a membership package and upload your bank slip at ${baseUrl}/pricing to activate your portal.`,
      tags: [{ name: 'type', value: 'welcome_register' }],
    });
  }

  public static async notifyAdminCreatedMember({
    email,
    name,
    password,
    packageName,
  }: {
    email: string;
    name: string;
    password: string;
    packageName?: string;
  }) {
    const baseUrl = getAppBaseUrl();
    const html = renderBrandedHtml({
      eyebrow: 'Portal Access Provisioned',
      heading: `Your MuscleCraft Portal Is Ready, ${name}`,
      bodyHtml: `
        <p style="margin:0 0 12px 0;">Coach Adeesha has created your official MuscleCraft account${packageName ? ` under <strong style="color:#ffffff;">${escapeHtml(packageName)}</strong>` : ''}.</p>
        <div style="padding:16px;background-color:#181822;border:1px solid #2b2b38;border-radius:12px;margin:16px 0;font-family:monospace;font-size:13px;">
          <div style="margin-bottom:6px;"><span style="color:#9ca3af;">Login Email:</span> <strong style="color:#ffffff;">${escapeHtml(email)}</strong></div>
          <div><span style="color:#9ca3af;">Temporary Password:</span> <strong style="color:#f87171;">${escapeHtml(password)}</strong></div>
        </div>
        <p style="margin:0;font-size:12px;color:#9ca3af;">Keep your credentials secure. Contact Coach Adeesha anytime if you need help signing in.</p>
      `,
      ctaLabel: 'Sign In to Athlete Portal',
      ctaUrl: `${baseUrl}/login`,
    });

    return this.sendEmail({
      to: email,
      subject: 'Your MuscleCraft Athlete Portal Login Credentials',
      html,
      text: `Hi ${name}, your MuscleCraft account is ready! Email: ${email} | Password: ${password} | Sign in at ${baseUrl}/login`,
      tags: [{ name: 'type', value: 'admin_created_member' }],
    });
  }

  public static async notifyPaymentSubmitted({
    email,
    name,
    referenceCode,
    amount,
    packageName,
    bankName,
  }: {
    email?: string | null;
    name: string;
    referenceCode: string;
    amount: number;
    packageName: string;
    bankName: string;
  }) {
    const baseUrl = getAppBaseUrl();
    const formattedAmount = Number(amount).toLocaleString('en-LK');
    const results: Promise<any>[] = [];

    if (email) {
      const clientHtml = renderBrandedHtml({
        eyebrow: 'Bank Slip Received',
        heading: 'Transfer Receipt Under Review',
        bodyHtml: `
          <p style="margin:0 0 12px 0;">Hi ${escapeHtml(name)}, we have received your manual bank transfer submission.</p>
          <div style="padding:16px;background-color:#181822;border:1px solid #2b2b38;border-radius:12px;margin:16px 0;font-size:13px;">
            <div style="margin-bottom:6px;"><span style="color:#9ca3af;">Reference Code:</span> <strong style="color:#ffffff;font-family:monospace;">${escapeHtml(referenceCode)}</strong></div>
            <div style="margin-bottom:6px;"><span style="color:#9ca3af;">Package:</span> <strong style="color:#ffffff;">${escapeHtml(packageName)}</strong></div>
            <div style="margin-bottom:6px;"><span style="color:#9ca3af;">Bank:</span> <strong style="color:#ffffff;">${escapeHtml(bankName)}</strong></div>
            <div><span style="color:#9ca3af;">Amount:</span> <strong style="color:#34d399;font-family:monospace;">Rs. ${formattedAmount} LKR</strong></div>
          </div>
          <p style="margin:0;">Coach Adeesha will verify your deposit slip and activate your portal shortly.</p>
        `,
        ctaLabel: 'View Your Portal Status',
        ctaUrl: `${baseUrl}/client`,
      });

      results.push(
        this.sendEmail({
          to: email,
          subject: `MuscleCraft Transfer Received (${referenceCode})`,
          html: clientHtml,
          text: `Hi ${name}, we received your transfer slip ${referenceCode} for ${packageName} (Rs. ${formattedAmount} LKR via ${bankName}). Coach Adeesha will verify and activate your portal shortly.`,
          tags: [{ name: 'type', value: 'payment_submitted_client' }],
        })
      );
    }

    // Notify Admin of new pending bank slip
    const adminEmail = this.getAdminEmail();
    if (adminEmail) {
      const adminHtml = renderBrandedHtml({
        eyebrow: 'Action Required · Bank Approvals',
        heading: `New Bank Slip Submitted: ${referenceCode}`,
        bodyHtml: `
          <p style="margin:0 0 12px 0;"><strong>${escapeHtml(name)}</strong> submitted a bank transfer slip awaiting your approval.</p>
          <div style="padding:16px;background-color:#181822;border:1px solid #2b2b38;border-radius:12px;margin:16px 0;font-size:13px;">
            <div style="margin-bottom:6px;"><span style="color:#9ca3af;">Reference:</span> <strong style="color:#ffffff;font-family:monospace;">${escapeHtml(referenceCode)}</strong></div>
            <div style="margin-bottom:6px;"><span style="color:#9ca3af;">Package:</span> <strong style="color:#ffffff;">${escapeHtml(packageName)}</strong></div>
            <div style="margin-bottom:6px;"><span style="color:#9ca3af;">Bank:</span> <strong style="color:#ffffff;">${escapeHtml(bankName)}</strong></div>
            <div><span style="color:#9ca3af;">Amount:</span> <strong style="color:#fbbf24;font-family:monospace;">Rs. ${formattedAmount} LKR</strong></div>
          </div>
        `,
        ctaLabel: 'Review & Approve in Admin Desk',
        ctaUrl: `${baseUrl}/admin?tab=payments`,
      });

      results.push(
        this.sendEmail({
          to: adminEmail,
          subject: `[Admin Alert] New Bank Slip ${referenceCode} — Rs. ${formattedAmount} LKR`,
          html: adminHtml,
          text: `New Bank Transfer Slip ${referenceCode} from ${name} (${packageName}, Rs. ${formattedAmount} LKR via ${bankName}). Review at ${baseUrl}/admin?tab=payments`,
          tags: [{ name: 'type', value: 'payment_submitted_admin' }],
        })
      );
    }

    await Promise.allSettled(results);
  }

  public static async notifyPaymentApproved({
    email,
    name,
    amount,
    packageName,
    expiresAt,
  }: {
    email?: string | null;
    name: string;
    amount: number | string;
    packageName: string;
    expiresAt?: string;
  }) {
    if (!email) return null;
    const baseUrl = getAppBaseUrl();
    const formattedAmount = Number(amount).toLocaleString('en-LK');
    const expDisplay = expiresAt
      ? new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : null;

    const html = renderBrandedHtml({
      eyebrow: 'Membership Activated',
      heading: `Payment Approved — Welcome to ${packageName}!`,
      bodyHtml: `
        <p style="margin:0 0 12px 0;">Hi ${escapeHtml(name)}, your bank transfer of <strong style="color:#34d399;">Rs. ${formattedAmount} LKR</strong> has been verified and approved by Coach Adeesha.</p>
        <div style="padding:16px;background-color:#0b1f17;border:1px solid #166534;border-radius:12px;margin:16px 0;font-size:13px;color:#bbf7d0;">
          <div><strong>Status:</strong> ACTIVE &amp; UNLOCKED</div>
          <div style="margin-top:4px;"><strong>Active Plan:</strong> ${escapeHtml(packageName)}</div>
          ${expDisplay ? `<div style="margin-top:4px;"><strong>Valid Through:</strong> ${escapeHtml(expDisplay)}</div>` : ''}
        </div>
        <p style="margin:0;">You now have full access to your Client Portal, body analytics tracking, diet protocols, and training video vault.</p>
      `,
      ctaLabel: 'Open Your Athlete Portal',
      ctaUrl: `${baseUrl}/client`,
    });

    return this.sendEmail({
      to: email,
      subject: `MuscleCraft Payment Approved — Your ${packageName} Access is Live`,
      html,
      text: `Hi ${name}, your bank transfer of Rs. ${formattedAmount} LKR for ${packageName} has been APPROVED. Your MuscleCraft athlete portal is now active at ${baseUrl}/client`,
      tags: [{ name: 'type', value: 'payment_approved' }],
    });
  }

  public static async notifyPaymentRejected({
    email,
    name,
    reason,
  }: {
    email?: string | null;
    name: string;
    reason: string;
  }) {
    if (!email) return null;
    const baseUrl = getAppBaseUrl();

    const html = renderBrandedHtml({
      eyebrow: 'Deposit Verification Notice',
      heading: 'Action Required: Bank Slip Could Not Be Verified',
      bodyHtml: `
        <p style="margin:0 0 12px 0;">Hi ${escapeHtml(name)}, our verification desk could not confirm your recent bank transfer slip.</p>
        <div style="padding:16px;background-color:#260c11;border:1px solid #9f1239;border-radius:12px;margin:16px 0;font-size:13px;color:#fecdd3;">
          <strong>Reviewer Note:</strong> ${escapeHtml(reason)}
        </div>
        <p style="margin:0;">Please upload a clear receipt photo on the Pricing page or reply directly to this email for assistance from Coach Adeesha.</p>
      `,
      ctaLabel: 'Re-upload Transfer Slip',
      ctaUrl: `${baseUrl}/pricing`,
    });

    return this.sendEmail({
      to: email,
      subject: 'MuscleCraft Notice: Please Re-verify Your Bank Transfer Slip',
      html,
      text: `Hi ${name}, your bank transfer slip could not be verified (${reason}). Please re-upload a clear slip at ${baseUrl}/pricing or reply to this email.`,
      tags: [{ name: 'type', value: 'payment_rejected' }],
    });
  }

  public static async notifyCoachFeedback({
    email,
    name,
    weekNumber,
    feedback,
  }: {
    email?: string | null;
    name: string;
    weekNumber: number;
    feedback: string;
  }) {
    if (!email) return null;
    const baseUrl = getAppBaseUrl();

    const html = renderBrandedHtml({
      eyebrow: `Week ${weekNumber} Check-In Review`,
      heading: 'New Coach Feedback From Adeesha',
      bodyHtml: `
        <p style="margin:0 0 12px 0;">Hi ${escapeHtml(name)}, Coach Adeesha has reviewed your Week ${weekNumber} body analytics check-in:</p>
        <div style="padding:16px;background-color:#181822;border-left:3px solid #dc2626;border-radius:8px;margin:16px 0;font-size:14px;color:#f3f4f6;font-style:italic;">
          &ldquo;${escapeHtml(feedback)}&rdquo;
        </div>
      `,
      ctaLabel: 'View Progress Dashboard',
      ctaUrl: `${baseUrl}/client`,
    });

    return this.sendEmail({
      to: email,
      subject: `MuscleCraft Week ${weekNumber} Review — Feedback From Coach Adeesha`,
      html,
      text: `Hi ${name}, Coach Adeesha posted feedback on your Week ${weekNumber} check-in: "${feedback}". View at ${baseUrl}/client`,
      tags: [{ name: 'type', value: 'coach_feedback' }],
    });
  }

  public static async sendContactInquiry({
    name,
    email,
    phone,
    subject,
    message,
  }: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }): Promise<EmailSendResult> {
    const adminEmail = this.getAdminEmail();
    const adminHtml = renderBrandedHtml({
      eyebrow: 'Website Inquiry Desk',
      heading: `New Inquiry: ${subject}`,
      bodyHtml: `
        <div style="padding:16px;background-color:#181822;border:1px solid #2b2b38;border-radius:12px;margin-bottom:16px;font-size:13px;">
          <div style="margin-bottom:6px;"><span style="color:#9ca3af;">From:</span> <strong style="color:#ffffff;">${escapeHtml(name)}</strong> (${escapeHtml(email)})</div>
          ${phone ? `<div style="margin-bottom:6px;"><span style="color:#9ca3af;">Phone / WhatsApp:</span> <strong style="color:#ffffff;">${escapeHtml(phone)}</strong></div>` : ''}
          <div><span style="color:#9ca3af;">Topic:</span> <strong style="color:#f87171;">${escapeHtml(subject)}</strong></div>
        </div>
        <div style="padding:16px;background-color:#0f0f15;border:1px solid #262630;border-radius:12px;white-space:pre-wrap;font-size:14px;color:#e5e7eb;">${escapeHtml(message)}</div>
      `,
      footerNote: 'Reply directly to this email to respond to the inquirer.',
    });

    const adminRes = await this.sendEmail({
      to: adminEmail,
      replyTo: email,
      subject: `[MuscleCraft Inquiry] ${subject} — ${name}`,
      html: adminHtml,
      text: `New MuscleCraft Inquiry\nFrom: ${name} (${email})${phone ? ` | Phone: ${phone}` : ''}\nTopic: ${subject}\n\n${message}`,
      tags: [{ name: 'type', value: 'contact_inquiry_admin' }],
    });

    // Send polite auto-reply to inquirer
    const autoReplyHtml = renderBrandedHtml({
      eyebrow: 'Inquiry Confirmed',
      heading: `We Received Your Message, ${name}`,
      bodyHtml: `
        <p style="margin:0 0 12px 0;">Thank you for contacting MuscleCraft regarding <strong style="color:#ffffff;">${escapeHtml(subject)}</strong>.</p>
        <p style="margin:0 0 12px 0;">Coach Adeesha or a member of our support desk will reply within 24 hours. You can also reply directly to this email if you would like to add extra details.</p>
      `,
      ctaLabel: 'Explore Membership Packages',
      ctaUrl: `${getAppBaseUrl()}/pricing`,
    });

    await this.sendEmail({
      to: email,
      subject: `MuscleCraft Received Your Inquiry: ${subject}`,
      html: autoReplyHtml,
      text: `Hi ${name}, thank you for contacting MuscleCraft regarding "${subject}". Coach Adeesha will respond within 24 hours.`,
      tags: [{ name: 'type', value: 'contact_inquiry_autoreply' }],
    }).catch(() => {});

    return adminRes;
  }

  public static async notifyNewsletterWelcome({ email }: { email: string }) {
    const baseUrl = getAppBaseUrl();
    const html = renderBrandedHtml({
      eyebrow: 'The Athletic Cohort',
      heading: 'Welcome to the MuscleCraft Dispatch',
      bodyHtml: `
        <p style="margin:0 0 12px 0;">You are officially subscribed to the MuscleCraft training dispatch.</p>
        <p style="margin:0;">Expect evidence-based strength programming insights, Sri Lankan macro-friendly meal protocols, and early priority access whenever new 90 Days Better Me cohorts open.</p>
      `,
      ctaLabel: 'View Training Programs',
      ctaUrl: `${baseUrl}/memberships`,
    });

    return this.sendEmail({
      to: email,
      subject: 'Welcome to the MuscleCraft Athletic Cohort',
      html,
      text: `Welcome to the MuscleCraft Athletic Cohort! Explore programs at ${baseUrl}/memberships`,
      tags: [{ name: 'type', value: 'newsletter_welcome' }],
    });
  }

  public static async sendBroadcastEmail({
    recipients,
    title,
    body,
    priority = 'normal',
  }: {
    recipients: string[];
    title: string;
    body: string;
    priority?: string;
  }): Promise<EmailSendResult> {
    const baseUrl = getAppBaseUrl();
    const eyebrow =
      priority === 'urgent'
        ? 'URGENT FACILITY NOTICE'
        : priority === 'high'
        ? 'PRIORITY ANNOUNCEMENT'
        : 'MUSCLECRAFT DISPATCH';

    const html = renderBrandedHtml({
      eyebrow,
      heading: title,
      bodyHtml: `<div style="white-space:pre-wrap;line-height:1.7;">${escapeHtml(body)}</div>`,
      ctaLabel: 'Open Athlete Portal',
      ctaUrl: `${baseUrl}/client`,
      footerNote: 'Sent by Coach Adeesha Kumarasingha via MuscleCraft Operations Broadcast Center.',
    });

    return this.sendEmail({
      to: recipients,
      subject: priority === 'urgent' ? `[URGENT] ${title} — MuscleCraft` : `${title} — MuscleCraft`,
      html,
      text: `${title}\n\n${body}\n\n— MuscleCraft (${baseUrl})`,
      tags: [{ name: 'type', value: 'broadcast_blast' }],
    });
  }

  /**
   * Automatic Notification: Membership Expiring Soon (3 Days Before Expiration)
   */
  public static async notifyMembershipExpiringSoon({
    email,
    name,
    packageName,
    daysLeft,
    expiresAt,
    tier,
  }: {
    email?: string | null;
    name: string;
    packageName?: string;
    daysLeft: number;
    expiresAt: string;
    tier?: string;
  }): Promise<EmailSendResult | null> {
    if (!email) return null;
    const baseUrl = getAppBaseUrl();
    const renewUrl =
      tier && tier !== 'none'
        ? `${baseUrl}/checkout?tier=${encodeURIComponent(tier)}`
        : `${baseUrl}/pricing`;
    const expDisplay = new Date(expiresAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const dayLabel = daysLeft === 1 ? '1 Day' : `${daysLeft} Days`;

    const html = renderBrandedHtml({
      eyebrow: `Renewal Reminder · ${dayLabel} Remaining`,
      heading: `Your MuscleCraft Membership Expires in ${dayLabel}`,
      bodyHtml: `
        <p style="margin:0 0 12px 0;">Hi ${escapeHtml(name)},</p>
        <p style="margin:0 0 14px 0;">This is a friendly heads-up that your <strong style="color:#ffffff;">${escapeHtml(packageName || 'MuscleCraft Membership')}</strong> is scheduled to expire on <strong style="color:#fbbf24;">${escapeHtml(expDisplay)}</strong>.</p>
        <div style="padding:16px;background-color:#261a0c;border:1px solid #b45309;border-radius:12px;margin:16px 0;font-size:13px;color:#fde68a;">
          <strong>Automatic Portal Lockout Policy:</strong> Once your expiration date passes, your athlete portal (training plans, diet blueprints, body analytics &amp; video vault) is automatically locked until your renewal is confirmed.
        </div>
        <p style="margin:0;">Renew early below to keep your training streak and portal access uninterrupted.</p>
      `,
      ctaLabel: 'Renew Membership Now',
      ctaUrl: renewUrl,
      footerNote: 'You can also visit Coach Adeesha at the MuscleCraft desk (245, Kotugoda Road, Seeduwa) to renew in person.',
    });

    return this.sendEmail({
      to: email,
      subject: `MuscleCraft Reminder: Your Membership Expires in ${dayLabel} (${expDisplay})`,
      html,
      text: `Hi ${name}, your ${packageName || 'MuscleCraft'} membership expires in ${dayLabel} (${expDisplay}). Renew now at ${renewUrl} to avoid automatic portal lockout.`,
      tags: [{ name: 'type', value: 'membership_expiring_3d' }],
    });
  }

  /**
   * Automatic Notification: Membership Expired & Portal Locked
   */
  public static async notifyMembershipExpired({
    email,
    name,
    packageName,
    expiresAt,
    tier,
  }: {
    email?: string | null;
    name: string;
    packageName?: string;
    expiresAt?: string;
    tier?: string;
  }): Promise<EmailSendResult | null> {
    if (!email) return null;
    const baseUrl = getAppBaseUrl();
    const renewUrl =
      tier && tier !== 'none'
        ? `${baseUrl}/checkout?tier=${encodeURIComponent(tier)}`
        : `${baseUrl}/pricing`;
    const expDisplay = expiresAt
      ? new Date(expiresAt).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : 'today';

    const html = renderBrandedHtml({
      eyebrow: 'Membership Expired · Portal Locked',
      heading: 'Your MuscleCraft Membership Has Expired',
      bodyHtml: `
        <p style="margin:0 0 12px 0;">Hi ${escapeHtml(name)},</p>
        <p style="margin:0 0 14px 0;">Your <strong style="color:#ffffff;">${escapeHtml(packageName || 'MuscleCraft Membership')}</strong> expired on <strong style="color:#f87171;">${escapeHtml(expDisplay)}</strong>, and your MuscleCraft Athlete Portal has been automatically locked.</p>
        <div style="padding:16px;background-color:#260c11;border:1px solid #9f1239;border-radius:12px;margin:16px 0;font-size:13px;color:#fecdd3;">
          <strong>All your progress is safely saved:</strong> Your body measurement history, diet blueprints, and profile remain preserved. Renew your membership to restore full portal &amp; gym access immediately.
        </div>
        <p style="margin:0;">Click below to renew your package online or visit the MuscleCraft front desk to reactivate in person.</p>
      `,
      ctaLabel: 'Renew & Reactivate Membership',
      ctaUrl: renewUrl,
      footerNote: 'Need help choosing a renewal tier? Reply directly to this email or contact Coach Adeesha.',
    });

    return this.sendEmail({
      to: email,
      subject: 'MuscleCraft Notice: Your Membership Has Expired — Renew to Restore Portal Access',
      html,
      text: `Hi ${name}, your ${packageName || 'MuscleCraft'} membership expired on ${expDisplay} and your athlete portal is temporarily locked. Renew anytime at ${renewUrl} to restore access.`,
      tags: [{ name: 'type', value: 'membership_expired_lockout' }],
    });
  }
}
