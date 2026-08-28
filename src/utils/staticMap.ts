// Slippy-map tile math (Web Mercator) — no API key needed, tiles come
// straight from the public OpenStreetMap tile server.
export type TilePoint = {
  tileX: number;
  tileY: number;
  fracX: number;
  fracY: number;
};

export function lonLatToTilePoint(lon: number, lat: number, zoom: number): TilePoint {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const x = ((lon + 180) / 360) * n;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;

  const tileX = Math.floor(x);
  const tileY = Math.floor(y);

  return {
    tileX,
    tileY,
    fracX: x - tileX,
    fracY: y - tileY,
  };
}

const CARTO_SUBDOMAINS = ["a", "b", "c", "d"];

// CARTO's free light basemap (no API key required) — the raw OSM tile
// server explicitly blocks direct in-app usage under its tile usage policy,
// so this is used instead.
export function osmTileUrl(x: number, y: number, zoom: number) {
  const subdomain = CARTO_SUBDOMAINS[Math.abs(x + y) % CARTO_SUBDOMAINS.length];
  return `https://${subdomain}.basemaps.cartocdn.com/light_all/${zoom}/${x}/${y}.png`;
}

export function isValidCoordinate(lat: unknown, lon: unknown) {
  const latNum = Number(lat);
  const lonNum = Number(lon);
  return (
    Number.isFinite(latNum) &&
    Number.isFinite(lonNum) &&
    Math.abs(latNum) <= 90 &&
    Math.abs(lonNum) <= 180 &&
    !(latNum === 0 && lonNum === 0)
  );
}
