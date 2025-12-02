import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * Shared Supabase Client Service
 * 
 * This service provides a singleton Supabase client instance
 * to avoid creating multiple clients (which causes warnings).
 * 
 * Both AuthService and SupabaseService should use this shared instance.
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseClientService {
  private _client: SupabaseClient | null = null;

  constructor() {
    const supabaseUrl = environment.supabaseUrl;
    const supabaseKey = environment.supabaseKey;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not found in environment. Some features may not work.');
    } else {
      this._client = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Get the shared Supabase client instance
   */
  get client(): SupabaseClient {
    if (!this._client) {
      throw new Error('Supabase client not initialized. Check environment variables.');
    }
    return this._client;
  }

  /**
   * Check if client is initialized
   */
  get isInitialized(): boolean {
    return this._client !== null;
  }
}

