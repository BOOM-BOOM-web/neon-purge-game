const Sfx = {
  ctx: null,
  init() {
    try { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); if (this.ctx.state === 'suspended') this.ctx.resume(); } catch(e) {}
  },
  play(freq, dur, type='square', vol=0.05, slide=0) {
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, t);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + dur);
    } catch(e) {}
  },
  shoot() { this.play(700 + Math.random()*100, 0.03, 'square', 0.015); },
  kill() { this.play(120, 0.1, 'sawtooth', 0.04, -60); },
  hurt() { this.play(80, 0.2, 'sawtooth', 0.1, -40); },
  coin() { this.play(1400, 0.04, 'sine', 0.03); },
  click() { this.play(500, 0.02, 'square', 0.03); },
  dash() { this.play(300, 0.12, 'sine', 0.05, 200); },
  rare() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.play(f, 0.12, 'sine', 0.06), i * 70)); },
  legendary() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => setTimeout(() => this.play(f, 0.15, 'triangle', 0.08), i * 60)); },
  mythic() { [523, 659, 784, 1047, 1319, 1568, 2093, 2637].forEach((f, i) => setTimeout(() => this.play(f, 0.2, 'sine', 0.1), i * 50)); },
  roundStart() { this.play(440, 0.08, 'square', 0.05); setTimeout(()=>this.play(660, 0.12, 'square', 0.05), 80); },
  gameOver() { [440, 330, 220, 110].forEach((f, i) => setTimeout(() => this.play(f, 0.25, 'sawtooth', 0.08), i * 150)); },
};