import { useState } from "react";
import { Trash2, ChevronDown, History, Loader2 } from "lucide-react";
import type { RecommendationRecord } from "@/lib/types";

interface HistoryViewProps {
  records: RecommendationRecord[];
  loading: boolean;
  onDelete: (id: string) => void;
  onSelect: (record: RecommendationRecord) => void;
}

export function HistoryView({
  records,
  loading,
  onDelete,
  onSelect,
}: HistoryViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="mx-auto h-10 w-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-400">No recommendations yet</p>
        <p className="text-xs text-gray-300 mt-1">
          Your past recommendations will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {records.map((record) => (
        <div
          key={record.id}
          className="rounded-lg border border-gray-200 bg-white overflow-hidden transition hover:border-gray-300"
        >
          {/* Summary row */}
          <button
            onClick={() => toggleExpand(record.id)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/50 transition"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 capitalize">
                  {record.crop}
                </span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500 capitalize">
                  {record.soil_type} soil
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {record.recommended_fertilizer}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <p className="text-sm font-bold text-green-800">
                  {record.recommended_quantity_kg} kg
                </p>
                <p className="text-xs text-gray-400">
                  ${record.estimated_cost}
                </p>
              </div>
              <ConfidenceBadge value={record.confidence} />
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  expandedId === record.id ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {/* Expanded details */}
          {expandedId === record.id && (
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/30">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <DetailItem label="N" value={`${record.nitrogen} kg/ha`} />
                <DetailItem label="P" value={`${record.phosphorus} kg/ha`} />
                <DetailItem label="K" value={`${record.potassium} kg/ha`} />
                <DetailItem label="pH" value={record.ph} />
                <DetailItem
                  label="Temp"
                  value={`${record.temperature}°C`}
                />
                <DetailItem
                  label="Humidity"
                  value={`${record.humidity}%`}
                />
                <DetailItem
                  label="Rainfall"
                  value={`${record.rainfall}mm`}
                />
                <DetailItem
                  label="Area"
                  value={`${record.input_data?.area ?? 1} ha`}
                />
              </div>

              {record.result_data?.warnings?.length > 0 && (
                <div className="mb-3 rounded border border-amber-200 bg-amber-50/50 p-2">
                  <p className="text-xs font-medium text-amber-700 mb-1">
                    Warnings
                  </p>
                  <ul className="space-y-0.5">
                    {record.result_data.warnings.map((w, i) => (
                      <li
                        key={i}
                        className="text-xs text-amber-600 pl-2"
                      >
                        → {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onSelect(record)}
                  className="text-xs font-medium text-green-700 hover:text-green-800 transition"
                >
                  View Full Details
                </button>
                <span className="text-gray-200">|</span>
                <span className="text-xs text-gray-400">
                  {new Date(record.created_at).toLocaleString()}
                </span>
                <button
                  onClick={() => onDelete(record.id)}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 transition"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-700">{value}</p>
    </div>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const color =
    value >= 70
      ? "bg-green-100 text-green-700"
      : value >= 40
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {value}%
    </span>
  );
}
