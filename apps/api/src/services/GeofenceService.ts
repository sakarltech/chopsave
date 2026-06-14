import { getPool } from '../db/pool';

/**
 * Check if a point (lat, lng) is within a supported city geofence.
 */
export async function isWithinSupportedCity(
  lat: number,
  lng: number,
  city: string,
): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query<{ within: boolean }>(
    `SELECT ST_Within(
       ST_SetSRID(ST_MakePoint($1, $2), 4326),
       geom
     ) AS within
     FROM city_geofences
     WHERE city = $3`,
    [lng, lat, city],
  );

  if (result.rows.length === 0) return false;
  return result.rows[0].within;
}

/**
 * Determine which supported city a point falls within (or null if outside all).
 */
export async function detectCity(
  lat: number,
  lng: number,
): Promise<string | null> {
  const pool = getPool();
  const result = await pool.query<{ city: string }>(
    `SELECT city FROM city_geofences
     WHERE ST_Within(
       ST_SetSRID(ST_MakePoint($1, $2), 4326),
       geom
     )
     LIMIT 1`,
    [lng, lat],
  );

  return result.rows[0]?.city ?? null;
}
