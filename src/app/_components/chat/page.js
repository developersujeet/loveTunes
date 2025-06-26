// Enhanced ChatRoom UI - Glassmorphic with Home Page Aesthetic "use client"; import Image from "next/image"; import React, { useEffect, useMemo, useRef, useState } from "react"; import { io } from "socket.io-client"; import { v4 as uuidv4 } from "uuid";

const ChatRoom = ({ roomId }) => { const socket = useMemo(() => io("https://lovetunes-as0c.onrender.com"), []); const [message, setMessage] = useState(""); const [chat, setChat] = useState([]); const [userId, setUserId] = useState(""); const [roomUsers, setRoomUsers] = useState([]); const [videoId, setVideoId] = useState(""); const [player, setPlayer] = useState(null); const [isPlaying, setIsPlaying] = useState(false); const [searchQuery, setSearchQuery] = useState(""); const [searchResults, setSearchResults] = useState([]); const [videoTitle, setVideoTitle] = useState("Unknown video"); const scroll = useRef(); const [modal, setmodal] = useState(false); const notificationTone = useRef(null);

useEffect(() => { const id = uuidv4(); setUserId(id); }, []);

useEffect(() => { if (!socket) return; socket.on("connect", () => console.log("Connected to server")); socket.on("receive-message", (data) => { setChat((prev) => [...prev, data]); notificationTone.current?.play().catch(console.error); }); socket.on("room-users", setRoomUsers); socket.on("play-video", (videoId, title) => { setVideoId(videoId); setVideoTitle(title); if (player) { player.loadVideoById(videoId); player.playVideo(); } setIsPlaying(true); }); socket.on("pause-video", () => { player?.pauseVideo(); setIsPlaying(false); }); socket.on("video-state", (play) => { setIsPlaying(play); play ? player?.playVideo() : player?.pauseVideo(); }); socket.emit("join-room", roomId); return () => socket.disconnect(); }, [socket, player, roomId]);

const searchYouTube = async (query) => { const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API; const res = await fetch(https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${API_KEY}); const data = await res.json(); setSearchResults(data.items); };

useEffect(() => { if (!window.YT) { const script = document.createElement("script"); script.src = "https://www.youtube.com/iframe_api"; script.async = true; script.onload = () => (window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady); document.body.appendChild(script); } else { window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady; } }, []);

const onYouTubeIframeAPIReady = () => { if (!videoId) return; const newPlayer = new window.YT.Player("youtube-player", { height: "0", width: "0", videoId, playerVars: { autoplay: 0, controls: 0, modestbranding: 1 }, events: { onReady: (e) => { setPlayer(e.target); isPlaying ? e.target.playVideo() : e.target.pauseVideo(); }, onStateChange: (e) => { setIsPlaying(e.data === window.YT.PlayerState.PLAYING); } } }); };

useEffect(() => { if (videoId && window.YT) onYouTubeIframeAPIReady(); }, [videoId]);

const handlePlayPause = () => { if (isPlaying) { socket.emit("pause-video", roomId); player?.pauseVideo(); } else { socket.emit("play-video", roomId, videoId, videoTitle); player?.playVideo(); } setIsPlaying(!isPlaying); };

const handleVideoSelect = (id, title) => { setVideoId(id); setVideoTitle(title); socket.emit("play-video", roomId, id, title); player?.loadVideoById(id); player?.playVideo(); setIsPlaying(true); };

const sendMessage = (type = "text", content = "") => { if (type === "text" && message.trim()) { socket.emit("send-message", { roomId, type, message, senderId: userId }); setMessage(""); } else if (type === "media" && content) { socket.emit("send-message", { roomId, type, content, senderId: userId }); } };

useEffect(() => { scroll.current && (scroll.current.scrollTop = scroll.current.scrollHeight); }, [chat]);

return ( <div className="relative min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex flex-col items-center justify-start px-4 py-6 overflow-hidden"> <div className="absolute inset-0 pointer-events-none"> <div className="absolute w-[800px] h-[800px] bg-purple-700 blur-[200px] opacity-30 rounded-full -bottom-48 -left-32" /> <div className="absolute w-[400px] h-[400px] bg-pink-400 blur-[150px] opacity-20 rounded-full -top-32 -right-24" /> </div> <audio ref={notificationTone} src="/tone.mp3" preload="auto" />

<div className="z-10 w-full max-w-3xl flex justify-between items-center px-6 py-4 bg-white/10 backdrop-blur-lg rounded-2xl text-white shadow-lg">
    <div>
      <h2 className="text-xl font-semibold">🎵 {videoTitle}</h2>
      <p className="text-sm text-white/70">Users: {roomUsers.length} | Room: {roomId}</p>
    </div>
    <button onClick={handlePlayPause} className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md">
      {isPlaying ? "Pause" : "Play"}
    </button>
  </div>

  <div ref={scroll} className="z-10 w-full max-w-3xl flex-1 overflow-y-auto mt-6 space-y-4 px-4 py-6 bg-white/10 backdrop-blur-md rounded-2xl shadow-inner">
    {chat.map((msg, index) => (
      <div key={index} className={`flex ${msg.senderId === userId ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-xs px-4 py-3 rounded-xl text-white shadow-md ${msg.senderId === userId ? "bg-purple-600" : "bg-purple-400"}`}>
          {msg.type === "text" && msg.message}
          {msg.type === "media" && (
            <>
              {msg.content?.includes("image") && <img src={msg.content} className="rounded-lg max-w-full" alt="shared media" />}
              {msg.content?.includes("video") && (
                <video controls className="rounded-lg max-w-full">
                  <source src={msg.content} type="video/mp4" />
                </video>
              )}
            </>
          )}
        </div>
      </div>
    ))}
  </div>

  <div className="z-10 w-full max-w-3xl flex items-center space-x-4 mt-6">
    <input
      type="text"
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      placeholder="Type your message..."
      className="flex-1 p-3 rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder-white/60 outline-none shadow-inner"
    />
    <button onClick={() => sendMessage("text")} className="px-5 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl shadow-lg">
      Send
    </button>
  </div>
</div>

); };

export default ChatRoom;

                    
