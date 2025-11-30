import { Component, OnInit, Output, EventEmitter, OnChanges, SimpleChanges, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../../services/supabase.service';

export interface FilterSelection {
  provinceId: number | null;
  districtId: number | null;
  municipalityId: number | null;
  wardId: number | null;
  pollingCenterId: number | null;
}

@Component({
  selector: 'app-dropdown-selector',
  templateUrl: './dropdown-selector.html',
  styleUrl: './dropdown-selector.scss',
  standalone: false
})
export class DropdownSelector implements OnInit {
  @Output() filtersSelected = new EventEmitter<FilterSelection>();

  // Dropdown data
  provinces: any[] = [];
  districts: any[] = [];
  municipalities: any[] = [];
  wards: any[] = [];
  pollingCenters: any[] = [];

  // Selected values
  selectedProvinceId: number | null = null;
  selectedDistrictId: number | null = null;
  selectedMunicipalityId: number | null = null;
  selectedWardId: number | null = null;
  selectedPollingCenterId: number | null = null;

  // Loading states
  loadingProvinces = false;
  loadingDistricts = false;
  loadingMunicipalities = false;
  loadingWards = false;
  loadingPollingCenters = false;

  constructor(
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadProvinces();
  }

  async loadProvinces() {
    this.loadingProvinces = true;
    try {
      const data = await this.supabaseService.getProvinces();
      this.provinces = data || [];
      console.log('Provinces loaded:', this.provinces);
    } catch (error) {
      console.error('Error loading provinces:', error);
      this.provinces = [];
    } finally {
      this.loadingProvinces = false;
      this.cdr.detectChanges();
    }
  }

  async onProvinceChange() {
    // Reset dependent dropdowns
    this.selectedDistrictId = null;
    this.selectedMunicipalityId = null;
    this.selectedWardId = null;
    this.selectedPollingCenterId = null;
    this.districts = [];
    this.municipalities = [];
    this.wards = [];
    this.pollingCenters = [];

    if (this.selectedProvinceId) {
      this.loadDistricts(this.selectedProvinceId);
    }
  }

  async loadDistricts(provinceId: number) {
    this.loadingDistricts = true;
    try {
      const data = await this.supabaseService.getDistrictsByProvince(provinceId);
      this.districts = data || [];
    } catch (error) {
      console.error('Error loading districts:', error);
      this.districts = [];
    } finally {
      this.loadingDistricts = false;
      this.cdr.detectChanges();
    }
  }

  async onDistrictChange() {
    // Reset dependent dropdowns
    this.selectedMunicipalityId = null;
    this.selectedWardId = null;
    this.selectedPollingCenterId = null;
    this.municipalities = [];
    this.wards = [];
    this.pollingCenters = [];

    if (this.selectedDistrictId) {
      this.loadMunicipalities(this.selectedDistrictId);
    }
  }

  async loadMunicipalities(districtId: number) {
    this.loadingMunicipalities = true;
    try {
      const data = await this.supabaseService.getMunicipalitiesByDistrict(districtId);
      this.municipalities = data || [];
    } catch (error) {
      console.error('Error loading municipalities:', error);
      this.municipalities = [];
    } finally {
      this.loadingMunicipalities = false;
      this.cdr.detectChanges();
    }
  }

  async onMunicipalityChange() {
    // Reset dependent dropdowns
    this.selectedWardId = null;
    this.selectedPollingCenterId = null;
    this.wards = [];
    this.pollingCenters = [];

    if (this.selectedMunicipalityId) {
      this.loadWards(this.selectedMunicipalityId);
    }
  }

  async loadWards(municipalityId: number) {
    this.loadingWards = true;
    try {
      const data = await this.supabaseService.getWardsByMunicipality(municipalityId);
      this.wards = data || [];
    } catch (error) {
      console.error('Error loading wards:', error);
      this.wards = [];
    } finally {
      this.loadingWards = false;
      this.cdr.detectChanges();
    }
  }

  async onWardChange() {
    // Reset dependent dropdowns
    this.selectedPollingCenterId = null;
    this.pollingCenters = [];

    if (this.selectedWardId) {
      this.loadPollingCenters(this.selectedWardId);
    }
  }

  async loadPollingCenters(wardId: number) {
    this.loadingPollingCenters = true;
    try {
      const data = await this.supabaseService.getPollingCentersByWard(wardId);
      this.pollingCenters = data || [];
    } catch (error) {
      console.error('Error loading polling centers:', error);
      this.pollingCenters = [];
    } finally {
      this.loadingPollingCenters = false;
      this.cdr.detectChanges();
    }
  }

  onSubmit() {
    if (!this.selectedPollingCenterId) {
      alert('Please select all filters including polling center');
      return;
    }

    const filters: FilterSelection = {
      provinceId: this.selectedProvinceId,
      districtId: this.selectedDistrictId,
      municipalityId: this.selectedMunicipalityId,
      wardId: this.selectedWardId,
      pollingCenterId: this.selectedPollingCenterId
    };

    this.filtersSelected.emit(filters);
  }

  resetFilters() {
    this.selectedProvinceId = null;
    this.selectedDistrictId = null;
    this.selectedMunicipalityId = null;
    this.selectedWardId = null;
    this.selectedPollingCenterId = null;
    this.districts = [];
    this.municipalities = [];
    this.wards = [];
    this.pollingCenters = [];
  }
}

