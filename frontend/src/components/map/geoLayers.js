// GeoJSON layers for Urban Eye GIS Map
// Combines live map civic features and Smart City arterial road networks

export const geoLayers = [
  {
    id: 'road_corridor',
    label: 'Surveyed Road Corridor',
    description: 'High-frequency road condition monitoring corridor',
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Monitored Road Corridor (Pune Smart Hub)' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [73.8320, 18.5310],
              [73.8450, 18.5280],
              [73.8567, 18.5204],
              [73.8680, 18.5150],
              [73.8790, 18.5080],
            ],
          },
        },
      ],
    },
  },
  {
    id: 'town_center',
    label: 'Command Center & Civic Hub',
    description: 'Urban Eye Traffic Command Center & Civic Core',
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Urban Eye Command Center (Shivajinagar)' },
          geometry: {
            type: 'Point',
            coordinates: [73.8567, 18.5204],
          },
        },
        {
          type: 'Feature',
          properties: { name: 'Nairobi Civic Reference Center' },
          geometry: {
            type: 'Point',
            coordinates: [36.8219, -1.2921],
          },
        },
      ],
    },
  },
  {
    id: 'main_road',
    label: 'Arterial Highway Network',
    description: 'Primary transit lines and multi-lane expressways',
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'FC Road & JM Road Arterial Transit' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [73.8410, 18.5320],
              [73.8475, 18.5260],
              [73.8540, 18.5190],
              [73.8600, 18.5130],
            ],
          },
        },
        {
          type: 'Feature',
          properties: { name: 'Main Road (Global Survey Reference)' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [36.80, -1.30],
              [36.82, -1.29],
              [36.84, -1.28],
            ],
          },
        },
      ],
    },
  },
  {
    id: 'residential',
    label: 'Urban Traffic Sectors',
    description: 'Municipal zones and high-density residential sectors',
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Sector 4 Smart Urban Zone' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [73.8350, 18.5350],
                [73.8650, 18.5350],
                [73.8650, 18.5100],
                [73.8350, 18.5100],
                [73.8350, 18.5350],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          properties: { name: 'Residential Area (Survey Sector A)' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [36.80, -1.30],
                [36.85, -1.30],
                [36.85, -1.25],
                [36.80, -1.25],
                [36.80, -1.30],
              ],
            ],
          },
        },
      ],
    },
  },
]
