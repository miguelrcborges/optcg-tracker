/**
 * Builds the bundled leader list from the public OPTCG API.
 *
 * Usage: bun run leaders
 *
 * The API returns alternate arts and reprints as separate rows that share a
 * card_set_id. We keep one row per card id, preferring the clean base art.
 * Promo leaders live in a separate feed and some are missing from it entirely,
 * so those are merged in from the supplement below.
 */

type ApiCard = {
  card_set_id: string;
  card_name: string;
  card_color: string;
  card_type: string;
  set_name: string;
  set_id: string;
  card_image: string | null;
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

const SET_SOURCES = [
  'https://optcgapi.com/api/allSetCards/',
  'https://optcgapi.com/api/allSTCards/',
];

const PROMO_SOURCE = 'https://optcgapi.com/api/allPromos/';

/**
 * Promo leaders that the API's promo feed does not cover yet. Kept here so the
 * bundled list stays complete until the upstream data catches up.
 */
const EXTRA_PROMOS: ApiCard[] = [
  {
    card_set_id: 'P-122',
    card_name: 'Ace & Sabo & Luffy',
    card_color: 'Red',
    card_type: 'Leader',
    set_name: 'One Piece Promotion Cards',
    set_id: 'P',
    card_image: '',
  },
];

/**
 * Event-only promo printings that are not real, playable leaders. Excluded even
 * when the promo feed lists them.
 */
const EXCLUDED_LEADER_IDS = new Set(['P-700', 'P-800', 'P-900', 'P-999']);

/**
 * Limitless has no art for P-122, so its art is bundled locally (the original
 * source blocks cross-origin hotlinking).
 */
const ART_OVERRIDES: Record<string, string> = {
  'P-122': 'leaders/P-122.webp',
};

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

  // Remove trailing parenthetical markers such as "(001)", "(Alternate Art)",
  // "(OP10 Release Event)" or "(Sealed Battle 2023 Vol. 1)".
  for (let i = 0; i < 4; i += 1) {
    const next = name.replace(/\s*\([^()]*\)\s*$/, '');
    if (next === name) break;
    name = next;
  }

  // Remove trailing card-code suffixes like "Trafalgar Law - OP14-001",
  // "Roronoa Zoro - OP01-001" or "Nami - P-117".
  name = name.replace(/\s+-\s+[A-Z]{1,4}\d{0,2}(?:-\d{3})?\s*$/i, '');

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
  const image = (card.card_image ?? '').toLowerCase();
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

  const prefix = card.card_set_id.split('-')[0] ?? card.set_id;
  const isPromo = prefix === 'P';

  // Promo ids share a single "P" set, so expose the full card id in the picker
  // to keep e.g. the all-color Luffy promos distinguishable.
  const setCode = isPromo ? card.card_set_id : prefix;
  const imageUrl =
    ART_OVERRIDES[card.card_set_id] ??
    `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece/${prefix}/${card.card_set_id}_EN.webp`;

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

const setCards = (await Promise.all(SET_SOURCES.map(fetchCards))).flat();
const setCardIds = new Set(setCards.map((card) => card.card_set_id));

// The promo feed also reprints set leaders under the "One Piece Promotion Cards"
// set name. Keep the original set row for those, and only add promo-exclusive ids.
const promoLeaders = (await fetchCards(PROMO_SOURCE)).filter(
  (card) => card.card_type === 'Leader' && !setCardIds.has(card.card_set_id),
);

const cards = [...setCards, ...promoLeaders, ...EXTRA_PROMOS].filter(
  (card) =>
    card.card_type === 'Leader' && !EXCLUDED_LEADER_IDS.has(card.card_set_id),
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
  source:
    'optcgapi.com (card data) + limitlesstcg CDN (art) + bundled P-122 art',
  count: leaders.length,
  leaders,
};

await Bun.write('src/data/leaders.json', `${JSON.stringify(payload, null, 2)}\n`);

console.log(`Wrote ${leaders.length} leaders to src/data/leaders.json`);
