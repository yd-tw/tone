'use client';

import { useState } from 'react';
import * as Tone from 'tone';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);

  const midiNotes = [
    { noteName: "E4", duration: "2n" },
    { noteName: "D4", duration: "8n" },
    { noteName: "C4", duration: "8n" },
    { noteName: "D4", duration: "8n" },
    { noteName: "E4", duration: "8n" },
    { noteName: "F4", duration: "8n" },
    { noteName: "E4", duration: "8n" },
    { noteName: "D4", duration: "8n" },
  ];

  const loadAndPlayMidi = async () => {
    await Tone.start();
    setIsPlaying(true);
    setNotes([]);

    const synth = new Tone.Synth().toDestination();
    Tone.Transport.cancel(); // 清空前一次排程

    let currentTime = 0;

    const part = new Tone.Part((time, note) => {
      synth.triggerAttackRelease(note.noteName, note.duration, time);
      // 使用 Tone.Transport.schedule 的時間同步顯示
      Tone.Draw.schedule(() => {
        setNotes((prev) => [...prev, note.noteName]);
      }, time);
    }, midiNotes.map((note) => {
      const event = { time: currentTime, ...note };
      currentTime += Tone.Time(note.duration).toSeconds();
      return event;
    }));

    part.start(0); // 從 Transport 時間 0 開始

    // 播放結束時解除鎖定按鈕
    Tone.Transport.scheduleOnce(() => {
      setIsPlaying(false);
    }, currentTime);

    Tone.Transport.start();
  };

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">🎵 音樂播放器</h1>
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        onClick={loadAndPlayMidi}
        disabled={isPlaying}
      >
        播放音樂
      </button>

      <div className="mt-6">
        <h2 className="text-xl">目前播放的音符：</h2>
        <div className="flex gap-2 mt-2 flex-wrap">
          {notes.slice(-10).map((note, idx) => (
            <span
              key={idx}
              className="bg-yellow-200 text-black px-2 py-1 rounded"
            >
              {note}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
