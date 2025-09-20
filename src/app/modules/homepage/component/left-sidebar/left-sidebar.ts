import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapboxService, NepalProvince, NepalDistrict } from '../../../../services/mapbox.service';
import { QueryParamService } from '../../../../services/query-param.service';

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
export class LeftSidebar implements OnInit {
  @Output() filterChange = new EventEmitter<any>();
  @Output() populationToggle = new EventEmitter<boolean>();
  @Output() sidebarToggle = new EventEmitter<void>();

  // Filter values
  selectedCountry = 'nepal';
  selectedProvince = '';
  selectedDistrict = '';
  selectedMunicipality = '';
  showPopulationLayer = false;

  // Real Nepal data from MapboxService
  provinces: NepalProvince[] = [];
  districts: NepalDistrict[] = [];
  municipalities: FilterOption[] = [];

  // Stats (mock data)
  totalSchools = '2,847';
  totalPopulation = '29.1M';
  selectedArea = '147,181';

  constructor(
    private mapboxService: MapboxService,
    private queryParamService: QueryParamService
  ) {
    // Provinces will be loaded dynamically from GeoJSON
  }

  ngOnInit() {
    // Listen to country changes
    this.queryParamService.country$.subscribe(country => {
      this.selectedCountry = country;
      this.updateProvincesForCountry(country);
    });

    // Load initial data
    this.updateProvincesForCountry(this.queryParamService.getCurrentCountry());
  }

  private updateProvincesForCountry(country: string) {
    switch (country.toLowerCase()) {
      case 'nepal':
        this.provinces = this.mapboxService.getProvinces();
        break;
      case 'india':
        // For India, we'll use states instead of provinces
        this.provinces = [];
        break;
      default:
        this.provinces = [];
    }
  }

  onCountryChange() {
    this.selectedProvince = '';
    this.selectedDistrict = '';
    this.selectedMunicipality = '';
    this.districts = [];
    this.municipalities = [];
    
    // Update query parameter
    this.queryParamService.setCountry(this.selectedCountry);
    
    this.emitFilterChange();
  }

  onProvinceChange() {
    this.selectedDistrict = '';
    this.selectedMunicipality = '';
    this.municipalities = [];
    
    // Get districts for selected province
    if (this.selectedProvince) {
      this.districts = this.mapboxService.districts.filter(
        district => district.provinceId === this.selectedProvince
      );
    } else {
      this.districts = [];
    }
    
    this.emitFilterChange();
  }

  onDistrictChange() {
    this.selectedMunicipality = '';
    
    // Mock municipalities based on selected district
    // In a real app, this would come from a service
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
