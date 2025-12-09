import { Component, OnInit, Output, EventEmitter, OnChanges, SimpleChanges, Input, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../../services/supabase.service';

export interface FilterSelection {
  provinceId: number | null;
  districtId: number | null;
  municipalityIds: number[];
  wardIds: number[];
  pollingCenterIds: number[];
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

  // Filtered data for search
  filteredMunicipalities: any[] = [];
  filteredWards: any[] = [];
  filteredPollingCenters: any[] = [];

  // Search terms
  municipalitySearchTerm: string = '';
  wardSearchTerm: string = '';
  pollingCenterSearchTerm: string = '';

  // Dropdown open states
  isMunicipalityDropdownOpen = false;
  isWardDropdownOpen = false;
  isPollingCenterDropdownOpen = false;

  // Selected values
  selectedProvinceId: number | null = null;
  selectedDistrictId: number | null = null;
  selectedMunicipalityIds: number[] = [];
  selectedWardIds: number[] = [];
  selectedPollingCenterIds: number[] = [];

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
    this.selectedMunicipalityIds = [];
    this.selectedWardIds = [];
    this.selectedPollingCenterIds = [];
    this.districts = [];
    this.municipalities = [];
    this.filteredMunicipalities = [];
    this.wards = [];
    this.filteredWards = [];
    this.pollingCenters = [];
    this.filteredPollingCenters = [];
    this.municipalitySearchTerm = '';
    this.wardSearchTerm = '';
    this.pollingCenterSearchTerm = '';

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
    this.selectedMunicipalityIds = [];
    this.selectedWardIds = [];
    this.selectedPollingCenterIds = [];
    this.municipalities = [];
    this.filteredMunicipalities = [];
    this.wards = [];
    this.filteredWards = [];
    this.pollingCenters = [];
    this.filteredPollingCenters = [];
    this.municipalitySearchTerm = '';
    this.wardSearchTerm = '';
    this.pollingCenterSearchTerm = '';

    if (this.selectedDistrictId) {
      this.loadMunicipalities(this.selectedDistrictId);
    }
  }

  async loadMunicipalities(districtId: number) {
    this.loadingMunicipalities = true;
    try {
      const data = await this.supabaseService.getMunicipalitiesByDistrict(districtId);
      this.municipalities = data || [];
      this.filteredMunicipalities = this.municipalities;
      this.municipalitySearchTerm = '';
    } catch (error) {
      console.error('Error loading municipalities:', error);
      this.municipalities = [];
      this.filteredMunicipalities = [];
    } finally {
      this.loadingMunicipalities = false;
      this.cdr.detectChanges();
    }
  }

  async onMunicipalityChange() {
    // Reset dependent dropdowns
    this.selectedWardIds = [];
    this.selectedPollingCenterIds = [];
    this.wards = [];
    this.filteredWards = [];
    this.pollingCenters = [];
    this.filteredPollingCenters = [];
    this.wardSearchTerm = '';
    this.pollingCenterSearchTerm = '';
    this.isWardDropdownOpen = false;
    this.isPollingCenterDropdownOpen = false;

    if (this.selectedMunicipalityIds.length > 0) {
      await this.loadWardsForMunicipalities(this.selectedMunicipalityIds);
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

  async loadWardsForMunicipalities(municipalityIds: number[]) {
    this.loadingWards = true;
    try {
      const allWards: any[] = [];
      const uniqueWardIds = new Set<number>();

      // Load wards for each selected municipality
      for (const municipalityId of municipalityIds) {
        const data = await this.supabaseService.getWardsByMunicipality(municipalityId);
        if (data) {
          // Add wards that haven't been added yet (avoid duplicates)
          for (const ward of data) {
            if (!uniqueWardIds.has(ward.id)) {
              uniqueWardIds.add(ward.id);
              allWards.push(ward);
            }
          }
        }
      }

      // Sort by ward number
      this.wards = allWards.sort((a, b) => a.ward_number - b.ward_number);
      this.filteredWards = this.wards;
      this.wardSearchTerm = '';
    } catch (error) {
      console.error('Error loading wards:', error);
      this.wards = [];
      this.filteredWards = [];
    } finally {
      this.loadingWards = false;
      this.cdr.detectChanges();
    }
  }

  async onWardChange() {
    // Reset dependent dropdowns
    this.selectedPollingCenterIds = [];
    this.pollingCenters = [];
    this.filteredPollingCenters = [];
    this.pollingCenterSearchTerm = '';
    this.isPollingCenterDropdownOpen = false;

    if (this.selectedWardIds.length > 0) {
      await this.loadPollingCentersForWards(this.selectedWardIds);
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

  async loadPollingCentersForWards(wardIds: number[]) {
    this.loadingPollingCenters = true;
    try {
      const allPollingCenters: any[] = [];
      const uniqueCenterIds = new Set<number>();

      // Load polling centers for each selected ward
      for (const wardId of wardIds) {
        const data = await this.supabaseService.getPollingCentersByWard(wardId);
        if (data) {
          // Add centers that haven't been added yet (avoid duplicates)
          for (const center of data) {
            if (!uniqueCenterIds.has(center.id)) {
              uniqueCenterIds.add(center.id);
              allPollingCenters.push(center);
            }
          }
        }
      }

      // Sort by nepali name
      this.pollingCenters = allPollingCenters.sort((a, b) => 
        (a.nepali_name || '').localeCompare(b.nepali_name || '')
      );
      this.filteredPollingCenters = this.pollingCenters;
      this.pollingCenterSearchTerm = '';
    } catch (error) {
      console.error('Error loading polling centers:', error);
      this.pollingCenters = [];
      this.filteredPollingCenters = [];
    } finally {
      this.loadingPollingCenters = false;
      this.cdr.detectChanges();
    }
  }

  onSubmit() {
    if (this.selectedPollingCenterIds.length === 0) {
      alert('Please select at least one polling center');
      return;
    }

    const filters: FilterSelection = {
      provinceId: this.selectedProvinceId,
      districtId: this.selectedDistrictId,
      municipalityIds: this.selectedMunicipalityIds,
      wardIds: this.selectedWardIds,
      pollingCenterIds: this.selectedPollingCenterIds
    };

    this.filtersSelected.emit(filters);
  }

  resetFilters() {
    this.selectedProvinceId = null;
    this.selectedDistrictId = null;
    this.selectedMunicipalityIds = [];
    this.selectedWardIds = [];
    this.selectedPollingCenterIds = [];
    this.districts = [];
    this.municipalities = [];
    this.wards = [];
    this.pollingCenters = [];
    this.filteredMunicipalities = [];
    this.filteredWards = [];
    this.filteredPollingCenters = [];
    this.municipalitySearchTerm = '';
    this.wardSearchTerm = '';
    this.pollingCenterSearchTerm = '';
    this.isMunicipalityDropdownOpen = false;
    this.isWardDropdownOpen = false;
    this.isPollingCenterDropdownOpen = false;
  }

  filterMunicipalities() {
    const term = this.municipalitySearchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredMunicipalities = this.municipalities;
    } else {
      this.filteredMunicipalities = this.municipalities.filter(m => 
        (m.nepali_name && m.nepali_name.toLowerCase().includes(term)) ||
        (m.english_name && m.english_name.toLowerCase().includes(term))
      );
    }
  }

  filterWards() {
    const term = this.wardSearchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredWards = this.wards;
    } else {
      this.filteredWards = this.wards.filter(w => 
        (w.ward_number && w.ward_number.toString().includes(term)) ||
        (w.nepali_name && w.nepali_name.toLowerCase().includes(term)) ||
        (w.english_name && w.english_name.toLowerCase().includes(term))
      );
    }
  }

  filterPollingCenters() {
    const term = this.pollingCenterSearchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredPollingCenters = this.pollingCenters;
    } else {
      this.filteredPollingCenters = this.pollingCenters.filter(c => 
        (c.nepali_name && c.nepali_name.toLowerCase().includes(term)) ||
        (c.english_name && c.english_name.toLowerCase().includes(term))
      );
    }
  }

  isMunicipalitySelected(id: number): boolean {
    return this.selectedMunicipalityIds.includes(id);
  }

  isWardSelected(id: number): boolean {
    return this.selectedWardIds.includes(id);
  }

  isPollingCenterSelected(id: number): boolean {
    return this.selectedPollingCenterIds.includes(id);
  }

  async toggleMunicipality(id: number) {
    const index = this.selectedMunicipalityIds.indexOf(id);
    if (index > -1) {
      this.selectedMunicipalityIds.splice(index, 1);
    } else {
      this.selectedMunicipalityIds.push(id);
    }
    await this.onMunicipalityChange();
  }

  async toggleWard(id: number) {
    const index = this.selectedWardIds.indexOf(id);
    if (index > -1) {
      this.selectedWardIds.splice(index, 1);
    } else {
      this.selectedWardIds.push(id);
    }
    await this.onWardChange();
  }

  togglePollingCenter(id: number) {
    const index = this.selectedPollingCenterIds.indexOf(id);
    if (index > -1) {
      this.selectedPollingCenterIds.splice(index, 1);
    } else {
      this.selectedPollingCenterIds.push(id);
    }
  }

  toggleMunicipalityDropdown() {
    const wasOpen = this.isMunicipalityDropdownOpen;
    
    // Close all other dropdowns
    if (this.isWardDropdownOpen) {
      this.isWardDropdownOpen = false;
      this.wardSearchTerm = '';
      this.filterWards();
    }
    if (this.isPollingCenterDropdownOpen) {
      this.isPollingCenterDropdownOpen = false;
      this.pollingCenterSearchTerm = '';
      this.filterPollingCenters();
    }
    
    // Toggle this dropdown
    this.isMunicipalityDropdownOpen = !wasOpen;
    if (!this.isMunicipalityDropdownOpen) {
      this.municipalitySearchTerm = '';
      this.filterMunicipalities();
    }
  }

  toggleWardDropdown() {
    const wasOpen = this.isWardDropdownOpen;
    
    // Close all other dropdowns
    if (this.isMunicipalityDropdownOpen) {
      this.isMunicipalityDropdownOpen = false;
      this.municipalitySearchTerm = '';
      this.filterMunicipalities();
    }
    if (this.isPollingCenterDropdownOpen) {
      this.isPollingCenterDropdownOpen = false;
      this.pollingCenterSearchTerm = '';
      this.filterPollingCenters();
    }
    
    // Toggle this dropdown
    this.isWardDropdownOpen = !wasOpen;
    if (!this.isWardDropdownOpen) {
      this.wardSearchTerm = '';
      this.filterWards();
    }
  }

  togglePollingCenterDropdown() {
    const wasOpen = this.isPollingCenterDropdownOpen;
    
    // Close all other dropdowns
    if (this.isMunicipalityDropdownOpen) {
      this.isMunicipalityDropdownOpen = false;
      this.municipalitySearchTerm = '';
      this.filterMunicipalities();
    }
    if (this.isWardDropdownOpen) {
      this.isWardDropdownOpen = false;
      this.wardSearchTerm = '';
      this.filterWards();
    }
    
    // Toggle this dropdown
    this.isPollingCenterDropdownOpen = !wasOpen;
    if (!this.isPollingCenterDropdownOpen) {
      this.pollingCenterSearchTerm = '';
      this.filterPollingCenters();
    }
  }

  getMunicipalityButtonText(): string {
    if (this.selectedMunicipalityIds.length === 0) {
      return 'Select Municipalities';
    }
    return `${this.selectedMunicipalityIds.length} selected`;
  }

  getWardButtonText(): string {
    if (this.selectedWardIds.length === 0) {
      return 'Select Wards';
    }
    return `${this.selectedWardIds.length} selected`;
  }

  getPollingCenterButtonText(): string {
    if (this.selectedPollingCenterIds.length === 0) {
      return 'Select Polling Centers';
    }
    return `${this.selectedPollingCenterIds.length} selected`;
  }

  selectAllMunicipalities() {
    const availableIds = this.filteredMunicipalities
      .map(m => m.id)
      .filter(id => !this.selectedMunicipalityIds.includes(id));
    
    this.selectedMunicipalityIds = [...this.selectedMunicipalityIds, ...availableIds];
    this.onMunicipalityChange();
  }

  deselectAllMunicipalities() {
    const filteredIds = this.filteredMunicipalities.map(m => m.id);
    this.selectedMunicipalityIds = this.selectedMunicipalityIds.filter(
      id => !filteredIds.includes(id)
    );
    this.onMunicipalityChange();
  }

  selectAllWards() {
    const availableIds = this.filteredWards
      .map(w => w.id)
      .filter(id => !this.selectedWardIds.includes(id));
    
    this.selectedWardIds = [...this.selectedWardIds, ...availableIds];
    this.onWardChange();
  }

  deselectAllWards() {
    const filteredIds = this.filteredWards.map(w => w.id);
    this.selectedWardIds = this.selectedWardIds.filter(
      id => !filteredIds.includes(id)
    );
    this.onWardChange();
  }

  selectAllPollingCenters() {
    const availableIds = this.filteredPollingCenters
      .map(c => c.id)
      .filter(id => !this.selectedPollingCenterIds.includes(id));
    
    this.selectedPollingCenterIds = [...this.selectedPollingCenterIds, ...availableIds];
  }

  deselectAllPollingCenters() {
    const filteredIds = this.filteredPollingCenters.map(c => c.id);
    this.selectedPollingCenterIds = this.selectedPollingCenterIds.filter(
      id => !filteredIds.includes(id)
    );
  }

  areAllMunicipalitiesSelected(): boolean {
    if (this.filteredMunicipalities.length === 0) return false;
    return this.filteredMunicipalities.every(m => 
      this.selectedMunicipalityIds.includes(m.id)
    );
  }

  areAllWardsSelected(): boolean {
    if (this.filteredWards.length === 0) return false;
    return this.filteredWards.every(w => 
      this.selectedWardIds.includes(w.id)
    );
  }

  areAllPollingCentersSelected(): boolean {
    if (this.filteredPollingCenters.length === 0) return false;
    return this.filteredPollingCenters.every(c => 
      this.selectedPollingCenterIds.includes(c.id)
    );
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // Check if click is inside any multiselect container
    const clickedContainer = target.closest('.multiselect-container');
    
    // Get all multiselect containers in the component
    const allContainers = document.querySelectorAll('.multiselect-container');
    let isInsideAnyContainer = false;
    
    allContainers.forEach(container => {
      if (container.contains(target)) {
        isInsideAnyContainer = true;
      }
    });
    
    // Close all dropdowns if clicking outside any container
    if (!isInsideAnyContainer) {
      this.isMunicipalityDropdownOpen = false;
      this.isWardDropdownOpen = false;
      this.isPollingCenterDropdownOpen = false;
    }
  }
}

