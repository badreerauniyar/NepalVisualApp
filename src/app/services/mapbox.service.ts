import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import * as mapboxgl from 'mapbox-gl';

export interface NepalProvince {
  id: string;
  name: string;
  nameNepali: string;
  coordinates: [number, number];
  bounds: [[number, number], [number, number]];
}

export interface NepalDistrict {
  id: string;
  name: string;
  nameNepali: string;
  provinceId: string;
  coordinates: [number, number];
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

  // Nepal provinces data
  public readonly provinces: NepalProvince[] = [
    {
      id: 'province1',
      name: 'Koshi Province',
      nameNepali: 'कोशी प्रदेश',
      coordinates: [87.3016, 26.8142],
      bounds: [[86.0, 26.0], [88.5, 28.0]]
    },
    {
      id: 'province2',
      name: 'Madhesh Province',
      nameNepali: 'मधेश प्रदेश',
      coordinates: [85.3240, 26.8142],
      bounds: [[84.0, 26.0], [87.0, 27.5]]
    },
    {
      id: 'province3',
      name: 'Bagmati Province',
      nameNepali: 'बागमती प्रदेश',
      coordinates: [85.3240, 27.7172],
      bounds: [[84.0, 27.0], [86.5, 28.5]]
    },
    {
      id: 'province4',
      name: 'Gandaki Province',
      nameNepali: 'गण्डकी प्रदेश',
      coordinates: [83.9856, 28.2096],
      bounds: [[82.5, 27.5], [85.0, 29.0]]
    },
    {
      id: 'province5',
      name: 'Lumbini Province',
      nameNepali: 'लुम्बिनी प्रदेश',
      coordinates: [83.2770, 27.4818],
      bounds: [[81.0, 27.0], [84.0, 28.5]]
    },
    {
      id: 'province6',
      name: 'Karnali Province',
      nameNepali: 'कर्णाली प्रदेश',
      coordinates: [82.0, 29.0],
      bounds: [[80.0, 28.5], [83.0, 30.0]]
    },
    {
      id: 'province7',
      name: 'Sudurpashchim Province',
      nameNepali: 'सुदूरपश्चिम प्रदेश',
      coordinates: [80.0, 29.0],
      bounds: [[79.0, 28.5], [81.5, 30.5]]
    }
  ];

  // Nepal districts data (sample - you can expand this)
  public readonly districts: NepalDistrict[] = [
    // Province 1
    { id: 'jhapa', name: 'Jhapa', nameNepali: 'झापा', provinceId: 'province1', coordinates: [87.7, 26.5] },
    { id: 'morang', name: 'Morang', nameNepali: 'मोरङ', provinceId: 'province1', coordinates: [87.3, 26.5] },
    { id: 'sunsari', name: 'Sunsari', nameNepali: 'सुनसरी', provinceId: 'province1', coordinates: [87.0, 26.5] },
    
    // Province 2
    { id: 'saptari', name: 'Saptari', nameNepali: 'सप्तरी', provinceId: 'province2', coordinates: [86.7, 26.5] },
    { id: 'siraha', name: 'Siraha', nameNepali: 'सिराहा', provinceId: 'province2', coordinates: [86.2, 26.7] },
    { id: 'dhanusha', name: 'Dhanusha', nameNepali: 'धनुषा', provinceId: 'province2', coordinates: [85.9, 26.8] },
    
    // Province 3
    { id: 'kathmandu', name: 'Kathmandu', nameNepali: 'काठमाडौं', provinceId: 'province3', coordinates: [85.3240, 27.7172] },
    { id: 'bhaktapur', name: 'Bhaktapur', nameNepali: 'भक्तपुर', provinceId: 'province3', coordinates: [85.4, 27.7] },
    { id: 'lalitpur', name: 'Lalitpur', nameNepali: 'ललितपुर', provinceId: 'province3', coordinates: [85.3, 27.7] },
    
    // Province 4
    { id: 'pokhara', name: 'Kaski', nameNepali: 'कास्की', provinceId: 'province4', coordinates: [83.9856, 28.2096] },
    { id: 'manang', name: 'Manang', nameNepali: 'मनाङ', provinceId: 'province4', coordinates: [84.0, 28.5] },
    { id: 'mustang', name: 'Mustang', nameNepali: 'मुस्ताङ', provinceId: 'province4', coordinates: [83.5, 28.8] },
    
    // Province 5
    { id: 'lumbini', name: 'Rupandehi', nameNepali: 'रुपन्देही', provinceId: 'province5', coordinates: [83.2770, 27.4818] },
    { id: 'kapilvastu', name: 'Kapilvastu', nameNepali: 'कपिलवस्तु', provinceId: 'province5', coordinates: [83.0, 27.5] },
    { id: 'palpa', name: 'Palpa', nameNepali: 'पाल्पा', provinceId: 'province5', coordinates: [83.5, 27.8] },
    
    // Province 6
    { id: 'jumla', name: 'Jumla', nameNepali: 'जुम्ला', provinceId: 'province6', coordinates: [82.2, 29.3] },
    { id: 'humla', name: 'Humla', nameNepali: 'हुम्ला', provinceId: 'province6', coordinates: [81.8, 29.8] },
    { id: 'dolpa', name: 'Dolpa', nameNepali: 'डोल्पा', provinceId: 'province6', coordinates: [82.5, 29.0] },
    
    // Province 7
    { id: 'kailali', name: 'Kailali', nameNepali: 'कैलाली', provinceId: 'province7', coordinates: [80.5, 28.8] },
    { id: 'kanchanpur', name: 'Kanchanpur', nameNepali: 'कञ्चनपुर', provinceId: 'province7', coordinates: [80.2, 28.7] },
    { id: 'dadeldhura', name: 'Dadeldhura', nameNepali: 'डडेलधुरा', provinceId: 'province7', coordinates: [80.5, 29.3] }
  ];

  constructor() {
    // Access token will be set when initializing the map
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
        this.addNepalBoundaries();
        this.addProvinceLayers();
      });

      return this.map;
    } catch (error) {
      console.error('Error initializing Mapbox:', error);
      throw error;
    }
  }

  private addNepalBoundaries() {
    if (!this.map) return;

    // Add Nepal country boundary
    this.map.addSource('nepal-boundary', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: { name: 'Nepal' },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [80.0, 26.0],
              [88.5, 26.0],
              [88.5, 30.5],
              [80.0, 30.5],
              [80.0, 26.0]
            ]]
          }
        }]
      }
    });

    this.map.addLayer({
      id: 'nepal-boundary-fill',
      type: 'fill',
      source: 'nepal-boundary',
      paint: {
        'fill-color': '#e0f2fe',
        'fill-opacity': 0.1
      }
    });

    this.map.addLayer({
      id: 'nepal-boundary-stroke',
      type: 'line',
      source: 'nepal-boundary',
      paint: {
        'line-color': '#0ea5e9',
        'line-width': 2
      }
    });
  }

  private addProvinceLayers() {
    if (!this.map) return;

    // Load official Nepal provinces GeoJSON data
    fetch('/assets/data/nepal-provinces.geojson')
      .then(response => response.json())
      .then(data => {
        // Transform the data to match our expected format
        const transformedData = this.transformProvinceData(data);
        
        this.map!.addSource('nepal-provinces', {
          type: 'geojson',
          data: transformedData
        });

        this.addProvinceLayersToMap();
      })
      .catch(error => {
        console.error('Error loading Nepal provinces data:', error);
        // Fallback to simple rectangles
        this.addFallbackProvinceLayers();
      });
  }

  private transformProvinceData(data: any) {
    // Transform the official data to match our expected format
    const transformedFeatures = data.features.map((feature: any) => ({
      type: 'Feature' as const,
      properties: {
        id: `province${feature.properties.province}`,
        name: feature.properties.pr_name,
        nameNepali: this.getNepaliName(feature.properties.province),
        population: this.getProvincePopulation(feature.properties.province),
        area: this.getProvinceArea(feature.properties.province)
      },
      geometry: feature.geometry
    }));

    return {
      type: 'FeatureCollection' as const,
      features: transformedFeatures
    };
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

    // Create GeoJSON for provinces (fallback)
    const provinceFeatures = this.provinces.map(province => ({
      type: 'Feature' as const,
      properties: {
        id: province.id,
        name: province.name,
        nameNepali: province.nameNepali
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [province.bounds[0][0], province.bounds[0][1]],
          [province.bounds[1][0], province.bounds[0][1]],
          [province.bounds[1][0], province.bounds[1][1]],
          [province.bounds[0][0], province.bounds[1][1]],
          [province.bounds[0][0], province.bounds[0][1]]
        ]]
      }
    }));

    this.map.addSource('nepal-provinces', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: provinceFeatures
      }
    });

    this.addProvinceLayersToMap();
  }

  filterByProvince(provinceId: string) {
    if (!this.map) return;

    const province = this.provinces.find(p => p.id === provinceId);
    if (province) {
      this.map.flyTo({
        center: province.coordinates,
        zoom: 8,
        duration: 1000
      });

      // Highlight selected province
      this.map.setFilter('nepal-provinces-fill', ['==', ['get', 'id'], provinceId]);
    }
  }

  filterByDistrict(districtId: string) {
    if (!this.map) return;

    const district = this.districts.find(d => d.id === districtId);
    if (district) {
      this.map.flyTo({
        center: district.coordinates,
        zoom: 10,
        duration: 1000
      });
    }
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

  destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.isInitialized = false;
    }
  }
}
