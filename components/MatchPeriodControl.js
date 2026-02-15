"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function MatchPeriodControl({
  gameId,
  currentPeriod,
  periodData,
  onPeriodStart,
  onPeriodEnd,
  resetKey,
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [localPeriodData, setLocalPeriodData] = useState(periodData);

  // When resetKey changes, reset the local state
  useEffect(() => {
    if (currentPeriod === 2) {
      setLocalPeriodData(null);
    }
  }, [resetKey, currentPeriod]);

  const handleStartPeriod = async () => {
    setErrorMsg("");
    setLoading(true);

    const timestamp = new Date().toISOString();

    // Check if period already exists
    const { data: existing, error: checkError } = await supabase
      .from("matchperiod")
      .select("id")
      .eq("game_id", gameId)
      .eq("period", currentPeriod)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 means no rows found, which is expected
      setErrorMsg(checkError.message);
      setLoading(false);
      return;
    }

    let result;
    if (existing) {
      // Update existing (in case it was reset)
      result = await supabase
        .from("matchperiod")
        .update({ started_at: timestamp })
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      // Create new
      result = await supabase
        .from("matchperiod")
        .insert([
          {
            game_id: gameId,
            period: currentPeriod,
            started_at: timestamp,
          },
        ])
        .select()
        .single();
    }

    if (result.error) {
      setErrorMsg(result.error.message);
    } else {
      setLocalPeriodData(result.data);
      onPeriodStart(result.data);
    }

    setLoading(false);
  };

  const handleEndPeriod = async () => {
    setErrorMsg("");
    setLoading(true);

    const timestamp = new Date().toISOString();

    const { data, error } = await supabase
      .from("matchperiod")
      .update({ ended_at: timestamp })
      .eq("game_id", gameId)
      .eq("period", currentPeriod)
      .select()
      .single();

    if (error) {
      setErrorMsg(error.message);
    } else {
      setLocalPeriodData(data);
      onPeriodEnd(data);
    }

    setLoading(false);
  };

  const periodStarted = localPeriodData?.started_at;
  const periodEnded = localPeriodData?.ended_at;

  return (
    <div className="bg-gray-800 p-4 rounded-lg space-y-3">
      <div className="text-lg font-semibold">
        {currentPeriod === 1 ? "1. Halbzeit" : "2. Halbzeit"}
      </div>

      {errorMsg && (
        <div className="bg-red-600/20 border border-red-600 text-red-200 p-2 rounded text-sm">
          {errorMsg}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleStartPeriod}
          disabled={loading || periodStarted}
          className={`px-4 py-2 rounded font-semibold ${
            periodStarted
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-500"
          } disabled:opacity-50`}
        >
          {periodStarted ? "✓ Started" : "Start"}
        </button>

        <button
          onClick={handleEndPeriod}
          disabled={loading || !periodStarted || periodEnded}
          className={`px-4 py-2 rounded font-semibold ${
            !periodStarted
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : periodEnded
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-500"
          } disabled:opacity-50`}
        >
          {periodEnded ? "✓ Ended" : "End"}
        </button>
      </div>

      {periodStarted && (
        <div className="text-sm text-gray-300">
          Started: {new Date(periodStarted).toLocaleTimeString()}
        </div>
      )}
      {periodEnded && (
        <div className="text-sm text-gray-300">
          Ended: {new Date(periodEnded).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
