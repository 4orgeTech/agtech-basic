import {
  CheckCircle2,
  AlertTriangle,
  Beaker,
  Coins,
  Gauge,
  Package,
  TrendingUp,
  Info,
} from "lucide-react";
import type { RecommendationResult, FertilizerInput } from "@/lib/types";

interface RecommendationDisplayProps {
  result: RecommendationResult;
  input: FertilizerInput;
}

export function RecommendationDisplay({
  result,
  input,
}: RecommendationDisplayProps) {
  const confidenceColor =
    result.confidence >= 70
      ? "text-green-700 bg-green-50 border-green-200"
      : result.confidence >= 40
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className="space-y-6">
      {/* Confidence Banner */}
      <div
        className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${confidenceColor}`}
      >
        <Gauge className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold">
            Confidence Score: {result.confidence}%
          </p>
          <p className="text-xs opacity-80">
            Based on how well your environmental conditions match the crop's
            ideal requirements
          </p>
        </div>
      </div>

      {/* Primary & Secondary Fertilizer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FertilizerCard
          label="Primary Fertilizer"
          name={result.primaryFertilizer}
          quantityKg={result.primaryQuantityKg}
          area={input.area}
          icon={<Beaker className="h-5 w-5" />}
        />
        {result.secondaryFertilizer ? (
          <FertilizerCard
            label="Secondary Fertilizer"
            name={result.secondaryFertilizer}
            quantityKg={result.secondaryQuantityKg}
            area={input.area}
            icon={<Package className="h-5 w-5" />}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-5 flex items-center justify-center text-center">
            <div>
              <CheckCircle2 className="mx-auto h-8 w-8 text-green-600 mb-2" />
              <p className="text-sm font-medium text-gray-600">
                Single fertilizer sufficient
              </p>
              <p className="text-xs text-gray-400 mt-1">
                No secondary application needed
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cost Summary */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Coins className="h-5 w-5 text-green-700" />
          <h3 className="text-sm font-semibold text-gray-800">
            Cost Estimate
          </h3>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-green-800">
            ${result.totalCost.toFixed(2)}
          </span>
          <span className="text-sm text-gray-500">
            total for {input.area} hectare{input.area !== 1 ? "s" : ""}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          ${(result.totalCost / input.area).toFixed(2)}/hectare — optimized for
          cost-efficiency
        </p>
      </div>

      {/* Nutrient Gap Analysis */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-700" />
          Nutrient Gap Analysis
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <NutrientBar
            label="Nitrogen"
            symbol="N"
            gap={result.nutrientGaps.n}
            supplied={result.nutrientSupplied.n}
            color="bg-blue-500"
          />
          <NutrientBar
            label="Phosphorus"
            symbol="P"
            gap={result.nutrientGaps.p}
            supplied={result.nutrientSupplied.p}
            color="bg-orange-500"
          />
          <NutrientBar
            label="Potassium"
            symbol="K"
            gap={result.nutrientGaps.k}
            supplied={result.nutrientSupplied.k}
            color="bg-purple-500"
          />
        </div>
      </div>

      {/* Reasoning */}
      {result.reasoning.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-green-700" />
            How This Was Calculated
          </h3>
          <ul className="space-y-2">
            {result.reasoning.map((reason, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Recommendations & Warnings
          </h3>
          <ul className="space-y-2">
            {result.warnings.map((warning, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-amber-700"
              >
                <span className="mt-0.5 flex-shrink-0">→</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FertilizerCard({
  label,
  name,
  quantityKg,
  area,
  icon,
}: {
  label: string;
  name: string;
  quantityKg: number;
  area: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-green-300 hover:shadow-sm">
      <div className="flex items-center gap-2 text-green-700 mb-3">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-lg font-bold text-gray-900 mb-2">{name}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-green-800">
          {quantityKg}
        </span>
        <span className="text-sm text-gray-500">kg</span>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        {quantityKg / area} kg/hectare
      </p>
    </div>
  );
}

function NutrientBar({
  label,
  symbol,
  gap,
  supplied,
  color,
}: {
  label: string;
  symbol: string;
  gap: number;
  supplied: number;
  color: string;
}) {
  const total = gap || 1;
  const pct = Math.min(100, (supplied / total) * 100);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xs font-bold text-gray-800">{symbol}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-2">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Gap: {gap}</span>
        <span className="text-gray-600 font-medium">
          Supplied: {supplied}
        </span>
      </div>
    </div>
  );
}
