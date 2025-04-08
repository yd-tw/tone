'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import * as Tone from 'tone';
import { solfegeNotes } from './config';
import { convertSolfegeToNote } from '@/utils/encoder';

const socket = io('https://socket.zeabur.app');

export default function Page() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);

  const playMusic = async () => {
    await Tone.start();
    setIsPlaying(true);
    setNotes([]);

    const synth = new Tone.Synth().toDestination();
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    transport.timeSignature = [6, 8];
    transport.bpm.value = 90;

    let currentTime = 0;

    const part = new Tone.Part((time, note) => {
      const actualNote = convertSolfegeToNote(note.noteName);
      synth.triggerAttackRelease(actualNote, note.duration, time);
      const draw = Tone.getDraw();
      draw.schedule(() => {
        setNotes((prev) => [...prev, actualNote]);
      }, time);
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

  // 按鈕點擊：傳送播放請求給所有裝置
  const handlePlay = () => {
    socket.emit('play-request', { triggeredAt: Date.now() });
  };

  // 收到廣播播放指令時
  useEffect(() => {
    socket.on('play', () => {
      playMusic();
    });

    return () => {
      socket.off('play');
    };
  }, []);

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">🎵 音樂播放器</h1>
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handlePlay}
        disabled={isPlaying}
      >
        播放音樂（同步）
      </button>

      <div className="mt-6">
        <h2 className="text-xl">目前播放的音符：</h2>
        <div className="flex gap-2 mt-2 flex-wrap">
          {notes.slice(-1).map((note, idx) => (
            <span
              key={idx}
              className="bg-yellow-200 text-black px-2 py-1 rounded text-xl"
            >
              {note}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
