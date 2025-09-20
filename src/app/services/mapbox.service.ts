import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import { QueryParamService } from './query-param.service';
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
  private currentCountry :string= '';

  constructor(private queryParamService: QueryParamService) {
    // Listen to country changes
    this.queryParamService.country$.subscribe(country => {
      this.currentCountry = country;
      if (this.map && this.currentCountry ) {
        this.loadCountryData(country);
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


  private loadCountryData(country: string) {
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
    fetch(`/assets/map-data/${country}/${filename}`)
      .then(response => response.json())
      .then(data => {
        console.log('data',data);
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
  }

  private addProvinceLayers() {
    // This method is now replaced by loadCountryData
    this.loadCountryData('nepal');
  }

 

  private getNepaliName(provinceNumber: number): string {
    const nepaliNames: { [key: number]: string } = {
      1: 'कोशी प्रदेश',
      2: 'मधेश प्रदेश', 
      3: 'बागमती प्रदेश',
      4: 'गण्डकी प्रदेश',
      5: 'लुम्बिनी प्रदेश',
      6: 'कर्णाली प्रदेश',
      7: 'सुदूरपश्चिम प्रदेश'
    };
    return nepaliNames[provinceNumber] || '';
  }

  private getProvincePopulation(provinceNumber: number): number {
    const populations: { [key: number]: number } = {
      1: 4535000,
      2: 6140000,
      3: 5520000,
      4: 2400000,
      5: 5000000,
      6: 1700000,
      7: 2600000
    };
    return populations[provinceNumber] || 0;
  }

  private getProvinceArea(provinceNumber: number): number {
    const areas: { [key: number]: number } = {
      1: 25905,
      2: 9661,
      3: 20300,
      4: 21504,
      5: 22288,
      6: 27984,
      7: 19539
    };
    return areas[provinceNumber] || 0;
  }

  private getProvinceCenter(geometry: any): [number, number] {
    // Calculate center from geometry bounds
    if (geometry.type === 'MultiPolygon') {
      const coords = geometry.coordinates[0][0];
      let minLng = coords[0][0];
      let maxLng = coords[0][0];
      let minLat = coords[0][1];
      let maxLat = coords[0][1];
      
      coords.forEach((coord: number[]) => {
        minLng = Math.min(minLng, coord[0]);
        maxLng = Math.max(maxLng, coord[0]);
        minLat = Math.min(minLat, coord[1]);
        maxLat = Math.max(maxLat, coord[1]);
      });
      
      return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
    }
    return [84.1240, 28.3949]; // Default to Nepal center
  }

  private getProvinceBounds(geometry: any): [[number, number], [number, number]] {
    // Calculate bounds from geometry
    if (geometry.type === 'MultiPolygon') {
      const coords = geometry.coordinates[0][0];
      let minLng = coords[0][0];
      let maxLng = coords[0][0];
      let minLat = coords[0][1];
      let maxLat = coords[0][1];
      
      coords.forEach((coord: number[]) => {
        minLng = Math.min(minLng, coord[0]);
        maxLng = Math.max(maxLng, coord[0]);
        minLat = Math.min(minLat, coord[1]);
        maxLat = Math.max(maxLat, coord[1]);
      });
      
      return [[minLng, minLat], [maxLng, maxLat]];
    }
    return [[80.0, 26.0], [88.5, 30.5]]; // Default Nepal bounds
  }

  private addProvinceLayersToMap() {
    if (!this.map) return;

    // Add province fill layer
    this.map.addLayer({
      id: 'nepal-provinces-fill',
      type: 'fill',
      source: 'nepal-provinces',
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

    // Add province stroke layer
    this.map.addLayer({
      id: 'nepal-provinces-stroke',
      type: 'line',
      source: 'nepal-provinces',
      paint: {
        'line-color': '#1e40af',
        'line-width': 2
      }
    });

    // Add province labels
    this.map.addLayer({
      id: 'nepal-provinces-labels',
      type: 'symbol',
      source: 'nepal-provinces',
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
    this.map.on('click', 'nepal-provinces-fill', (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const coordinates = e.lngLat;
        
        // Create popup
        const props = feature.properties || {};
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div class="map-popup">
              <h3>${props['name'] || 'Unknown'}</h3>
              <p>${props['nameNepali'] || ''}</p>
              <p>Population: ${props['population']?.toLocaleString() || 'N/A'}</p>
              <p>Area: ${props['area']?.toLocaleString() || 'N/A'} km²</p>
            </div>
          `)
          .addTo(this.map!);
      }
    });

    // Add hover effects
    this.map.on('mouseenter', 'nepal-provinces-fill', () => {
      this.map!.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', 'nepal-provinces-fill', () => {
      this.map!.getCanvas().style.cursor = '';
    });
  }

  private addFallbackProvinceLayers() {
    if (!this.map) return;
    console.log('Using fallback province layers');
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

 

    getDistricts(): district[] {
      return this.districts;
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
