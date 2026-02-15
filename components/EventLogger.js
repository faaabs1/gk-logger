"use client";

import { useState } from "react";
import { CATEGORIES } from "@/components/categories";
import EventButton from "@/components/EventButton";

export default function EventLogger({ currentTime, gameId, onLog, running }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSave = async () => {
    setErrorMsg("");

    if (!running) return setErrorMsg("Start the period to log events.");
    if (!selectedCategory) return setErrorMsg("Pick a category.");
    
    const hasSubcategories = CATEGORIES[selectedCategory].subcategories.length > 0;
    if (hasSubcategories && !selectedSubcategory) return setErrorMsg("Pick a subcategory.");

    const eventTimestamp = new Date().toISOString();

    const payload = {
      game_id: Number(gameId),
      event_timestamp: eventTimestamp,
      category: selectedCategory,
      subcategory: selectedSubcategory || selectedCategory, // Use category name if no subcategory
    };

    try {
      setSaving(true);
      await onLog(payload); // parent will insert into Supabase
      // Reset on success
      setSelectedCategory(null);
      setSelectedSubcategory(null);
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

      {!selectedCategory ? (
        // Step 1: Choose Category
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(CATEGORIES).map(([cat, info]) => (
            <EventButton
              key={cat}
              label={cat}
              color={info.color}
              onClick={() => setSelectedCategory(cat)}
            />
          ))}
        </div>
      ) : (
        // Step 2: Choose Subcategory (or confirm if no subcategories)
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{selectedCategory}</h2>

          {CATEGORIES[selectedCategory].subcategories.length > 0 ? (
            <>
              {/* Subcategory Selection */}
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES[selectedCategory].subcategories.map((subcat) => {
                  const isSelected = selectedSubcategory === subcat;
                  return (
                    <button
                      key={subcat}
                      onClick={() => setSelectedSubcategory(subcat)}
                      className={`px-3 py-2 rounded border transition ${
                        isSelected
                          ? `${CATEGORIES[selectedCategory].color} text-white`
                          : "bg-gray-200 text-black hover:bg-gray-300"
                      }`}
                    >
                      {subcat}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bg-gray-700 p-3 rounded text-sm text-gray-200">
              No subcategories for this action - click Save to log it.
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={saving || !running}
              className={`px-4 py-2 rounded text-white ${
                running ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-500 cursor-not-allowed"
              } disabled:opacity-50`}
            >
              {!running ? "Start period to save" : saving ? "Saving…" : "Save Event"}
            </button>
            <button
              onClick={() => setSelectedCategory(null)}
              disabled={saving}
              className="px-4 py-2 bg-gray-500 text-white rounded disabled:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
