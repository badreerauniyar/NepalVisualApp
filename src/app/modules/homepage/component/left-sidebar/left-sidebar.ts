import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QueryParamService } from '../../../../services/query-param.service';
import { INDIA_DATA } from '../../../../../assets/constants/india';
import * as nepalData from '../../../../../assets/constants/nepal-data.json';


interface FilterOption {
  value: string;
  name: string;
}

interface Province {
  id: number;
  name: string;
  area_sq_km: string;
  website: string;
  headquarter: string;
  districts: District[];
}

interface District {
  id: number;
  province_id: number;
  name: string;
  area_sq_km: string;
  website: string;
  headquarter: string;
  municipalities: Municipality[];
}

interface Municipality {
  id: number;
  district_id: number;
  category_id: number;
  name: string;
  area_sq_km: string;
  website: string;
  wards: number[];
}

interface Ward {
  wardNumber: number;
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
  selectedCountry = '';
  selectedProvince = '';
  selectedDistrict = '';
  selectedMunicipality = '';
  selectedWard = '';
  showPopulationLayer = false;

  // Data from constants files
  provinces: Province[] = [];
  districts: District[] = [];
  municipalities: Municipality[] = [];
  wards: Ward[] = [];

  // Stats (mock data)
  totalSchools = '2,847';
  totalPopulation = '29.1M';
  selectedArea = '147,181';

  constructor(
    private queryParamService: QueryParamService
  ) {
    // Data will be loaded from constants files based on selected country
  }

  ngOnInit() {
    // Listen to all parameter changes
    this.queryParamService.country$.subscribe(country => {
      this.selectedCountry = country;
      this.loadStateData(this.selectedCountry);
    });

    this.queryParamService.province$.subscribe(province => {
      this.selectedProvince = province;
      this.loadDistrictsForProvince();
      this.emitFilterChange();
    });

    this.queryParamService.district$.subscribe(district => {
      this.selectedDistrict = district;
      this.loadMunicipalitiesForDistrict();
      this.emitFilterChange();
    });

    this.queryParamService.municipality$.subscribe(municipality => {
      this.selectedMunicipality = municipality;
      this.loadWardsForMunicipality();
      this.emitFilterChange();
    });

    this.queryParamService.ward$.subscribe(ward => {
      this.selectedWard = ward;
      this.emitFilterChange();
    });
  }
  
  private loadStateData(country: string) {
    switch (country?.toLowerCase()) {
      case 'nepal':
        // Extract only provinces from nepalData, avoiding heavy district data
        const nepalDataObj = (nepalData as any).default || nepalData;
        const provinces = nepalDataObj[0]?.provinces || [];
        
        // Map provinces to provinces and remove districts data to keep it lightweight
        this.provinces = provinces.map((state: any) => ({
          id: state.id,
          name: state.name,
          area_sq_km: state.area_sq_km,
          website: state.website,
          headquarter: state.headquarter,
          districts: [] // Empty array - districts will be loaded when needed
        }));
        console.log(this.provinces)
        break;
      default:
        this.provinces = [];
    }
  }

  onCountryChange() {
    this.queryParamService.setCountry(this.selectedCountry);
    this.emitFilterChange();
  }

  onProvinceChange() {
    this.queryParamService.setProvince(this.selectedProvince);
    this.loadDistrictsForProvince();
    this.emitFilterChange();
  }

  private loadDistrictsForProvince() {
    // Get districts for selected province from constants data
    if (this.selectedProvince) {
      // Load districts dynamically from nepalData
      const nepalDataObj = (nepalData as any).default || nepalData;
      const provinces = nepalDataObj[0]?.provinces || [];
      const selectedState = provinces.find((state: any) => state.id.toString() === this.selectedProvince);
      
      // Map districts and remove municipalities data to keep it lightweight
      this.districts = selectedState?.districts?.map((district: any) => ({
        id: district.id,
        province_id: district.province_id,
        name: district.name,
        area_sq_km: district.area_sq_km,
        website: district.website,
        headquarter: district.headquarter,
        municipalities: [] // Empty array - municipalities will be loaded when needed
      })) || [];
    } else {
      this.districts = [];
    }
  }

  onDistrictChange() {
    this.queryParamService.setDistrict(this.selectedDistrict);
    this.loadMunicipalitiesForDistrict();
    this.emitFilterChange();
  }

  private loadMunicipalitiesForDistrict() {
    // Get municipalities for selected district from constants data
    if (this.selectedDistrict) {
      // Load municipalities dynamically from nepalData
      const nepalDataObj = (nepalData as any).default || nepalData;
      const provinces = nepalDataObj[0]?.provinces || [];
      const selectedState = provinces.find((state: any) => state.id.toString() === this.selectedProvince);
      const selectedDistrict = selectedState?.districts?.find((district: any) => district.id.toString() === this.selectedDistrict);
      
      // Map municipalities and remove wards data to keep it lightweight
      this.municipalities = selectedDistrict?.municipalities?.map((municipality: any) => ({
        id: municipality.id,
        district_id: municipality.district_id,
        category_id: municipality.category_id,
        name: municipality.name,
        area_sq_km: municipality.area_sq_km,
        website: municipality.website,
        wards: [] // Empty array - wards will be loaded when needed
      })) || [];
    } else {
      this.municipalities = [];
    }
  }

  onMunicipalityChange() {
    this.queryParamService.setMunicipality(this.selectedMunicipality);
    this.loadWardsForMunicipality();
    this.emitFilterChange();
  }

  private loadWardsForMunicipality() {
    // Get wards for selected municipality
    if (this.selectedMunicipality) {
      // Load wards dynamically from nepalData
      const nepalDataObj = (nepalData as any).default || nepalData;
      const provinces = nepalDataObj[0]?.provinces || [];
      const selectedState = provinces.find((state: any) => state.id.toString() === this.selectedProvince);
      const selectedDistrict = selectedState?.districts?.find((district: any) => district.id.toString() === this.selectedDistrict);
      const selectedMunicipality = selectedDistrict?.municipalities?.find((municipality: any) => municipality.id.toString() === this.selectedMunicipality);
      
      this.wards = selectedMunicipality?.wards?.map((wardNumber: number) => ({ wardNumber })) || [];
    } else {
      this.wards = [];
    }
  }

  onWardChange() {
    this.queryParamService.setWard(this.selectedWard);
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
    this.selectedWard = '';
    this.districts = [];
    this.municipalities = [];
    this.wards = [];
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
      municipality: this.selectedMunicipality,
      ward: this.selectedWard
    });
  }
}
