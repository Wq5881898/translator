type DictionaryEntry = {
  word?: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string }>;
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: Array<{ definition?: string }>;
  }>;
};

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type EnglishDictionaryLookup = {
  headword: string;
  phonetic?: string;
  definitions: string[];
};

function lemmaCandidates(word: string): string[] {
  const value = word.toLocaleLowerCase('en');
  const candidates: string[] = [];
  const add = (candidate: string) => {
    if (candidate.length > 1 && candidate !== value && !candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  };

  if (value.endsWith('ied') && value.length > 4) add(`${value.slice(0, -3)}y`);
  if (value.endsWith('ed') && value.length > 3) {
    const withoutEd = value.slice(0, -2);
    add(withoutEd);
    if (withoutEd.at(-1) === withoutEd.at(-2)) add(withoutEd.slice(0, -1));
    add(value.slice(0, -1));
  }
  if (value.endsWith('ing') && value.length > 5) {
    const withoutIng = value.slice(0, -3);
    add(withoutIng);
    if (withoutIng.at(-1) === withoutIng.at(-2)) add(withoutIng.slice(0, -1));
    add(`${withoutIng}e`);
  }
  if (value.endsWith('ies') && value.length > 4) add(`${value.slice(0, -3)}y`);
  if (value.endsWith('es') && value.length > 3) add(value.slice(0, -2));
  if (value.endsWith('s') && value.length > 2) add(value.slice(0, -1));

  return candidates;
}

async function fetchEntries(
  word: string,
  fetcher: FetchLike,
): Promise<DictionaryEntry[] | undefined> {
  const response = await fetcher(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
  );
  if (!response.ok) return undefined;
  const entries = (await response.json()) as DictionaryEntry[];
  return entries.length ? entries : undefined;
}

function phoneticFrom(entries?: DictionaryEntry[]): string | undefined {
  const entry = entries?.[0];
  return entry?.phonetic || entry?.phonetics?.find((item) => item.text)?.text;
}

function definitionsFrom(entries?: DictionaryEntry[]): string[] {
  const definitions: string[] = [];
  for (const meaning of entries?.[0]?.meanings ?? []) {
    const definition = meaning.definitions?.find((item) => item.definition)?.definition?.trim();
    if (definition && !definitions.includes(definition)) definitions.push(definition);
    if (definitions.length === 2) break;
  }
  return definitions;
}

export async function fetchEnglishDictionaryLookup(
  word: string,
  fetcher: FetchLike = fetch,
): Promise<EnglishDictionaryLookup | undefined> {
  const normalized = word.trim().toLocaleLowerCase('en');
  const originalEntries = await fetchEntries(normalized, fetcher);
  let preferredEntries = originalEntries;
  let headword = originalEntries?.[0]?.word?.trim() || normalized;

  for (const candidate of lemmaCandidates(normalized)) {
    const candidateEntries = await fetchEntries(candidate, fetcher);
    if (candidateEntries) {
      preferredEntries = candidateEntries;
      headword = candidateEntries[0]?.word?.trim() || candidate;
      break;
    }
  }

  if (!preferredEntries) return undefined;
  return {
    headword,
    ...(phoneticFrom(originalEntries) || phoneticFrom(preferredEntries)
      ? { phonetic: phoneticFrom(originalEntries) || phoneticFrom(preferredEntries) }
      : {}),
    definitions: definitionsFrom(preferredEntries),
  };
}

export async function fetchEnglishPhonetic(
  word: string,
  fetcher: FetchLike = fetch,
): Promise<string | undefined> {
  return (await fetchEnglishDictionaryLookup(word, fetcher))?.phonetic;
}

