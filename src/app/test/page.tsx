'use client';

import { useState } from 'react';
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);

  const loadAndPlayMidi = async () => {
    const res = await fetch('/song2.mid');
    const arrayBuffer = await res.arrayBuffer();
    const midi = new Midi(arrayBuffer);

    // 每個 track 都可以獨立播放
    midi.tracks.forEach((track) => {
      track.notes.forEach((note) => {
        console.log('音符資訊:', {
          名稱: note.name,
          開始時間: note.time,
          持續時間: note.duration,
          音高: note.midi,
          音量: note.velocity,
          頻率: Tone.Frequency(note.name).toFrequency()
        });
        // 將每個音符加入 Tone.js 的時間表
        Tone.Transport.scheduleOnce((time) => {
          const synth = new Tone.Synth().toDestination();
          synth.triggerAttackRelease(note.name, note.duration, time);

          // 更新目前播放的音符
          setNotes((prev) => [...prev, note.name]);
        }, note.time);
      });
    });

    await Tone.start(); // 需要使用者互動後才能播放
    Tone.Transport.bpm.value = midi.header.tempos[0]?.bpm || 120;
    Tone.Transport.start();
    setIsPlaying(true);
  };

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">🎵 MIDI 音樂播放器</h1>
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        onClick={loadAndPlayMidi}
        disabled={isPlaying}
      >
        播放 MIDI
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
