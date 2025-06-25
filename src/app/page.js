"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const handleCreateRoom = () => {
    const newRoom = `room-${Math.random().toString(36).substring(7)}`;
    router.push(`/room/${newRoom}`);
  };

  const handleJoinRoom = () => {
    if (roomId.trim() !== "") router.push(`/room/${roomId}`);
  };

  // Sakura generator
  useEffect(() => {
    const count = 10;
    const root = document.querySelector("#sakura");
    if (!root) return;

    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "absolute animate-sakura";
      el.style.left = `${Math.random() * 100}%`;
      el.style.animationDelay = `${Math.random() * 5}s`;
      el.style.animationDuration = `${6 + Math.random() * 6}s`;
      el.textContent = "🌸";
      root.appendChild(el);
    }
  }, []);

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center px-4">
      {/* Sakura Layer */}
      <div id="sakura" className="absolute inset-0 overflow-hidden pointer-events-none z-0" />

      {/* Main Content */}
      <div className="z-10 text-center space-y-8 max-w-md w-full">
        <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow">LoveTunes</h1>
        <p className="text-white text-lg">Create or join a room to sync music with friends</p>

        {/* Create Room Card */}
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-white text-xl font-semibold">Start a New Vibe</h2>
          <p className="text-white/80 text-sm">Create a room and share the code with friends</p>
          <button
            className="w-full py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition"
            onClick={handleCreateRoom}
          >
            🌟 Create Room
          </button>
        </div>

        {/* Join Room Card */}
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-white text-xl font-semibold">Join a Room</h2>
          <p className="text-white/80 text-sm">Enter a room code to join friends</p>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter room code"
            className="w-full py-2 px-4 rounded-lg bg-white/20 text-white placeholder-white/60 outline-none"
          />
          <button
            className="w-full py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition"
            onClick={handleJoinRoom}
          >
            🎵 Join Room
          </button>
        </div>
      </div>
    </main>
  );
}
