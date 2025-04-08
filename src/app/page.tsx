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

  const prepareAudio = async () => {
    await Tone.start();
    setIsReady(true);
  };

  const playMusic = async () => {
    setCurrentIndex(-1);
    setIsPlaying(true);

    const synth = new Tone.Synth().toDestination();
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    transport.timeSignature = [6, 8];
    transport.bpm.value = 90;

    let currentTime = 0;

    const part = new Tone.Part((time, note) => {
      const draw = Tone.getDraw();

      if (note.noteName !== "rest") {
        const actualNote = convertSolfegeToNote(note.noteName);
        synth.triggerAttackRelease(actualNote, note.duration, time);
        draw.schedule(() => {
          setCurrentIndex((prev) => prev + 1);
        }, time);
      } else {
        draw.schedule(() => {
          setCurrentIndex((prev) => prev + 1);
        }, time);
      }
    }, solfegeNotes.map((note) => {
      const event = { time: currentTime, ...note };
      currentTime += Tone.Time(note.duration).toSeconds();
      return event;
    }));

    part.start(0);

    transport.scheduleOnce(() => {
      setIsPlaying(false);
      part.dispose();
    }, currentTime);

    transport.start("+0.1");
  };

  const handlePlay = () => {
    socket.emit("play-request", { triggeredAt: Date.now() });
  };

  useEffect(() => {
    if (!isReady) return;
    socket.on("play", playMusic);
    return () => {
      socket.off("play");
    };
  }, [isReady]);

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">🎵 音樂播放器</h1>

      <button
        className={`px-4 py-2 rounded text-white ${isReady ? "bg-blue-500 hover:bg-blue-600" : "bg-green-500 hover:bg-green-600"}`}
        onClick={isReady ? handlePlay : prepareAudio}
        disabled={isPlaying}
      >
        {isReady ? "開始演奏" : "加入等待"}
      </button>

      <div className="mt-6">
        <h2 className="text-xl">目前播放的音符：</h2>
        <div className="flex gap-2 mt-2 flex-wrap">
          {[0, 1, 2].map((offset) => {
            const index = currentIndex + offset;
            const note = solfegeNotes[index];
            if (!note) return null;

            const label =
              note.noteName === "rest"
                ? "rest"
                : convertNoteToSolfege(convertSolfegeToNote(note.noteName));

            return (
              <span
                key={index}
                className={`px-2 py-1 rounded text-xl ${offset === 0 ? "bg-yellow-400 font-bold" : "bg-gray-200"}`}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>
    </main>
  );
}
