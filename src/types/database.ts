export interface SensorData {
  id: string | number;
  field_no: string;
  moisture: number;
  temperature: number;
  humidity: number;
  npk: number;
  growth_height: number;
  created_at: string;
}

export interface DiseaseLog {
  id: string | number;
  image_url: string;
  disease_name: string;
  confidence: number;
  created_at: string;
  suggestion?: string;
}

export interface Actuator {
  id: string | number;
  field_no: string;
  motor_status: boolean;
  last_on: string | null;
}

export interface Field {
  id: string | number;
  field_name: string;
  location: string;
  crop_type: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
}

export type Language = 'en' | 'ta';
