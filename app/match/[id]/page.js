"use client";
import { useState, useEffect, use } from "react";
import Stopwatch from "@/components/Stopwatch";
import EventLogger from "@/components/EventLogger";
import MatchPeriodControl from "@/components/MatchPeriodControl";
import GoalkeeperSelector from "@/components/GoalkeeperSelector";
import { supabase } from "@/lib/supabaseClient";

export default function MatchPage({ params }) {
  const matchId = use(params).id;
  const [events, setEvents] = useState([]);
  const [half, setHalf] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Game metadata
  const [gameData, setGameData] = useState(null);
  const [currentGoalkeeperId, setCurrentGoalkeeperId] = useState(null);
  const [periodData, setPeriodData] = useState(null);
  const [secondHalfResetKey, setSecondHalfResetKey] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch game data on mount
  useEffect(() => {
    const fetchGameData = async () => {
      setLoading(true);

      // Fetch game data
      const { data: gameData, error: gameError } = await supabase
        .from("game")
        .select("*")
        .eq("gameid", Number(matchId))
        .single();

      if (gameError) {
        setErrorMsg(gameError.message);
        setLoading(false);
        return;
      }

      if (!gameData) {
        setLoading(false);
        return;
      }

      // Fetch team data
      const { data: teamData } = await supabase
        .from("team")
        .select("*")
        .eq("teamid", gameData.game_opponent)
        .single();

      // Fetch player data
      const { data: playerData } = await supabase
        .from("player")
        .select("*")
        .eq("id", gameData.goalkeeper)
        .single();

      setGameData({
        ...gameData,
        team: teamData,
        player: playerData,
      });
      setCurrentGoalkeeperId(gameData.goalkeeper);

      setLoading(false);
    };

    fetchGameData();
  }, [matchId]);

  // Fetch period data when half changes
  useEffect(() => {
    const fetchPeriodData = async () => {
      const { data, error } = await supabase
        .from("matchperiod")
        .select("*")
        .eq("game_id", Number(matchId))
        .eq("period", half)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching period:", error);
      } else if (data) {
        setPeriodData(data);
      } else {
        setPeriodData(null);
      }
    };

    fetchPeriodData();
  }, [half, matchId]);
  const handleEndGame = async () => {
    setIsRunning(false);

    // OPTIONAL: update Game row with an ended_at timestamp
    // const { error } = await supabase
    //   .from("Game")
    //   .update({ ended_at: new Date().toISOString() })
    //   .eq("gameID", matchId);
    // if (error) console.error("Failed to end game:", error);

    // Redirect to summary or home
    window.location.href = "/"; // or `/games/${matchId}/summary`
  };

  const handlePeriodStart = (data) => {
    setPeriodData(data);
    setIsRunning(true);  // Auto-start stopwatch when period starts
  };

  const handlePeriodEnd = (data) => {
    setPeriodData(data);
    setIsRunning(false);  // Auto-stop stopwatch when period ends
    
    // If it's the 1st half ending, reset the 2nd half button and switch to 2nd half
    if (half === 1) {
      setSecondHalfResetKey((prev) => prev + 1);
      setHalf(2);
      setStopwatchTime(45 * 60); // Reset stopwatch to 45:00 for second half
    }
    
    // If it's the 2nd half ending, end the game automatically
    if (half === 2) {
      window.location.href = "/";
    }
  };

  const handleGoalkeeperChange = (newGoalkeeperId) => {
    setCurrentGoalkeeperId(newGoalkeeperId);
  };


  // Insert to Supabase
  const handleLogEvent = async (payload) => {
    setErrorMsg("");

    const { data, error } = await supabase
      .from("eventlog")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Insert EventLog error:", error);
      setErrorMsg(error.message || "Failed to save event.");
      return;
    }

    // Keep local list for display
    setEvents((prev) => [...prev, data]);
  };

  const handleStartPause = () => setIsRunning((prev) => !prev);

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen text-white">
      {/* Game Metadata */}
      {loading ? (
        <div className="bg-gray-800 p-4 rounded-lg">Loading game data...</div>
      ) : gameData ? (
        <div className="bg-gray-800 p-4 rounded-lg space-y-2">
          <div>
            <b>Opponent:</b> {gameData.team?.team_name || "Unknown"}
          </div>
          <div>
            <b>Location:</b> {gameData.game_location === 0 ? "Home" : "Away"}
          </div>
          <div>
            <b>Date/Time:</b> {new Date(gameData.game_datetime).toLocaleString()}
          </div>
          <div>
            <b>Starting Goalkeeper:</b>{" "}
            {gameData.player
              ? `${gameData.player.player_firstname} ${gameData.player.player_lastname}`
              : "Unknown"}
          </div>
        </div>
      ) : null}

      {/* Error banner */}
      {errorMsg && (
        <div className="bg-red-600/20 border border-red-600 text-red-200 p-3 rounded">
          {errorMsg}
        </div>
      )}

      {/* Goalkeeper Selector */}
      <GoalkeeperSelector
        gameId={Number(matchId)}
        currentGoalkeeperId={currentGoalkeeperId}
        currentPeriod={half}
        onGoalkeeperChange={handleGoalkeeperChange}
      />

      {/* Period Control */}
      <MatchPeriodControl
        gameId={Number(matchId)}
        currentPeriod={half}
        periodData={periodData}
        onPeriodStart={handlePeriodStart}
        onPeriodEnd={handlePeriodEnd}
        resetKey={secondHalfResetKey}
      />

      {/* Stopwatch */}
      <Stopwatch time={stopwatchTime} running={isRunning} onTick={setCurrentTime} />

      {/* Event Logger */}
      <EventLogger 
        gameId={Number(matchId)} 
        currentTime={currentTime} 
        onLog={handleLogEvent}
        running={isRunning}
      />

      {/* Aggregated Event Summary */}
      <div>
        <h2 className="text-xl font-semibold mt-6 mb-4">Actions Summary</h2>
        {events.length === 0 ? (
          <p className="text-gray-400">No actions recorded yet</p>
        ) : (
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-lg font-semibold mb-4">
              Total Actions: <span className="text-green-400">{events.length}</span>
            </div>
            <div className="space-y-3">
              {Object.entries(
                events.reduce((acc, e) => {
                  if (!acc[e.category]) {
                    acc[e.category] = 0;
                  }
                  acc[e.category] += 1;
                  return acc;
                }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                    <span className="font-semibold">{category}</span>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
