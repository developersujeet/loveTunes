"use client";
import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

const ChatRoom = ({ roomId }) => {
  const socket = useMemo(() => io("https://lovetunes-as0c.onrender.com"), []);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [userId, setUserId] = useState("");
  const [roomUsers, setRoomUsers] = useState([]);
  const [videoId, setVideoId] = useState("");
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [videoTitle, setVideoTitle] = useState("Unknown video");
  const scroll = useRef();
  const [modal, setmodal] = useState(false);
  const notificationTone = useRef(null);

  useEffect(() => {
    setUserId(uuidv4());
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => console.log("Connected to server"));

    socket.on("receive-message", (data) => {
      setChat((prev) => [...prev, data]);
      notificationTone.current?.play().catch(console.error);
    });

    socket.on("room-users", (users) => setRoomUsers(users));

    socket.on("play-video", (videoId, videoTitle, startTime = 0) => {
      setVideoId(videoId);
      setVideoTitle(videoTitle);
      if (player) {
        player.loadVideoById(videoId);
        player.seekTo(startTime, true);
        player.playVideo();
      }
      setIsPlaying(true);
    });

    socket.on("pause-video", (pauseTime = 0) => {
      if (player) {
        player.seekTo(pauseTime, true);
        player.pauseVideo();
      }
      setIsPlaying(false);
    });

    socket.on("video-state", (playing) => {
      setIsPlaying(playing);
      playing ? player?.playVideo() : player?.pauseVideo();
    });

    socket.emit("join-room", roomId);

    return () => {
      socket.off("connect");
      socket.off("receive-message");
      socket.off("room-users");
      socket.off("play-video");
      socket.off("pause-video");
      socket.off("video-state");
    };
  }, [socket, player, roomId]);

  const searchYouTube = async (query) => {
    const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API;
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${API_KEY}`
      );
      const data = await res.json();
      setSearchResults(data.items);
    } catch (err) {
      console.error("Error fetching YouTube:", err);
    }
  };

  useEffect(() => {
    if (!window.YT) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onload = () => {
        window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
      };
      document.body.appendChild(script);
    } else {
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }
  }, []);

  const onYouTubeIframeAPIReady = () => {
    if (videoId) {
      const newPlayer = new window.YT.Player("youtube-player", {
        height: "1",
        width: "1",
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          showinfo: 0,
          fs: 0,
          rel: 0,
        },
        events: {
          onReady: (e) => {
            setPlayer(e.target);
            isPlaying ? e.target.playVideo() : e.target.pauseVideo();
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
            if (e.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
          },
        },
      });
    }
  };

  useEffect(() => {
    if (videoId && window.YT) onYouTubeIframeAPIReady();
  }, [videoId]);

  const handlePlayPause = () => {
    if (!player) return;

    const currentTime = player.getCurrentTime() || 0;

    if (isPlaying) {
      socket.emit("pause-video", roomId, currentTime);
      player.pauseVideo();
    } else {
      socket.emit("play-video", roomId, videoId, videoTitle, currentTime);
      player.seekTo(currentTime, true);
      player.playVideo();
    }

    setIsPlaying(!isPlaying);
  };

  const handleVideoSelect = (videoId, title) => {
    setVideoId(videoId);
    setVideoTitle(title);
    socket.emit("play-video", roomId, videoId, title, 0);
    if (player) {
      player.loadVideoById(videoId);
      player.playVideo();
    }
    setIsPlaying(true);
  };

  const sendMessage = (type = "text", content = "") => {
    if (type === "text" && message.trim()) {
      socket.emit("send-message", {
        roomId,
        type,
        message,
        senderId: userId,
      });
      setMessage("");
    } else if (type === "media" && content) {
      socket.emit("send-message", {
        roomId,
        type,
        content,
        senderId: userId,
      });
    }
  };

  useEffect(() => {
    scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: "smooth" });
  }, [chat]);

  return (
    <>
      <div className="flex flex-col h-screen w-screen bg-black text-white py-2 relative overflow-hidden">
        <div className="h-[800px] w-[800px] bg-purple-800 rounded-full blur-3xl opacity-25 absolute bottom-0 -left-32"></div>
        <div className="h-[400px] w-[400px] bg-purple-800 rounded-full blur-3xl opacity-25 absolute top-0 -right-32"></div>
        <audio ref={notificationTone} src="/tone.mp3" preload="auto" />

        <div className="text-white font-semibold text-center py-2 text-sm">
          <p>{roomUsers.length} users</p>
          <p>Share code: {roomId}</p>
        </div>

        <div className="max-w-screen-lg w-full mx-auto rounded-xl relative z-10 lg:px-0 px-5">
          <div className="flex w-full items-center justify-between lg:py-5 py-2 px-5 bg-purple-600 rounded-xl z-20">
            <div className="flex items-center space-x-3">
              {videoId ? (
                <div>
                  <span>{videoTitle?.slice(0, 20)}</span>
                  <button
                    className={`px-4 py-2 ${
                      isPlaying ? "bg-purple-900" : "bg-purple-300"
                    } text-white rounded-lg`}
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? "Pause" : "Play"}
                  </button>
                </div>
              ) : (
                <span>No music selected</span>
              )}
            </div>
            <Image
              src="/music.png"
              alt="music"
              width={30}
              height={30}
              className="cursor-pointer"
              onClick={() => setmodal(true)}
            />
          </div>

          <div id="youtube-player" className="mb-4" />

          <div
            className="lg:h-[520px] h-[500px] overflow-y-scroll flex flex-col gap-4 py-10 lg:px-8 px-2 rounded-xl z-10"
            ref={scroll}
          >
            {chat.map((msg, i) => (
              <div
                key={i}
                className={`flex items-center ${
                  msg.senderId === userId ? "justify-end" : "justify-start"
                }`}
              >
                {msg.senderId !== userId && (
                  <Image
                    src="/heart.png"
                    alt="User"
                    width={40}
                    height={40}
                    className="mr-2 rounded-full bg-purple-500 p-2"
                  />
                )}
                <div
                  className={`py-2 px-4 max-w-xs rounded-lg ${
                    msg.senderId === userId
                      ? "bg-purple-400 text-white"
                      : "bg-purple-600"
                  }`}
                >
                  {msg.type === "text" && msg.message}
                  {msg.type === "media" && (
                    <>
                      {msg.content?.startsWith("data:image") && (
                        <img
                          src={msg.content}
                          alt="Shared media"
                          className="max-w-full rounded-lg"
                        />
                      )}
                      {msg.content?.startsWith("data:video") && (
                        <video controls className="max-w-full rounded-lg">
                          <source src={msg.content} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      )}
                      {msg.content?.startsWith("blob:") && (
                        <>
                          {msg.content?.includes("image") ? (
                            <img
                              src={msg.content}
                              alt="Shared media"
                              className="max-w-full rounded-lg"
                            />
                          ) : msg.content?.includes("video") ? (
                            <video controls className="max-w-full rounded-lg">
                              <source src={msg.content} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          ) : null}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="flex flex-row items-center space-x-5">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full p-3 border border-gray-300 bg-transparent rounded-lg text-white"
            />
            <button
              onClick={() => sendMessage("text")}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-80 z-50">
          <button
            className="absolute top-4 right-4 text-white text-2xl"
            onClick={() => setmodal(false)}
          >
            Close
          </button>
          <div className="mb-4 flex flex-col items-center space-y-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a song..."
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
            <button
              onClick={() => searchYouTube(searchQuery)}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Search
            </button>
            <div className="mt-4">
              {searchResults.map((video) => (
                <div
                  key={video.id.videoId}
                  className="flex justify-between mb-2"
                >
                  <div className="text-white px-10">{video.snippet.title}</div>
                  <button
                    onClick={() =>
                      handleVideoSelect(video.id.videoId, video.snippet.title)
                    }
                    className="px-4 py-2 bg-green-500 text-white rounded-lg"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatRoom;
