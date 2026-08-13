const Lottery = {
  pityCount: 0,
  
  getAvailableWeapons() {
    return Object.keys(WEAPONS).filter(w => Config.unlocks[w] <= Game.round);
  },
  
  rollRarity(isPremium) {
    this.pityCount += isPremium ? 2 : 1;
    if (this.pityCount >= Config.lottery.pityThreshold) {
      this.pityCount = 0;
      return Math.random() < 0.2 ? 'mythic' : 'legendary';
    }
    const odds = isPremium ? 
      { common:.22, rare:.36, epic:.24, legendary:.14, mythic:.04 } : 
      { common:.58, rare:.28, epic:.10, legendary:.035, mythic:.005 };
    const r = Math.random(); let acc = 0;
    for (const k of ['common','rare','epic','legendary','mythic']) {
      acc += odds[k];
      if (r < acc) {
        if (k === 'epic' || k === 'legendary' || k === 'mythic') this.pityCount = 0;
        return k;
      }
    }
    return 'common';
  },
  
  doPull(isPremium) {
    if (Game.lotteryAnimating) return;
    const cost = isPremium ? Config.lottery.premiumCost : Config.lottery.standardCost;
    if (!Game.freePullUsed) Game.freePullUsed = true;
    else { if (Game.coins < cost) return; Game.coins -= cost; }
    
    const rarity = this.rollRarity(isPremium);
    const availWeapons = this.getAvailableWeapons();
    const weaponKey = pick(availWeapons);
    
    Game.lotteryAnimating = true;
    UI.updateLottery();
    this.animateReel(weaponKey, rarity, isPremium, availWeapons);
  },
  
  animateReel(resultWeapon, resultRarity, isPremium, availWeapons) {
    const reel = document.getElementById('reel');
    reel.innerHTML = '';
    reel.style.transition = 'none';
    reel.style.transform = 'translateX(0)';
    
    const itemCount = 35;
    const items = [];
    for (let i = 0; i < itemCount - 1; i++) items.push({ weapon: pick(availWeapons), rarity: this.rollRarity(isPremium) });
    items.push({ weapon: resultWeapon, rarity: resultRarity });
    
    for (const item of items) {
      const w = WEAPONS[item.weapon], r = RARITIES[item.rarity];
      const el = document.createElement('div');
      el.className = 'reel-item';
      el.style.borderColor = r.color;
      el.style.boxShadow = r.glow > 0 ? `0 0 ${r.glow}px ${r.color}` : 'none';
      el.innerHTML = `<div class="font-display font-bold text-sm" style="color:${r.color}">${w.abbr}</div><div class="text-[9px] uppercase mt-1" style="color:${r.color};opacity:0.7">${r.name}</div>`;
      reel.appendChild(el);
    }
    
    const itemWidth = 108; 
    const containerWidth = 560;
    const targetIndex = itemCount - 1;
    const targetX = -(targetIndex * itemWidth - containerWidth / 2 + 50);
    
    setTimeout(() => {
      reel.style.transition = 'transform 3s cubic-bezier(0.15, 0.65, 0.25, 1)';
      reel.style.transform = `translateX(${targetX}px)`;
    }, 50);
    
    setTimeout(() => this.revealResult(resultWeapon, resultRarity), 3100);
  },
  
  revealResult(weaponKey, rarity) {
    const w = WEAPONS[weaponKey], r = RARITIES[rarity];
    const currentRarity = Game.weapons[weaponKey];
    let resultType = 'new', resultText = 'NEW WEAPON';
    
    if (currentRarity) {
      const curIdx = Object.keys(RARITIES).indexOf(currentRarity);
      const newIdx = Object.keys(RARITIES).indexOf(rarity);
      if (newIdx > curIdx) {
        resultType = 'upgrade'; resultText = 'UPGRADED!';
        Game.weapons[weaponKey] = rarity;
      } else {
        resultType = 'duplicate'; resultText = 'DUPLICATE';
        const refund = Math.floor((rarity === 'mythic' ? 200 : 100) * 0.5);
        Game.coins += refund;
      }
    } else {
      Game.weapons[weaponKey] = rarity;
    }
    
    if (rarity === 'mythic') Sfx.mythic();
    else if (rarity === 'legendary') Sfx.legendary();
    else if (rarity === 'epic' || rarity === 'rare') Sfx.rare();
    else Sfx.coin();
    
    document.getElementById('lottery-result').innerHTML = `
      <div class="anim-scaleIn">
        <div class="text-xs font-display tracking-[6px] mb-2" style="color:${r.color}">${resultText}</div>
        <div class="font-display text-3xl font-black glow-strong" style="color:${r.color}">${w.name}</div>
        <div class="text-sm mt-1" style="color:${r.color};opacity:0.8">${r.name} · ${w.desc}</div>
        <div class="text-xs text-gray-400 mt-2">${resultType === 'duplicate' ? `<span style="color:#ffd700">Refund</span>` : resultType === 'upgrade' ? `<span style="color:#00ff88">Power increased!</span>` : `<span style="color:#00ffff">Added to arsenal</span>`}</div>
      </div>`;
    
    const burstCount = rarity === 'mythic' ? 60 : rarity === 'legendary' ? 40 : 20;
    for (let i = 0; i < burstCount; i++) {
      const a = rand(0, Math.PI * 2), s = rand(100, 400);
      spawnParticle(window.innerWidth/2, window.innerHeight/2, Math.cos(a)*s, Math.sin(a)*s, rand(0.5,1.0), rand(3,7), r.color);
    }
    Game.screenShake = rarity === 'mythic' ? 25 : 15;
    
    Game.lotteryAnimating = false;
    UI.updateLottery();
  }
};