import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import { QueryParamService } from './query-param.service';
import * as nepalData from '../../assets/constants/nepal-data.json';
import { NEPAL_DATA } from '../../assets/constants/nepal';

export interface country {
  id: string;
  name: string;
  localName: string;
  population: number;
  area: number;
  center: [number, number];
  zoom: number;
  geojsonFile: string;
}
export interface province {
  id: string;
  name: string;
  localName: string;
  population: number;
  area: number;
  center: [number, number];
}

export interface district {
  id: string;
  name: string;
  localName: string;
  population: number;
  area: number;
  center: [number, number];
}
export interface localLevel {
  id: string;
  name: string;
  localName: string;
  population: number;
  area: number;
  center: [number, number];
}


export interface MapFilter {
  country?: string;
  province?: string;
  district?: string;
  municipality?: string;
}

export interface ProvinceSelection {
  id: string;
  name: string;
  localName: string;
  population: number;
  area: number;
  center: [number, number];
  geojsonFile: string;
}

export interface DistrictSelection {
  id: string;
  name: string;
  localName: string;
  population: number;
  area: number;
  center: [number, number];
  geojsonFile: string;
  provinceId: string;
}

export interface MunicipalitySelection {
  id: string;
  name: string;
  localName: string;
  population: number;
  area: number;
  center: [number, number];
  geojsonFile: string;
  districtId: string;
  provinceId: string;
}

@Injectable({
  providedIn: 'root'
})
export class MapboxService {
  private map: mapboxgl.Map | null = null;
  private isInitialized = false;
  private countries: country[] = [];
  private provinces: province[] = [];
  private districts: district[] = [];
  private localLevels: localLevel[] = [];
  private currentCountry: string = '';
  private currentProvince: string = '';
  private currentDistrict: string = '';
  private currentMunicipality: string = '';

  // Current selections (for internal use only)
  private currentProvinceData: ProvinceSelection | null = null;
  private currentDistrictData: DistrictSelection | null = null;
  private currentMunicipalityData: MunicipalitySelection | null = null;

  constructor(private queryParamService: QueryParamService) {
    // Listen to country changes
    this.queryParamService.country$.subscribe(country => {
      this.currentCountry = country;
      if (this.map && this.currentCountry) {
        this.loadCountryData(country);
        // this.loadProvincesData();
      }
    });

    // Listen to province changes from query parameters
    this.queryParamService.province$.subscribe(provinceId => {
      console.log('provinceId',provinceId)
      if (provinceId && this.map && this.currentCountry) {
        // Convert numeric province ID to province data ID format
        const mappedProvinceId = this.mapProvinceId(provinceId);
        console.log(`mappedProvinceId`,mappedProvinceId)
        if (mappedProvinceId) {
          this.selectProvince(mappedProvinceId);
        }
      } else if (!provinceId) {
        this.deselectProvince();
      }
    });

    // Listen to district changes from query parameters
    this.queryParamService.district$.subscribe(districtId => {
      if (districtId && this.map && this.currentProvince) {
        this.selectDistrict(districtId);
      } else if (!districtId) {
        this.deselectDistrict();
      }
    });

    // Listen to municipality changes from query parameters
    this.queryParamService.municipality$.subscribe(municipalityId => {
      if (municipalityId && this.map && this.currentDistrict) {
        this.selectMunicipality(municipalityId);
      } else if (!municipalityId) {
        this.deselectMunicipality();
      }
    });
  }

  async initializeMap(containerId: string): Promise<mapboxgl.Map> {
    if (this.isInitialized && this.map) {
      return this.map;
    }

    try {
      this.map = new mapboxgl.Map({
        container: containerId,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [84.1240, 28.3949], // Center of Nepal
        zoom: 6,
        projection: 'mercator',
        accessToken: `pk.eyJ1IjoiYmFkcmVlcmF1bml5YXIiLCJhIjoiY2t3NTV0bW9rMGIyYTJvcmh1aG51em9mdyJ9.G10LrSe11yvYmbFyLTYOQQ`
      });

      this.map.on('load', () => {
        this.isInitialized = true;
        if(this.currentCountry)
        this.loadCountryData(this.currentCountry);
      });

      return this.map;
    } catch (error) {
      console.error('Error initializing Mapbox:', error);
      throw error;
    }
  }


  public loadCountryData(country: string) {
    if(!country) return 
    if (!this.map) return;

    // Clear existing layers
    this.clearMapLayers();
    console.log(country)
    const countryData = this.getCountryData(country);
    console.log('countryData',countryData);
    if (!countryData) return;

    // Center map on country
    this.map.flyTo({
      center: countryData.center,
      zoom: 6,
      duration: 1000
    });

    // Load country-specific GeoJSON
    this.loadCountryGeoJSON(countryData.geojsonFile, country);
  }


  private getGeoJSONFileName(level: 'province' | 'district' | 'municipality', provinceId: string, name: string, districtId?: string, municipalityId?: string): string {
    const nameLower = name.toLowerCase().replace(/\s+/g, '_');
      console.log(`mun name`,name)
    switch (level) {
      case 'province':
        const id = provinceId.replace('province', '');
        return `${nameLower}province_${id}.geojson`;
      
      case 'district':
        return `${name}.geojson`;
      
      case 'municipality':
        return `${nameLower}.geojson`;
      
      default:
        return `${nameLower}.geojson`;
    }
  }

  private getGeoJSONFolderPath(level: 'province' | 'district' | 'municipality', provinceId: string, districtId?: string): string {
    const nepalDataObj = (nepalData as any).default || nepalData;
    const provinces = nepalDataObj[0]?.provinces || [];
    const province = provinces.find((p: any) => p.id.toString() === provinceId.replace('province', ''));
    
    if (!province) return '';
    
    const provinceNameLower = province.name.toLowerCase().replace(/\s+/g, '_');
    const provinceIdNum = provinceId.replace('province', '');
    const provinceFolder = `${provinceNameLower}province_${provinceIdNum}`;
    
    switch (level) {
      case 'province':
        return `maps-of-provinces`;
      
      case 'district':
        return `maps-of-districts/${provinceFolder}_districts`;
      
      case 'municipality':
        return `maps-of-municipalities/${provinceFolder}/${district?.toUpperCase()}`;
      
      default:
        return '';
    }
  }

  private mapProvinceId(queryParamId: string): string | null {
    // Map numeric province ID from query params to province data ID format
    // Query param: "1" -> Province data: "province1"
    const numericId = parseInt(queryParamId);
    if (isNaN(numericId) || numericId < 1 || numericId > 7) {
      return null;
    }
    return `province${numericId}`;
  }

  private getCountryData(country: string): country | null {
    console.log(country)
    if(!country) return null
    switch (country) {
      case 'nepal':
        return {
          id: NEPAL_DATA.countryCode,
          name: NEPAL_DATA.name,
          localName: NEPAL_DATA.localName,
          population: NEPAL_DATA.population,
          area: NEPAL_DATA.area,
          center: NEPAL_DATA.center,
          zoom: NEPAL_DATA.zoom,
          geojsonFile: NEPAL_DATA.geojsonFile,
        };
      default:
        return null;
    }
  }

  private loadCountryGeoJSON(filename: string, country: string) {
    console.log('filename',filename);
    console.log('country',country);
    fetch(`/assets/map-data/${country}/maps-of-nepal/${country}.geojson`)
      .then(response => response.json())
      .then(data => {
        console.log('country map data',data);
        const sourceId = `${country}-boundaries`;
        console.log('sourceId',sourceId);
        this.map!.addSource(sourceId, {
          type: 'geojson',
          data: data
        });

        this.addCountryLayers(sourceId, country);
      })
      .catch(error => {
        console.error(`Error loading ${country} data:`, error);
      });
  }

  public selectProvince(provinceId: string) {
    if (!this.map || !this.currentCountry) return;

    // Get province data directly from nepal-data.json
    const nepalDataObj = (nepalData as any).default || nepalData;
    const provinces = nepalDataObj[0]?.provinces || [];
    const provinceData = provinces.find((p: any) => p.id.toString() === provinceId.replace('province', ''));
    if (!provinceData) return;

    // Create province selection object
    const province: ProvinceSelection = {
      id: provinceId,
      name: provinceData.name,
      localName: provinceData.name_nepali || provinceData.name,
      population: provinceData.population || 0,
      area: parseFloat(provinceData.area_sq_km) || 0,
      center: [84.1240, 28.3949] as [number, number],
      geojsonFile: this.getGeoJSONFileName('province', provinceId, provinceData.name)
    };

    this.currentProvince = provinceId;
    this.currentProvinceData = province;

    // Clear existing province layers
    this.clearProvinceLayers();

    // Load province GeoJSON
    console.log(`province data`, province.geojsonFile, province)
    this.loadProvinceGeoJSON(province.geojsonFile, province);
  }

  public selectDistrict(districtId: string) {
    if (!this.map || !this.currentProvince) return;

    // Get district data directly from nepal-data.json
    const nepalDataObj = (nepalData as any).default || nepalData;
    const provinces = nepalDataObj[0]?.provinces || [];
    const provinceData = provinces.find((p: any) => p.id.toString() === this.currentProvince.replace('province', ''));
    if (!provinceData) return;

    const districtData = provinceData.districts.find((d: any) => d.id.toString() === districtId);
    if (!districtData) return;

    // Create district selection object
    const district: DistrictSelection = {
      id: districtId,
      name: districtData.name,
      localName: districtData.name_nepali || districtData.name,
      population: districtData.population || 0,
      area: parseFloat(districtData.area_sq_km) || 0,
      center: [84.1240, 28.3949] as [number, number],
      geojsonFile: this.getGeoJSONFileName('district', this.currentProvince, districtData.name, districtId),
      provinceId: this.currentProvince
    };

    this.currentDistrict = districtId;
    this.currentDistrictData = district;

    // Clear existing district layers
    this.clearDistrictLayers();

    // Load district GeoJSON
    this.loadDistrictGeoJSON(district.geojsonFile, district);
  }

  public selectMunicipality(municipalityId: string) {
    if (!this.map || !this.currentDistrict) return;

    // Get municipality data directly from nepal-data.json
    const nepalDataObj = (nepalData as any).default || nepalData;
    const provinces = nepalDataObj[0]?.provinces || [];
    const provinceData = provinces.find((p: any) => p.id.toString() === this.currentProvince.replace('province', ''));
    if (!provinceData) return;

    const districtData = provinceData.districts.find((d: any) => d.id.toString() === this.currentDistrict);
    if (!districtData) return;

    const municipalityData = districtData.municipalities.find((m: any) => m.id.toString() === municipalityId);
    if (!municipalityData) return;

    // Create municipality selection object
    const municipality: MunicipalitySelection = {
      id: municipalityId,
      name: municipalityData.name,
      localName: municipalityData.name_nepali || municipalityData.name,
      population: municipalityData.population || 0,
      area: parseFloat(municipalityData.area_sq_km) || 0,
      center: [84.1240, 28.3949] as [number, number],
      geojsonFile: this.getGeoJSONFileName('municipality', this.currentProvince, municipalityData.name, this.currentDistrict, municipalityId),
      districtId: this.currentDistrict,
      provinceId: this.currentProvince
    };

    this.currentMunicipality = municipalityId;
    this.currentMunicipalityData = municipality;

    // Clear existing municipality layers
    this.clearMunicipalityLayers();

    // Load municipality GeoJSON
    this.loadMunicipalityGeoJSON(municipality.geojsonFile, municipality);
  }

  private loadProvinceGeoJSON(filename: string, province: ProvinceSelection) {
    const folderPath = this.getGeoJSONFolderPath('province', province.id);
    console.log(`folderPath`,folderPath)
    const filePath = `/assets/map-data/${this.currentCountry}/maps-of-nepal/${folderPath}/${filename}`;
    
    fetch(filePath)
      .then(response => response.json())
      .then(data => {
        console.log('province map data', data);
        const sourceId = `province-${province.id}`;
        
        this.map!.addSource(sourceId, {
          type: 'geojson',
          data: data
        });

        this.addProvinceLayers(sourceId, province);
        
        // Center map on province
        this.map!.fitBounds(this.getBoundsFromGeoJSON(data), {
          padding: 50,
          duration: 1000
        });
      })
      .catch(error => {
        console.error(`Error loading province ${province.name} data:`, error);
      });
  }

  private loadDistrictGeoJSON(filename: string, district: DistrictSelection) {
    const folderPath = this.getGeoJSONFolderPath('district', district.provinceId);
    const filePath = `/assets/map-data/${this.currentCountry}/maps-of-nepal/${folderPath}/${filename}`;
    
    fetch(filePath)
      .then(response => response.json())
      .then(data => {
        console.log('district map data', data);
        const sourceId = `district-${district.id}`;
        
        this.map!.addSource(sourceId, {
          type: 'geojson',
          data: data
        });

        this.addDistrictLayers(sourceId, district);
        
        // Center map on district
        this.map!.fitBounds(this.getBoundsFromGeoJSON(data), {
          padding: 30,
          duration: 1000
        });
      })
      .catch(error => {
        console.error(`Error loading district ${district.name} data:`, error);
      });
  }

  private loadMunicipalityGeoJSON(filename: string, municipality: MunicipalitySelection) {
    const folderPath = this.getGeoJSONFolderPath('municipality', municipality.provinceId);
    const filePath = `/assets/map-data/${this.currentCountry}/maps-of-nepal/${folderPath}/${filename}`;
    
    fetch(filePath)
      .then(response => response.json())
      .then(data => {
        console.log('municipality map data', data);
        const sourceId = `municipality-${municipality.id}`;
        
        this.map!.addSource(sourceId, {
          type: 'geojson',
          data: data
        });

        this.addMunicipalityLayers(sourceId, municipality);
        
        // Center map on municipality
        this.map!.fitBounds(this.getBoundsFromGeoJSON(data), {
          padding: 20,
          duration: 1000
        });
      })
      .catch(error => {
        console.error(`Error loading municipality ${municipality.name} data:`, error);
      });
  }


  private getBoundsFromGeoJSON(geojson: any): mapboxgl.LngLatBounds {
    const bounds = new mapboxgl.LngLatBounds();
    
    if (geojson.type === 'FeatureCollection') {
      geojson.features.forEach((feature: any) => {
        if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates[0].forEach((coord: [number, number]) => {
            bounds.extend(coord);
          });
        } else if (feature.geometry.type === 'MultiPolygon') {
          feature.geometry.coordinates.forEach((polygon: any) => {
            polygon[0].forEach((coord: [number, number]) => {
              bounds.extend(coord);
            });
          });
        }
      });
    }
    
    return bounds;
  }

  private addCountryLayers(sourceId: string, country: string) {
    if (!this.map) return;

    // Add fill layer
    this.map.addLayer({
      id: `${country}-fill`,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          '#3b82f6',
          '#60a5fa'
        ],
        'fill-opacity': 0.6
      }
    });

    // Add stroke layer
    this.map.addLayer({
      id: `${country}-stroke`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#1e40af',
        'line-width': 2
      }
    });

    // Add labels
    this.map.addLayer({
      id: `${country}-labels`,
      type: 'symbol',
      source: sourceId,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        'text-size': 12,
        'text-anchor': 'center'
      },
      paint: {
        'text-color': '#1e40af',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    });

    // Add click handlers
    this.map.on('click', `${country}-fill`, (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const coordinates = e.lngLat;
        
        const props = feature.properties || {};
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div class="map-popup">
              <h3>${props['name'] || 'Unknown'}</h3>
              <p>${props['nameNepali'] || props['nameHindi'] || ''}</p>
              <p>Population: ${props['population']?.toLocaleString() || 'N/A'}</p>
              <p>Area: ${props['area']?.toLocaleString() || 'N/A'} km²</p>
            </div>
          `)
          .addTo(this.map!);
      }
    });

    // Add hover effects
    this.map.on('mouseenter', `${country}-fill`, () => {
      this.map!.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', `${country}-fill`, () => {
      this.map!.getCanvas().style.cursor = '';
    });
  }

  private addProvinceLayers(sourceId: string, province: ProvinceSelection) {
    if (!this.map) return;

    // Add fill layer
    this.map.addLayer({
      id: `province-${province.id}-fill`,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          '#10b981',
          '#34d399'
        ],
        'fill-opacity': 0.7
      }
    });

    // Add stroke layer
    this.map.addLayer({
      id: `province-${province.id}-stroke`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#059669',
        'line-width': 3
      }
    });

    // Add labels
    this.map.addLayer({
      id: `province-${province.id}-labels`,
      type: 'symbol',
      source: sourceId,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        'text-size': 14,
        'text-anchor': 'center'
      },
      paint: {
        'text-color': '#059669',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    });

    // Add click handlers
    this.map.on('click', `province-${province.id}-fill`, (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const coordinates = e.lngLat;
        
        const props = feature.properties || {};
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div class="map-popup">
              <h3>${province.name}</h3>
              <p>${province.localName}</p>
              <p>Population: ${province.population.toLocaleString()}</p>
              <p>Area: ${province.area.toLocaleString()} km²</p>
            </div>
          `)
          .addTo(this.map!);
      }
    });

    // Add hover effects
    this.map.on('mouseenter', `province-${province.id}-fill`, () => {
      this.map!.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', `province-${province.id}-fill`, () => {
      this.map!.getCanvas().style.cursor = '';
    });
  }

  private addDistrictLayers(sourceId: string, district: DistrictSelection) {
    if (!this.map) return;

    // Add fill layer
    this.map.addLayer({
      id: `district-${district.id}-fill`,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          '#f59e0b',
          '#fbbf24'
        ],
        'fill-opacity': 0.6
      }
    });

    // Add stroke layer
    this.map.addLayer({
      id: `district-${district.id}-stroke`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#d97706',
        'line-width': 2
      }
    });

    // Add labels
    this.map.addLayer({
      id: `district-${district.id}-labels`,
      type: 'symbol',
      source: sourceId,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        'text-size': 12,
        'text-anchor': 'center'
      },
      paint: {
        'text-color': '#d97706',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    });

    // Add click handlers
    this.map.on('click', `district-${district.id}-fill`, (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const coordinates = e.lngLat;
        
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div class="map-popup">
              <h3>${district.name}</h3>
              <p>${district.localName}</p>
              <p>Population: ${district.population.toLocaleString()}</p>
              <p>Area: ${district.area.toLocaleString()} km²</p>
            </div>
          `)
          .addTo(this.map!);
      }
    });

    // Add hover effects
    this.map.on('mouseenter', `district-${district.id}-fill`, () => {
      this.map!.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', `district-${district.id}-fill`, () => {
      this.map!.getCanvas().style.cursor = '';
    });
  }

  private addMunicipalityLayers(sourceId: string, municipality: MunicipalitySelection) {
    if (!this.map) return;

    // Add fill layer
    this.map.addLayer({
      id: `municipality-${municipality.id}-fill`,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          '#dc2626',
          '#ef4444'
        ],
        'fill-opacity': 0.5
      }
    });

    // Add stroke layer
    this.map.addLayer({
      id: `municipality-${municipality.id}-stroke`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#b91c1c',
        'line-width': 1
      }
    });

    // Add labels
    this.map.addLayer({
      id: `municipality-${municipality.id}-labels`,
      type: 'symbol',
      source: sourceId,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        'text-size': 10,
        'text-anchor': 'center'
      },
      paint: {
        'text-color': '#b91c1c',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1
      }
    });

    // Add click handlers
    this.map.on('click', `municipality-${municipality.id}-fill`, (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const coordinates = e.lngLat;
        
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div class="map-popup">
              <h3>${municipality.name}</h3>
              <p>${municipality.localName}</p>
              <p>Population: ${municipality.population.toLocaleString()}</p>
              <p>Area: ${municipality.area.toLocaleString()} km²</p>
            </div>
          `)
          .addTo(this.map!);
      }
    });

    // Add hover effects
    this.map.on('mouseenter', `municipality-${municipality.id}-fill`, () => {
      this.map!.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', `municipality-${municipality.id}-fill`, () => {
      this.map!.getCanvas().style.cursor = '';
    });
  }

  private clearMapLayers() {
    if (!this.map) return;

    // Remove existing layers
    const layersToRemove = [
      'nepal-fill', 'nepal-stroke', 'nepal-labels',
      'india-fill', 'india-stroke', 'india-labels'
    ];

    layersToRemove.forEach(layerId => {
      if (this.map!.getLayer(layerId)) {
        this.map!.removeLayer(layerId);
      }
    });

    // Remove existing sources
    const sourcesToRemove = [
      'nepal-boundaries', 'india-boundaries'
    ];

    sourcesToRemove.forEach(sourceId => {
      if (this.map!.getSource(sourceId)) {
        this.map!.removeSource(sourceId);
      }
    });

    // Clear province layers
    this.clearProvinceLayers();
  }

  private clearProvinceLayers() {
    if (!this.map) return;

    // Remove all province layers
    const provinceLayers = this.map.getStyle().layers
      .filter(layer => layer.id.includes('province-'))
      .map(layer => layer.id);

    provinceLayers.forEach(layerId => {
      if (this.map!.getLayer(layerId)) {
        this.map!.removeLayer(layerId);
      }
    });

    // Remove all province sources
    const provinceSources = Object.keys(this.map.getStyle().sources)
      .filter(sourceId => sourceId.includes('province-'));

    provinceSources.forEach(sourceId => {
      if (this.map!.getSource(sourceId)) {
        this.map!.removeSource(sourceId);
      }
    });
  }

  private clearDistrictLayers() {
    if (!this.map) return;

    // Remove all district layers
    const districtLayers = this.map.getStyle().layers
      .filter(layer => layer.id.includes('district-'))
      .map(layer => layer.id);

    districtLayers.forEach(layerId => {
      if (this.map!.getLayer(layerId)) {
        this.map!.removeLayer(layerId);
      }
    });

    // Remove all district sources
    const districtSources = Object.keys(this.map.getStyle().sources)
      .filter(sourceId => sourceId.includes('district-'));

    districtSources.forEach(sourceId => {
      if (this.map!.getSource(sourceId)) {
        this.map!.removeSource(sourceId);
      }
    });
  }

  private clearMunicipalityLayers() {
    if (!this.map) return;

    // Remove all municipality layers
    const municipalityLayers = this.map.getStyle().layers
      .filter(layer => layer.id.includes('municipality-'))
      .map(layer => layer.id);

    municipalityLayers.forEach(layerId => {
      if (this.map!.getLayer(layerId)) {
        this.map!.removeLayer(layerId);
      }
    });

    // Remove all municipality sources
    const municipalitySources = Object.keys(this.map.getStyle().sources)
      .filter(sourceId => sourceId.includes('municipality-'));

    municipalitySources.forEach(sourceId => {
      if (this.map!.getSource(sourceId)) {
        this.map!.removeSource(sourceId);
      }
    });
  }


  resetMap() {
    if (!this.map) return;

    this.map.flyTo({
      center: [84.1240, 28.3949], // Center of Nepal
      zoom: 6,
      duration: 1000
    });

    // Reset filters
    this.map.setFilter('nepal-provinces-fill', ['!=', 'id', '']);
  }

  togglePopulationLayer(show: boolean) {
    if (!this.map) return;

    if (show) {
      // Add population density layer (mock data)
      this.map.addSource('population-density', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      this.map.addLayer({
        id: 'population-density',
        type: 'fill',
        source: 'population-density',
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.3
        }
      });
    } else {
      if (this.map.getLayer('population-density')) {
        this.map.removeLayer('population-density');
      }
      if (this.map.getSource('population-density')) {
        this.map.removeSource('population-density');
      }
    }
  }

  getMap(): mapboxgl.Map | null {
    return this.map;
  }

  public deselectProvince() {
    this.currentProvince = '';
    this.currentProvinceData = null;
    this.clearProvinceLayers();
    this.deselectDistrict(); // Also deselect district and municipality
    
    // Reset to country view
    if (this.currentCountry) {
      this.loadCountryData(this.currentCountry);
    }
  }

  public deselectDistrict() {
    this.currentDistrict = '';
    this.currentDistrictData = null;
    this.clearDistrictLayers();
    this.deselectMunicipality(); // Also deselect municipality
  }

  public deselectMunicipality() {
    this.currentMunicipality = '';
    this.currentMunicipalityData = null;
    this.clearMunicipalityLayers();
  }

  getLocalLevels(): localLevel[] {
    return this.localLevels;
  }
  getCountries(): country[] {
    return this.countries;
  }

  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.isInitialized = false;
    }
  }
}
