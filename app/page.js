"use client";
import { useRouter } from "next/navigation";


export default function HomePage() {
  const router = useRouter();

  const startNewGame = () => {
    router.push("/new-game");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">Goalkeeper Logger</h1>
      <button
        onClick={startNewGame}
        className="px-6 py-3 bg-green-600 rounded-lg text-xl hover:bg-green-500"
      >
        New Game
      </button>
    </div>
  );
}