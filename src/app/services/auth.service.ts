import { Injectable, signal, computed } from '@angular/core';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { SupabaseClientService } from './supabase-client.service';
import { environment } from '../../environments/environment';

// Get frontend URL from environment or fallback to current origin
const getFrontendUrl = (): string => {
  return environment.frontendUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200');
};

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role_name: string;
  role_description?: string;
  assigned_provinces: string[];
  is_active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;

  // Signals for reactive state
  private currentUser = signal<User | null>(null);
  private currentSession = signal<Session | null>(null);
  private userProfile = signal<UserProfile | null>(null);

  // Computed signals
  public readonly isAuthenticated = computed(() => this.currentUser() !== null);
  public readonly isSuperAdmin = computed(() => {
    const role = this.userProfile()?.role_name;
    return role?.toLowerCase() === 'superadmin';
  });
  public readonly isAdmin = computed(() => {
    const role = this.userProfile()?.role_name;
    return role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin';
  });
  public readonly currentUserProfile = computed(() => this.userProfile());

  constructor(
    private router: Router,
    private supabaseClientService: SupabaseClientService
  ) {
    // Use shared Supabase client instance
    this.supabase = this.supabaseClientService.client;
    
    // Listen to auth state changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);
      
      if (session?.user) {
        this.loadUserProfile();
      } else {
        this.userProfile.set(null);
      }
    });

    // Load initial session
    this.loadSession();
  }

  /**
   * Load current session on service initialization
   */
  private async loadSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.currentSession.set(session);
    this.currentUser.set(session?.user ?? null);
    
    if (session?.user) {
      await this.loadUserProfile();
    }
  }

  /**
   * Wait for user profile to load (useful for guards)
   */
  async waitForProfile(maxWaitMs: number = 2000): Promise<boolean> {
    if (this.userProfile()) {
      return true;
    }

    const startTime = Date.now();
    while (!this.userProfile() && (Date.now() - startTime) < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return this.userProfile() !== null;
  }

  /**
   * Load user profile with role information
   */
  private async loadUserProfile() {
    try {
      const userId = this.currentUser()?.id;
      if (!userId) {
        this.userProfile.set(null);
        return;
      }

      // Get role data from RPC function
      const { data: roleData, error: roleError } = await this.supabase
        .rpc('get_current_user_role');

      if (roleError) throw roleError;

      if (roleData && roleData.length > 0) {
        const role = roleData[0];
        
        // Get profile data (we already have role data from RPC, just get profile fields)
        const { data: profileData, error: profileError } = await this.supabase
          .from('profiles')
          .select('id, email, full_name, is_active, assigned_provinces')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        this.userProfile.set({
          id: profileData.id,
          email: profileData.email || '',
          full_name: profileData.full_name || '',
          role_name: role.role_name,
          role_description: role.role_description,
          assigned_provinces: role.assigned_provinces || [],
          is_active: profileData.is_active
        });
      } else {
        // No role data, try to get basic profile
        const { data: profileData, error: profileError } = await this.supabase
          .from('profiles')
          .select('id, email, full_name, is_active, assigned_provinces')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        // Default to 'user' role if no role assigned
        this.userProfile.set({
          id: profileData.id,
          email: profileData.email || '',
          full_name: profileData.full_name || '',
          role_name: 'user',
          role_description: 'General user with limited access',
          assigned_provinces: profileData.assigned_provinces || [],
          is_active: profileData.is_active
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      this.userProfile.set(null);
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    if (data.user) {
      await this.loadUserProfile();
    }

    return { data, error };
  }

  /**
   * Sign out current user
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;

    this.currentUser.set(null);
    this.currentSession.set(null);
    this.userProfile.set(null);
    
    this.router.navigate(['/login']);
  }

  /**
   * Reset password (sends email)
   * Works from frontend - no backend needed!
   * Note: Requires proper configuration in Supabase Dashboard
   */
  async resetPassword(email: string) {
    const frontendUrl = getFrontendUrl();
    
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${frontendUrl}/reset-password`
    });

    if (error) {
      // Provide more helpful error messages
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('rate limit') || errorMsg.includes('too many')) {
        throw new Error('Too many password reset requests. Please wait a few minutes and try again.');
      } else if (errorMsg.includes('redirect') || errorMsg.includes('url')) {
        throw new Error('Invalid redirect URL configuration. Please contact administrator.');
      } else if (errorMsg.includes('email') || errorMsg.includes('user')) {
        throw new Error('Email not found. Please check your email address and try again.');
      }
      throw error;
    }

    return data;
  }

  /**
   * Update password (used after clicking reset link from email)
   */
  async updatePassword(newPassword: string) {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  }


  /**
   * Get all users (superadmin only)
   */
  async getAllUsers() {
    const { data, error } = await this.supabase
      .rpc('get_all_users');

    if (error) throw error;
    return data;
  }

  /**
   * Get all available roles
   */
  async getRoles() {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select('*')
      .order('role_name');

    if (error) throw error;
    return data;
  }

  /**
   * Create new user (superadmin only)
   * Uses Supabase Edge Function for secure user creation
   */
  async createUser(email: string, fullName: string, roleId: string, provinces: string[] = []) {
    // Call the Edge Function
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${environment.supabaseUrl}/functions/v1/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': environment.supabaseKey,
      },
      body: JSON.stringify({
        email,
        fullName,
        roleId,
        provinces,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create user');
    }

    return result;
  }

  /**
   * Assign role to user (superadmin only)
   */
  async assignRoleToUser(userId: string, roleId: string, provinces: string[] = []) {
    const { data, error } = await this.supabase
      .rpc('assign_role_to_user', {
        p_user_id: userId,
        p_role_id: roleId,
        p_provinces: provinces
      });

    if (error) throw error;
    return data;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: { full_name?: string }) {
    const userId = this.currentUser()?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    if (data) {
      await this.loadUserProfile();
    }

    return data;
  }

  /**
   * Delete user (superadmin only)
   * Uses Supabase Edge Function for secure user deletion
   */
  async deleteUser(userId: string) {
    // Call the Edge Function
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${environment.supabaseUrl}/functions/v1/delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': environment.supabaseKey,
      },
      body: JSON.stringify({
        userId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete user');
    }

    return result;
  }

  /**
   * Check if user has access to a province
   */
  hasProvinceAccess(provinceCode: string): boolean {
    const profile = this.userProfile();
    if (!profile) return false;
    
    // Superadmin has access to all provinces
    if (profile.role_name === 'superadmin') return true;
    
    // Check if province is in assigned_provinces
    return profile.assigned_provinces.includes(provinceCode);
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser();
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    return this.currentSession();
  }

  /**
   * Get supabase client (for components that need direct access)
   */
  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }
}

