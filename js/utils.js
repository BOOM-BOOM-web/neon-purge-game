const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

const distSq = (a, b) => { const dx = a.x-b.x, dy = a.y-b.y; return dx*dx + dy*dy; };
const dist = (a, b) => Math.sqrt(distSq(a, b));

class Pool {
  constructor(factory) { this.factory = factory; this.free = []; this.active = []; }
  get() { const obj = this.free.pop() || this.factory(); this.active.push(obj); return obj; }
  recycle(obj) { const i = this.active.indexOf(obj); if(i>-1) this.active.splice(i,1); this.free.push(obj); }
}

const Camera = {
  x: 0, y: 0,
  follow(target, dt) {
    this.x = lerp(this.x, target.x - window.innerWidth/2, dt * 8);
    this.y = lerp(this.y, target.y - window.innerHeight/2, dt * 8);
  }
};

const Storage = {
  get(k, def) { try { return localStorage.getItem(k) || def; } catch(e) { return def; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch(e) {} }
};