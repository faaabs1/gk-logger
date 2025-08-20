"use client";

import NewGameForm from "@/components/NewGameForm";

export default function NewGamePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-6">New Game Metadata</h1>
      <NewGameForm />
    </div>
  );
}
