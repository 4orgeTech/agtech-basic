import { useState } from "react";
import { Sprout, Loader2, RotateCcw } from "lucide-react";
import type { FertilizerInput } from "@/lib/types";
import { CROP_OPTIONS, SOIL_OPTIONS } from "@/lib/types";

interface InputFormProps {
  onSubmit: (input: FertilizerInput) => void;
  loading: boolean;
}

interface FieldConfig {
  key: keyof FertilizerInput;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  hint: string;
}

const numericFields: FieldConfig[] = [
  { key: "nitrogen", label: "Nitrogen (N)", unit: "kg/ha", min: 0, max: 500, step: 1, hint: "Current soil nitrogen level" },
  { key: "phosphorus", label: "Phosphorus (P)", unit: "kg/ha", min: 0, max: 500, step: 1, hint: "Current soil phosphorus level" },
  { key: "potassium", label: "Potassium (K)", unit: "kg/ha", min: 0, max: 500, step: 1, hint: "Current soil potassium level" },
  { key: "ph", label: "Soil pH", unit: "pH", min: 0, max: 14, step: 0.1, hint: "Soil acidity/alkalinity (0-14)" },
  { key: "temperature", label: "Temperature", unit: "°C", min: -20, max: 60, step: 0.5, hint: "Average growing temperature" },
  { key: "humidity", label: "Humidity", unit: "%", min: 0, max: 100, step: 1, hint: "Average relative humidity" },
  { key: "rainfall", label: "Rainfall", unit: "mm", min: 0, max: 5000, step: 10, hint: "Annual/seasonal rainfall" },
  { key: "area", label: "Area", unit: "hectares", min: 0.1, max: 10000, step: 0.1, hint: "Field size to fertilize" },
];

const defaultInput: FertilizerInput = {
  crop: "wheat",
  soilType: "loamy",
  nitrogen: 40,
  phosphorus: 20,
  potassium: 30,
  ph: 6.5,
  temperature: 22,
  humidity: 60,
  rainfall: 700,
  area: 1,
};

export function InputForm({ onSubmit, loading }: InputFormProps) {
  const [input, setInput] = useState<FertilizerInput>(defaultInput);

  const updateField = (key: keyof FertilizerInput, value: string | number) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(input);
  };

  const handleReset = () => {
    setInput(defaultInput);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Crop and Soil Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Crop Type
          </label>
          <select
            value={input.crop}
            onChange={(e) => updateField("crop", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
          >
            {CROP_OPTIONS.map((crop) => (
              <option key={crop} value={crop} className="capitalize">
                {crop.charAt(0).toUpperCase() + crop.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Soil Type
          </label>
          <select
            value={input.soilType}
            onChange={(e) => updateField("soilType", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
          >
            {SOIL_OPTIONS.map((soil) => (
              <option key={soil} value={soil} className="capitalize">
                {soil.charAt(0).toUpperCase() + soil.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Soil NPK Parameters */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-3">
          Soil Nutrient Parameters
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {numericFields.slice(0, 3).map((field) => (
            <NumberInput
              key={field.key}
              field={field}
              value={input[field.key] as number}
              onChange={(val) => updateField(field.key, val)}
            />
          ))}
        </div>
      </div>

      {/* Environmental Parameters */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-3">
          Soil & Environmental Conditions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {numericFields.slice(3, 7).map((field) => (
            <NumberInput
              key={field.key}
              field={field}
              value={input[field.key] as number}
              onChange={(val) => updateField(field.key, val)}
            />
          ))}
        </div>
      </div>

      {/* Area */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-3">
          Field Size
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {numericFields.slice(7).map((field) => (
            <NumberInput
              key={field.key}
              field={field}
              value={input[field.key] as number}
              onChange={(val) => updateField(field.key, val)}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600/40 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sprout className="h-4 w-4" />
          )}
          {loading ? "Analyzing..." : "Get Recommendation"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>
    </form>
  );
}

function NumberInput({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {field.label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pr-12 text-sm text-gray-900 transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
          {field.unit}
        </span>
      </div>
      <p className="mt-1 text-xs text-gray-400">{field.hint}</p>
    </div>
  );
}
