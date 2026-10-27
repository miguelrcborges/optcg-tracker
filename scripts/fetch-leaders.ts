/**
 * Builds the bundled leader list from the public OPTCG API.
 *
 * Usage: bun run leaders
 *
 * The API returns alternate arts and reprints as separate rows that share a
 * card_set_id. We keep one row per card id, preferring the clean base art.
 */

type ApiCard = {
  card_set_id: string;
  card_name: string;
  card_color: string;
  card_type: string;
  set_name: string;
  set_id: string;
  card_image: string;
};

type Leader = {
  id: string;
  name: string;
  colors: string[];
  setId: string;
  setName: string;
  setCode: string;
  imageUrl: string;
};

const SOURCES = [
  'https://optcgapi.com/api/allSetCards/',
  'https://optcgapi.com/api/allSTCards/',
];

const COLORS = ['Red', 'Blue', 'Green', 'Purple', 'Yellow', 'Black'];

async function fetchCards(url: string): Promise<ApiCard[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return (await response.json()) as ApiCard[];
}

function stripDecorations(raw: string): string {
  let name = raw.trim();

  // Remove trailing card-code suffixes like "Trafalgar Law - OP14-001".
  name = name.replace(/\s+-\s+[A-Z]{2,4}\d{2}-\d{3}\s*$/i, '');

  // Remove trailing "(001)", "(OP01-001)", "(Alternate Art)" markers.
  for (let i = 0; i < 3; i += 1) {
    const next = name.replace(
      /\s*\((?:[^()]*\d[^()]*|alternate art|parallel)\)\s*$/i,
      '',
    );
    if (next === name) break;
    name = next;
  }

  // Normalise dots used as name separators: "Monkey.D.Luffy" -> "Monkey D. Luffy".
  name = name.replace(/\./g, (_dot, offset: number, whole: string) => {
    const previous = whole[offset - 1] ?? '';
    const beforePrevious = whole[offset - 2] ?? '';
    const isInitial = /[A-Z]/.test(previous) && !/[A-Za-z]/.test(beforePrevious);
    return isInitial ? '. ' : ' ';
  });

  // Give quoted nicknames breathing room: Eustass"Captain"Kid -> Eustass "Captain" Kid.
  name = name.replace(/"([^"]+)"/g, ' "$1" ');

  return name.replace(/\s+/g, ' ').trim();
}

function qualityScore(card: ApiCard): number {
  const name = card.card_name.toLowerCase();
  const image = card.card_image.toLowerCase();
  let score = 0;

  if (/_p\d+/.test(image)) score += 20;
  if (/\(parallel\)/.test(name) || /alternate art/.test(name)) score += 20;
  if (/\([^)]*\d[^)]*\)\s*$/.test(card.card_name)) score += 5;
  if (!card.card_image) score += 100;

  return score;
}

function toLeader(card: ApiCard): Leader {
  const colors = card.card_color
    .split(/\s+/)
    .map((color) => color.trim())
    .filter((color) => COLORS.includes(color));

  const setCode = card.card_set_id.split('-')[0] ?? card.set_id;
  const imageUrl = `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece/${setCode}/${card.card_set_id}_EN.webp`;

  return {
    id: card.card_set_id,
    name: stripDecorations(card.card_name),
    colors: colors.length > 0 ? colors : ['Black'],
    setId: card.set_id,
    setName: card.set_name,
    setCode,
    imageUrl,
  };
}

const cards = (await Promise.all(SOURCES.map(fetchCards))).flat().filter(
  (card) => card.card_type === 'Leader',
);

const bestById = new Map<string, ApiCard>();
for (const card of cards) {
  const current = bestById.get(card.card_set_id);
  if (!current || qualityScore(card) < qualityScore(current)) {
    bestById.set(card.card_set_id, card);
  }
}

const leaders = [...bestById.values()]
  .map(toLeader)
  .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'optcgapi.com (card data) + limitlesstcg CDN (art)',
  count: leaders.length,
  leaders,
};

await Bun.write('src/data/leaders.json', `${JSON.stringify(payload, null, 2)}\n`);

console.log(`Wrote ${leaders.length} leaders to src/data/leaders.json`);
