const Input = { keys: {}, mouse: { x: 0, y: 0, down: false } };

window.addEventListener('keydown', e => {
  Input.keys[e.key.toLowerCase()] = true;
  if (e.key === ' ' && Game.state === 'playing') { Game.player.tryDash(); e.preventDefault(); }
});
window.addEventListener('keyup', e => { Input.keys[e.key.toLowerCase()] = false; });
window.addEventListener('mousemove', e => { Input.mouse.x = e.clientX; Input.mouse.y = e.clientY; });
window.addEventListener('mousedown', () => { Input.mouse.down = true; Sfx.init(); });
window.addEventListener('mouseup', () => { Input.mouse.down = false; });

const UI = {
  updateHUD() {
    if (!Game.player) return;
    const p = Game.player;
    const hpPct = (p.health / p.maxHealth) * 100;
    const healthFill = document.getElementById('health-fill');
    healthFill.style.width = hpPct + '%';
    healthFill.classList.toggle('low', hpPct < 30);
    
    document.getElementById('round-display').textContent = Game.round;
    document.getElementById('kills-display').textContent = Game.kills;
    document.getElementById('coins-display').textContent = Game.coins;
    document.getElementById('combo-display').textContent = 'x' + Game.combo;
    document.getElementById('timer-display').textContent = Game.isBossRound ? '∞' : Math.max(0, Math.ceil(Game.roundDuration - Game.roundTimer));
    
    const dashEl = document.getElementById('dash-indicator');
    if (p.dashCooldown > 0) {
      dashEl.style.borderColor = '#444'; dashEl.style.color = '#666';
      dashEl.querySelector('span').textContent = Math.ceil(p.dashCooldown * 10) / 10 + 's';
    } else {
      dashEl.style.borderColor = '#00ffff'; dashEl.style.color = '#00ffff';
      dashEl.querySelector('span').textContent = 'DASH';
    }
    
    const wList = document.getElementById('weapons-list');
    wList.innerHTML = '';
    for (const [wkey, rarity] of Object.entries(Game.weapons)) {
      const w = WEAPONS[wkey], r = RARITIES[rarity];
      const chip = document.createElement('div');
      chip.className = 'weapon-chip';
      chip.style.borderColor = r.color;
      chip.style.boxShadow = r.glow > 0 ? `0 0 ${r.glow}px ${r.color}66` : 'none';
      chip.innerHTML = `<span class="font-display font-bold text-xs" style="color:${r.color}">${w.abbr}</span><span class="text-[10px] uppercase" style="color:${r.color};opacity:0.7">${r.name}</span>`;
      wList.appendChild(chip);
    }
  },
  
  showLottery() {
    document.getElementById('lottery-screen').classList.remove('hidden');
    document.getElementById('continue-text').textContent = `DEPLOY ROUND ${Game.round + 1}`;
    document.getElementById('reel').innerHTML = '';
    document.getElementById('lottery-result').innerHTML = '';
    this.updateLottery();
  },
  
  updateLottery() {
    document.getElementById('coins-display').textContent = Game.coins;
    
    const pityPct = (Lottery.pityCount / Config.lottery.pityThreshold) * 100;
    document.getElementById('pity-bar-fill').style.width = pityPct + '%';
    document.getElementById('pity-percent').textContent = Math.floor(pityPct) + '%';
    
    document.getElementById('standard-pull').disabled = Game.coins < Config.lottery.standardCost || Game.lotteryAnimating;
    document.getElementById('premium-pull').disabled = Game.coins < Config.lottery.premiumCost || Game.lotteryAnimating;
    document.getElementById('free-pull').disabled = Game.freePullUsed || Game.lotteryAnimating;
    
    const invEl = document.getElementById('inventory-display');
    invEl.innerHTML = '';
    for (const [wkey, rarity] of Object.entries(Game.weapons)) {
      const w = WEAPONS[wkey], r = RARITIES[rarity];
      const card = document.createElement('div');
      card.className = `weapon-card-display bg-rarity-${rarity}`;
      card.style.borderColor = r.color;
      card.innerHTML = `<div class="font-display font-bold text-sm" style="color:${r.color};text-shadow:0 0 ${r.glow}px ${r.color}">${w.abbr}</div><div><div class="text-xs font-bold">${w.name}</div><div class="text-[10px] uppercase rarity-${rarity}">${r.name}</div></div>`;
      invEl.appendChild(card);
    }
  }
};

// Event Listeners
// --- Event Listeners ---
document.getElementById('start-btn').addEventListener('click', () => { 
  Sfx.init(); 
  Sfx.click(); 
  document.getElementById('menu-screen').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  Game.start(); 
});

document.getElementById('retry-btn').addEventListener('click', () => { 
  Sfx.init(); 
  Sfx.click(); 
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('menu-screen').classList.add('hidden');
  document.getElementById('lottery-screen').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  Game.start(); 
});

document.getElementById('standard-pull').addEventListener('click', () => { Sfx.click(); Lottery.doPull(false); });
document.getElementById('premium-pull').addEventListener('click', () => { Sfx.click(); Lottery.doPull(true); });
document.getElementById('free-pull').addEventListener('click', () => { Sfx.click(); Lottery.doPull(false); });

document.getElementById('continue-btn').addEventListener('click', () => { 
  Sfx.click(); 
  document.getElementById('lottery-screen').classList.add('hidden');
  Game.round++; 
  Game.state = 'playing'; 
  Game.startRound(); 
});

// --- Init ---
document.getElementById('menu-highscore').textContent = Game.highScore;
document.getElementById('highscore-display').textContent = Game.highScore;
Game.lastT = performance.now();
Game.init();
