// Offline artwork generator. The private observation and catalogue subset arrive on stdin.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const astronomy = require(process.argv[2]);

const { observation, stars } = JSON.parse(fs.readFileSync(0, 'utf8'));
const time = astronomy.MakeTime(new Date(observation.utc));
const observer = new astronomy.Observer(observation.latitude, observation.longitude, 0);
const horizontalRotation = astronomy.Rotation_EQJ_HOR(time, observer);
const equatorOfDateRotation = astronomy.Rotation_EQJ_EQD(time);
const localSidereal = astronomy.SiderealTime(time) * 15 + observation.longitude;
const radians = Math.PI / 180;

// The plain geometric horizon assumes a level sea-height observer.
function project(star) {
  const sphere = new astronomy.Spherical(star.dec, star.ra * 15, 1);
  const j2000 = astronomy.VectorFromSphere(sphere, time);
  const horizontal = astronomy.HorizonFromVector(astronomy.RotateVector(horizontalRotation, j2000));
  const ofDate = astronomy.SphereFromVector(astronomy.RotateVector(equatorOfDateRotation, j2000));

  // Cross-check the rotation against the horizontal-coordinate equations using local sidereal time.
  const hourAngle = (localSidereal - ofDate.lon) * radians;
  const dec = ofDate.lat * radians;
  const lat = observation.latitude * radians;
  const sinAlt = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(hourAngle);
  const az = Math.atan2(-Math.cos(dec) * Math.sin(hourAngle),
    Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(hourAngle));
  assert(Math.abs(Math.asin(sinAlt) / radians - horizontal.lat) < 1e-5);
  assert(Math.abs(Math.sin((az - horizontal.lon * radians) / 2)) < 1e-5);

  if (horizontal.lat <= 0) return null;
  const radius = (90 - horizontal.lat) / 90 * 214;
  const angle = (horizontal.lon + 24) * radians;
  return {
    hip: star.hip,
    mag: star.mag,
    x: Math.round(240 + radius * Math.sin(angle)),
    y: Math.round(240 - radius * Math.cos(angle)),
  };
}

const visible = stars.map(project).filter(Boolean);
process.stdout.write(JSON.stringify(visible) + '\n');
