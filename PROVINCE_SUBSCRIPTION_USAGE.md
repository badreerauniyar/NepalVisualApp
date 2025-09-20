# Province Subscription System Usage

This document explains how to use the province subscription system implemented in the MapboxService.

## Overview

The province subscription system is **query parameter driven** and allows you to:
- Automatically display province data when a province is selected via query parameters
- Show/hide province information in the UI based on query parameter state
- Get real-time updates when provinces are selected/deselected through URL changes
- Access province information including population, area, and GeoJSON data
- Sync map display with query parameter changes

## Key Features

### 1. Query Parameter Driven Selection

The system automatically responds to query parameter changes:

```typescript
// The service automatically listens to query parameter changes
// URL: /?country=nepal&province=1
// This will automatically load and display Koshi Province

// URL: /?country=nepal&province=3  
// This will automatically load and display Bagmati Province

// URL: /?country=nepal (no province param)
// This will clear province selection and return to country view
```

### 2. Province Data Subscription

The service provides reactive observables for selected province data:

```typescript
// Subscribe to currently selected province (driven by query params)
this.mapboxService.selectedProvince$.subscribe(province => {
  if (province) {
    console.log('Selected province:', province.name);
    // Province data is automatically available
  } else {
    console.log('No province selected');
    // Province data is hidden/cleared
  }
});
```

### 3. Manual Province Selection (via Query Params)

```typescript
// Select a province by setting query parameter
this.queryParamService.setProvince('1'); // Koshi Province

// Deselect current province
this.queryParamService.setProvince(''); // Clears province selection
```

### 4. Province Data Structure

Each province object contains:

```typescript
interface ProvinceSelection {
  id: string;                    // e.g., "province1"
  name: string;                  // e.g., "Koshi Province"
  localName: string;             // e.g., "कोशी प्रदेश"
  population: number;            // e.g., 4535000
  area: number;                  // e.g., 25905 (in km²)
  center: [number, number];      // [longitude, latitude]
  geojsonFile: string;           // e.g., "koshi_province_1.geojson"
}
```

## Implementation Details

### Query Parameter Mapping

The system automatically maps query parameter province IDs to internal province data:

```typescript
// Query Parameter -> Province Data ID
"1" -> "province1" (Koshi Province)
"2" -> "province2" (Madhesh Province)  
"3" -> "province3" (Bagmati Province)
"4" -> "province4" (Gandaki Province)
"5" -> "province5" (Lumbini Province)
"6" -> "province6" (Karnali Province)
"7" -> "province7" (Sudurpashchim Province)
```

### GeoJSON File Naming Convention

The system follows a specific naming convention for GeoJSON files:

```
{province_name_lowercase}_province_{id}.geojson
```

Examples:
- `koshi_province_1.geojson`
- `madhesh_province_2.geojson`
- `bagmati_province_3.geojson`
- `gandaki_province_4.geojson`
- `lumbini_province_5.geojson`
- `karnali_province_6.geojson`
- `sudurpashchim_province_7.geojson`

### File Structure

```
src/assets/map-data/nepal/maps-of-nepal/
├── maps-of-provinces/
│   ├── koshi_province_1.geojson
│   ├── madhesh_province_2.geojson
│   ├── bagmati_province_3.geojson
│   ├── gandaki_province_4.geojson
│   ├── lumbini_province_5.geojson
│   ├── karnali_province_6.geojson
│   └── sudurpashchim_province_7.geojson
├── maps-of-districts/
└── maps-of-municipalities/
```

## Usage Examples

### Basic Component Integration

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MapboxService, ProvinceSelection } from './services/mapbox.service';
import { QueryParamService } from './services/query-param.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-province-display',
  template: `
    <!-- Only show province data when a province is selected via query params -->
    <div *ngIf="selectedProvince" class="province-info">
      <h3>{{ selectedProvince.name }}</h3>
      <p>{{ selectedProvince.localName }}</p>
      <div class="stats">
        <span>Population: {{ selectedProvince.population.toLocaleString() }}</span>
        <span>Area: {{ selectedProvince.area.toLocaleString() }} km²</span>
      </div>
      
      <button (click)="deselectProvince()">
        Deselect Province
      </button>
    </div>
    
    <!-- Show message when no province is selected -->
    <div *ngIf="!selectedProvince" class="no-province">
      <p>No province selected. Select a province from the dropdown to view details.</p>
    </div>
  `
})
export class ProvinceDisplayComponent implements OnInit, OnDestroy {
  selectedProvince: ProvinceSelection | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private mapboxService: MapboxService,
    private queryParamService: QueryParamService
  ) {}

  ngOnInit() {
    // Subscribe to selected province (driven by query params)
    this.subscriptions.push(
      this.mapboxService.selectedProvince$.subscribe(province => {
        this.selectedProvince = province;
      })
    );
  }

  deselectProvince() {
    // Clear province selection via query params
    this.queryParamService.setProvince('');
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
```

### Map Integration

The service automatically handles:
- Loading GeoJSON data from the correct file path
- Adding map layers with proper styling
- Setting up click and hover interactions
- Centering the map on the selected province
- Clearing previous province selections

### Styling

The province layers use distinct colors:
- Fill: Green gradient (`#34d399` to `#10b981`)
- Stroke: Dark green (`#059669`)
- Labels: Dark green with white halo

## Next Steps

This implementation provides the foundation for:
1. **District Selection**: Extend the system to handle district-level selections
2. **Municipality Selection**: Add municipality-level map interactions
3. **Data Filtering**: Implement filtering based on selected administrative levels
4. **Custom Styling**: Allow customization of map layer colors and styles
5. **Performance Optimization**: Implement lazy loading for large datasets

## Troubleshooting

### Common Issues

1. **GeoJSON files not loading**: Check file paths and naming convention
2. **Map not updating**: Ensure the map is initialized before calling selection methods
3. **Memory leaks**: Always unsubscribe from observables in component destruction
4. **Styling issues**: Check CSS custom properties are defined

### Debug Information

Enable console logging to debug province selection:

```typescript
// The service logs province data loading and selection events
// Check browser console for detailed information
```
