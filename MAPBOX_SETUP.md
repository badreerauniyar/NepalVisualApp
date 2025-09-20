# Mapbox Integration Setup Guide

## Overview
This guide will help you set up Mapbox integration for your Nepal Visual App. The app now includes:

- Interactive Nepal map with province boundaries
- Real-time filtering by administrative divisions
- Population density visualization
- Interactive popups with province information
- Responsive design with left sidebar controls

## Prerequisites

1. **Mapbox Account**: You need a Mapbox account to get an access token
2. **Node.js**: Ensure you have Node.js installed
3. **Angular CLI**: Make sure Angular CLI is installed

## Setup Steps

### 1. Get Mapbox Access Token

1. Go to [Mapbox](https://www.mapbox.com/) and create a free account
2. Navigate to your [Account page](https://account.mapbox.com/)
3. Go to the "Access tokens" section
4. Copy your **Default public token** (starts with `pk.`)

### 2. Configure Environment Variables

1. Open `src/environments/environment.ts`
2. Replace `YOUR_MAPBOX_ACCESS_TOKEN_HERE` with your actual Mapbox access token:

```typescript
export const environment = {
  production: false,
  mapbox: {
    accessToken: 'pk.your_actual_token_here'
  }
};
```

3. Do the same for `src/environments/environment.prod.ts` for production builds.

### 3. Install Dependencies

The required dependencies are already installed:
- `mapbox-gl` - Mapbox GL JS library
- `@types/mapbox-gl` - TypeScript definitions

### 4. Run the Application

```bash
npm start
```

The application will start on `http://localhost:4200`

## Features

### Interactive Map
- **Nepal Overview**: The map initially loads centered on Nepal
- **Province Boundaries**: All 7 provinces are displayed with distinct colors
- **Interactive Popups**: Click on any province to see detailed information
- **Zoom Controls**: Use the zoom in/out buttons or mouse wheel
- **Current Location**: Click the location button to center on your current position

### Left Sidebar Filters
- **Country Selection**: Currently set to Nepal
- **Province Filter**: Select any of the 7 provinces to zoom and highlight
- **District Filter**: Choose from districts within the selected province
- **Municipality Filter**: Select municipalities within the selected district
- **Population Layer Toggle**: Show/hide population density overlay

### Map Controls
- **Zoom In/Out**: Buttons for precise zoom control
- **Layer Toggle**: Toggle population density visualization
- **Location Button**: Center map on current GPS location
- **Reset**: Clear all filters and return to Nepal overview

## Data Structure

### Provinces Included
1. **Koshi Province** (कोशी प्रदेश)
2. **Madhesh Province** (मधेश प्रदेश)
3. **Bagmati Province** (बागमती प्रदेश)
4. **Gandaki Province** (गण्डकी प्रदेश)
5. **Lumbini Province** (लुम्बिनी प्रदेश)
6. **Karnali Province** (कर्णाली प्रदेश)
7. **Sudurpashchim Province** (सुदूरपश्चिम प्रदेश)

### Sample Districts
Each province includes sample districts with their coordinates and administrative information.

## Customization

### Adding More Data
1. **Districts**: Add more districts in `src/app/services/mapbox.service.ts`
2. **Municipalities**: Extend the municipality data structure
3. **GeoJSON**: Replace `src/assets/data/nepal-provinces.geojson` with more detailed boundaries

### Styling
- **Map Styles**: Change the map style in `mapbox.service.ts` (line 45)
- **Colors**: Modify province colors in the layer paint properties
- **UI**: Update styles in `src/styles.scss`

### Adding New Features
- **Search**: Implement search functionality using Mapbox Geocoding API
- **Heatmaps**: Add population density or other data visualizations
- **Markers**: Add custom markers for specific locations
- **Routes**: Implement routing between locations

## Troubleshooting

### Common Issues

1. **Map Not Loading**
   - Check if your Mapbox access token is correct
   - Ensure the token has the required scopes
   - Check browser console for errors

2. **Province Data Not Showing**
   - Verify the GeoJSON file is accessible at `/assets/data/nepal-provinces.geojson`
   - Check if the file is properly formatted JSON

3. **Filter Not Working**
   - Ensure the province/district IDs match between the service and template
   - Check browser console for JavaScript errors

### Debug Mode
Enable debug mode by adding this to your environment:
```typescript
export const environment = {
  production: false,
  mapbox: {
    accessToken: 'your_token_here',
    debug: true
  }
};
```

## API Usage

### Mapbox Services Used
- **Mapbox GL JS**: Core mapping library
- **Mapbox Styles API**: For map styling
- **Mapbox Geocoding API**: For location search (optional)

### Rate Limits
- Free tier includes 50,000 map loads per month
- Additional usage requires paid plan
- Monitor usage in your Mapbox account dashboard

## Next Steps

1. **Real GeoJSON Data**: Replace the simplified province boundaries with accurate administrative boundaries
2. **District Boundaries**: Add detailed district-level GeoJSON data
3. **Municipality Data**: Include municipality/VDC boundaries
4. **Data Integration**: Connect to real data sources for population, schools, etc.
5. **Advanced Features**: Add search, routing, and more interactive features

## Support

For issues related to:
- **Mapbox**: Check [Mapbox documentation](https://docs.mapbox.com/)
- **Angular**: Refer to [Angular documentation](https://angular.io/docs)
- **This Implementation**: Check the code comments and console logs

## License

This implementation uses Mapbox GL JS which requires a Mapbox account and access token. Make sure to comply with Mapbox's terms of service.
