"use client";

import { useState } from "react";

const notesMap = ['sol3', 'ti3', 'do4', 're4', 'mi4', 'fa4', 'sol4', 'la4', 'ti4', 'do5', 're5', 'mi5', 'fa5', 'rest']
const noteDurations = ['2n','4n', '8n', '16n', '2n.', '4n.', '8n.', '16n.']

export default function Home() {
  const [selectedDuration, setSelectedDuration] = useState("4n");
  const [noteSequence, setNoteSequence] = useState<
    { noteName: string; duration: string }[]
  >([]);

  const addNote = (note: string) => {
    const noteWithOctave = `${note}`;
    setNoteSequence([
      ...noteSequence,
      { noteName: noteWithOctave, duration: selectedDuration },
    ]);
  };

  const removeLastNote = () => {
    setNoteSequence(noteSequence.slice(0, -1));
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">音符配置工具</h1>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">選擇音符長度：</label>
        <select
          className="p-2 border rounded"
          value={selectedDuration}
          onChange={(e) => setSelectedDuration(e.target.value)}
        >
          {noteDurations.map((duration) => (
            <option key={duration} value={duration}>
              {duration}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {notesMap.map((note) => (
          <button
            key={note}
            onClick={() => addNote(note)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {note}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <button
          onClick={removeLastNote}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          刪除上一個音符
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">目前的音符配置：</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
          {`[ \n  ${noteSequence.map((note) => `{ noteName: "${note.noteName}", duration: "${note.duration}" }`).join(", \n  ")} \n]`}
        </pre>
      </div>
    </main>
  );
}
