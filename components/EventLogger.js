"use client";

import { useState } from "react";
import { CATEGORIES } from "@/components/categories";
import EventButton from "@/components/EventButton";

export default function EventLogger({ currentTime, onLog }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcats, setSelectedSubcats] = useState([]);
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  

  const toggleSubcategory = (subcat) => {
    setSelectedSubcats((prev) =>
      prev.includes(subcat)
        ? prev.filter((s) => s !== subcat)
        : [...prev, subcat]
    );
  };

  const handleSave = async () => {
    setErrorMsg("");

    if (!selectedCategory) return setErrorMsg("Pick a category.");
    if (selectedSubcats.length === 0) return setErrorMsg("Pick at least one subcategory.");
    if (!rating) return setErrorMsg("Pick a rating (Positive/Neutral/Negative).");

    const payload = {
      id: Date.now(), // local UI id
      minute: Math.floor((currentTime || 0) / 60),
      category: selectedCategory,
      subcategories: selectedSubcats,
      rating,
      comment,
    };

    try {
      setSaving(true);
      await onLog(payload); // parent will insert into Supabase
      // Reset only on success
      setSelectedCategory(null);
      setSelectedSubcats([]);
      setRating(null);
      setComment("");
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
        // Step 2: Subcategories + Rating + Comment
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{selectedCategory}</h2>

          {/* Subcategory Selection */}
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES[selectedCategory].subcategories.map((subcat) => {
              const isSelected = selectedSubcats.includes(subcat);
              return (
                <button
                  key={subcat}
                  onClick={() => toggleSubcategory(subcat)}
                  className={`px-3 py-2 rounded border transition ${
                    isSelected
                      ? `${CATEGORIES[selectedCategory].color} text-white` // bg = category color, text = white
                      : "bg-gray-200 text-black hover:bg-gray-300"
                  }`}
                >
                  {subcat}
                </button>
              );
            })}
          </div>


          {/* Rating Selection */}
          <div className="flex space-x-3">
            {["Positive", "Neutral", "Negative"].map((r) => {
              const isSelected = rating === r;
              let colorClasses = "bg-gray-200 text-black hover:bg-gray-300"; // default

              if (isSelected) {
                if (r === "Positive") colorClasses = "bg-green-600 text-white";
                if (r === "Neutral") colorClasses = "bg-yellow-500 text-white";
                if (r === "Negative") colorClasses = "bg-red-600 text-white";
              }

              return (
                <button
                  key={r}
                  onClick={() => setRating(r)}
                  className={`px-3 py-2 rounded transition ${colorClasses}`}
                >
                  {r}
                </button>
              );
            })}
          </div>


          {/* Comment */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add optional comment..."
            className="w-full p-2 border rounded text-black"
          />

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-400"
            >
              {saving ? "Saving…" : "Save Event"}
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
