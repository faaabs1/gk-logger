"use client";

export default function EventButton({ label, color = "bg-blue-600", onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${color} text-white px-4 py-2 rounded shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );
}
