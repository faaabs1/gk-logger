"use client";

import { useState } from "react";
import { CATEGORIES } from "@/components/categories";
import EventButton from "@/components/EventButton";

export default function EventLogger({ currentTime, gameId, onLog, running }) {
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCategoryClick = async (category) => {
    setErrorMsg("");

    if (!running) return setErrorMsg("Start the period to log events.");
    if (saving) return;

    const eventTimestamp = new Date().toISOString();

    const payload = {
      game_id: Number(gameId),
      event_timestamp: eventTimestamp,
      category,
      subcategory: category, // DB column is NOT NULL; category is now the whole event
    };

    try {
      setSaving(true);
      await onLog(payload); // parent will insert into Supabase
    } catch (e) {
      setErrorMsg(e?.message || "Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="bg-red-600/20 border border-red-600 text-red-200 p-2 rounded text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(CATEGORIES).map(([cat, info]) => (
          <EventButton
            key={cat}
            label={cat}
            color={info.color}
            onClick={() => handleCategoryClick(cat)}
            disabled={saving || !running}
          />
        ))}
      </div>
    </div>
  );
}
