import { db } from '../db/mock-db';
import { User, UserRole } from '../types';

export class AuthService {
  // Get active session user by ID or default to client_90 for quick review
  static getCurrentUser(userId?: string | null): User | null {
    if (!userId) {
      // Default fallback is the 90-day coaching member Marcus Vance
      return db.users.find((u) => u.id === 'usr_client_90') || null;
    }
    return db.users.find((u) => u.id === userId) || null;
  }

  static getUserByEmail(email: string): User | null {
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  static authenticate(email: string): User | null {
    const user = this.getUserByEmail(email);
    return user || null;
  }

  static register(data: { name: string; email: string; phone?: string; tier: 'monthly' | 'coaching_90' }): User {
    const existing = this.getUserByEmail(data.email);
    if (existing) {
      throw new Error('User with this email already exists.');
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      email: data.email,
      name: data.name,
      phone: data.phone,
      role: 'client',
      tier: data.tier,
      status: 'pending', // Pending until bank transfer approved
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      joinedAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    return newUser;
  }

  static checkPermission(user: User | null, requiredRole: UserRole[]): boolean {
    if (!user) return false;
    return requiredRole.includes(user.role);
  }
}
