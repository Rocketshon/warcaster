// Maps art filenames to categories for use across the app
export const ART = {
  hero: ['emperor.jpg', 'triumph-ullanor.jpg', 'battle-scene.jpg', 'imperator-titan.jpg'],
  imperium: ['space-marine-dual.jpg', 'space-marine-ii.jpg', 'devastator.jpg', 'black-templar.jpg', 'black-templars-crusade.jpg', 'rogal-dorn.jpg', 'sigismund.jpg'],
  chaos: ['black-crusader.jpg', 'black-legion.jpg', 'fulgrim.jpg', 'nurgle-knight.jpg'],
  xenos: ['necron-destroyer.jpg', 'necrons-army.jpg', 'necrons-rising.jpg', 'baharroth.jpg', 'fuegan.jpg'],
  wolves: ['space-wolves-viking.jpg', 'leman-russ.jpg', 'logan-grimnar.jpg', 'rex-luporum.jpg'],
  angels: ['death-company.jpg', 'sanguinius.png'],
  misc: ['ancestor.jpg', 'black-dragons.jpg', 'arks-of-omen.jpg'],
} as const;

export function getArtPath(filename: string): string {
  return `/crusade-command/art/${filename}`;
}

export function getRandomArt(category: keyof typeof ART): string {
  const pool = ART[category];
  return getArtPath(pool[Math.floor(Math.random() * pool.length)]);
}

export function getFactionArt(factionId: string): string {
  if (factionId.includes('wolves') || factionId.includes('space_wolves')) return getArtPath(ART.wolves[0]);
  if (factionId.includes('angel') || factionId.includes('blood')) return getArtPath(ART.angels[0]);
  if (factionId.includes('templar') || factionId.includes('black_templars')) return getArtPath('black-templars-crusade.jpg');
  if (factionId.includes('necron')) return getArtPath(ART.xenos[0]);
  if (factionId.includes('chaos') || factionId.includes('death_guard') || factionId.includes('thousand') || factionId.includes('world_eater')) return getArtPath(ART.chaos[0]);
  if (factionId.includes('space_marine') || factionId.includes('astartes')) return getArtPath(ART.imperium[0]);
  if (factionId.includes('aeldari') || factionId.includes('drukhari') || factionId.includes('tyranid') || factionId.includes('ork') || factionId.includes('tau')) return getArtPath(ART.xenos[2]);
  return getArtPath(ART.hero[0]);
}
