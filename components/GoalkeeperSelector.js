"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function GoalkeeperSelector({
  gameId,
  currentGoalkeeperId,
  currentPeriod,
  onGoalkeeperChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentGK, setCurrentGK] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch players and current goalkeeper
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Get all players
      const { data: playerData, error: playerError } = await supabase
        .from("player")
        .select("id, player_firstname, player_lastname")
        .order("player_lastname", { ascending: true });

      // Get current goalkeeper
      const { data: gkData, error: gkError } = await supabase
        .from("player")
        .select("id, player_firstname, player_lastname")
        .eq("id", currentGoalkeeperId)
        .single();

      if (!playerError) {
        setPlayers(playerData || []);
      }

      if (!gkError && gkData) {
        setCurrentGK(gkData);
      }

      setLoading(false);
    };

    fetchData();
  }, [currentGoalkeeperId]);

  const handleChangeGoalkeeper = async (newGoalkeeperId) => {
    setErrorMsg("");

    if (newGoalkeeperId === currentGoalkeeperId) {
      setIsOpen(false);
      return;
    }

    const timestamp = new Date().toISOString();

    // Record the change
    const { error } = await supabase
      .from("goalkeeperchange")
      .insert([
        {
          game_id: gameId,
          old_goalkeeper_id: currentGoalkeeperId || null,
          new_goalkeeper_id: newGoalkeeperId,
          changed_at: timestamp,
          period: currentPeriod,
        },
      ]);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // Update current goalkeeper display
    const newGK = players.find((p) => p.id === newGoalkeeperId);
    setCurrentGK(newGK);
    setIsOpen(false);
    onGoalkeeperChange(newGoalkeeperId);
  };

  const getPlayerName = (player) => {
    return [player.player_firstname, player.player_lastname]
      .filter(Boolean)
      .join(" ");
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm text-gray-400">Current Goalkeeper</div>
          <div className="text-lg font-semibold">
            {currentGK ? getPlayerName(currentGK) : "None selected"}
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:bg-blue-400"
        >
          Change
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-600/20 border border-red-600 text-red-200 p-2 rounded text-sm">
          {errorMsg}
        </div>
      )}

      {isOpen && (
        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-700 rounded p-2 bg-gray-900">
          {players.map((player) => {
            const isSelected = player.id === currentGoalkeeperId;
            return (
              <button
                key={player.id}
                onClick={() => handleChangeGoalkeeper(player.id)}
                disabled={loading}
                className={`w-full text-left px-3 py-2 rounded transition ${
                  isSelected
                    ? "bg-blue-600 text-white font-semibold"
                    : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                } disabled:opacity-50`}
              >
                {getPlayerName(player)}
                {isSelected && " ✓"}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
