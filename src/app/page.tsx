"use client";

import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import * as Tone from "tone";
import { Edit3, Music, Music2, Timer } from "lucide-react";
import { solfegeNotes } from "@/config/notes";
import { convertNoteToSolfege, convertSolfegeToNote } from "@/utils/encoder";
import Link from "next/link";

const socket = io("https://socket.zeabur.app");

export default function Page() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [timeOffset, setTimeOffset] = useState<number>(0);

  // 與伺服器對時
  const syncServerTime = () => {
    const start = Date.now();
    socket.emit("get-server-time", (serverTime: number) => {
      const end = Date.now();
      const rtt = end - start;
      const estimatedServerTime = serverTime + rtt / 2;
      const offset = estimatedServerTime - end;
      setTimeOffset(offset);
      console.log("與伺服器時間差:", offset, "ms");
    });
  };

  const prepareAudio = async () => {
    await Tone.start();
    setIsReady(true);
    syncServerTime(); // 準備完成後對時
  };

  const playMusic = useCallback(async (startAt: number) => {
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
    const adjustedStart = (startAt - now - timeOffset) / 1000;

    console.log("預定播放時間距現在", adjustedStart, "秒");

    transport.start("+" + adjustedStart);
  }, [timeOffset]);

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
  }, [isReady, playMusic]);

  return (
    <main className="mx-auto flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="rounded-2xl border border-gray-300 bg-white p-6">
        <Link
          href="/edit"
          className="fixed right-6 bottom-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700"
        >
          <Edit3 className="h-6 w-6" />
        </Link>

        <h1 className="mb-6 flex items-center gap-2 text-3xl font-semibold text-gray-800">
          <Music className="h-8 w-8" />
          音樂播放器
        </h1>

        <div className="mb-8 flex justify-center">
          <button
            className={`cursor-pointer rounded-xl px-6 py-3 font-medium text-white transition-colors duration-300 ${isReady
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-green-500 hover:bg-green-600"
              } ${isPlaying && "cursor-not-allowed opacity-50"}`}
            onClick={isReady ? handlePlay : prepareAudio}
            disabled={isPlaying}
          >
            {isReady ? "開始演奏" : "加入等待"}
          </button>
        </div>

        <div>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-gray-700">
            <Music2 className="h-6 w-6" />
            目前播放的音符
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
                  className={`rounded-xl p-4 text-center ${offset === 0
                      ? "border-2 border-yellow-400 bg-yellow-100"
                      : "bg-gray-50"
                    }`}
                >
                  <div
                    className={`mb-1 text-xl font-bold ${offset === 0 ? "text-yellow-600" : "text-gray-700"
                      }`}
                  >
                    {label}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                    <Timer className="h-4 w-4" />
                    {note.duration}
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
