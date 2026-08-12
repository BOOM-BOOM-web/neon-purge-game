const Config = {
  player: { speed: 280, radius: 14, maxHealth: 100, dashSpeed: 900, dashDuration: 0.12, dashCooldown: 1.0, regenPerRound: 25 },
  round: { baseDuration: 25, bossEvery: 5 },
  lottery: { standardCost: 100, premiumCost: 350, pityThreshold: 50 },
  unlocks: { // Round requirements for weapons
    pistol: 1, smg: 1, shotgun: 2, rifle: 3, flame: 3, flak: 4,
    laser: 5, minigun: 5, plasma: 6, rocket: 7, lightning: 8, railgun: 9
  }
};

const RARITIES = {
  common:    { name: 'COMMON',    color: '#9ca3af', mult: 1.0,  glow: 0  },
  rare:      { name: 'RARE',      color: '#3b82f6', mult: 1.6,  glow: 10 },
  epic:      { name: 'EPIC',      color: '#a855f7', mult: 2.4,  glow: 18 },
  legendary: { name: 'LEGENDARY', color: '#f59e0b', mult: 3.8,  glow: 28 },
  mythic:    { name: 'MYTHIC',    color: '#ff0066', mult: 6.0,  glow: 45 },
};

const WEAPONS = {
  pistol:   { name:'Sidearm',     abbr:'PSTL', damage:24,  fireRate:340, bulletSpeed:650, spread:0.03, count:1, radius:4, color:'#00ffff', pierce:0, desc:'Standard issue' },
  smg:      { name:'Vector SMG',  abbr:'SMG',  damage:11,  fireRate:65,  bulletSpeed:720, spread:0.14, count:1, radius:3, color:'#88ff00', pierce:0, desc:'Rapid fire' },
  shotgun:  { name:'Scattergun',  abbr:'SHTG', damage:13,  fireRate:680, bulletSpeed:560, spread:0.28, count:8, radius:4, color:'#ff8800', pierce:1, desc:'Devastating up close' },
  rifle:    { name:'Marksman',    abbr:'MKSM', damage:62,  fireRate:580, bulletSpeed:950, spread:0.005,count:1, radius:5, color:'#4488ff', pierce:3, desc:'Precise and piercing' },
  minigun:  { name:'Annihilator', abbr:'ANHL', damage:16,  fireRate:40,  bulletSpeed:780, spread:0.09, count:1, radius:4, color:'#ffff00', pierce:0, desc:'Unleash the storm' },
  laser:    { name:'Photon Lance',abbr:'PHOT', damage:2.5, fireRate:15,  bulletSpeed:1400,spread:0,    count:1, radius:5, color:'#ff00ff', pierce:99,desc:'Continuous beam' },
  rocket:   { name:'Demolisher',  abbr:'DMOL', damage:100, fireRate:1400,bulletSpeed:380, spread:0,    count:1, radius:8, color:'#ff4400', pierce:0, explosion:{r:120,dmg:80}, desc:'Area of effect' },
  plasma:   { name:'Ion Caster',  abbr:'ION',  damage:32,  fireRate:220, bulletSpeed:520, spread:0.06, count:3, radius:5, color:'#00ff88', pierce:1, bounce:2, desc:'Bouncing ion bolts' },
  railgun:  { name:'Rail Cannon', abbr:'RAIL', damage:180, fireRate:1800,bulletSpeed:1600,spread:0,   count:1, radius:10,color:'#ffffff', pierce:99, desc:'Pierces everything' },
  lightning:{ name:'Arc Emitter',  abbr:'ARC',  damage:45,  fireRate:380, bulletSpeed:0,  spread:0,    count:1, radius:0, color:'#88ddff', pierce:0, chain:{count:5,range:220}, desc:'Chains between foes' },
  flak:     { name:'Flak Cannon', abbr:'FLAK', damage:7,   fireRate:180, bulletSpeed:480, spread:0.45, count:6, radius:3, color:'#ffaa00', pierce:0, explosion:{r:40,dmg:15}, desc:'Explosive shrapnel' },
  flame:    { name:'Inferno',     abbr:'INFR', damage:4.5, fireRate:25,  bulletSpeed:320, spread:0.22, count:2, radius:7, color:'#ff6600', pierce:0, life:0.35, desc:'Wave of fire' },
};

const ENEMIES = {
  walker:  { name:'Walker',  hp:38,  speed:55,  dmg:10, radius:15, color:'#ff3366', coins:5,  score:10 },
  runner:  { name:'Runner',  hp:22,  speed:130, dmg:8,  radius:11, color:'#ffcc00', coins:8,  score:15, zigzag:true },
  brute:   { name:'Brute',   hp:160, speed:38,  dmg:22, radius:26, color:'#cc66ff', coins:18, score:35 },
  spitter: { name:'Spitter', hp:35,  speed:45,  dmg:14, radius:13, color:'#66ff66', coins:14, score:25, ranged:true, range:320, cd:1800 },
  bomber:  { name:'Bomber',  hp:55,  speed:80,  dmg:45, radius:17, color:'#ff8800', coins:16, score:30, explodeR:75 },
  boss:    { name:'Behemoth',hp:1800,speed:32,  dmg:38, radius:48, color:'#ff0066', coins:120,score:600, isBoss:true },
};