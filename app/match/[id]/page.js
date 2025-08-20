"use client";
import { useState } from "react";
import Stopwatch from "@/components/Stopwatch";
import EventLogger from "@/components/EventLogger";
import { supabase } from "@/lib/supabaseClient"; // <-- NEW

export default function MatchPage({ params }) {
  const matchId = params.id;
  const [events, setEvents] = useState([]);
  const [half, setHalf] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState(""); // <-- NEW (optional banner)
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


  // Insert to Supabase + keep local log list
  const handleLogEvent = async (event) => {
    setErrorMsg("");

    // Build payload for your Event table columns
    const payload = {
      match_id: Number(matchId),          // FK to Game.gameID
      minute: event.minute,              // number
      category: event.category,          // text
      subcategories: event.subcategories, // JSON (array)
      rating: event.rating,              // text/enum
      comment: event.comment || null,    // text (nullable)
      // created_at: let DB default handle it
    };

    const { data, error } = await supabase
      .from("Event")                     // NOTE: case-sensitive table name
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Insert Event error:", error);
      setErrorMsg(error.message || "Failed to save event.");
      return;
    }

    // Keep your local list the same shape you already render
    // (retain the UI-generated id so your list keys keep working)
    setEvents((prev) => [...prev, event]);
  };

  const handleStartPause = () => setIsRunning((prev) => !prev);

  const handleNextHalf = () => {
    setIsRunning(false);          // stop first half
    setStopwatchTime(45 * 60);    // reset to 45:00
    setHalf(2);
    setIsRunning(true);           // start second half immediately
  };

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen text-white">
      {/* Metadata */}
      <div className="bg-gray-800 p-4 rounded-lg space-y-1">
        <div><b>Match:</b> {matchId}</div>
        <div><b>Half:</b> {half === 1 ? "First Half" : "Second Half"}</div>
      </div>

      {/* Optional error banner */}
      {errorMsg && (
        <div className="bg-red-600/20 border border-red-600 text-red-200 p-3 rounded">
          {errorMsg}
        </div>
      )}


      {/* Controls */}
      <div className="flex space-x-4">
        <button
          onClick={handleStartPause}
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-500"
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        {half === 1 && (
          <button
            onClick={handleNextHalf}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
          >
            2. Halbzeit starten
          </button>
        )}
        <button
          onClick={handleEndGame}
          className="px-4 py-2 bg-red-600 rounded hover:bg-red-500 ml-auto"
        >
          Spiel beenden
        </button>
      </div>


      {/* Stopwatch */}
      <Stopwatch time={stopwatchTime} running={isRunning} onTick={setCurrentTime} />

      {/* Event Logger */}
      <EventLogger currentTime={currentTime} onLog={handleLogEvent} />

      {/* Event Log */}
      <div>
        <h2 className="text-xl font-semibold mt-6 mb-2">Event Log</h2>
        <ul className="space-y-2">
          {events.map((e) => {
            let bg = "bg-gray-200 text-black";
            if (e.rating === "Positive") bg = "bg-green-600 text-white";
            else if (e.rating === "Negative") bg = "bg-red-600 text-white";
            else if (e.rating === "Neutral") bg = "bg-yellow-500 text-white";

            return (
              <li key={e.id} className={`p-2 rounded ${bg}`}>
                <div className="flex justify-between">
                  <span className="font-bold">{e.minute}'</span>
                  <span>{e.category}</span>
                </div>
                <div className="text-sm mt-1">
                  {e.subcategories.join(", ")} | <b>{e.rating}</b>
                </div>
                {e.comment && <div className="italic">"{e.comment}"</div>}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
