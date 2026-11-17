import { db } from '../db/mock-db';
import { User, UserRole } from '../types';

export class AuthService {
  // Credential map for local in-memory authentication and fallback
  private static credentials: Map<string, string> = new Map([
    ['adeesha@musclecraft.lk', 'AdeeshaOwner2026!'],
    ['owner@musclecraft.lk', 'AdeeshaOwner2026!'],
    ['coach.kasun@musclecraft.lk', 'KasunCoach2026!'],
    ['marcus@musclecraft.lk', 'ClientPass2026!'],
    ['nuwan.silva@gmail.com', 'Nuwan2026!'],
    ['kanishka.perera@gmail.com', 'Kanishka2026!'],
    ['rohan.v@gmail.com', 'Rohan2026!'],
    ['dinuka@gmail.com', 'Dinuka2026!'],
    ['saman.rashmi@gmail.com', 'Saman2026!'],
  ]);

  static getCurrentUser(userId?: string | null): User | null {
    if (!userId) {
      return null;
    }
    return db.users.find((u) => u.id === userId) || null;
  }

  static getUserByEmail(email: string): User | null {
    const clean = email.toLowerCase().trim();
    if (!clean) return null;
    return db.users.find((u) => u.email.toLowerCase().trim() === clean) || null;
  }

  static setPassword(email: string, password: string): void {
    if (email && password) {
      this.credentials.set(email.toLowerCase().trim(), password);
    }
  }

  static verifyPassword(email: string, password?: string): boolean {
    if (!password) return false;
    const clean = email.toLowerCase().trim();
    const stored = this.credentials.get(clean);
    if (!stored) return false;
    return stored === password;
  }

  static authenticate(email: string, password?: string): { user: User | null; error?: string } {
    const user = this.getUserByEmail(email);
    if (!user) return { user: null };

    if (!password) {
      return {
        user: null,
        error: 'Password is required.',
      };
    }

    const clean = email.toLowerCase().trim();
    const stored = this.credentials.get(clean);
    if (!stored || stored !== password) {
      return {
        user: null,
        error: 'Invalid email or password.',
      };
    }

    return { user };
  }

  static registerUser(data: {
    id?: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
    tier?: string;
    packageId?: string;
    packageName?: string;
    packageType?: 'sole' | 'couple' | 'coaching';
    status?: User['status'];
    membershipExpiresAt?: string;
  }): User {
    const cleanEmail = data.email.toLowerCase().trim();
    const existing = this.getUserByEmail(cleanEmail);
    if (existing && !data.id) {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    if (!data.password || data.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const newUser: User = {
      id: data.id || `usr_${Date.now()}`,
      email: cleanEmail,
      name: data.name.trim(),
      phone: data.phone?.trim(),
      role: data.role || 'client',
      tier: data.tier || 'none',
      packageId: data.packageId || (data.tier && data.tier !== 'none' ? data.tier : undefined),
      packageName: data.packageName || 'No Active Plan',
      packageType: data.packageType || 'sole',
      status: data.status || 'pending',
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      joinedAt: new Date().toISOString(),
      membershipExpiresAt: data.membershipExpiresAt,
    };

    if (existing) {
      Object.assign(existing, newUser);
      this.credentials.set(cleanEmail, data.password);
      return existing;
    }

    db.users.push(newUser);
    this.credentials.set(cleanEmail, data.password);
    return newUser;
  }

  static register(data: { name: string; email: string; phone?: string; tier: 'monthly' | 'coaching_90' }): User {
    return this.registerUser({
      name: data.name,
      email: data.email,
      password: 'DefaultPassword2026!',
      phone: data.phone,
      tier: data.tier,
    });
  }

  static checkPermission(user: User | null, requiredRole: UserRole[]): boolean {
    if (!user) return false;
    return requiredRole.includes(user.role);
  }
}
