import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * Supabase Service for Voter Data
 * 
 * This service provides methods to query voter data from Supabase.
 * 
 * Usage:
 *   constructor(private supabaseService: SupabaseService) {}
 *   
 *   // Search voters
 *   this.supabaseService.searchVoters('अकबर').subscribe(results => {
 *     console.log(results);
 *   });
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    const supabaseUrl = environment.supabaseUrl;
    const supabaseKey = environment.supabaseKey;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not found in environment. Some features may not work.');
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Search voters by name (supports Nepali text)
   */
  async searchVoters(searchTerm: string, limit: number = 50) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized. Check environment variables.');
    }

    const { data, error } = await this.supabase
      .from('voters')
      .select(`
        *,
        ward_metadata (
          province,
          district,
          ward_number,
          polling_center
        )
      `)
      .or(`voter_name.ilike.%${searchTerm}%,voter_number.eq.${searchTerm}`)
      .limit(limit);

    if (error) {
      console.error('Error searching voters:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get voters by ward
   */
  async getVotersByWard(
    province: string,
    district: string,
    wardNumber: string,
    limit: number = 100,
    offset: number = 0
  ) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized. Check environment variables.');
    }

    // First, get the ward metadata ID
    const { data: wardData, error: wardError } = await this.supabase
      .from('ward_metadata')
      .select('id')
      .eq('province', province)
      .eq('district', district)
      .eq('ward_number', wardNumber)
      .single();

    if (wardError || !wardData) {
      throw new Error(`Ward not found: ${province}, ${district}, Ward ${wardNumber}`);
    }

    // Get voters for this ward
    const { data, error } = await this.supabase
      .from('voters')
      .select('*')
      .eq('ward_metadata_id', wardData.id)
      .order('serial_number', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching voters:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get ward metadata
   */
  async getWardMetadata(province: string, district: string, wardNumber: string) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized. Check environment variables.');
    }

    const { data, error } = await this.supabase
      .from('ward_metadata')
      .select('*')
      .eq('province', province)
      .eq('district', district)
      .eq('ward_number', wardNumber)
      .single();

    if (error) {
      console.error('Error fetching ward metadata:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get voter by voter number
   */
  async getVoterByNumber(voterNumber: string) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized. Check environment variables.');
    }

    const { data, error } = await this.supabase
      .from('voters')
      .select(`
        *,
        ward_metadata (
          province,
          district,
          ward_number,
          polling_center,
          house_of_representatives_constituency,
          provincial_assembly_constituency
        )
      `)
      .eq('voter_number', voterNumber)
      .single();

    if (error) {
      console.error('Error fetching voter:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get statistics for a ward
   */
  async getWardStatistics(province: string, district: string, wardNumber: string) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized. Check environment variables.');
    }

    // Get ward metadata
    const wardMetadata = await this.getWardMetadata(province, district, wardNumber);

    // Get voter count
    const { count, error: countError } = await this.supabase
      .from('voters')
      .select('*', { count: 'exact', head: true })
      .eq('ward_metadata_id', wardMetadata.id);

    if (countError) {
      throw countError;
    }

    // Get gender distribution
    const { data: genderData, error: genderError } = await this.supabase
      .from('voters')
      .select('gender')
      .eq('ward_metadata_id', wardMetadata.id);

    if (genderError) {
      throw genderError;
    }

    const genderStats = genderData.reduce((acc: any, voter: any) => {
      acc[voter.gender] = (acc[voter.gender] || 0) + 1;
      return acc;
    }, {});

    // Get age statistics
    const { data: ageData, error: ageError } = await this.supabase
      .from('voters')
      .select('age')
      .eq('ward_metadata_id', wardMetadata.id);

    if (ageError) {
      throw ageError;
    }

    const ages = ageData.map((v: any) => v.age).filter((a: number) => a > 0);
    const avgAge = ages.length > 0 
      ? ages.reduce((a: number, b: number) => a + b, 0) / ages.length 
      : 0;

    return {
      ward: wardMetadata,
      totalVoters: count || 0,
      genderDistribution: genderStats,
      averageAge: Math.round(avgAge * 10) / 10,
      minAge: ages.length > 0 ? Math.min(...ages) : 0,
      maxAge: ages.length > 0 ? Math.max(...ages) : 0
    };
  }

  // ============================================
  // New Schema Methods (polling_centers hierarchy)
  // ============================================

  /**
   * Get all unique provinces
   */
  async getProvinces() {
    if (!this.supabase) {
      throw new Error('Supabase not initialized. Check environment variables.');
    }

    const { data, error } = await this.supabase
      .from('provinces')
      .select('id, nepali_name, english_name, province_code')
      .eq('is_active', true)
      .order('province_code', { ascending: true });

    if (error) {
      console.error('Error fetching provinces:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get districts by province ID
   */
  async getDistrictsByProvince(provinceId: number) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized. Check environment variables.');
    }

    const { data, error } = await this.supabase
      .from('districts')
      .select('id, nepali_name, english_name, district_code')
      .eq('province_id', provinceId)
      .eq('is_active', true)
      .order('nepali_name', { ascending: true });

    if (error) {
      console.error('Error fetching districts:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get municipalities by district ID
   */
  async getMunicipalitiesByDistrict(districtId: number) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized. Check environment variables.');
    }

    const { data, error } = await this.supabase
      .from('municipalities')
      .select('id, nepali_name, english_name, type, municipality_code')
      .eq('district_id', districtId)
      .eq('is_active', true)
      .order('nepali_name', { ascending: true });

    if (error) {
      console.error('Error fetching municipalities:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get wards by municipality ID
   */
  async getWardsByMunicipality(municipalityId: number) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized. Check environment variables.');
    }

    const { data, error } = await this.supabase
      .from('wards')
      .select('id, ward_number, nepali_name, english_name, house_of_representatives_constituency, provincial_assembly_constituency')
      .eq('municipality_id', municipalityId)
      .eq('is_active', true)
      .order('ward_number', { ascending: true });

    if (error) {
      console.error('Error fetching wards:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get polling centers by ward ID
   */
  async getPollingCentersByWard(wardId: number) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized. Check environment variables.');
    }

    const { data, error } = await this.supabase
      .from('polling_centers')
      .select('id, nepali_name, english_name')
      .eq('ward_id', wardId)
      .eq('is_active', true)
      .order('nepali_name', { ascending: true });

    if (error) {
      console.error('Error fetching polling centers:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get voters by polling center with filters
   */
  async getVotersByPollingCenter(
    pollingCenterId: number,
    options: {
      searchTerm?: string;
      gender?: string;
      minAge?: number;
      maxAge?: number;
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized. Check environment variables.');
    }

    const {
      searchTerm = '',
      gender,
      minAge,
      maxAge,
      limit = 100,
      offset = 0,
      sortBy = 'serial_number',
      sortOrder = 'asc'
    } = options;

    let query = this.supabase
      .from('voters')
      .select(`
        *,
        polling_centers!inner (
          id,
          nepali_name,
          english_name,
          wards!inner (
            id,
            ward_number,
            municipalities!inner (
              id,
              nepali_name,
              districts!inner (
                id,
                nepali_name,
                provinces!inner (
                  id,
                  nepali_name
                )
              )
            )
          )
        )
      `, { count: 'exact' })
      .eq('polling_center_id', pollingCenterId);

    // Apply search filter
    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,voter_id.eq.${searchTerm},full_name_english.ilike.%${searchTerm}%`);
    }

    // Apply gender filter
    if (gender) {
      query = query.eq('gender', gender);
    }

    // Apply age filters
    if (minAge !== undefined) {
      query = query.gte('age', minAge);
    }
    if (maxAge !== undefined) {
      query = query.lte('age', maxAge);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching voters:', error);
      throw error;
    }

    return {
      data: data || [],
      count: count || 0
    };
  }

  /**
   * Get voters count by polling center (for statistics)
   */
  async getVotersCountByPollingCenter(pollingCenterId: number) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized. Check environment variables.');
    }

    const { count, error } = await this.supabase
      .from('voters')
      .select('*', { count: 'exact', head: true })
      .eq('polling_center_id', pollingCenterId);

    if (error) {
      console.error('Error counting voters:', error);
      throw error;
    }

    return count || 0;
  }
}

