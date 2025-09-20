import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeftSidebar } from '../component/left-sidebar/left-sidebar';
import { RightSidebar } from '../component/right-sidebar/right-sidebar';

interface MapFeature {
  id: string;
  name: string;
  type?: string;
  level?: string;
  address?: string;
  students?: number;
  population?: number;
  coordinates: [number, number];
}

interface SearchResult {
  id: string;
  name: string;
  type: string;
  coordinates: [number, number];
}

@Component({
  selector: 'app-homepage',
  standalone: false,
  templateUrl: './homepage.html',
  styleUrl: './homepage.scss'
})
export class Homepage implements OnInit, OnDestroy {
  isLoading = true;
  showPopulationLayer = false;
  selectedFeature: MapFeature | null = null;
  searchResults: SearchResult[] = [];
  
  // Mock data for demonstration
  private mockFeatures: MapFeature[] = [
    {
      id: '1',
      name: 'Kathmandu Valley School',
      type: 'Public',
      level: 'Primary',
      address: 'Kathmandu, Nepal',
      students: 450,
      coordinates: [85.3240, 27.7172]
    },
    {
      id: '2',
      name: 'Everest Secondary School',
      type: 'Private',
      level: 'Secondary',
      address: 'Pokhara, Nepal',
      students: 320,
      coordinates: [83.9856, 28.2096]
    },
    {
      id: '3',
      name: 'Lumbini Higher Secondary',
      type: 'Public',
      level: 'Higher Secondary',
      address: 'Lumbini, Nepal',
      students: 280,
      coordinates: [83.2770, 27.4818]
    }
  ];

  ngOnInit() {
    console.log('Homepage component initialized');
    // Simulate map loading
    setTimeout(() => {
      this.isLoading = false;
      this.initializeMap();
    }, 2000);
  }

  ngOnDestroy() {
    // Cleanup map instance if needed
  }

  private initializeMap() {
    // In a real implementation, this would initialize Mapbox GL JS
    console.log('Map initialized');
  }

  // Map control methods
  zoomIn() {
    console.log('Zoom in');
    // Implement zoom in functionality
  }

  zoomOut() {
    console.log('Zoom out');
    // Implement zoom out functionality
  }

  togglePopulationLayer() {
    this.showPopulationLayer = !this.showPopulationLayer;
    console.log('Population layer toggled:', this.showPopulationLayer);
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Current location:', position.coords);
          // Center map on current location
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    } else {
      console.log('Geolocation not supported');
    }
  }

  // Info panel methods
  closeInfoPanel() {
    this.selectedFeature = null;
  }

  // Search methods
  clearSearchResults() {
    this.searchResults = [];
  }

  selectSearchResult(result: SearchResult) {
    console.log('Selected search result:', result);
    // Center map on selected result
    this.searchResults = [];
  }

  // Mock search functionality
  performSearch(query: string) {
    if (query.length < 2) {
      this.searchResults = [];
      return;
    }

    // Mock search results
    this.searchResults = this.mockFeatures
      .filter(feature => 
        feature.name.toLowerCase().includes(query.toLowerCase()) ||
        feature.address?.toLowerCase().includes(query.toLowerCase())
      )
      .map(feature => ({
        id: feature.id,
        name: feature.name,
        type: feature.type || 'Unknown',
        coordinates: feature.coordinates
      }));
  }

  // Mock feature selection
  selectFeature(feature: MapFeature) {
    this.selectedFeature = feature;
  }
}
