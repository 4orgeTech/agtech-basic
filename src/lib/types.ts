// Types shared between frontend and the recommendation API

export interface FertilizerInput {
  crop: string;
  soilType: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  area: number;
}

export interface NutrientValues {
  n: number;
  p: number;
  k: number;
}

export interface RecommendationResult {
  primaryFertilizer: string;
  secondaryFertilizer: string | null;
  primaryQuantityKg: number;
  secondaryQuantityKg: number;
  totalCost: number;
  nutrientGaps: NutrientValues;
  nutrientSupplied: NutrientValues;
  confidence: number;
  reasoning: string[];
  warnings: string[];
}

export interface RecommendationRecord {
  id: string;
  crop: string;
  soil_type: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  recommended_fertilizer: string;
  recommended_quantity_kg: number;
  estimated_cost: number;
  confidence: number;
  input_data: FertilizerInput;
  result_data: RecommendationResult;
  created_at: string;
}

export interface ApiResponse {
  id: string;
  recommendation: RecommendationResult;
  input: FertilizerInput;
  created_at: string;
}

export const CROP_OPTIONS = [
  "rice", "wheat", "maize", "cotton", "sugarcane",
  "soybean", "tomato", "potato", "banana", "groundnut",
];

export const SOIL_OPTIONS = [
  "sandy", "loamy", "clay", "silty", "peaty", "chalky",
];
