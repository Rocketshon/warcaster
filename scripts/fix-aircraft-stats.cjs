const fs = require('fs');
const path = require('path');

const AIRCRAFT_STATS = {
  'Thunderhawk Gunship': { M: '20+"', T: '12', Sv: '2+', W: '30', Ld: '6+', OC: '0' },
  'Thunderhawk Transporter': { M: '20+"', T: '12', Sv: '2+', W: '30', Ld: '6+', OC: '0' },
  'Fire Raptor Gunship': { M: '20+"', T: '10', Sv: '3+', W: '18', Ld: '6+', OC: '0' },
  'Storm Eagle Gunship': { M: '20+"', T: '10', Sv: '3+', W: '18', Ld: '6+', OC: '0' },
  'Sokar-pattern Stormbird': { M: '20+"', T: '13', Sv: '2+', W: '40', Ld: '6+', OC: '0' },
  'Xiphon Interceptor': { M: '20+"', T: '9', Sv: '3+', W: '12', Ld: '6+', OC: '0' },
  'Heldrake': { M: '20+"', T: '9', Sv: '3+', W: '12', Ld: '6+', OC: '0' },
  'Hell Blade': { M: '20+"', T: '8', Sv: '3+', W: '10', Ld: '6+', OC: '0' },
  'Hell Talon': { M: '20+"', T: '9', Sv: '3+', W: '14', Ld: '6+', OC: '0' },
  'Chaos Thunderhawk': { M: '20+"', T: '12', Sv: '2+', W: '30', Ld: '6+', OC: '0' },
  'Stormhawk Interceptor': { M: '20+"', T: '9', Sv: '3+', W: '10', Ld: '6+', OC: '0' },
  'Stormraven Gunship': { M: '20+"', T: '10', Sv: '3+', W: '14', Ld: '6+', OC: '0' },
  'Stormtalon Gunship': { M: '20+"', T: '8', Sv: '3+', W: '10', Ld: '6+', OC: '0' },
  'Stormfang Gunship': { M: '20+"', T: '10', Sv: '3+', W: '14', Ld: '6+', OC: '0' },
  'Stormwolf': { M: '20+"', T: '10', Sv: '3+', W: '14', Ld: '6+', OC: '0' },
  'Corvus Blackstar': { M: '20+"', T: '10', Sv: '3+', W: '14', Ld: '6+', OC: '0' },
  'Nephilim Jetfighter': { M: '20+"', T: '8', Sv: '3+', W: '11', Ld: '6+', OC: '0' },
  'Ravenwing Dark Talon': { M: '20+"', T: '8', Sv: '3+', W: '11', Ld: '6+', OC: '0' },
  'Valkyrie': { M: '20+"', T: '10', Sv: '2+', W: '14', Ld: '7+', OC: '0' },
  'Vendetta Gunship': { M: '20+"', T: '10', Sv: '2+', W: '14', Ld: '7+', OC: '0' },
  'Vulture Gunship': { M: '20+"', T: '10', Sv: '2+', W: '14', Ld: '7+', OC: '0' },
  'Avenger Strike Fighter': { M: '20+"', T: '9', Sv: '3+', W: '14', Ld: '7+', OC: '0' },
  'Marauder Bomber': { M: '20+"', T: '10', Sv: '2+', W: '20', Ld: '7+', OC: '0' },
  'Marauder Destroyer': { M: '20+"', T: '10', Sv: '2+', W: '20', Ld: '7+', OC: '0' },
  'Voss-pattern Lightning': { M: '20+"', T: '9', Sv: '3+', W: '14', Ld: '7+', OC: '0' },
  'Aquila Lander': { M: '20+"', T: '9', Sv: '3+', W: '12', Ld: '7+', OC: '0' },
  'Valkyrie Sky Talon': { M: '20+"', T: '10', Sv: '2+', W: '14', Ld: '7+', OC: '0' },
  'Dakkajet': { M: '20+"', T: '9', Sv: '3+', W: '12', Ld: '7+', OC: '0' },
  'Burna-bommer': { M: '20+"', T: '9', Sv: '3+', W: '12', Ld: '7+', OC: '0' },
  'Blitza-bommer': { M: '20+"', T: '9', Sv: '3+', W: '12', Ld: '7+', OC: '0' },
  'Wazbom Blastajet': { M: '20+"', T: '9', Sv: '3+', W: '12', Ld: '7+', OC: '0' },
  'Attack Fighta': { M: '20+"', T: '9', Sv: '3+', W: '10', Ld: '7+', OC: '0' },
  'Fighta-bommer': { M: '20+"', T: '9', Sv: '3+', W: '12', Ld: '7+', OC: '0' },
  'Doom Scythe': { M: '20+"', T: '9', Sv: '3+', W: '12', Ld: '7+', OC: '0' },
  'Night Scythe': { M: '20+"', T: '9', Sv: '3+', W: '12', Ld: '7+', OC: '0' },
  'Night Shroud': { M: '20+"', T: '9', Sv: '3+', W: '14', Ld: '7+', OC: '0' },
  'Crimson Hunter': { M: '20+"', T: '8', Sv: '3+', W: '12', Ld: '6+', OC: '0' },
  'Hemlock Wraithfighter': { M: '20+"', T: '8', Sv: '3+', W: '12', Ld: '6+', OC: '0' },
  'Nightwing': { M: '20+"', T: '8', Sv: '3+', W: '12', Ld: '6+', OC: '0' },
  'Phoenix': { M: '20+"', T: '9', Sv: '3+', W: '16', Ld: '6+', OC: '0' },
  'Vampire Hunter': { M: '20+"', T: '12', Sv: '3+', W: '30', Ld: '6+', OC: '0' },
  'Vampire Raider': { M: '20+"', T: '12', Sv: '3+', W: '30', Ld: '6+', OC: '0' },
  'Razorwing Jetfighter': { M: '20+"', T: '8', Sv: '4+', W: '10', Ld: '7+', OC: '0' },
  'Voidraven Bomber': { M: '20+"', T: '9', Sv: '4+', W: '12', Ld: '6+', OC: '0' },
  'Raven Strike Fighter': { M: '20+"', T: '8', Sv: '4+', W: '10', Ld: '6+', OC: '0' },
  'Razorshark Strike Fighter': { M: '20+"', T: '10', Sv: '3+', W: '12', Ld: '7+', OC: '0' },
  'Sun Shark Bomber': { M: '20+"', T: '9', Sv: '3+', W: '12', Ld: '7+', OC: '0' },
  'Tiger Shark': { M: '20+"', T: '11', Sv: '3+', W: '18', Ld: '7+', OC: '0' },
  'AX-1-0 Tiger Shark': { M: '20+"', T: '11', Sv: '3+', W: '18', Ld: '7+', OC: '0' },
  'Barracuda': { M: '20+"', T: '10', Sv: '3+', W: '14', Ld: '7+', OC: '0' },
  'Manta': { M: '20+"', T: '14', Sv: '2+', W: '60', Ld: '7+', OC: '0' },
  'Orca Dropship': { M: '20+"', T: '12', Sv: '3+', W: '28', Ld: '7+', OC: '0' },
  'Archaeopter Fusilave': { M: '20+"', T: '9', Sv: '3+', W: '10', Ld: '7+', OC: '0' },
  'Archaeopter Stratoraptor': { M: '20+"', T: '9', Sv: '3+', W: '10', Ld: '7+', OC: '0' },
  'Archaeopter Transvector': { M: '20+"', T: '9', Sv: '3+', W: '10', Ld: '7+', OC: '0' },
  'Ares Gunship': { M: '20+"', T: '12', Sv: '2+', W: '22', Ld: '6+', OC: '0' },
  'Orion Assault Dropship': { M: '20+"', T: '12', Sv: '2+', W: '22', Ld: '6+', OC: '0' },
  'Grey Knights Thunderhawk Gunship': { M: '20+"', T: '12', Sv: '2+', W: '30', Ld: '6+', OC: '0' },
};

const filePath = path.resolve(__dirname, '../src/data/units.ts');
let raw = fs.readFileSync(filePath, 'utf-8');
let fixCount = 0;

for (const [name, stats] of Object.entries(AIRCRAFT_STATS)) {
  const namePattern = '"name": "' + name + '"';
  let searchFrom = 0;

  while (true) {
    const nameIdx = raw.indexOf(namePattern, searchFrom);
    if (nameIdx === -1) break;

    // Find the stats field near this name (within 500 chars)
    const statsIdx = raw.indexOf('"stats":', nameIdx);
    if (statsIdx === -1 || statsIdx - nameIdx > 500) {
      searchFrom = nameIdx + 1;
      continue;
    }

    // Check if stats is empty: "stats": {} or "stats": { }
    const emptyMatch = raw.slice(statsIdx).match(/"stats":\s*\{\s*\}/);
    if (emptyMatch) {
      const replacement = '"stats": ' + JSON.stringify(stats);
      raw = raw.slice(0, statsIdx) + replacement + raw.slice(statsIdx + emptyMatch[0].length);
      fixCount++;
      console.log('  Fixed: ' + name);
    }
    searchFrom = nameIdx + namePattern.length;
  }
}

fs.writeFileSync(filePath, raw, 'utf-8');
console.log('\nTotal aircraft stats fixed: ' + fixCount);
