import { Field, SensorData, DiseaseLog, Actuator } from '../types/database';

export const INITIAL_FIELDS: Field[] = [
  {
    id: 'f1',
    field_name: 'Field 1 - Paddy (நெல்)',
    location: 'Thanjavur Delta Region (10.7870° N, 79.1378° E)',
    crop_type: 'Paddy / Rice (Samba)',
    latitude: 10.7870,
    longitude: 79.1378,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'f2',
    field_name: 'Field 2 - Sugarcane (கரும்பு)',
    location: 'Madurai Agri Zone (9.9252° N, 78.1198° E)',
    crop_type: 'Sugarcane (Co 0238)',
    latitude: 9.9252,
    longitude: 78.1198,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString()
  },
  {
    id: 'f3',
    field_name: 'Field 3 - Maize & Cotton (சோளம்)',
    location: 'Coimbatore Plains (11.0168° N, 76.9558° E)',
    crop_type: 'Maize / Hybrid Cotton',
    latitude: 11.0168,
    longitude: 76.9558,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  }
];

export const generate24HourSensorData = (fieldNo: string): SensorData[] => {
  const data: SensorData[] = [];
  const now = Date.now();
  
  // Create 24 hourly data points
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now - i * 3600 * 1000);
    // Add realistic variations
    const baseMoisture = fieldNo.includes('2') ? 42 : fieldNo.includes('3') ? 35 : 68;
    const baseTemp = 28 + Math.sin(i / 3) * 4;
    const baseHumidity = 75 - Math.sin(i / 3) * 10;
    const baseNpk = 140 + Math.floor(Math.random() * 20);
    const growth = 32 + (24 - i) * 0.15;

    data.push({
      id: `sd-${fieldNo}-${i}-${now}`,
      field_no: fieldNo,
      moisture: Math.max(15, Math.min(95, Math.round(baseMoisture + Math.sin(i / 2) * 8 + (Math.random() * 4 - 2)))),
      temperature: Number((baseTemp + (Math.random() * 1.5 - 0.75)).toFixed(1)),
      humidity: Number((baseHumidity + (Math.random() * 3 - 1.5)).toFixed(1)),
      npk: Math.round(baseNpk),
      growth_height: Number(growth.toFixed(1)),
      created_at: time.toISOString()
    });
  }

  return data;
};

export const INITIAL_ACTUATORS: Actuator[] = [
  { id: 'act-1', field_no: 'Field 1 - Paddy (நெல்)', motor_status: true, last_on: new Date(Date.now() - 1800000).toISOString() },
  { id: 'act-2', field_no: 'Field 2 - Sugarcane (கரும்பு)', motor_status: false, last_on: new Date(Date.now() - 86400000).toISOString() },
  { id: 'act-3', field_no: 'Field 3 - Maize & Cotton (சோளம்)', motor_status: false, last_on: new Date(Date.now() - 43200000).toISOString() },
];

export const INITIAL_DISEASE_LOGS: DiseaseLog[] = [
  {
    id: 'd-1',
    image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb197a7?w=500&auto=format&fit=crop&q=60',
    disease_name: 'Brown Spot Disease',
    confidence: 92.4,
    suggestion: 'Use Bavistin 1g/L aqueous spray. Ensure optimal field drainage.',
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'd-2',
    image_url: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=500&auto=format&fit=crop&q=60',
    disease_name: 'Rice Leaf Blast (Magnaporthe oryzae)',
    confidence: 88.0,
    suggestion: 'Apply Tricyclazole 75 WP @ 0.6 g/L of water during initial morning hours.',
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];
