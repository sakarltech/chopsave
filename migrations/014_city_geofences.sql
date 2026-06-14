-- Migration 014: Create city_geofences table and seed Lagos + Abuja polygons

CREATE TABLE city_geofences (
  city  VARCHAR(20) PRIMARY KEY,
  geom  GEOMETRY(Polygon, 4326)
);

-- Lagos State approximate bounding polygon
INSERT INTO city_geofences(city, geom) VALUES (
  'lagos',
  ST_GeomFromText('POLYGON((2.7 6.3, 3.7 6.3, 3.7 6.8, 2.7 6.8, 2.7 6.3))', 4326)
);

-- FCT Abuja approximate bounding polygon
INSERT INTO city_geofences(city, geom) VALUES (
  'abuja',
  ST_GeomFromText('POLYGON((6.9 8.8, 7.3 8.8, 7.3 9.1, 6.9 9.1, 6.9 8.8))', 4326)
);
