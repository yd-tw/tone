const solfegeMap: Record<string, string> = {
  do: 'C',
  re: 'D',
  mi: 'E',
  fa: 'F',
  sol: 'G',
  la: 'A',
  ti: 'B',
  rest: 'rest',
};

export const convertSolfegeToNote = (solfegeNote: string): string => {
  const match = solfegeNote.match(/([a-z]+)(\d)/i);
  if (!match) return solfegeNote;

  const [, name, octave] = match;
  const pitch = solfegeMap[name.toLowerCase()];
  return pitch ? `${pitch}${octave}` : solfegeNote;
};