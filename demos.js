/* Interactive demos for dev-kaiki.github.io
 *
 * Two self-contained simulations, no dependencies, no network:
 *   1. RS-232 flow control — let the visitor overflow a CNC buffer, then
 *      switch on the adaptive scheduler and watch it stop happening.
 *   2. G-code viewer — parse a program and draw the toolpath.
 *
 * Markup is generated here so the English and Portuguese pages stay in sync:
 * each page only carries an empty container plus its lang attribute.
 */
(function () {
  'use strict';

  var PT = document.documentElement.lang.toLowerCase().indexOf('pt') === 0;
  function t(en, pt) { return PT ? pt : en; }

  /* ------------------------------------------------------------------ *
   * 1. FLOW CONTROL SIMULATOR
   * ------------------------------------------------------------------ */

  var CNC_BUFFER = 256;      // bytes — typical of an older controller
  var HIGH_WATER = 0.78;     // sends XOFF above this
  var LOW_WATER  = 0.40;     // sends XON below this
  var TICK_MS    = 50;

  function FlowSim(root) {
    var self = this;
    this.root = root;
    this.reset();

    root.innerHTML =
      '<div class="demo-head">' +
        '<h3>' + t('Try it: feed the machine', 'Experimente: alimente a máquina') + '</h3>' +
        '<p>' + t(
          'The controller below has a 256-byte buffer and only one way to complain: ' +
          'it sends <code>XOFF</code> when it is nearly full. Push the rate up and watch what happens.',
          'O comando abaixo tem 256 bytes de buffer e uma única forma de reclamar: ' +
          'manda <code>XOFF</code> quando está quase cheio. Suba a taxa e veja o que acontece.') +
        '</p>' +
      '</div>' +

      '<div class="demo-modes" role="group">' +
        '<button class="dm-btn is-on" data-mode="manual">' + t('Manual rate', 'Taxa manual') + '</button>' +
        '<button class="dm-btn" data-mode="adaptive">' + t('Adaptive scheduler', 'Escalonador adaptativo') + '</button>' +
      '</div>' +

      '<div class="demo-rate">' +
        '<label for="fs-rate">' + t('Send rate', 'Taxa de envio') + '</label>' +
        '<input id="fs-rate" type="range" min="20" max="900" step="10" value="240">' +
        '<output id="fs-rateval">240 B/s</output>' +
      '</div>' +

      '<div class="buf">' +
        '<div class="buf-label">' +
          '<span>' + t('CNC receive buffer', 'Buffer de recepção da CNC') + '</span>' +
          '<span id="fs-bufval">0 / 256 B</span>' +
        '</div>' +
        '<div class="buf-track">' +
          '<div class="buf-mark buf-mark-hi" style="left:78%"></div>' +
          '<div class="buf-fill" id="fs-fill"></div>' +
        '</div>' +
        '<div class="buf-legend">' +
          '<span class="sig" id="fs-sig">XON</span>' +
          '<span>' + t('threshold at 78% sends XOFF', 'limiar em 78% dispara XOFF') + '</span>' +
        '</div>' +
      '</div>' +

      '<div class="stats">' +
        '<div class="stat"><b id="fs-sent">0</b><span>' + t('bytes sent', 'bytes enviados') + '</span></div>' +
        '<div class="stat"><b id="fs-thru">0</b><span>' + t('avg B/s', 'B/s médio') + '</span></div>' +
        '<div class="stat stat-bad"><b id="fs-lost">0</b><span>' + t('bytes LOST', 'bytes PERDIDOS') + '</span></div>' +
      '</div>' +

      '<p class="verdict" id="fs-verdict"></p>' +

      '<div class="demo-actions">' +
        '<button class="btn btn-sm" id="fs-reset">' + t('Reset', 'Reiniciar') + '</button>' +
      '</div>';

    this.el = {
      rate:    root.querySelector('#fs-rate'),
      rateVal: root.querySelector('#fs-rateval'),
      fill:    root.querySelector('#fs-fill'),
      bufVal:  root.querySelector('#fs-bufval'),
      sig:     root.querySelector('#fs-sig'),
      sent:    root.querySelector('#fs-sent'),
      thru:    root.querySelector('#fs-thru'),
      lost:    root.querySelector('#fs-lost'),
      verdict: root.querySelector('#fs-verdict'),
      modes:   root.querySelectorAll('.dm-btn'),
      rateBox: root.querySelector('.demo-rate')
    };

    this.el.rate.addEventListener('input', function () {
      self.manualRate = +this.value;
      self.el.rateVal.textContent = self.manualRate + ' B/s';
    });
    root.querySelector('#fs-reset').addEventListener('click', function () { self.reset(); });

    Array.prototype.forEach.call(this.el.modes, function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(self.el.modes, function (o) { o.classList.remove('is-on'); });
        b.classList.add('is-on');
        self.mode = b.getAttribute('data-mode');
        self.el.rateBox.style.opacity = self.mode === 'adaptive' ? '.4' : '1';
        self.el.rate.disabled = self.mode === 'adaptive';
        self.reset(true);
      });
    });

    this.timer = setInterval(function () { self.tick(); }, TICK_MS);
  }

  FlowSim.prototype.reset = function (keepMode) {
    this.buffer     = 0;
    this.sent       = 0;
    this.lost       = 0;
    this.elapsed    = 0;
    this.xoff       = false;
    this.chunk      = 8;       // adaptive: current chunk size
    this.sinceXoff  = 0;
    if (!keepMode) {
      this.mode       = 'manual';
      this.manualRate = 240;
    }
    if (this.el) this.render();
  };

  FlowSim.prototype.tick = function () {
    var dt = TICK_MS / 1000;
    this.elapsed += dt;

    // The controller drains its buffer as it executes blocks. Rate wobbles,
    // because blocks are not all the same length — this is what makes a fixed
    // send rate unsafe.
    var drain = (170 + Math.sin(this.elapsed * 1.7) * 70) * dt;
    this.buffer = Math.max(0, this.buffer - drain);

    // Controller raises XOFF near full, clears it once it has drained.
    if (this.buffer > CNC_BUFFER * HIGH_WATER) this.xoff = true;
    else if (this.buffer < CNC_BUFFER * LOW_WATER) this.xoff = false;

    var want;
    if (this.mode === 'adaptive') {
      // Grow while the machine keeps up; collapse hard the moment XOFF arrives.
      if (this.xoff) {
        this.chunk = Math.max(2, this.chunk * 0.55);
        this.sinceXoff = 0;
      } else {
        this.sinceXoff += dt;
        if (this.sinceXoff > 0.35) this.chunk = Math.min(30, this.chunk * 1.08);
      }
      want = this.xoff ? 0 : this.chunk;
    } else {
      // Manual mode ignores XOFF entirely — this is the naive implementation.
      want = this.manualRate * dt;
    }

    if (want > 0) {
      var room = CNC_BUFFER - this.buffer;
      if (want > room) {
        // Buffer overflow: the excess bytes are silently dropped by the
        // controller. On a real machine this is a corrupted program.
        this.lost += want - room;
        this.buffer = CNC_BUFFER;
        this.sent += room;
      } else {
        this.buffer += want;
        this.sent += want;
      }
    }

    this.render();
  };

  FlowSim.prototype.render = function () {
    var pct = this.buffer / CNC_BUFFER * 100;
    this.el.fill.style.width = pct.toFixed(1) + '%';
    this.el.fill.className = 'buf-fill' + (pct > 78 ? ' is-hot' : '');
    this.el.bufVal.textContent = Math.round(this.buffer) + ' / 256 B';

    this.el.sig.textContent = this.xoff ? 'XOFF' : 'XON';
    this.el.sig.className = 'sig' + (this.xoff ? ' sig-off' : '');

    this.el.sent.textContent = Math.round(this.sent);
    this.el.thru.textContent = this.elapsed > 0.5 ? Math.round(this.sent / this.elapsed) : 0;
    this.el.lost.textContent = Math.round(this.lost);

    var v = this.el.verdict, lost = this.lost, thru = this.elapsed > 1 ? this.sent / this.elapsed : 0;
    if (lost > 0) {
      v.className = 'verdict is-bad';
      v.innerHTML = t(
        '<b>Characters lost.</b> The program reaching the machine is now corrupt — ' +
        'on a real job this is a crashed tool, not an error message.',
        '<b>Caracteres perdidos.</b> O programa que chegou na máquina está corrompido — ' +
        'num trabalho real isso é ferramenta quebrada, não mensagem de erro.');
    } else if (this.mode === 'adaptive') {
      v.className = 'verdict is-good';
      v.innerHTML = t(
        '<b>No loss.</b> The scheduler grows the chunk while the machine drains and ' +
        'backs off the instant <code>XOFF</code> arrives — around ' + Math.round(thru) + ' B/s, with nothing dropped.',
        '<b>Sem perda.</b> O escalonador aumenta o chunk enquanto a máquina drena e ' +
        'recua no instante em que o <code>XOFF</code> chega — cerca de ' + Math.round(thru) + ' B/s, sem perder nada.');
    } else if (thru > 0 && thru < 120) {
      v.className = 'verdict';
      v.innerHTML = t(
        'Safe, but slow. At this rate a 40-minute job takes hours, and drip-feed stops being viable.',
        'Seguro, mas lento. Nessa taxa um trabalho de 40 minutos leva horas, e o drip-feed deixa de ser viável.');
    } else {
      v.className = 'verdict';
      v.innerHTML = t(
        'Nothing lost yet. Push the rate higher — the buffer drains unevenly, so a rate that looks safe still isn\'t.',
        'Nada perdido ainda. Suba mais a taxa — o buffer drena de forma irregular, então uma taxa que parece segura ainda não é.');
    }
  };

  /* ------------------------------------------------------------------ *
   * 2. G-CODE VIEWER
   * ------------------------------------------------------------------ */

  var SAMPLE = [
    '( SMI - exemplo / sample )',
    'G21 G90 G17',
    'G0 X0 Y0',
    'G1 X60 Y0 F300',
    'G1 X60 Y40',
    'G1 X0 Y40',
    'G1 X0 Y0',
    'G0 X15 Y12',
    'G1 X45 Y12',
    'G1 X45 Y28',
    'G1 X15 Y28',
    'G1 X15 Y12',
    'G0 X30 Y20',
    'G2 X30 Y20 I8 J0',
    'G0 X0 Y0',
    'M30'
  ].join('\n');

  function GcodeView(root) {
    var self = this;
    root.innerHTML =
      '<div class="demo-head">' +
        '<h3>' + t('Try it: read a program', 'Experimente: leia um programa') + '</h3>' +
        '<p>' + t(
          'Paste G-code and see the toolpath. Dashed is rapid positioning (<code>G0</code>), ' +
          'solid is cutting (<code>G1</code>/<code>G2</code>/<code>G3</code>).',
          'Cole um G-code e veja o caminho da ferramenta. Tracejado é posicionamento rápido ' +
          '(<code>G0</code>), sólido é corte (<code>G1</code>/<code>G2</code>/<code>G3</code>).') +
        '</p>' +
      '</div>' +
      '<div class="gc-grid">' +
        '<textarea id="gc-src" spellcheck="false" aria-label="G-code"></textarea>' +
        '<div class="gc-canvas-wrap"><canvas id="gc-canvas" width="520" height="360"></canvas></div>' +
      '</div>' +
      '<div class="stats">' +
        '<div class="stat"><b id="gc-moves">0</b><span>' + t('moves', 'movimentos') + '</span></div>' +
        '<div class="stat"><b id="gc-cut">0</b><span>' + t('cutting mm', 'mm cortando') + '</span></div>' +
        '<div class="stat"><b id="gc-rapid">0</b><span>' + t('rapid mm', 'mm em rápido') + '</span></div>' +
      '</div>' +
      '<div class="demo-actions">' +
        '<button class="btn btn-sm" id="gc-sample">' + t('Load example', 'Carregar exemplo') + '</button>' +
      '</div>';

    this.src    = root.querySelector('#gc-src');
    this.canvas = root.querySelector('#gc-canvas');
    this.out    = {
      moves: root.querySelector('#gc-moves'),
      cut:   root.querySelector('#gc-cut'),
      rapid: root.querySelector('#gc-rapid')
    };

    this.src.value = SAMPLE;
    this.src.addEventListener('input', function () { self.draw(); });
    root.querySelector('#gc-sample').addEventListener('click', function () {
      self.src.value = SAMPLE; self.draw();
    });
    this.draw();
  }

  // Minimal parser: absolute coordinates, G0/G1 lines and G2/G3 arcs via I/J.
  GcodeView.prototype.parse = function (text) {
    var segs = [], x = 0, y = 0, lines = text.split('\n');

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].replace(/\(.*?\)/g, '').replace(/;.*$/, '').trim().toUpperCase();
      if (!line) continue;

      var g = line.match(/G(0?[0-3])(?![0-9])/);
      if (!g) continue;
      var mode = parseInt(g[1], 10);

      var nx = num(line, 'X'), ny = num(line, 'Y');
      var tx = nx === null ? x : nx, ty = ny === null ? y : ny;

      if (mode === 2 || mode === 3) {
        var ci = num(line, 'I') || 0, cj = num(line, 'J') || 0;
        var cx = x + ci, cy = y + cj;
        var r  = Math.sqrt(ci * ci + cj * cj);
        if (r > 0) {
          var a0 = Math.atan2(y - cy, x - cx);
          var a1 = Math.atan2(ty - cy, tx - cx);
          if (mode === 2 && a1 >= a0) a1 -= Math.PI * 2;
          if (mode === 3 && a1 <= a0) a1 += Math.PI * 2;
          if (Math.abs(a1 - a0) < 1e-9) a1 = a0 + (mode === 2 ? -1 : 1) * Math.PI * 2;
          var steps = Math.max(12, Math.ceil(Math.abs(a1 - a0) * 12));
          var px = x, py = y;
          for (var s = 1; s <= steps; s++) {
            var a = a0 + (a1 - a0) * (s / steps);
            var qx = cx + Math.cos(a) * r, qy = cy + Math.sin(a) * r;
            segs.push({ x1: px, y1: py, x2: qx, y2: qy, rapid: false });
            px = qx; py = qy;
          }
        }
      } else if (tx !== x || ty !== y) {
        segs.push({ x1: x, y1: y, x2: tx, y2: ty, rapid: mode === 0 });
      }
      x = tx; y = ty;
    }
    return segs;

    function num(l, letter) {
      var m = l.match(new RegExp(letter + '(-?\\d+(?:\\.\\d+)?)'));
      return m ? parseFloat(m[1]) : null;
    }
  };

  GcodeView.prototype.draw = function () {
    var segs = this.parse(this.src.value);
    var cv = this.canvas, ctx = cv.getContext('2d');
    var css = getComputedStyle(document.body);
    var W = cv.width, H = cv.height, pad = 26;

    ctx.clearRect(0, 0, W, H);

    var cut = 0, rapid = 0;
    for (var i = 0; i < segs.length; i++) {
      var d = Math.hypot(segs[i].x2 - segs[i].x1, segs[i].y2 - segs[i].y1);
      if (segs[i].rapid) rapid += d; else cut += d;
    }
    this.out.moves.textContent = segs.length;
    this.out.cut.textContent   = Math.round(cut);
    this.out.rapid.textContent = Math.round(rapid);

    if (!segs.length) return;

    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    segs.forEach(function (s) {
      minX = Math.min(minX, s.x1, s.x2); maxX = Math.max(maxX, s.x1, s.x2);
      minY = Math.min(minY, s.y1, s.y2); maxY = Math.max(maxY, s.y1, s.y2);
    });
    var spanX = Math.max(maxX - minX, 1), spanY = Math.max(maxY - minY, 1);
    var k = Math.min((W - pad * 2) / spanX, (H - pad * 2) / spanY);
    var ox = (W - spanX * k) / 2, oy = (H - spanY * k) / 2;

    // Y is flipped: G-code Y grows away from the operator, canvas Y grows down.
    function PX(x) { return ox + (x - minX) * k; }
    function PY(y) { return H - (oy + (y - minY) * k); }

    var accent = css.getPropertyValue('--accent').trim() || '#b45309';
    var faint  = css.getPropertyValue('--fg-faint').trim() || '#888';

    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = faint;
    ctx.beginPath();
    segs.forEach(function (s) {
      if (!s.rapid) return;
      ctx.moveTo(PX(s.x1), PY(s.y1)); ctx.lineTo(PX(s.x2), PY(s.y2));
    });
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.strokeStyle = accent;
    ctx.beginPath();
    segs.forEach(function (s) {
      if (s.rapid) return;
      ctx.moveTo(PX(s.x1), PY(s.y1)); ctx.lineTo(PX(s.x2), PY(s.y2));
    });
    ctx.stroke();

    // origin marker
    ctx.fillStyle = faint;
    ctx.beginPath();
    ctx.arc(PX(segs[0].x1), PY(segs[0].y1), 3.5, 0, Math.PI * 2);
    ctx.fill();
  };

  /* ------------------------------------------------------------------ */

  function boot() {
    var a = document.getElementById('demo-flow');
    var b = document.getElementById('demo-gcode');
    if (a) new FlowSim(a);
    if (b) new GcodeView(b);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
