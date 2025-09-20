import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FilterOption {
  value: string;
  name: string;
}

@Component({
  selector: 'app-left-sidebar',
  standalone: false,
  templateUrl: './left-sidebar.html',
  styleUrl: './left-sidebar.scss'
})
export class LeftSidebar {
  @Output() filterChange = new EventEmitter<any>();
  @Output() populationToggle = new EventEmitter<boolean>();
  @Output() sidebarToggle = new EventEmitter<void>();

  // Filter values
  selectedCountry = '';
  selectedProvince = '';
  selectedDistrict = '';
  selectedMunicipality = '';
  showPopulationLayer = false;

  // Sample data - in real app, this would come from a service
  provinces: FilterOption[] = [
    { value: 'province1', name: 'Province 1' },
    { value: 'province2', name: 'Province 2' },
    { value: 'province3', name: 'Province 3' },
    { value: 'province4', name: 'Province 4' },
    { value: 'province5', name: 'Province 5' },
    { value: 'province6', name: 'Province 6' },
    { value: 'province7', name: 'Province 7' }
  ];

  districts: FilterOption[] = [];
  municipalities: FilterOption[] = [];

  // Stats (mock data)
  totalSchools = '2,847';
  totalPopulation = '29.1M';
  selectedArea = '147,181';

  onCountryChange() {
    this.selectedProvince = '';
    this.selectedDistrict = '';
    this.selectedMunicipality = '';
    this.districts = [];
    this.municipalities = [];
    this.emitFilterChange();
  }

  onProvinceChange() {
    this.selectedDistrict = '';
    this.selectedMunicipality = '';
    this.municipalities = [];
    
    // Mock districts based on selected province
    if (this.selectedProvince) {
      this.districts = [
        { value: 'district1', name: 'District 1' },
        { value: 'district2', name: 'District 2' },
        { value: 'district3', name: 'District 3' }
      ];
    } else {
      this.districts = [];
    }
    
    this.emitFilterChange();
  }

  onDistrictChange() {
    this.selectedMunicipality = '';
    
    // Mock municipalities based on selected district
    if (this.selectedDistrict) {
      this.municipalities = [
        { value: 'municipality1', name: 'Municipality 1' },
        { value: 'municipality2', name: 'Municipality 2' },
        { value: 'municipality3', name: 'Municipality 3' }
      ];
    } else {
      this.municipalities = [];
    }
    
    this.emitFilterChange();
  }

  onMunicipalityChange() {
    this.emitFilterChange();
  }

  onPopulationToggle() {
    this.populationToggle.emit(this.showPopulationLayer);
  }

  resetFilters() {
    this.selectedCountry = '';
    this.selectedProvince = '';
    this.selectedDistrict = '';
    this.selectedMunicipality = '';
    this.districts = [];
    this.municipalities = [];
    this.emitFilterChange();
  }

  toggleSidebar() {
    this.sidebarToggle.emit();
  }

  private emitFilterChange() {
    this.filterChange.emit({
      country: this.selectedCountry,
      province: this.selectedProvince,
      district: this.selectedDistrict,
      municipality: this.selectedMunicipality
    });
  }
}
