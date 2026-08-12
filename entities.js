const particlePool = new Pool(() => ({ x:0, y:0, vx:0, vy:0, life:0, maxLife:1, r:1, color:'#fff' }));
function spawnParticle(x, y, vx, vy, life, r, color) {
  const p = particlePool.get();
  p.x=x; p.y=y; p.vx=vx; p.vy=vy; p.life=life; p.maxLife=life; p.r=r; p.color=color;
  return p;
}
function updateParticles(dt) {
  for (let i = particlePool.active.length - 1; i >= 0; i--) {
    const p = particlePool.active[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; p.life -= dt;
    if (p.life <= 0) particlePool.recycle(p);
  }
}

const bulletPool = new Pool(() => ({ x:0, y:0, vx:0, vy:0, dmg:0, r:0, color:'#fff', pierce:0, bounce:0, explosion:null, isCrit:false, trail:[], life:1 }));
function spawnBullet(x, y, angle, speed, dmg, r, color, pierce, bounce, explosion, isCrit) {
  const b = bulletPool.get();
  b.x=x; b.y=y; b.vx=Math.cos(angle)*speed; b.vy=Math.sin(angle)*speed;
  b.dmg=dmg; b.r=r; b.color=color; b.pierce=pierce; b.bounce=bounce;
  b.explosion=explosion; b.isCrit=isCrit; b.trail.length=0; b.life=1.2;
  return b;
}
function updateBullets(dt) {
  for (let i = bulletPool.active.length - 1; i >= 0; i--) {
    const b = bulletPool.active[i];
    b.trail.push({x:b.x, y:b.y}); if (b.trail.length > 5) b.trail.shift();
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0) { bulletPool.recycle(b); continue; }
    
    for (let j = Game.enemies.length - 1; j >= 0; j--) {
      const e = Game.enemies[j];
      const dr = b.r + e.radius;
      if (distSq(b, e) < dr*dr) {
        damageEnemy(e, b.dmg, b.isCrit ? '#ffff00' : b.color);
        if (b.explosion) Game.createExplosion(b.x, b.y, b.explosion.r, b.explosion.dmg);
        if (b.bounce > 0) { b.bounce--; }
        else if (b.pierce > 0) { b.pierce--; }
        else { bulletPool.recycle(b); break; }
      }
    }
  }
}

class Player {
  constructor() {
    this.x = 0; this.y = 0; this.radius = Config.player.radius;
    this.health = Config.player.maxHealth; this.maxHealth = Config.player.maxHealth;
    this.angle = 0; this.dashTimer = 0; this.dashCooldown = 0; this.dashAngle = 0; this.invuln = 0;
  }
  update(dt) {
    this.angle = Math.atan2(Input.mouse.y + Camera.y - this.y, Input.mouse.x + Camera.x - this.x);
    let dx=0, dy=0;
    if (Input.keys['w']) dy-=1; if (Input.keys['s']) dy+=1;
    if (Input.keys['a']) dx-=1; if (Input.keys['d']) dx+=1;
    
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.x += Math.cos(this.dashAngle) * Config.player.dashSpeed * dt;
      this.y += Math.sin(this.dashAngle) * Config.player.dashSpeed * dt;
      spawnParticle(this.x, this.y, rand(-20,20), rand(-20,20), 0.3, this.radius*0.8, '#00ffff');
    } else {
      const speed = Config.player.speed * (1 + Game.upgrades.speed * 0.12);
      if (dx!==0 || dy!==0) { const l=Math.hypot(dx,dy); this.x += (dx/l)*speed*dt; this.y += (dy/l)*speed*dt; }
    }
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.invuln > 0) this.invuln -= dt;
    
    if (Math.random() < 0.5) spawnParticle(this.x - Math.cos(this.angle)*15, this.y - Math.sin(this.angle)*15, rand(-30,30), rand(-30,30), 0.2, rand(2,4), '#0088ff');
    if (Input.mouse.down) Game.fireWeapons(dt);
  }
  tryDash() {
    if (this.dashCooldown > 0 || this.dashTimer > 0) return;
    let dx=0, dy=0;
    if (Input.keys['w']) dy-=1; if (Input.keys['s']) dy+=1;
    if (Input.keys['a']) dx-=1; if (Input.keys['d']) dx+=1;
    if (dx===0 && dy===0) { dx = Math.cos(this.angle); dy = Math.sin(this.angle); }
    else { const l=Math.hypot(dx,dy); dx/=l; dy/=l; }
    this.dashTimer = Config.player.dashDuration;
    this.dashCooldown = Config.player.dashCooldown / (1 + Game.upgrades.dash * 0.20);
    this.dashAngle = Math.atan2(dy, dx);
    this.invuln = Config.player.dashDuration + 0.05;
    Sfx.dash();
  }
  
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    if (this.dashTimer > 0) {
      ctx.globalAlpha = 0.5; ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 25;
      ctx.beginPath(); ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (this.invuln > 0 && Math.floor(this.invuln * 20) % 2 === 0) ctx.globalAlpha = 0.5;
    
    ctx.rotate(this.angle);
    ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 15; ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(this.radius, 0);
    ctx.lineTo(-this.radius * 0.6, this.radius * 0.8);
    ctx.lineTo(-this.radius * 0.3, 0);
    ctx.lineTo(-this.radius * 0.6, -this.radius * 0.8);
    ctx.closePath(); ctx.fill();
    
    ctx.fillStyle = '#003344';
    ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    ctx.restore();
  }
}

class Enemy {
  constructor(type, x, y) {
    const def = ENEMIES[type];
    this.type = type; this.x = x; this.y = y;
    const hpScale = 1 + Game.round * 0.12;
    const spdScale = 1 + Game.round * 0.025;
    this.hp = def.hp * hpScale; this.maxHp = this.hp;
    this.speed = def.speed * spdScale; this.damage = def.dmg;
    this.radius = def.radius; this.color = def.color;
    this.coins = def.coins; this.score = def.score;
    this.zigzag = def.zigzag; this.ranged = def.ranged;
    this.isBoss = def.isBoss; this.explodeR = def.explodeR;
    this.range = def.range; this.cd = def.cd || 0;
    this.attackTimer = rand(500, 1500); this.hitFlash = 0; this.angle = 0;
    this.spawnTime = Game.time;
  }
  update(dt) {
    const p = Game.player;
    const dx = p.x - this.x, dy = p.y - this.y;
    const d = Math.hypot(dx, dy);
    this.angle = Math.atan2(dy, dx);
    
    if (this.ranged && d < this.range) {
      if (d < this.range * 0.7) { this.x -= (dx/d)*this.speed*dt; this.y -= (dy/d)*this.speed*dt; }
      this.attackTimer -= dt * 1000;
      if (this.attackTimer <= 0) {
        this.attackTimer = this.cd;
        Game.enemyBullets.push({ x:this.x, y:this.y, vx:Math.cos(this.angle)*280, vy:Math.sin(this.angle)*280, damage:this.damage, radius:6, color:this.color, life:2.5 });
      }
    } else if (this.zigzag) {
      const perp = this.angle + Math.PI / 2;
      const zig = Math.sin(Game.time * 8 + this.spawnTime) * 0.5;
      const ax = Math.cos(this.angle) + Math.cos(perp) * zig;
      const ay = Math.sin(this.angle) + Math.sin(perp) * zig;
      const l = Math.hypot(ax, ay);
      this.x += (ax/l)*this.speed*dt; this.y += (ay/l)*this.speed*dt;
    } else {
      this.x += (dx/d)*this.speed*dt; this.y += (dy/d)*this.speed*dt;
    }
    
    if (this.type === 'bomber' && d < this.radius + p.radius + 10) {
      this.hp = 0; Game.createExplosion(this.x, this.y, this.explodeR, this.damage);
    }
    if (d < this.radius + p.radius) {
      if (p.invuln <= 0) Game.damagePlayer(this.damage * 0.5);
      const overlap = (this.radius + p.radius - d) / 2;
      this.x -= (dx/d)*overlap; this.y -= (dy/d)*overlap;
    }
    if (this.hitFlash > 0) this.hitFlash -= dt * 5;
  }
  
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = this.color; ctx.shadowBlur = 15;
    ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : this.color;
    
    if (this.type === 'walker') {
      ctx.rotate(this.angle);
      ctx.beginPath(); ctx.moveTo(this.radius, 0); ctx.lineTo(-this.radius * 0.7, this.radius * 0.7); ctx.lineTo(-this.radius * 0.7, -this.radius * 0.7); ctx.closePath(); ctx.fill();
    } else if (this.type === 'runner') {
      ctx.rotate(this.angle);
      ctx.beginPath(); ctx.moveTo(this.radius, 0); ctx.lineTo(0, this.radius * 0.6); ctx.lineTo(-this.radius * 0.5, 0); ctx.lineTo(0, -this.radius * 0.6); ctx.closePath(); ctx.fill();
    } else if (this.type === 'brute') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const x = Math.cos(a) * this.radius; const y = Math.sin(a) * this.radius; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2); ctx.fill();
    } else if (this.type === 'spitter') {
      ctx.rotate(this.angle); ctx.beginPath();
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const r = i % 2 === 0 ? this.radius : this.radius * 0.6; const x = Math.cos(a) * r; const y = Math.sin(a) * r; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.closePath(); ctx.fill();
    } else if (this.type === 'bomber') {
      const pulse = 1 + Math.sin(Game.time * 6) * 0.15;
      ctx.beginPath(); ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = Math.sin(Game.time * 8) > 0 ? '#ffff00' : '#ff4400';
      ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2); ctx.fill();
    } else if (this.isBoss) {
      ctx.rotate(Game.time * 0.3); ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const r = i % 2 === 0 ? this.radius : this.radius * 0.65; const x = Math.cos(a) * r; const y = Math.sin(a) * r; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = this.color; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.25 * (1 + Math.sin(Game.time * 4) * 0.3), 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0; ctx.restore();
    
    if (this.maxHp > 60 && !this.isBoss) {
      const bw = this.radius * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(this.x - bw/2, this.y - this.radius - 10, bw, 4);
      ctx.fillStyle = this.color; ctx.fillRect(this.x - bw/2, this.y - this.radius - 10, bw * (this.hp / this.maxHp), 4);
    }
  }
}

function damageEnemy(e, dmg, color) {
  e.hp -= dmg; e.hitFlash = 1;
  Game.damageNumbers.push({ x: e.x + rand(-10,10), y: e.y - e.radius, text: Math.ceil(dmg).toString(), life: 0.6, maxLife: 0.6, color: color, size: dmg > 50 ? 22 : 14, isCrit: dmg > 50 });
  for (let i = 0; i < 3; i++) spawnParticle(e.x, e.y, rand(-80,80), rand(-80,80), 0.2, rand(1,3), e.color);
}