type DictionaryEntry = {
  phonetic?: string;
  phonetics?: Array<{
    text?: string;
  }>;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export async function fetchEnglishPhonetic(
  word: string,
  fetcher: FetchLike = fetch,
): Promise<string | undefined> {
  const response = await fetcher(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
  );

  if (!response.ok) {
    return undefined;
  }

  const entries = (await response.json()) as DictionaryEntry[];
  const entry = entries[0];

  return entry?.phonetic || entry?.phonetics?.find((item) => item.text)?.text;
}
