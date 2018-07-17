import hash from "string-hash";

const PALETTE_LENGTH = 10;

export const toPercent = proportion => Math.round(proportion * 10000) / 100;
export const byProportion = (a, b) => b.totalProportion - a.totalProportion;
export const asPalette = str => (hash(str) % PALETTE_LENGTH) + 1;
