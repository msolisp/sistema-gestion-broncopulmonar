
import { findRegionByCommune, REGIONS } from '../src/lib/chile-data';

const testCases = [
    "HUECHURABA",
    "Huechuraba",
    "PUENTE ALTO",
    "Puente Alto",
    "VIÑA DEL MAR",
    "Viña del Mar"
];

console.log("--- Testing Commune Matcher ---");

testCases.forEach(commune => {
    const region = findRegionByCommune(commune);
    console.log(`Commune: "${commune}" -> Region: "${region}"`);

    if (region) {
        // Verify option value match
        const regionData = REGIONS.find(r => r.name === region);
        const exists = regionData?.communes.some(c => c.toUpperCase() === commune.toUpperCase());
        console.log(`   Exists in region list (Case Insensitive)? ${exists}`);
    } else {
        console.error(`   ❌ Failed to find region for ${commune}`);
    }
});
