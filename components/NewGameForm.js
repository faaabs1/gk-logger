"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function NewGameForm() {
  const router = useRouter();

  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);

  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedGoalkeeper, setSelectedGoalkeeper] = useState("");
  const [datetime, setDatetime] = useState("");
  const [locationChoice, setLocationChoice] = useState(""); // "0" = home, "1" = away

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch Team + Player
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErrorMsg("");

      const teamQ = supabase
        .from("Team")
        .select("teamID, team_name")
        .order("team_name", { ascending: true });

      const playerQ = supabase
        .from("Player")
        .select("id, player_firstname, player_lastname")
        .order("player_lastname", { ascending: true })
        .order("player_firstname", { ascending: true });

      const [{ data: teamData, error: teamError }, { data: playerData, error: playerError }] =
        await Promise.all([teamQ, playerQ]);

      if (cancelled) return;

      if (teamError || playerError) {
        setErrorMsg(teamError?.message || playerError?.message || "Failed to load data.");
      } else {
        setTeams(teamData || []);
        setPlayers(playerData || []);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const playersWithName = useMemo(
    () =>
      players.map((p) => ({
        ...p,
        fullName: [p.player_firstname, p.player_lastname].filter(Boolean).join(" "),
      })),
    [players]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedTeam || !selectedGoalkeeper || !datetime || locationChoice === "") {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    const dt = new Date(datetime);
    if (Number.isNaN(dt.getTime())) {
      setErrorMsg("Invalid date and time.");
      return;
    }
    const isoDatetime = dt.toISOString();

    setSaving(true);
    const { data, error } = await supabase
      .from("Game")
      .insert([
        {
          game_location: Number(locationChoice),     // 0 = home, 1 = away
          game_opponent: Number(selectedTeam),       // Team.teamID
          game_datetime: isoDatetime,                // datetime string
          goalkeeper: Number(selectedGoalkeeper),    // Player.id
        },
      ])
      .select()
      .single();
    setSaving(false);

    if (error) {
      setErrorMsg(error.message || "Could not create game.");
      return;
    }

    router.push(`/match/${data.gameID}`);
  };

  if (loading) {
    return <p className="text-white">Loading…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      {errorMsg ? (
        <div className="bg-red-600/20 border border-red-600 text-red-200 p-3 rounded">
          {errorMsg}
        </div>
      ) : null}

      {/* Team */}
      <div>
        <label className="block mb-1">Opponent:</label>
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="w-full p-2 rounded text-black"
        >
          <option value="">Select a team</option>
          {teams.map((t) => (
            <option key={t.teamID} value={t.teamID}>
              {t.team_name}
            </option>
          ))}
        </select>
      </div>

      {/* Goalkeeper */}
      <div>
        <label className="block mb-1">Goalkeeper:</label>
        <select
          value={selectedGoalkeeper}
          onChange={(e) => setSelectedGoalkeeper(e.target.value)}
          className="w-full p-2 rounded text-black"
        >
          <option value="">Select a goalkeeper</option>
          {playersWithName.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fullName || "(unnamed)"}
            </option>
          ))}
        </select>
      </div>

      {/* Home / Away */}
      <div>
        <span className="block mb-1">Location:</span>
        <div className="flex items-center gap-6 bg-gray-800 p-3 rounded">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="location"
              value="0"
              checked={locationChoice === "0"}
              onChange={(e) => setLocationChoice(e.target.value)}
              className="accent-green-600"
            />
            <span>Home (0)</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="location"
              value="1"
              checked={locationChoice === "1"}
              onChange={(e) => setLocationChoice(e.target.value)}
              className="accent-green-600"
            />
            <span>Away (1)</span>
          </label>
        </div>
      </div>

      {/* Date & Time */}
      <div>
        <label className="block mb-1">Date & Time:</label>
        <input
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          className="w-full p-2 rounded text-black"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className={`w-full py-2 rounded text-xl transition ${
          saving ? "bg-green-700 cursor-not-allowed" : "bg-green-600 hover:bg-green-500"
        }`}
      >
        {saving ? "Creating…" : "Start Logging"}
      </button>
    </form>
  );
}
