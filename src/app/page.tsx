"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import * as Tone from "tone";
import { solfegeNotes } from "@/config/notes";
import { convertNoteToSolfege, convertSolfegeToNote } from "@/utils/encoder";

const socket = io("https://socket.zeabur.app");

export default function Page() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [timeOffset, setTimeOffset] = useState<number>(0); // 本地時間與伺服器的時間差（本地時間 - 伺服器時間）

  // 與伺服器對時
  const syncServerTime = () => {
    const start = Date.now();
    socket.emit("get-server-time", (serverTime: number) => {
      const end = Date.now();
      const rtt = end - start;
      const estimatedServerTime = serverTime + rtt / 2;
      const offset = estimatedServerTime - end; // 正值表示本機慢，負值表示本機快
      setTimeOffset(offset);
      console.log("⏱️ 與伺服器時間差:", offset, "ms");
    });
  };

  const prepareAudio = async () => {
    await Tone.start();
    setIsReady(true);
    syncServerTime(); // 準備完成後對時
  };

  const playMusic = async (startAt: number) => {
    setCurrentIndex(-1);
    setIsPlaying(true);

    const synth = new Tone.Synth().toDestination();
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    transport.timeSignature = [6, 8];
    transport.bpm.value = 75;

    let currentTime = 0;

    const part = new Tone.Part(
      (time, note) => {
        const draw = Tone.getDraw();

        if (note.noteName !== "rest") {
          const actualNote = convertSolfegeToNote(note.noteName);
          synth.triggerAttackRelease(actualNote, note.duration, time);
        }

        draw.schedule(() => {
          setCurrentIndex((prev) => prev + 1);
        }, time);
      },
      solfegeNotes.map((note) => {
        const event = { time: currentTime, ...note };
        currentTime += Tone.Time(note.duration).toSeconds();
        return event;
      }),
    );

    part.start(0);

    transport.scheduleOnce(() => {
      setIsPlaying(false);
      part.dispose();
    }, currentTime);

    // 換算 Tone.js 中的時間點
    const now = Date.now();
    const adjustedStart = (startAt - now - timeOffset) / 1000; // 轉為秒

    console.log("🎵 預定播放時間距現在", adjustedStart, "秒");

    transport.start("+" + adjustedStart); // 延遲這個時間啟動
  };

  const handlePlay = () => {
    socket.emit("play-request", { triggeredAt: Date.now() });
  };

  useEffect(() => {
    if (!isReady) return;

    // 收到播放事件時啟動播放
    socket.on("play", ({ startAt }) => {
      playMusic(startAt);
    });

    return () => {
      socket.off("play");
    };
  }, [isReady, timeOffset]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center p-6">
      <div className="rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="mb-6 flex items-center gap-2 text-3xl font-semibold text-gray-800">
          🎵 音樂播放器
        </h1>

        <div className="mb-8 flex justify-center">
          <button
            className={`rounded-xl px-6 py-3 font-medium text-white transition-colors duration-300 ${isReady ? "bg-blue-500 hover:bg-blue-600" : "bg-green-500 hover:bg-green-600"} ${isPlaying && "cursor-not-allowed opacity-50"}`}
            onClick={isReady ? handlePlay : prepareAudio}
            disabled={isPlaying}
          >
            {isReady ? "開始演奏" : "加入等待"}
          </button>
        </div>

        <div>
          <h2 className="mb-4 text-2xl font-semibold text-gray-700">
            🎶 目前播放的音符
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((offset) => {
              const index = currentIndex + offset;
              const note = solfegeNotes[index];
              if (!note) return null;

              const label =
                note.noteName === "rest"
                  ? "rest"
                  : convertNoteToSolfege(convertSolfegeToNote(note.noteName));

              return (
                <div
                  key={index}
                  className={`rounded-xl p-4 text-center shadow-md ${offset === 0 ? "border-2 border-yellow-400 bg-yellow-100" : "bg-gray-50"}`}
                >
                  <div
                    className={`mb-1 text-xl font-bold ${offset === 0 ? "text-yellow-600" : "text-gray-700"}`}
                  >
                    {label}
                  </div>
                  <div className="text-sm text-gray-500">
                    ⏱️ {note.duration}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
