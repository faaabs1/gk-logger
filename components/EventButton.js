"use client";

export default function EventButton({ label, color = "bg-blue-600", onClick }) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white px-4 py-2 rounded shadow hover:opacity-90`}
    >
      {label}
    </button>
  );
}