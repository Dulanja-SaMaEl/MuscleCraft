/**
 * MuscleCraft Fitness Platform — Text.lk SMS Gateway Service
 * Official SMS Integration using Text.lk API v3
 * 
 * Supports both manual broadcast announcements and automated event notifications:
 * - Bank slip approval / rejection alerts
 * - Welcome / onboarding SMS
 * - Coach check-in feedback alerts
 * - Membership expiration warnings
 */

export interface SendSmsParams {
  to: string | string[];
  message: string;
  senderId?: string;
}

export interface SmsSendResult {
  success: boolean;
  recipientCount: number;
  messageId?: string;
  status?: string;
  rawResponse?: any;
  error?: string;
}

export interface GatewayStatusResult {
  isConfigured: boolean;
  provider: string;
  senderId: string;
  balance?: number | string;
  expiredOn?: string;
  status: 'online' | 'offline' | 'unconfigured';
  error?: string;
}

export class SmsService {
  private static defaultApiUrl = 'https://app.text.lk/api/v3/sms/send';
  private static balanceApiUrl = 'https://app.text.lk/api/v3/balance';

  /**
   * Resolves the Text.lk API Token from environment variables (fail-safe discovery).
   */
  public static getApiToken(): string {
    return (
      process.env.TEXTLK_API_TOKEN ||
      process.env.TEXT_LK_API_TOKEN ||
      process.env.TEXTLK_TOKEN ||
      process.env.SMS_API_KEY ||
      ''
    ).trim();
  }

  /**
   * Resolves the approved Sender ID from environment variables.
   */
  public static getSenderId(): string {
    return (
      process.env.TEXTLK_SENDER_ID ||
      process.env.TEXT_LK_SENDER_ID ||
      process.env.SMS_SENDER_ID ||
      'Musclecraft'
    ).trim();
  }

  /**
   * Checks if the SMS gateway is properly provisioned with credentials.
   */
  public static isConfigured(): boolean {
    const token = this.getApiToken();
    return Boolean(token && token.length > 10 && !token.includes('placeholder'));
  }

  /**
   * Normalizes any Sri Lankan or international phone number to Text.lk format (e.g. 94771234567).
   * Strips spaces, dashes, parentheses, and leading '+'.
   * Converts local 07XXXXXXXX to 947XXXXXXXX.
   */
  public static normalizePhoneNumber(rawPhone?: string | null): string | null {
    if (!rawPhone || typeof rawPhone !== 'string') return null;

    // Remove all non-numeric characters
    let cleaned = rawPhone.replace(/\D/g, '');
    if (!cleaned) return null;

    // Sri Lankan local format with leading 0 (e.g. 0771234567 -> 94771234567)
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '94' + cleaned.substring(1);
    }
    // Sri Lankan 9-digit format missing leading 0 or country code (e.g. 771234567 -> 94771234567)
    else if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1'))) {
      cleaned = '94' + cleaned;
    }
    // Already in 947XXXXXXXX format (11 digits)
    else if (cleaned.startsWith('94') && cleaned.length === 11) {
      return cleaned;
    }

    // Minimum valid international/local length check
    if (cleaned.length >= 9 && cleaned.length <= 15) {
      return cleaned;
    }

    return null;
  }

  /**
   * Queries real-time SMS gateway balance and account status from Text.lk API v3.
   */
  public static async getGatewayStatus(): Promise<GatewayStatusResult> {
    const token = this.getApiToken();
    const senderId = this.getSenderId();

    if (!token) {
      return {
        isConfigured: false,
        provider: 'Text.lk SMS Gateway',
        senderId,
        status: 'unconfigured',
      };
    }

    try {
      const res = await fetch(this.balanceApiUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        return {
          isConfigured: true,
          provider: 'Text.lk SMS Gateway',
          senderId,
          status: 'offline',
          error: `HTTP ${res.status}: Failed to reach Text.lk API`,
        };
      }

      const json = await res.json();
      if (json && json.status === 'success' && json.data) {
        return {
          isConfigured: true,
          provider: 'Text.lk SMS Gateway',
          senderId,
          balance: json.data.remaining_balance ?? '0',
          expiredOn: json.data.expired_on,
          status: 'online',
        };
      }

      return {
        isConfigured: true,
        provider: 'Text.lk SMS Gateway',
        senderId,
        status: 'online',
        balance: 'Active',
      };
    } catch (err: any) {
      return {
        isConfigured: true,
        provider: 'Text.lk SMS Gateway',
        senderId,
        status: 'offline',
        error: err.message || 'Network error connecting to Text.lk',
      };
    }
  }

  /**
   * Dispatches a single or multi-recipient SMS message via Text.lk API v3.
   */
  public static async sendSms({
    to,
    message,
    senderId,
  }: SendSmsParams): Promise<SmsSendResult> {
    const token = this.getApiToken();
    const resolvedSender = senderId || this.getSenderId();

    // 1. Prepare and normalize recipients
    const rawList = Array.isArray(to) ? to : [to];
    const validRecipients: string[] = [];

    for (const item of rawList) {
      if (typeof item === 'string') {
        // Can be comma-separated already
        const split = item.split(',');
        for (const sub of split) {
          const norm = this.normalizePhoneNumber(sub);
          if (norm && !validRecipients.includes(norm)) {
            validRecipients.push(norm);
          }
        }
      }
    }

    if (validRecipients.length === 0) {
      return {
        success: false,
        recipientCount: 0,
        error: 'No valid phone numbers provided for SMS delivery.',
      };
    }

    if (!token) {
      console.warn('[Text.lk SMS] Gateway token not configured. SMS dispatch simulated for:', validRecipients);
      return {
        success: true,
        recipientCount: validRecipients.length,
        status: 'simulated_unconfigured',
      };
    }

    // Text.lk expects comma-separated numbers in "recipient"
    const recipientString = validRecipients.join(',');

    try {
      const payload = {
        recipient: recipientString,
        sender_id: resolvedSender,
        type: 'plain',
        message: message.trim(),
      };

      const res = await fetch(process.env.TEXTLK_API_URL || this.defaultApiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json().catch(() => null);

      if (!res.ok || (responseData && responseData.status === 'error')) {
        const errMsg = responseData?.message || `HTTP ${res.status}: SMS sending failed`;
        console.error('[Text.lk SMS Error]:', errMsg, responseData);
        return {
          success: false,
          recipientCount: validRecipients.length,
          error: errMsg,
          rawResponse: responseData,
        };
      }

      return {
        success: true,
        recipientCount: validRecipients.length,
        status: 'delivered',
        messageId: responseData?.data?.uid || responseData?.data?.id,
        rawResponse: responseData,
      };
    } catch (err: any) {
      console.error('[Text.lk SMS Exception]:', err);
      return {
        success: false,
        recipientCount: validRecipients.length,
        error: err.message || 'Failed to dispatch SMS through Text.lk network',
      };
    }
  }

  // ============================================================================
  // STANDARDIZED BUSINESS EVENT NOTIFICATIONS (AUTOMATIC)
  // ============================================================================

  /**
   * Automatic Notification: Bank Transfer Slip Approved -> Membership Activated
   */
  public static async notifyPaymentApproved({
    phone,
    name,
    amount,
    packageName,
  }: {
    phone?: string | null;
    name: string;
    amount: number | string;
    packageName: string;
  }): Promise<SmsSendResult | null> {
    const norm = this.normalizePhoneNumber(phone);
    if (!norm) return null;

    const formattedAmount = Number(amount).toLocaleString('en-LK');
    const msg = `MuscleCraft: Welcome ${name}! Your bank transfer of Rs. ${formattedAmount} for ${packageName} has been APPROVED. Your athlete portal is now ACTIVE. Access at: https://musclecraft.lk/client`;

    return this.sendSms({ to: norm, message: msg });
  }

  /**
   * Automatic Notification: Bank Transfer Slip Rejected
   */
  public static async notifyPaymentRejected({
    phone,
    name,
    reason,
  }: {
    phone?: string | null;
    name: string;
    reason: string;
  }): Promise<SmsSendResult | null> {
    const norm = this.normalizePhoneNumber(phone);
    if (!norm) return null;

    const msg = `MuscleCraft Notice: Hi ${name}, your deposit slip could not be verified (${reason}). Please re-upload a clear slip at https://musclecraft.lk/pricing or WhatsApp Coach Adeesha.`;

    return this.sendSms({ to: norm, message: msg });
  }

  /**
   * Automatic Notification: Self-Registration Confirmation
   */
  public static async notifyWelcomeRegistered({
    phone,
    name,
  }: {
    phone?: string | null;
    name: string;
  }): Promise<SmsSendResult | null> {
    const norm = this.normalizePhoneNumber(phone);
    if (!norm) return null;

    const msg = `Welcome to MuscleCraft, ${name}! Your profile is registered. Select your training package and submit your transfer at https://musclecraft.lk/pricing to unlock your portal.`;

    return this.sendSms({ to: norm, message: msg });
  }

  /**
   * Automatic Notification: Admin Created New Member
   */
  public static async notifyAdminCreatedMember({
    phone,
    name,
    email,
    password,
  }: {
    phone?: string | null;
    name: string;
    email: string;
    password?: string;
  }): Promise<SmsSendResult | null> {
    const norm = this.normalizePhoneNumber(phone);
    if (!norm) return null;

    const passInfo = password ? ` Password: ${password}` : '';
    const msg = `Welcome to MuscleCraft, ${name}! Coach Adeesha has activated your membership account (${email}).${passInfo} Login at https://musclecraft.lk/login`;

    return this.sendSms({ to: norm, message: msg });
  }

  /**
   * Automatic Notification: Coach Check-In Feedback Added
   */
  public static async notifyCoachFeedback({
    phone,
    name,
    weekNumber,
  }: {
    phone?: string | null;
    name: string;
    weekNumber: number | string;
  }): Promise<SmsSendResult | null> {
    const norm = this.normalizePhoneNumber(phone);
    if (!norm) return null;

    const msg = `MuscleCraft Coaching: Coach Adeesha reviewed your Week ${weekNumber} check-in and added guidance. View your feedback now at https://musclecraft.lk/client`;

    return this.sendSms({ to: norm, message: msg });
  }
}
