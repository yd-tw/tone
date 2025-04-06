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
  
    const transport = Tone.getTransport();
  
    midi.tracks.forEach((track) => {
      track.notes.forEach((note) => {
        transport.scheduleOnce((time) => {
          const synth = new Tone.Synth().toDestination();
          synth.triggerAttackRelease(note.name, note.duration, time);
  
          setNotes((prev) => {
            const updated = [...prev, note.name];
            return updated.slice(-100);
          });
        }, note.time);
      });
    });
  
    await Tone.start();
    transport.bpm.value = midi.header.tempos[0]?.bpm || 120;
    transport.start();
    setIsPlaying(true);
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
          {notes.slice(-15).map((note, idx) => (
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
