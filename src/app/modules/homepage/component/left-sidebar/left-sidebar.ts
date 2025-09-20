import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QueryParamService } from '../../../../services/query-param.service';
import { NEPAL_DATA } from '../../../../../assets/constants/nepal';
import { INDIA_DATA } from '../../../../../assets/constants/india';


interface FilterOption {
  value: string;
  name: string;
}

interface Province {
  id: string;
  name: string;
  nameNepali?: string;
  nameLocal?: string;
  population: number;
  area: number;
  districts?: District[];
}

interface District {
  id: string;
  name: string;
  nameNepali?: string;
  nameLocal?: string;
  population: number;
  area: number;
  municipalities?: Municipality[];
}

interface Municipality {
  id: string;
  name: string;
  nameNepali?: string;
  nameLocal?: string;
  population: number;
  area: number;
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
  showPopulationLayer = false;

  // Data from constants files
  provinces: Province[] = [];
  districts: District[] = [];
  municipalities: Municipality[] = [];

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
    // Listen to country changes
    this.queryParamService.country$.subscribe(country => {
      if(country){
        this.selectedCountry=country
        this.loadCountryMap(this.selectedCountry)
      }
    });
  }
  
  private loadCountryMap(country: string) {
    switch (country?.toLowerCase()) {
      case 'nepal':
        this.provinces = NEPAL_DATA.provinces.map(province => ({
          id: province.id,
          name: province.name,
          nameNepali: province.nameNepali,
          population: province.population,
          area: province.area,
          districts: province.districts?.map(district => ({
            id: district.id,
            name: district.name,
            nameNepali: district.nameNepali,
            population: district.population,
            area: district.area,
            municipalities: district.municipalities?.map(municipality => ({
              id: municipality.id,
              name: municipality.name,
              nameNepali: municipality.nameNepali,
              population: municipality.population,
              area: municipality.area
            }))
          }))
        }));
        break;
      case 'india':
        this.provinces = INDIA_DATA.states.map(state => ({
          id: state.id,
          name: state.name,
          nameLocal: state.nameLocal,
          population: state.population,
          area: state.area,
          districts: state.districts?.map(district => ({
            id: district.id,
            name: district.name,
            nameLocal: district.nameLocal,
            population: district.population,
            area: district.area,
            municipalities: district.municipalities?.map(municipality => ({
              id: municipality.id,
              name: municipality.name,
              nameLocal: municipality.nameLocal,
              population: municipality.population,
              area: municipality.area
            }))
          }))
        }));
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
    
    // Get districts for selected province from constants data
    if (this.selectedProvince) {
      const selectedProvinceData = this.provinces.find(
        province => province.id === this.selectedProvince
      );
      this.districts = selectedProvinceData?.districts || [];
    } else {
      this.districts = [];
    }
    
    this.emitFilterChange();
  }

  onDistrictChange() {
    this.selectedMunicipality = '';
    
    // Get municipalities for selected district from constants data
    if (this.selectedDistrict) {
      const selectedDistrictData = this.districts.find(
        district => district.id === this.selectedDistrict
      );
      this.municipalities = selectedDistrictData?.municipalities || [];
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
