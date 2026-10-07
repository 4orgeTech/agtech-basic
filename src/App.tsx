import { useCallback, useEffect, useState } from "react";
import {
  Sprout,
  FlaskConical,
  History as HistoryIcon,
  Leaf,
  AlertCircle,
  X,
} from "lucide-react";
import { InputForm } from "@/components/InputForm";
import { RecommendationDisplay } from "@/components/RecommendationDisplay";
import { HistoryView } from "@/components/HistoryView";
import {
  getRecommendation,
  getHistory,
  deleteRecommendation,
} from "@/lib/api";
import type {
  FertilizerInput,
  RecommendationResult,
  RecommendationRecord,
} from "@/lib/types";

type Tab = "recommend" | "history";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("recommend");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [resultInput, setResultInput] = useState<FertilizerInput | null>(null);
  const [history, setHistory] = useState<RecommendationRecord[]>([]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const records = await getHistory(50);
      setHistory(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "history" && history.length === 0) {
      loadHistory();
    }
  }, [activeTab, history.length, loadHistory]);

  const handleSubmit = async (input: FertilizerInput) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getRecommendation(input);
      setResult(response.recommendation);
      setResultInput(response.input);
      setHistory([]); // force reload on next history visit
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecommendation(id);
      setHistory((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete record");
    }
  };

  const handleSelectRecord = (record: RecommendationRecord) => {
    if (record.result_data && record.input_data) {
      setResult(record.result_data);
      setResultInput(record.input_data);
      setActiveTab("recommend");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-green-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-700 text-white">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">
                  FertiSense
                </h1>
                <p className="text-xs text-gray-500 -mt-0.5">
                  Smart Fertilizer Recommendations
                </p>
              </div>
            </div>

            <nav className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setActiveTab("recommend")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === "recommend"
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <FlaskConical className="h-4 w-4" />
                Recommend
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === "history"
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <HistoryIcon className="h-4 w-4" />
                History
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
            <p className="flex-1 text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {activeTab === "recommend" ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Input Panel */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Sprout className="h-5 w-5 text-green-700" />
                    <h2 className="text-lg font-bold text-gray-900">
                      Input Parameters
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500">
                    Enter your soil and environmental data to get a tailored
                    fertilizer recommendation.
                  </p>
                </div>
                <InputForm onSubmit={handleSubmit} loading={loading} />
              </div>
            </div>

            {/* Result Panel */}
            <div className="lg:col-span-3">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm min-h-[400px]">
                {result && resultInput ? (
                  <>
                    <div className="mb-5 pb-4 border-b border-gray-100">
                      <h2 className="text-lg font-bold text-gray-900">
                        Recommendation Results
                      </h2>
                      <p className="text-sm text-gray-500">
                        Optimized for{" "}
                        <span className="font-medium text-gray-700 capitalize">
                          {resultInput.crop}
                        </span>{" "}
                        in{" "}
                        <span className="font-medium text-gray-700 capitalize">
                          {resultInput.soilType}
                        </span>{" "}
                        soil
                      </p>
                    </div>
                    <RecommendationDisplay
                      result={result}
                      input={resultInput}
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                      <FlaskConical className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-700 mb-1">
                      No recommendation yet
                    </h3>
                    <p className="text-sm text-gray-400 max-w-xs">
                      Fill in your soil parameters on the left and click "Get
                      Recommendation" to see your personalized fertilizer plan.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                Recommendation History
              </h2>
              <p className="text-sm text-gray-500">
                All your past fertilizer recommendations, stored for reference.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <HistoryView
                records={history}
                loading={historyLoading}
                onDelete={handleDelete}
                onSelect={handleSelectRecord}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-green-100 bg-white/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4">
          <p className="text-center text-xs text-gray-400">
            FertiSense — Data-driven fertilizer recommendations. Results are
            estimates based on soil science and should be validated with local
            agronomic expertise.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
