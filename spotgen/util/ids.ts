export function parseSpotId(id: string): number {
  const m = id.match(/^s(\d+)$/);
  if (!m) throw new Error(`Invalid spot id: ${id}`);
  return parseInt(m[1], 10);
}

export function formatSpotId(n: number): string {
  return `s${String(n).padStart(3, "0")}`;
}


