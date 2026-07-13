/* ============================================================
   PixelOS — Main Application Engine
   Drag system, pixel rain, z-index manager, apps, sprites
   ============================================================ */
(function () {
  'use strict';

  /* -------------------------------------------------------
     SPRITE DEFINITIONS
     Each defined as rows of string digits:
     0 = transparent, 1 = primary, 2 = accent, 3 = highlight
  ------------------------------------------------------- */
  const SPRITES = {
    coffee: {
      palette: ['#e8d5c4', '#8B4513', '#5D2E0C'],
      rows: [
        '000011110000',
        '000111111000',
        '001111111100',
        '011000000110',
        '011000000110',
        '011111111110',
        '011111111110',
        '011000000110',
        '011000000110',
        '001111111100',
        '000111111000',
        '000110001100',
      ],
    },
    diary: {
      palette: ['#f5f0e8', '#c4a882', '#8b7355'],
      rows: [
        '001111111100',
        '011111111110',
        '011000000010',
        '011111111110',
        '011000000010',
        '011000000010',
        '011111111110',
        '011000000010',
        '011000000010',
        '011111111110',
        '011111111110',
        '001111111100',
      ],
    },
    paint: {
      palette: ['#ff6b9d', '#c084fc', '#60a5fa'],
      rows: [
        '000000011110',
        '000000111110',
        '000001333110',
        '000012223110',
        '000012223110',
        '000012223110',
        '000001111110',
        '000000111100',
        '000011111000',
        '000111110000',
        '001111100000',
        '011111000000',
      ],
    },
    globe: {
      palette: ['#4fc3f7', '#1a73e8', '#388e3c'],
      rows: [
        '000111111000',
        '001111111100',
        '011000000110',
        '011033330110',
        '011033330110',
        '011033330110',
        '011000000110',
        '011012321110',
        '001101110100',
        '000110011000',
        '000001100000',
        '000010010000',
      ],
    },
    calc: {
      palette: ['#c084fc', '#8b5cf6', '#fbbf24'],
      rows: [
        '001111111100',
        '011111111110',
        '011222222110',
        '011222222110',
        '011222222110',
        '011222222110',
        '011222222110',
        '011222222110',
        '011222222110',
        '011222222110',
        '011333333110',
        '001111111100',
      ],
    },
  };

  /* -------------------------------------------------------
     PIXEL ART RENDERER
  ------------------------------------------------------- */
  function renderSprite(canvas, spriteId, scale) {
    if (!canvas) return;
    const sprite = SPRITES[spriteId];
    if (!sprite) return;
    scale = scale || 2;
    const h = sprite.rows.length;
    const w = sprite.rows[0].length;
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = parseInt(sprite.rows[y][x], 10);
        if (c === 0 || !sprite.palette[c - 1]) continue;
        ctx.fillStyle = sprite.palette[c - 1];
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  function renderAllSprites() {
    document.querySelectorAll('[data-sprite]').forEach(function (el) {
      var id = el.getAttribute('data-sprite');
      var scale = 1;
      if (el.classList.contains('dock-sprite')) scale = 2;
      else if (el.classList.contains('desk-sprite')) scale = 3;
      renderSprite(el, id, scale);
    });
  }

  /* -------------------------------------------------------
     CLOCK
  ------------------------------------------------------- */
  function updateClock() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock').textContent = h + ':' + m + ':' + s;
  }

  /* -------------------------------------------------------
     THEME TOGGLE
  ------------------------------------------------------- */
  function toggleTheme() {
    var body = document.body;
    var btn = document.getElementById('theme-toggle');
    var isNight = body.getAttribute('data-theme') === 'night';
    body.setAttribute('data-theme', isNight ? 'day' : 'night');
    btn.textContent = isNight ? '☀️' : '🌙';
  }

  /* -------------------------------------------------------
     RAIN CANVAS — Pixel Rain
  ------------------------------------------------------- */
  var rainCtx, rainW, rainH, rainDrops = [];
  var RAIN_COUNT = 80;
  var rainAnimId = null;
  var rainRunning = false;

  function Drop() {
    this.reset = function () {
      this.x = Math.random() * rainW;
      this.y = -Math.random() * rainH;
      this.speed = 1.5 + Math.random() * 4;
      this.len = 6 + Math.random() * 14;
      this.w = 2;
      this.opacity = 0.2 + Math.random() * 0.4;
      this.hue = 220 + Math.random() * 60;
    };
    this.reset();
    this.update = function () {
      this.y += this.speed;
      if (this.y > rainH + 20) {
        this.reset();
        this.y = -this.len;
      }
    };
    this.draw = function () {
      rainCtx.fillStyle = 'hsla(' + this.hue + ', 80%, 70%, ' + this.opacity + ')';
      var l = this.len;
      for (var i = 0; i < l; i += 2) {
        rainCtx.fillRect(this.x, this.y - i, this.w, 2);
      }
      rainCtx.fillStyle = 'hsla(' + this.hue + ', 90%, 85%, ' + (this.opacity * 0.5) + ')';
      rainCtx.fillRect(this.x - 1, this.y - l - 2, 4, 3);
    };
  }

  function initRain() {
    var canvas = document.getElementById('rain-canvas');
    if (!canvas) return;
    rainCtx = canvas.getContext('2d');
    resizeRain();
    rainDrops = [];
    for (var i = 0; i < RAIN_COUNT; i++) {
      rainDrops.push(new Drop());
    }
    if (!rainRunning) {
      rainRunning = true;
      animateRain();
    }
  }

  function resizeRain() {
    var canvas = document.getElementById('rain-canvas');
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    rainW = canvas.width;
    rainH = canvas.height;
  }

  function animateRain() {
    if (!rainCtx) return;
    rainCtx.clearRect(0, 0, rainW, rainH);
    for (var i = 0; i < rainDrops.length; i++) {
      rainDrops[i].update();
      rainDrops[i].draw();
    }
    rainAnimId = requestAnimationFrame(animateRain);
  }

  /* -------------------------------------------------------
     DRAG ENGINE & Z-INDEX MANAGER
  ------------------------------------------------------- */
  var dragState = null;
  var zIndexCounter = 10;
  var desktop = document.getElementById('desktop');

  function bringToFront(win) {
    if (!win) return;
    win.style.zIndex = ++zIndexCounter;
    var allWins = document.querySelectorAll('.window');
    var maxZ = 0;
    allWins.forEach(function (w) {
      var z = parseInt(w.style.zIndex, 10) || 0;
      if (z > maxZ) maxZ = z;
    });
    zIndexCounter = maxZ + 1;
    win.style.zIndex = zIndexCounter;
  }

  function initDrag() {
    desktop = document.getElementById('desktop');
    if (!desktop) return;

    var maximizeState = null;

    document.addEventListener('dblclick', function (e) {
      var header = e.target.closest('.window-header');
      if (!header) return;
      var win = header.closest('.window');
      if (!win || win.classList.contains('minimized')) return;
      if (maximizeState === win) {
        win.style.left = maximizeState.left;
        win.style.top = maximizeState.top;
        win.style.width = maximizeState.width;
        win.style.height = maximizeState.height;
        maximizeState = null;
      } else {
        maximizeState = {
          left: win.style.left,
          top: win.style.top,
          width: win.style.width,
          height: win.style.height,
          win: win,
        };
        var dRect = desktop.getBoundingClientRect();
        win.style.left = '0px';
        win.style.top = '0px';
        win.style.width = dRect.width + 'px';
        win.style.height = dRect.height + 'px';
      }
      bringToFront(win);
    });

    document.addEventListener('mousedown', function (e) {
      var header = e.target.closest('.window-header');
      if (!header) return;
      var win = header.closest('.window');
      if (!win || win.classList.contains('minimized')) return;
      bringToFront(win);
      var dRect = desktop.getBoundingClientRect();
      var wRect = win.getBoundingClientRect();
      dragState = {
        win: win,
        offsetX: e.clientX - wRect.left,
        offsetY: e.clientY - wRect.top,
        desktopRect: dRect,
        startLeft: win.offsetLeft,
        startTop: win.offsetTop,
      };
      e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
      if (!dragState) return;
      var s = dragState;
      var x = e.clientX - s.offsetX - s.desktopRect.left;
      var y = e.clientY - s.offsetY - s.desktopRect.top;
      var maxX = s.desktopRect.width - s.win.offsetWidth;
      var maxY = s.desktopRect.height - s.win.offsetHeight;
      x = Math.max(0, Math.min(x, maxX));
      y = Math.max(0, Math.min(y, maxY));
      s.win.style.left = x + 'px';
      s.win.style.top = y + 'px';
    });

    document.addEventListener('mouseup', function () {
      dragState = null;
    });
  }

  /* -------------------------------------------------------
     WINDOW CONTROLS
  ------------------------------------------------------- */
  function initWindowControls() {
    document.querySelectorAll('.window').forEach(function (win) {
      var closeBtn = win.querySelector('.win-close');
      var minBtn = win.querySelector('.win-min');
      if (closeBtn) {
        closeBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          win.style.display = 'none';
        });
      }
      if (minBtn) {
        minBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          win.classList.toggle('minimized');
          minBtn.textContent = win.classList.contains('minimized') ? '▢' : '─';
        });
      }
    });
  }

  /* -------------------------------------------------------
     START MENU
  ------------------------------------------------------- */
  function initStartMenu() {
    var startBtn = document.getElementById('start-btn');
    var menu = document.getElementById('start-menu');
    if (!startBtn || !menu) return;

    startBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.classList.toggle('closed');
      startBtn.classList.toggle('active');
    });

    document.addEventListener('click', function (e) {
      if (!menu.classList.contains('closed') &&
          !menu.contains(e.target) &&
          e.target !== startBtn &&
          !startBtn.contains(e.target)) {
        menu.classList.add('closed');
        startBtn.classList.remove('active');
      }
    });

    menu.querySelectorAll('.start-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var app = this.getAttribute('data-app');
        if (app) {
          openApp(app);
        }
        if (this.id === 'start-about') {
          document.getElementById('about-modal').classList.remove('closed');
        }
        menu.classList.add('closed');
        startBtn.classList.remove('active');
      });
    });

    document.getElementById('about-close').addEventListener('click', function () {
      document.getElementById('about-modal').classList.add('closed');
    });

    // Settings modal
    var settingsStartItem = document.getElementById('start-settings');
    if (settingsStartItem) {
      settingsStartItem.addEventListener('click', function (e) {
        e.stopPropagation();
        document.getElementById('settings-modal').classList.remove('closed');
        menu.classList.add('closed');
        startBtn.classList.remove('active');
      });
    }
    document.getElementById('settings-close').addEventListener('click', function () {
      document.getElementById('settings-modal').classList.add('closed');
    });
  }

  /* -------------------------------------------------------
     DOCK
  ------------------------------------------------------- */
  function initDock() {
    document.querySelectorAll('.dock-icon').forEach(function (icon) {
      icon.addEventListener('click', function () {
        var app = this.getAttribute('data-app');
        if (app) openApp(app);
      });
    });
  }

  function openApp(app) {
    var win = document.querySelector('.window[data-app="' + app + '"]');
    if (!win) return;
    if (win.style.display === 'none') {
      win.style.display = 'flex';
    }
    win.classList.remove('minimized');
    var minBtn = win.querySelector('.win-min');
    if (minBtn) minBtn.textContent = '─';
    bringToFront(win);
    // Auto-focus calculator input
    if (app === 'calc') {
      var ci = document.getElementById('calc-input');
      if (ci) setTimeout(function () { ci.focus(); }, 100);
    }
  }

  /* -------------------------------------------------------
     APP: LO-FI CAFE — YouTube Music + Spotify Connector
  ------------------------------------------------------- */
  function initLofi() {
    var embedContainer = document.getElementById('player-embed');
    var playBtn = document.getElementById('play-btn');
    var nowPlaying = document.getElementById('now-playing');
    var nowPlayingSub = document.getElementById('now-playing-sub');
    var visualizer = document.getElementById('visualizer');
    var streamContainer = document.getElementById('stream-container');
    var spotifyContainer = document.getElementById('spotify-embed-container');
    var spotifyUrlInput = document.getElementById('spotify-url-input');
    var spotifyLoadBtn = document.getElementById('spotify-load-btn');

    if (!playBtn) return;
    var audio = new Audio();
    var currentStream = '';
    var isPlaying = false;

    function playStream(url, name) {
      if (currentStream === url && !audio.paused) {
        audio.pause();
        isPlaying = false;
        if (playBtn) { playBtn.textContent = '▶'; playBtn.classList.remove('playing'); }
        animateVisualizer(false);
        return;
      }

      currentStream = url;
      audio.src = url;
      audio.play().then(function () {
        isPlaying = true;
        if (nowPlaying) nowPlaying.textContent = '♪ ' + name;
        if (nowPlayingSub) nowPlayingSub.textContent = 'live radio';
        if (playBtn) { playBtn.textContent = '⏸'; playBtn.classList.add('playing'); }
        animateVisualizer(true);
      }).catch(function () {
        if (nowPlayingSub) nowPlayingSub.textContent = 'click to retry';
      });
    }

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var url = this.getAttribute('data-stream');
        var name = this.textContent.trim();
        playStream(url, name);
      });
    });

    // Tab switching
    document.querySelectorAll('.player-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.player-tab').forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        var src = this.getAttribute('data-source');
        if (streamContainer) streamContainer.classList.toggle('active', src === 'radio');
        if (spotifyContainer) spotifyContainer.classList.toggle('active', src === 'spotify');
      });
    });

    // Play/pause
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        if (!currentStream) return;
        if (audio.paused) {
          audio.play().then(function () {
            isPlaying = true;
            playBtn.textContent = '⏸';
            playBtn.classList.add('playing');
            animateVisualizer(true);
          }).catch(function () {});
        } else {
          audio.pause();
          isPlaying = false;
          playBtn.textContent = '▶';
          playBtn.classList.remove('playing');
          animateVisualizer(false);
        }
      });
    }

    // Spotify embed
    function loadSpotifyEmbed(type, id) {
      if (!spotifyContainer) return;
      spotifyContainer.innerHTML =
        '<iframe src="https://open.spotify.com/embed/' + type + '/' + id +
        '" width="100%" height="152" allow="encrypted-media" ' +
        'style="border:none;border-radius:4px;"></iframe>' +
        '<span class="pixel-text" style="font-size:5px;color:var(--text-secondary);opacity:0.4;display:block;text-align:center;margin-top:4px;">full playback requires Spotify Premium · preview only on free tier</span>';
      if (nowPlaying) nowPlaying.textContent = '♪ Spotify ' + type;
      if (nowPlayingSub) nowPlayingSub.textContent = '';
      animateVisualizer(true);
      if (playBtn) { playBtn.textContent = '⏸'; playBtn.classList.add('playing'); }
      isPlaying = true;
    }

    if (spotifyLoadBtn && spotifyUrlInput) {
      spotifyLoadBtn.addEventListener('click', function () {
        var url = spotifyUrlInput.value.trim();
        var match = url.match(/open\.spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
        if (match) loadSpotifyEmbed(match[1], match[2]);
      });
      spotifyUrlInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') spotifyLoadBtn.click();
      });
    }

    // Visualizer
    function animateVisualizer(active) {
      if (!visualizer) return;
      var bars = visualizer.querySelectorAll('.bar');
      for (var i = 0; i < bars.length; i++) {
        bars[i].classList.toggle('paused', !active);
      }
    }
    animateVisualizer(false);
  }

  /* -------------------------------------------------------
     APP: GLASS DIARY
  ------------------------------------------------------- */
  function initDiary() {
    var textarea = document.querySelector('.diary-input');
    var charCount = document.querySelector('.diary-char-count');
    var clearBtn = document.getElementById('diary-clear');
    var exportBtn = document.getElementById('diary-export');
    var dateDisplay = document.querySelector('.diary-date');

    if (dateDisplay) {
      var now = new Date();
      dateDisplay.textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    }

    if (textarea && charCount) {
      textarea.addEventListener('input', function () {
        charCount.textContent = this.value.length + ' chars';
      });
    }

    if (clearBtn && textarea) {
      clearBtn.addEventListener('click', function () {
        textarea.value = '';
        if (charCount) charCount.textContent = '0 chars';
        textarea.focus();
      });
    }

    if (exportBtn && textarea) {
      exportBtn.addEventListener('click', function () {
        var text = textarea.value;
        if (!text) return;
        var blob = new Blob([text], { type: 'text/plain' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'glass-diary-' + Date.now() + '.txt';
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  }

  /* -------------------------------------------------------
     APP: PIXEL PET
  ------------------------------------------------------- */
  function initPixelEditor() {
    var canvas = document.getElementById('editor-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    var GRID = 16;
    var CELL = canvas.width / GRID;
    var pixels = [];
    var currentColor = '#000000';
    var currentTool = 'pen';

    // Init pixel array
    for (var i = 0; i < GRID * GRID; i++) pixels[i] = null;

    function drawGrid() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw pixels
      for (var y = 0; y < GRID; y++) {
        for (var x = 0; x < GRID; x++) {
          var color = pixels[y * GRID + x];
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
          }
        }
      }
      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 0.5;
      for (var i = 0; i <= GRID; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL, 0);
        ctx.lineTo(i * CELL, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL);
        ctx.lineTo(canvas.width, i * CELL);
        ctx.stroke();
      }
    }

    function getCell(clientX, clientY) {
      var rect = canvas.getBoundingClientRect();
      var scaleX = canvas.width / rect.width;
      var scaleY = canvas.height / rect.height;
      var x = Math.floor((clientX - rect.left) * scaleX / CELL);
      var y = Math.floor((clientY - rect.top) * scaleY / CELL);
      if (x < 0 || x >= GRID || y < 0 || y >= GRID) return null;
      return { x: x, y: y };
    }

    function floodFill(startX, startY, fillColor) {
      var targetColor = pixels[startY * GRID + startX];
      if (targetColor === fillColor) return;
      var visited = {};
      var stack = [{ x: startX, y: startY }];
      while (stack.length > 0) {
        var p = stack.pop();
        var key = p.x + ',' + p.y;
        if (visited[key]) continue;
        visited[key] = true;
        if (p.x < 0 || p.x >= GRID || p.y < 0 || p.y >= GRID) continue;
        if (pixels[p.y * GRID + p.x] !== targetColor) continue;
        pixels[p.y * GRID + p.x] = fillColor;
        stack.push({ x: p.x + 1, y: p.y });
        stack.push({ x: p.x - 1, y: p.y });
        stack.push({ x: p.x, y: p.y + 1 });
        stack.push({ x: p.x, y: p.y - 1 });
      }
      drawGrid();
    }

    function handleDraw(clientX, clientY) {
      var cell = getCell(clientX, clientY);
      if (!cell) return;
      if (currentTool === 'pen') {
        pixels[cell.y * GRID + cell.x] = currentColor;
        drawGrid();
      } else if (currentTool === 'eraser') {
        pixels[cell.y * GRID + cell.x] = null;
        drawGrid();
      } else if (currentTool === 'fill') {
        floodFill(cell.x, cell.y, currentColor);
      }
    }

    var isDrawing = false;
    canvas.addEventListener('mousedown', function (e) {
      isDrawing = true;
      handleDraw(e.clientX, e.clientY);
    });
    canvas.addEventListener('mousemove', function (e) {
      if (!isDrawing) return;
      handleDraw(e.clientX, e.clientY);
    });
    document.addEventListener('mouseup', function () {
      isDrawing = false;
    });

    // Color swatches
    document.querySelectorAll('.color-swatch').forEach(function (swatch) {
      swatch.addEventListener('click', function () {
        document.querySelectorAll('.color-swatch').forEach(function (s) { s.classList.remove('active'); });
        this.classList.add('active');
        currentColor = this.getAttribute('data-color');
      });
    });
    // Select first color by default
    var firstSwatch = document.querySelector('.color-swatch');
    if (firstSwatch) { firstSwatch.classList.add('active'); currentColor = firstSwatch.getAttribute('data-color'); }

    // Tools
    document.querySelectorAll('.editor-tool').forEach(function (tool) {
      tool.addEventListener('click', function () {
        document.querySelectorAll('.editor-tool').forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        currentTool = this.getAttribute('data-tool');
      });
    });

    // Clear
    document.getElementById('editor-clear').addEventListener('click', function () {
      for (var i = 0; i < pixels.length; i++) pixels[i] = null;
      drawGrid();
    });

    // Export
    document.getElementById('editor-export').addEventListener('click', function () {
      // Draw without grid
      var exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      var ectx = exportCanvas.getContext('2d');
      ectx.imageSmoothingEnabled = false;
      for (var y = 0; y < GRID; y++) {
        for (var x = 0; x < GRID; x++) {
          var color = pixels[y * GRID + x];
          if (color) {
            ectx.fillStyle = color;
            ectx.fillRect(x * CELL, y * CELL, CELL, CELL);
          }
        }
      }
      var a = document.createElement('a');
      a.download = 'pixel-art-' + Date.now() + '.png';
      a.href = exportCanvas.toDataURL();
      a.click();
    });

    drawGrid();
  }

  /* -------------------------------------------------------
     APP: NEXUS BROWSER
  ------------------------------------------------------- */
  function initBrowser() {
    var input = document.getElementById('browser-input');
    var goBtn = document.getElementById('browser-go');
    var backBtn = document.getElementById('browser-back');
    var content = document.getElementById('browser-content');
    var welcome = document.getElementById('browser-welcome');

    if (!input || !goBtn || !content) return;

    var apiBase = 'https://en.wikipedia.org/w/api.php';

    function escapeHtml(text) {
      var d = document.createElement('div');
      d.textContent = text;
      return d.innerHTML;
    }

    async function searchWiki(query) {
      query = query.trim();
      if (!query) return;

      content.innerHTML = '<div class="wiki-loading"><span class="pixel-text">searching...</span></div>';

      try {
        var res = await fetch(apiBase + '?action=query&list=search&srsearch=' + encodeURIComponent(query) + '&srlimit=15&format=json&origin=*');
        var data = await res.json();
        var results = data.query && data.query.search ? data.query.search : [];

        if (results.length === 0) {
          content.innerHTML = '<div class="wiki-empty"><span class="pixel-text">no results found</span></div>';
          return;
        }

        var html = '<div class="wiki-results">';
        for (var i = 0; i < results.length; i++) {
          var r = results[i];
          var snippet = r.snippet ? r.snippet.replace(/<\/?[^>]+(>|$)/g, '') : '';
          html += '<div class="wiki-result-item" data-title="' + escapeHtml(encodeURIComponent(r.title)) + '">' +
            '<span class="wiki-result-title">' + escapeHtml(r.title) + '</span>' +
            '<span class="wiki-result-snippet">' + escapeHtml(snippet.substring(0, 200)) + '</span>' +
          '</div>';
        }
        html += '</div>';
        content.innerHTML = html;

        content.querySelectorAll('.wiki-result-item').forEach(function (item) {
          item.addEventListener('click', function () {
            var title = decodeURIComponent(this.getAttribute('data-title'));
            loadArticle(title);
          });
        });
      } catch (e) {
        content.innerHTML = '<div class="wiki-empty"><span class="pixel-text">search failed — try again</span></div>';
      }
    }

    async function loadArticle(title) {
      content.innerHTML = '<div class="wiki-loading"><span class="pixel-text">loading article...</span></div>';

      try {
        var res = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title));
        if (!res.ok) throw new Error('not found');
        var data = await res.json();

        var html = '<div class="wiki-article">';

        // Back button
        html += '<div class="wiki-article-toolbar"><button class="wiki-back-btn pixel-btn">◂ BACK</button>';

        // Extract page URL
        var pageUrl = 'https://en.wikipedia.org/wiki/' + encodeURIComponent(data.title);
        html += '<a href="' + pageUrl + '" target="_blank" class="pixel-btn wiki-ext-link">↗ OPEN</a></div>';

        // Title
        html += '<h1 class="wiki-article-title">' + escapeHtml(data.title) + '</h1>';

        // Thumbnail
        if (data.thumbnail && data.thumbnail.source) {
          html += '<img class="wiki-article-thumb" src="' + data.thumbnail.source + '" alt="' + escapeHtml(data.title) + '" loading="lazy">';
        }

        // Extract (first paragraph)
        if (data.extract) {
          var paragraphs = data.extract.split('\n').filter(function (p) { return p.trim(); });
          for (var i = 0; i < paragraphs.length; i++) {
            html += '<p class="wiki-article-text">' + escapeHtml(paragraphs[i]) + '</p>';
          }
        }

        html += '</div>';
        content.innerHTML = html;

        var backBtn2 = content.querySelector('.wiki-back-btn');
        if (backBtn2) {
          backBtn2.addEventListener('click', function () {
            showWelcome();
          });
        }
      } catch (e) {
        content.innerHTML = '<div class="wiki-empty"><span class="pixel-text">could not load article</span></div>';
      }
    }

    function showWelcome() {
      content.innerHTML =
        '<div class="browser-welcome">' +
          '<span class="pixel-text wiki-welcome-icon">📖</span>' +
          '<span class="pixel-text wiki-welcome-title">WIKIPEDIA VIEWER</span>' +
          '<span class="pixel-text wiki-welcome-sub">search any article to read</span>' +
        '</div>';
    }

    function handleInput() {
      var query = input.value.trim();
      if (!query) return;
      searchWiki(query);
    }

    goBtn.addEventListener('click', handleInput);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleInput();
    });

    if (backBtn) {
      backBtn.addEventListener('click', showWelcome);
    }
  }

  /* -------------------------------------------------------
      DESKTOP SEARCH BAR
  ------------------------------------------------------- */
  function initDesktopSearch() {
    var input = document.getElementById('desktop-search-input');
    var btn = document.getElementById('desktop-search-btn');
    if (!input || !btn) return;

    function doSearch() {
      var query = input.value.trim();
      if (!query) return;

      // Open browser window
      var browserWin = document.querySelector('.window[data-app="browser"]');
      if (browserWin) {
        openApp('browser');
      }

      // Find the browser content and trigger wiki search
      var browserContent = document.getElementById('browser-content');
      var browserInput = document.getElementById('browser-input');
      if (browserInput) {
        browserInput.value = query;
      }

      // Trigger search via the browser's own function
      if (browserContent) {
        // Simulate a search by directly calling the wiki search
        // We need to access the browser's search function
        // Since initBrowser creates closures, we can re-trigger via the input
        var event = new KeyboardEvent('keydown', { key: 'Enter' });
        browserInput.dispatchEvent(event);
      }
    }

    btn.addEventListener('click', doSearch);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doSearch();
    });
  }

  /* -------------------------------------------------------
      APP: CALCULATOR
  ------------------------------------------------------- */
  function initCalc() {
    var input = document.getElementById('calc-input');
    var display = document.getElementById('calc-display');
    var sciRows = document.getElementById('calc-sci-rows');
    if (!input) return;

    /* ---------- mode toggle ---------- */
    document.querySelectorAll('.calc-mode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.calc-mode-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        if (sciRows) sciRows.classList.toggle('open', btn.getAttribute('data-mode') === 'sci');
      });
    });

    /* ---------- eval with Math support ---------- */
    function evalExpr(expr) {
      var s = expr;
      s = s.replace(/π/g, 'Math.PI');
      var funcs = { sin:'Math.sin', cos:'Math.cos', tan:'Math.tan', log:'Math.log10', ln:'Math.log', sqrt:'Math.sqrt' };
      for (var f in funcs) {
        s = s.replace(new RegExp(f + '\\(', 'g'), funcs[f] + '(');
      }
      s = s.replace(/([\d.]+)!/g, 'fact($1)');
      s = s.replace(/[^0-9+\-*/.()% a-zA-Z,]/g, '');
      if (!s) return '';
      try {
        var fact = function (n) { return n <= 1 ? 1 : n * fact(n - 1); };
        var result = Function('fact', '"use strict"; return (' + s + ')')(fact);
        if (!isFinite(result)) return 'ERR';
        return String(parseFloat(result.toFixed(10)));
      } catch (e) {
        return 'ERR';
      }
    }

    function evaluate() {
      var expr = input.value.trim();
      if (!expr) return;
      var result = evalExpr(expr);
      display.textContent = result;
      input.value = result !== 'ERR' ? result : expr;
      if (result !== 'ERR') input.select();
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        evaluate();
      }
    });

    input.addEventListener('input', function () {
      display.textContent = input.value || '0';
    });

    document.querySelectorAll('.calc-btn, .calc-sci').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = this.getAttribute('data-v');
        if (!v) return;

        if (v === 'C') {
          input.value = '';
          display.textContent = '0';
          input.focus();
          return;
        }

        if (v === '=') {
          evaluate();
          return;
        }

        if (v === '±') {
          var expr = input.value.trim();
          if (/^-?[\d.]+$/.test(expr)) {
            input.value = expr.startsWith('-') ? expr.slice(1) : '-' + expr;
            display.textContent = input.value;
          }
          input.focus();
          return;
        }

        if (v === '**2' || v === '**3') {
          input.value = '(' + (input.value || '0') + ')' + v;
          display.textContent = input.value;
          input.focus();
          return;
        }

        input.value += v;
        display.textContent = input.value;
        input.focus();
      });
    });

    input.focus();
  }

  /* -------------------------------------------------------
      WIDGET: ANALOG CLOCK
  ------------------------------------------------------- */
  function initClockWidget() {
    var canvas = document.getElementById('clock-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    function drawClock() {
      var w = canvas.width, h = canvas.height;
      var cx = w / 2, cy = h / 2, r = 58;
      ctx.clearRect(0, 0, w, h);

      // Face
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
      ctx.fill();

      // Hour markers
      for (var i = 0; i < 12; i++) {
        var ang = (i / 12) * Math.PI * 2 - Math.PI / 2;
        var len = i % 3 === 0 ? 8 : 5;
        var x1 = cx + Math.cos(ang) * (r - 4);
        var y1 = cy + Math.sin(ang) * (r - 4);
        var x2 = cx + Math.cos(ang) * (r - 4 - len);
        var y2 = cy + Math.sin(ang) * (r - 4 - len);
        ctx.strokeStyle = i % 3 === 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)';
        ctx.lineWidth = i % 3 === 0 ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Time
      var now = new Date();
      var hh = now.getHours(), mm = now.getMinutes(), ss = now.getSeconds();

      // Hour hand
      var hAng = (hh % 12 + mm / 60) / 12 * Math.PI * 2 - Math.PI / 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(hAng) * (r * 0.5), cy + Math.sin(hAng) * (r * 0.5));
      ctx.stroke();

      // Minute hand
      var mAng = (mm + ss / 60) / 60 * Math.PI * 2 - Math.PI / 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(mAng) * (r * 0.7), cy + Math.sin(mAng) * (r * 0.7));
      ctx.stroke();

      // Second hand
      var sAng = ss / 60 * Math.PI * 2 - Math.PI / 2;
      ctx.strokeStyle = 'rgba(255,107,157,0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(sAng) * 6, cy - Math.sin(sAng) * 6);
      ctx.lineTo(cx + Math.cos(sAng) * (r * 0.78), cy + Math.sin(sAng) * (r * 0.78));
      ctx.stroke();

      // Center dot
      ctx.fillStyle = 'rgba(255,107,157,0.9)';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    drawClock();
    setInterval(drawClock, 1000);
  }

  /* -------------------------------------------------------
      WIDGET: CALENDAR
  ------------------------------------------------------- */
  function initCalendarWidget() {
    var grid = document.getElementById('cal-grid');
    var monthYear = document.getElementById('cal-month-year');
    var prevBtn = document.getElementById('cal-prev');
    var nextBtn = document.getElementById('cal-next');
    if (!grid || !monthYear) return;

    var currentDate = new Date();
    var currentMonth = currentDate.getMonth();
    var currentYear = currentDate.getFullYear();
    var today = currentDate.getDate();

    function renderCalendar(month, year) {
      grid.innerHTML = '';
      var firstDay = new Date(year, month, 1).getDay();
      var daysInMonth = new Date(year, month + 1, 0).getDate();
      var monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

      monthYear.textContent = monthNames[month] + ' ' + year;

      for (var i = 0; i < firstDay; i++) {
        var empty = document.createElement('span');
        empty.className = 'cal-day cal-empty';
        grid.appendChild(empty);
      }

      for (var d = 1; d <= daysInMonth; d++) {
        var day = document.createElement('span');
        day.className = 'cal-day';
        day.textContent = d;
        if (d === today && month === currentDate.getMonth() && year === currentDate.getFullYear()) {
          day.classList.add('cal-today');
        }
        grid.appendChild(day);
      }
    }

    renderCalendar(currentMonth, currentYear);

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar(currentMonth, currentYear);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar(currentMonth, currentYear);
      });
    }
  }

  /* -------------------------------------------------------
      SETTINGS ENGINE
  ------------------------------------------------------- */
  var settingsState = {
    accent: '#ff6b9d',
    rain: true,
    particles: true,
    sparkles: true,
    blur: 16,
  };

  function initSettings() {
    var accentInput = document.getElementById('setting-accent');
    var rainToggle = document.getElementById('setting-rain');
    var particlesToggle = document.getElementById('setting-particles');
    var sparklesToggle = document.getElementById('setting-sparkles');
    var blurSlider = document.getElementById('setting-blur');
    var resetBtn = document.getElementById('settings-reset');

    // Load saved
    var saved = localStorage.getItem('pixelos-settings');
    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        for (var k in parsed) settingsState[k] = parsed[k];
      } catch (e) {}
    }

    function applySettings() {
      // Accent color
      var accent = settingsState.accent;
      document.documentElement.style.setProperty('--accent', accent);
      // Generate accent2 (purple-ish shift) and accent3 (blue-ish shift)
      document.documentElement.style.setProperty('--accent2', shiftColor(accent, 40));
      document.documentElement.style.setProperty('--accent3', shiftColor(accent, -60));
      if (accentInput) accentInput.value = accent;

      // Rain
      var rainCanvas = document.getElementById('rain-canvas');
      if (rainCanvas) {
        rainCanvas.style.display = settingsState.rain ? 'block' : 'none';
      }
      if (rainToggle) rainToggle.checked = settingsState.rain;

      // Particles
      var particleCanvas = document.getElementById('particle-canvas');
      if (particleCanvas) {
        particleCanvas.style.display = settingsState.particles ? 'block' : 'none';
      }
      if (particlesToggle) particlesToggle.checked = settingsState.particles;

      // Sparkles
      if (sparklesToggle) sparklesToggle.checked = settingsState.sparkles;

      // Blur
      document.documentElement.style.setProperty('--glass-blur', settingsState.blur + 'px');
      if (blurSlider) blurSlider.value = settingsState.blur;

      // Save
      localStorage.setItem('pixelos-settings', JSON.stringify(settingsState));
    }

    function shiftColor(hex, amount) {
      hex = hex.replace('#', '');
      var r = Math.min(255, Math.max(0, parseInt(hex.substring(0, 2), 16) + amount));
      var g = Math.min(255, Math.max(0, parseInt(hex.substring(2, 4), 16) + amount));
      var b = Math.min(255, Math.max(0, parseInt(hex.substring(4, 6), 16) + amount));
      return '#' + [r, g, b].map(function (c) {
        return ('0' + c.toString(16)).slice(-2);
      }).join('');
    }

    // Events
    if (accentInput) {
      accentInput.addEventListener('input', function () {
        settingsState.accent = this.value;
        applySettings();
      });
    }
    document.querySelectorAll('.color-preset').forEach(function (btn) {
      btn.addEventListener('click', function () {
        settingsState.accent = this.getAttribute('data-color');
        applySettings();
      });
    });
    if (rainToggle) {
      rainToggle.addEventListener('change', function () {
        settingsState.rain = this.checked;
        applySettings();
      });
    }
    if (particlesToggle) {
      particlesToggle.addEventListener('change', function () {
        settingsState.particles = this.checked;
        applySettings();
      });
    }
    if (sparklesToggle) {
      sparklesToggle.addEventListener('change', function () {
        settingsState.sparkles = this.checked;
        applySettings();
      });
    }
    if (blurSlider) {
      blurSlider.addEventListener('input', function () {
        settingsState.blur = parseInt(this.value);
        applySettings();
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        settingsState.accent = '#ff6b9d';
        settingsState.rain = true;
        settingsState.particles = true;
        settingsState.sparkles = true;
        settingsState.blur = 16;
        applySettings();
      });
    }

    // Apply sparkles toggle
    var origSparkles = createSparkles;
    createSparkles = function (x, y) {
      if (!settingsState.sparkles) return;
      origSparkles(x, y);
    };

    applySettings();
  }

  /* -------------------------------------------------------
      BOOT SCREEN
  ------------------------------------------------------- */
  function initBootScreen() {
    var boot = document.getElementById('boot-screen');
    if (!boot) return;

    var bootMessages = [
      ' pixel engine...      [OK]',
      ' glass filesystem...  [OK]',
      ' sprite database...   [OK]',
      ' blur kernels...      [OK]',
      ' neon tubes...        [OK]',
      ' window manager...    [OK]',
      ' pixel rain...        [OK]',
      ' systems operational. [OK]',
    ];

    bootMessages.forEach(function (msg, i) {
      var el = document.getElementById('term-line' + (i + 2));
      setTimeout(function () {
        if (!el) return;
        el.textContent = msg;
      }, 300 + i * 200);
    });

    setTimeout(function () {
      var cursorLine = document.getElementById('term-line10');
      if (cursorLine) cursorLine.innerHTML = '│ PixelOS ready. <span class="term-cursor">█</span>';
    }, 2200);

    setTimeout(function () {
      boot.classList.add('done');
    }, 2800);
  }

  /* -------------------------------------------------------
     PARTICLE SYSTEM — Ambient Floating Particles
  ------------------------------------------------------- */
  var pCtx, pW, pH, particles = [];
  var PARTICLE_COUNT = 40;
  var pAnimId = null;

  function Particle() {
    this.reset = function () {
      this.x = Math.random() * pW;
      this.y = pH + 10 + Math.random() * 60;
      this.size = 2 + Math.floor(Math.random() * 4);
      this.speed = 0.15 + Math.random() * 0.4;
      this.wobble = Math.random() * 0.5;
      this.wobbleSpeed = 0.005 + Math.random() * 0.01;
      this.wobbleOffset = Math.random() * Math.PI * 2;
      this.opacity = 0.08 + Math.random() * 0.2;
      this.hue = Math.random() * 60 + 20;
    };
    this.reset();
    this.draw = function () {
      pCtx.fillStyle = 'hsla(' + this.hue + ', 80%, 70%, ' + this.opacity + ')';
      pCtx.fillRect(Math.round(this.x), Math.round(this.y), this.size, this.size);
    };
    this.update = function () {
      this.y -= this.speed;
      this.x += Math.sin(this.y * this.wobbleSpeed + this.wobbleOffset) * this.wobble;
      if (this.y < -20) this.reset();
    };
  }

  function initParticles() {
    var canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    pCtx = canvas.getContext('2d');
    resizeParticles();
    particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var p = new Particle();
      p.y = Math.random() * pH;
      particles.push(p);
    }
    animateParticles();
  }

  function resizeParticles() {
    var canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    pW = canvas.width;
    pH = canvas.height;
  }

  function animateParticles() {
    if (!pCtx) return;
    pCtx.clearRect(0, 0, pW, pH);
    for (var i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    pAnimId = requestAnimationFrame(animateParticles);
  }

  /* -------------------------------------------------------
     DESKTOP ICONS
  ------------------------------------------------------- */
  function initDesktopIcons() {
    document.querySelectorAll('.desk-icon').forEach(function (icon) {
      icon.addEventListener('dblclick', function () {
        var app = this.getAttribute('data-app');
        if (app) openApp(app);
      });
      // Also open on single click with visual feedback
      icon.addEventListener('click', function () {
        this.style.transform = 'scale(0.95)';
        var self = this;
        setTimeout(function () { self.style.transform = ''; }, 150);
      });
    });
  }

  /* -------------------------------------------------------
     WINDOW RESIZE
  ------------------------------------------------------- */
  var resizeState = null;

  function initWindowResize() {
    document.querySelectorAll('.window-resize-handle').forEach(function (handle) {
      handle.addEventListener('mousedown', function (e) {
        e.stopPropagation();
        var win = this.closest('.window');
        if (!win || win.classList.contains('minimized')) return;
        var rect = win.getBoundingClientRect();
        var dRect = desktop.getBoundingClientRect();
        resizeState = {
          win: win,
          startX: e.clientX,
          startY: e.clientY,
          startW: rect.width,
          startH: rect.height,
          minW: 280,
          minH: 200,
          desktopRect: dRect,
        };
        e.preventDefault();
      });
    });
  }

  // resize mousemove/mouseup handled in the document-level events
  function handleResizeMove(e) {
    if (!resizeState) return;
    var s = resizeState;
    var dx = e.clientX - s.startX;
    var dy = e.clientY - s.startY;
    var newW = Math.max(s.minW, Math.min(s.startW + dx, s.desktopRect.width - parseInt(s.win.style.left)));
    var newH = Math.max(s.minH, Math.min(s.startH + dy, s.desktopRect.height - parseInt(s.win.style.top)));
    s.win.style.width = newW + 'px';
    s.win.style.height = newH + 'px';
  }

  /* -------------------------------------------------------
     SPARKLE EFFECT
  ------------------------------------------------------- */
  function createSparkles(x, y) {
    var colors = ['#ff6b9d', '#c084fc', '#60a5fa', '#fbbf24', '#34d399', '#ff8aae'];
    var count = 10 + Math.floor(Math.random() * 8);
    for (var i = 0; i < count; i++) {
      var spark = document.createElement('div');
      spark.className = 'sparkle';
      spark.style.cssText = 'left:' + x + 'px;top:' + y + 'px;background:' + colors[i % colors.length] + ';';
      document.body.appendChild(spark);
      var angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      var dist = 16 + Math.random() * 28;
      var sx = Math.cos(angle) * dist;
      var sy = Math.sin(angle) * dist;
      requestAnimationFrame(function () {
        spark.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        spark.style.transform = 'translate(' + sx + 'px,' + sy + 'px) scale(0.5)';
        spark.style.opacity = '0';
      });
      setTimeout(function () { spark.remove(); }, 600);
    }
  }

  document.addEventListener('mousedown', function (e) {
    var t = e.target;
    if (t.closest('.window-header') || t.closest('.window-resize-handle') ||
        t.closest('button') || t.closest('input') || t.closest('textarea') ||
        t.closest('select') || t.closest('iframe') || t.closest('.dock-icon') ||
        t.closest('.sticky-note') || t.closest('.explorer-item') ||
        t.closest('.explorer-sidebar-item') || t.closest('.terminal-input')) return;
    createSparkles(e.clientX, e.clientY);
  });

  /* -------------------------------------------------------
     ACTIVE WINDOW GLOW — update bringToFront
  ------------------------------------------------------- */
  // Override the original bringToFront to add glow + dock indicator
  var origBringToFront = bringToFront;
  bringToFront = function (win) {
    document.querySelectorAll('.window').forEach(function (w) {
      w.classList.remove('active-glow');
    });
    document.querySelectorAll('.dock-icon').forEach(function (d) {
      d.classList.remove('active');
    });
    if (win) {
      win.classList.add('active-glow');
      origBringToFront(win);
      var app = win.getAttribute('data-app');
      if (app) {
        var dockIcon = document.querySelector('.dock-icon[data-app="' + app + '"]');
        if (dockIcon) dockIcon.classList.add('active');
      }
    }
  };

  /* -------------------------------------------------------
     RESIZE HANDLER
  ------------------------------------------------------- */
  function handleResize() {
    resizeRain();
    resizeParticles();
  }

  /* -------------------------------------------------------
     SPRITE DEFINITIONS — New Apps
  ------------------------------------------------------- */
  SPRITES.folder = {
    palette: ['#fbbf24', '#f59e0b', '#d97706'],
    rows: [
      '000111111100',
      '001111111110',
      '011111111111',
      '011000000110',
      '011000000110',
      '011000000110',
      '011000000110',
      '011000000110',
      '011000000110',
      '011111111110',
      '001111111100',
    ],
  };
  SPRITES.snake = {
    palette: ['#34d399', '#10b981', '#059669'],
    rows: [
      '000001100000',
      '000111111000',
      '001222222100',
      '012222222210',
      '012201222210',
      '001220122100',
      '000122221000',
      '000012210000',
      '000012210000',
      '000001100000',
      '000001100000',
    ],
  };
  SPRITES.timer = {
    palette: ['#60a5fa', '#3b82f6', '#2563eb'],
    rows: [
      '000111111000',
      '011111111110',
      '011000000110',
      '011022220110',
      '011022220110',
      '011022220110',
      '011022220110',
      '011022220110',
      '011022220110',
      '011000000110',
      '011111111110',
      '001111111100',
    ],
  };
  SPRITES.terminal = {
    palette: ['#34d399', '#10b981', '#047857'],
    rows: [
      '000000000000',
      '000111111000',
      '001111111100',
      '011011101110',
      '011101110110',
      '011110111110',
      '011101110110',
      '011011101110',
      '001110111100',
      '000111111000',
      '000000000000',
    ],
  };

  /* -------------------------------------------------------
     VIRTUAL FILESYSTEM (localStorage-backed)
  ------------------------------------------------------- */
  var vfs = (function () {
    var STORAGE_KEY = 'pixelos-vfs';
    var root = { type: 'dir', children: {} };
    var currentPath = '/';

    function init() {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { root = JSON.parse(saved); } catch (e) { seedFS(); }
      } else {
        seedFS();
      }
    }

    function seedFS() {
      root = { type: 'dir', children: {} };
      mkdirp('/Documents');
      mkdirp('/Pictures');
      mkdirp('/Music');
      mkdirp('/Notes');
      touch('/Documents/hello.txt', 'Welcome to PixelOS!\n');
      touch('/Notes/welcome.note', 'Your sticky notes appear here.\n');
      save();
    }

    function save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
    }

    function resolve(p) {
      if (!p || p === '/') return { node: root, name: '/', parent: null };
      var parts = normalize(p).split('/').filter(Boolean);
      var node = root;
      for (var i = 0; i < parts.length; i++) {
        if (!node.children || !node.children[parts[i]]) return null;
        node = node.children[parts[i]];
      }
      return { node: node, name: parts[parts.length - 1], parent: null };
    }

    function normalize(p) {
      if (!p || p[0] !== '/') p = currentPath + '/' + p;
      var parts = [];
      p.split('/').forEach(function (seg) {
        if (seg === '..') parts.pop();
        else if (seg && seg !== '.') parts.push(seg);
      });
      return '/' + parts.join('/');
    }

    function mkdirp(path) {
      var parts = normalize(path).split('/').filter(Boolean);
      var node = root;
      for (var i = 0; i < parts.length; i++) {
        if (!node.children[parts[i]]) {
          node.children[parts[i]] = { type: 'dir', children: {} };
        }
        node = node.children[parts[i]];
      }
    }

    function ls(path) {
      var r = resolve(path || currentPath);
      if (!r || r.node.type !== 'dir') return [];
      var items = [];
      for (var name in r.node.children) {
        items.push({ name: name, node: r.node.children[name] });
      }
      items.sort(function (a, b) { return a.name.localeCompare(b.name); });
      return items;
    }

    function mkdir(path) {
      var normalized = normalize(path);
      var parts = normalized.split('/').filter(Boolean);
      var name = parts.pop();
      var parentPath = '/' + parts.join('/');
      var r = resolve(parentPath);
      if (!r || r.node.type !== 'dir') return false;
      if (r.node.children[name]) return false;
      r.node.children[name] = { type: 'dir', children: {} };
      save();
      return true;
    }

    function touch(path, content) {
      var normalized = normalize(path);
      var parts = normalized.split('/').filter(Boolean);
      var name = parts.pop();
      var parentPath = '/' + parts.join('/');
      var r = resolve(parentPath);
      if (!r || r.node.type !== 'dir') return false;
      r.node.children[name] = { type: 'file', content: content || '' };
      save();
      return true;
    }

    function rm(path) {
      var normalized = normalize(path);
      var parts = normalized.split('/').filter(Boolean);
      var name = parts.pop();
      var parentPath = '/' + parts.join('/');
      var r = resolve(parentPath);
      if (!r || r.node.type !== 'dir') return false;
      delete r.node.children[name];
      save();
      return true;
    }

    function rename(oldPath, newName) {
      var norm = normalize(oldPath);
      var parts = norm.split('/').filter(Boolean);
      parts[parts.length - 1] = newName;
      var targetPath = '/' + parts.join('/');
      var r = resolve(oldPath);
      var t = resolve(targetPath);
      if (!r || t) return false;
      var parentParts = norm.split('/').filter(Boolean);
      parentParts.pop();
      var parentPath = '/' + parentParts.join('/');
      var p = resolve(parentPath);
      if (!p) return false;
      var oldName = norm.split('/').filter(Boolean).pop();
      p.node.children[newName] = r.node;
      delete p.node.children[oldName];
      save();
      return true;
    }

    function read(path) {
      var r = resolve(path);
      if (!r || r.node.type !== 'file') return null;
      return r.node.content || '';
    }

    function write(path, content) {
      var r = resolve(path);
      if (!r || r.node.type !== 'file') return false;
      r.node.content = content;
      save();
      return true;
    }

    function getPath() { return currentPath; }
    function setPath(p) { currentPath = normalize(p); }

    init();
    return { ls: ls, mkdir: mkdir, touch: touch, rm: rm, rename: rename,
             read: read, write: write, resolve: resolve, normalize: normalize,
             getPath: getPath, setPath: setPath, save: save };
  })();

  /* -------------------------------------------------------
     NOTIFICATION SYSTEM
  ------------------------------------------------------- */
  var notifications = [];

  function notify(title, message, type) {
    type = type || 'info';
    var container = document.getElementById('notification-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'notification-toast ' + type;
    toast.innerHTML = '<span class="notif-title">' + title + '</span>' +
      '<span class="notif-msg">' + message + '</span>' +
      '<button class="notif-close">&times;</button>';
    container.appendChild(toast);
    notifications.push(toast);

    toast.querySelector('.notif-close').addEventListener('click', function () {
      dismiss(toast);
    });

    setTimeout(function () { dismiss(toast); }, 4000);

    function dismiss(el) {
      if (!el.parentNode) return;
      el.style.opacity = '0';
      el.style.transform = 'translateX(100%)';
      setTimeout(function () { if (el.parentNode) el.remove(); }, 300);
    }
  }

  /* -------------------------------------------------------
     APP: FILE EXPLORER
  ------------------------------------------------------- */
  function initExplorer() {
    var filesEl = document.getElementById('explorer-files');
    var pathEl = document.getElementById('explorer-path');
    if (!filesEl) return;
    var currentPath = '/';

    function renderDir(path) {
      currentPath = path;
      if (pathEl) pathEl.textContent = path;
      var items = vfs.ls(path);
      filesEl.innerHTML = '';
      items.forEach(function (item) {
        var el = document.createElement('div');
        el.className = 'explorer-item';
        el.setAttribute('data-name', item.name);
        el.setAttribute('data-type', item.node.type);
        var icon = item.node.type === 'dir' ? '📁' : '📄';
        el.innerHTML =
          '<span class="explorer-item-icon">' + icon + '</span>' +
          '<span class="explorer-item-name">' + item.name + '</span>';
        el.addEventListener('dblclick', function () {
          if (item.node.type === 'dir') {
            renderDir(vfs.normalize(path + '/' + item.name));
          }
        });
        el.addEventListener('click', function (e) {
          document.querySelectorAll('.explorer-item').forEach(function (i) { i.classList.remove('selected'); });
          el.classList.add('selected');
        });
        el.addEventListener('contextmenu', function (e) {
          e.preventDefault();
          showContextMenu(e.clientX, e.clientY, item.name, item.node.type, path);
        });
        filesEl.appendChild(el);
      });

      // Update sidebar active
      document.querySelectorAll('.explorer-sidebar-item').forEach(function (item) {
        item.classList.toggle('active', item.getAttribute('data-path') === path);
      });
    }

    function showContextMenu(x, y, name, type, parentPath) {
      removeContextMenu();
      var menu = document.createElement('div');
      menu.className = 'explorer-context-menu';
      menu.style.left = x + 'px';
      menu.style.top = y + 'px';

      if (type === 'file') {
        var readItem = document.createElement('div');
        readItem.className = 'explorer-context-item';
        readItem.textContent = '📖 Read';
        readItem.addEventListener('click', function () {
          var content = vfs.read(parentPath + '/' + name);
          if (content !== null) {
            var newContent = prompt('Edit file content:', content);
            if (newContent !== null) {
              vfs.write(parentPath + '/' + name, newContent);
              notify('File Saved', name, 'success');
            }
          }
          removeContextMenu();
        });
        menu.appendChild(readItem);
      }

      var renameItem = document.createElement('div');
      renameItem.className = 'explorer-context-item';
      renameItem.textContent = '✏️ Rename';
      renameItem.addEventListener('click', function () {
        var newName = prompt('Rename "' + name + '" to:', name);
        if (newName && newName !== name) {
          vfs.rename(parentPath + '/' + name, newName);
          notify('Renamed', name + ' → ' + newName, 'info');
          renderDir(currentPath);
        }
        removeContextMenu();
      });
      menu.appendChild(renameItem);

      var delItem = document.createElement('div');
      delItem.className = 'explorer-context-item';
      delItem.textContent = '🗑️ Delete';
      delItem.addEventListener('click', function () {
        if (confirm('Delete "' + name + '"?')) {
          vfs.rm(parentPath + '/' + name);
          notify('Deleted', name, 'warning');
          renderDir(currentPath);
        }
        removeContextMenu();
      });
      menu.appendChild(delItem);

      document.body.appendChild(menu);
      setTimeout(function () {
        document.addEventListener('click', removeContextMenu, { once: true });
      }, 0);
    }

    function removeContextMenu() {
      var m = document.querySelector('.explorer-context-menu');
      if (m) m.remove();
    }

    // Sidebar navigation
    document.querySelectorAll('.explorer-sidebar-item').forEach(function (item) {
      item.addEventListener('click', function () {
        renderDir(this.getAttribute('data-path'));
      });
    });

    // New folder button
    document.getElementById('explorer-new-folder').addEventListener('click', function () {
      var name = prompt('Folder name:');
      if (name) {
        vfs.mkdir(currentPath + '/' + name);
        notify('Folder Created', name, 'success');
        renderDir(currentPath);
      }
    });

    renderDir('/');
  }

  /* -------------------------------------------------------
     APP: STICKY NOTES
  ------------------------------------------------------- */
  function initStickyNotes() {
    var STORAGE_KEY = 'pixelos-notes';
    var container = document.getElementById('sticky-notes-container');
    if (!container) return;

    var colors = ['yellow', 'pink', 'green', 'blue', 'purple'];
    var colorHex = { yellow: '#fef3c7', pink: '#fce7f3', green: '#d1fae5', blue: '#dbeafe', purple: '#ede9fe' };

    function loadNotes() {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          var notes = JSON.parse(saved);
          notes.forEach(function (n) { createNote(n.text, n.color, n.x, n.y, false); });
        } catch (e) {}
      }
    }

    function saveNotes() {
      var notes = [];
      document.querySelectorAll('.sticky-note').forEach(function (el) {
        notes.push({
          text: el.querySelector('.sticky-note-text').value,
          color: el.classList.contains('yellow') ? 'yellow' :
                 el.classList.contains('pink') ? 'pink' :
                 el.classList.contains('green') ? 'green' :
                 el.classList.contains('blue') ? 'blue' : 'purple',
          x: parseInt(el.style.left),
          y: parseInt(el.style.top),
        });
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }

    function createNote(text, color, x, y, shouldSave) {
      if (!container) return;
      if (x === undefined) x = 40 + Math.random() * 200;
      if (y === undefined) y = 40 + Math.random() * 200;
      color = color || 'yellow';
      text = text || '';

      var note = document.createElement('div');
      note.className = 'sticky-note ' + color;
      note.style.left = x + 'px';
      note.style.top = y + 'px';
      note.innerHTML =
        '<div class="sticky-note-header">' +
          '<div class="sticky-note-colorbar">' +
            colors.map(function (c) { return '<span class="sticky-color-dot" style="background:' + colorHex[c] + '" data-color="' + c + '"></span>'; }).join('') +
          '</div>' +
          '<button class="sticky-note-close">&times;</button>' +
        '</div>' +
        '<textarea class="sticky-note-text">' + text + '</textarea>';
      container.appendChild(note);

      // Color switcher
      note.querySelectorAll('.sticky-color-dot').forEach(function (dot) {
        dot.addEventListener('click', function () {
          var newColor = this.getAttribute('data-color');
          colors.forEach(function (c) { note.classList.remove(c); });
          note.classList.add(newColor);
          saveNotes();
        });
      });

      // Close button
      note.querySelector('.sticky-note-close').addEventListener('click', function () {
        note.remove();
        saveNotes();
      });

      // Auto-save on text input
      note.querySelector('.sticky-note-text').addEventListener('input', saveNotes);

      // Drag
      var header = note.querySelector('.sticky-note-header');
      var isDragging = false, startX, startY, origX, origY;

      header.addEventListener('mousedown', function (e) {
        if (e.target.classList.contains('sticky-color-dot') || e.target.classList.contains('sticky-note-close')) return;
        isDragging = true;
        var rect = note.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        origX = rect.left;
        origY = rect.top;
        e.preventDefault();

        function onMove(ev) {
          if (!isDragging) return;
          note.style.left = (origX + ev.clientX - startX) + 'px';
          note.style.top = (origY + ev.clientY - startY) + 'px';
        }

        function onUp() {
          isDragging = false;
          saveNotes();
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });

      if (shouldSave !== false) saveNotes();
      return note;
    }

    // New note button
    var btn = document.createElement('button');
    btn.id = 'new-note-btn';
    btn.textContent = '+';
    btn.title = 'New Sticky Note';
    btn.addEventListener('click', function () { createNote('', 'yellow', undefined, undefined, true); });
    document.body.appendChild(btn);

    loadNotes();
  }

  /* -------------------------------------------------------
     APP: PIXEL SNAKE
  ------------------------------------------------------- */
  function initSnake() {
    var canvas = document.getElementById('snake-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    var GRID = 15;
    var CELL = canvas.width / GRID;
    var snake = [];
    var food = {};
    var direction = 'right';
    var nextDirection = 'right';
    var score = 0;
    var best = parseInt(localStorage.getItem('pixelos-snake-best') || '0');
    var gameOver = false;
    var gameLoop = null;
    var speed = 150;

    document.getElementById('snake-best').textContent = best;

    function init() {
      snake = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }];
      direction = 'right';
      nextDirection = 'right';
      score = 0;
      gameOver = false;
      speed = 150;
      document.getElementById('snake-score').textContent = '0';
      spawnFood();
      draw();
      if (gameLoop) clearInterval(gameLoop);
      gameLoop = setInterval(update, speed);
    }

    function spawnFood() {
      var free = [];
      for (var x = 0; x < GRID; x++) {
        for (var y = 0; y < GRID; y++) {
          var occupied = false;
          for (var i = 0; i < snake.length; i++) {
            if (snake[i].x === x && snake[i].y === y) { occupied = true; break; }
          }
          if (!occupied) free.push({ x: x, y: y });
        }
      }
      if (free.length > 0) {
        food = free[Math.floor(Math.random() * free.length)];
      }
    }

    function update() {
      if (gameOver) return;
      direction = nextDirection;
      var head = { x: snake[0].x, y: snake[0].y };
      switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
      }

      // Wall wrap
      if (head.x < 0) head.x = GRID - 1;
      if (head.x >= GRID) head.x = 0;
      if (head.y < 0) head.y = GRID - 1;
      if (head.y >= GRID) head.y = 0;

      // Self collision (check from index 1 to skip the tail that might move)
      for (var i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
          endGame();
          return;
        }
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        score++;
        document.getElementById('snake-score').textContent = score;
        if (score > best) {
          best = score;
          localStorage.setItem('pixelos-snake-best', String(best));
          document.getElementById('snake-best').textContent = best;
        }
        spawnFood();
        // Speed up
        if (speed > 60) {
          speed -= 3;
          clearInterval(gameLoop);
          gameLoop = setInterval(update, speed);
        }
      } else {
        snake.pop();
      }

      draw();
    }

    function endGame() {
      gameOver = true;
      clearInterval(gameLoop);
      notify('Snake Game Over', 'Score: ' + score + ' | Best: ' + best, 'warning');
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.5;
      for (var i = 0; i <= GRID; i++) {
        ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke();
      }
      // Snake
      for (var i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 ? '#34d399' : '#10b981';
        var padding = i === 0 ? 1 : 2;
        ctx.fillRect(snake[i].x * CELL + padding, snake[i].y * CELL + padding, CELL - padding * 2, CELL - padding * 2);
        if (i === 0) {
          // Eyes
          ctx.fillStyle = '#000';
          var ex = snake[i].x * CELL + (direction === 'right' ? CELL - 7 : direction === 'left' ? 3 : CELL / 2 - 2);
          var ey = snake[i].y * CELL + (direction === 'up' ? 3 : direction === 'down' ? CELL - 7 : CELL / 2 - 2);
          ctx.fillRect(ex, ey, 3, 3);
        }
      }
      // Food
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(food.x * CELL + CELL/2 - 2, food.y * CELL + 2, 4, 3);

      // Game over overlay
      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ef4444';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 10);
        ctx.fillStyle = '#aaa';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText('press RESTART', canvas.width/2, canvas.height/2 + 16);
      }
    }

    // Controls
    document.addEventListener('keydown', function (e) {
      var key = e.key;
      if (['ArrowUp', 'w', 'W'].includes(key) && direction !== 'down') nextDirection = 'up';
      if (['ArrowDown', 's', 'S'].includes(key) && direction !== 'up') nextDirection = 'down';
      if (['ArrowLeft', 'a', 'A'].includes(key) && direction !== 'right') nextDirection = 'left';
      if (['ArrowRight', 'd', 'D'].includes(key) && direction !== 'left') nextDirection = 'right';
    });

    document.getElementById('snake-restart').addEventListener('click', function () {
      if (gameLoop) clearInterval(gameLoop);
      init();
    });

    init();
  }

  /* -------------------------------------------------------
     APP: TIMER / STOPWATCH
  ------------------------------------------------------- */
  function initTimer() {
    var display = document.getElementById('timer-display');
    var startBtn = document.getElementById('timer-start');
    var lapBtn = document.getElementById('timer-lap');
    var resetBtn = document.getElementById('timer-reset');
    var lapsEl = document.getElementById('timer-laps');
    var presets = document.querySelectorAll('.timer-preset-btn');
    var customMin = document.getElementById('timer-custom-min');
    if (!display || !startBtn) return;

    var mode = 'stopwatch';
    var running = false;
    var startTime = 0;
    var elapsed = 0;
    var lapCount = 0;
    var timerInterval = null;
    var countdownTarget = 0;

    function formatTime(ms) {
      var totalSec = Math.floor(ms / 1000);
      var min = Math.floor(totalSec / 60);
      var sec = totalSec % 60;
      var tenth = Math.floor((ms % 1000) / 100);
      return String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0') + '.' + tenth;
    }

    function updateDisplay() {
      if (running) {
        var now = Date.now();
        if (mode === 'stopwatch') {
          elapsed = now - startTime;
        } else {
          elapsed = countdownTarget - (now - startTime);
          if (elapsed <= 0) {
            elapsed = 0;
            running = false;
            clearInterval(timerInterval);
            startBtn.textContent = '▶ START';
            notify('Timer Done', 'Countdown finished!', 'success');
          }
        }
      }
      display.textContent = formatTime(elapsed);
    }

    function startTimer() {
      if (mode === 'stopwatch') {
        startTime = Date.now() - elapsed;
      } else {
        if (elapsed <= 0) return;
        startTime = Date.now() - (countdownTarget - elapsed);
      }
      running = true;
      startBtn.textContent = '⏸ PAUSE';
      lapBtn.disabled = (mode === 'stopwatch') ? false : true;
      timerInterval = setInterval(updateDisplay, 100);
    }

    function pauseTimer() {
      running = false;
      clearInterval(timerInterval);
      startBtn.textContent = '▶ RESUME';
    }

    function resetTimer() {
      running = false;
      clearInterval(timerInterval);
      elapsed = 0;
      countdownTarget = 0;
      lapCount = 0;
      startBtn.textContent = '▶ START';
      display.textContent = '00:00.0';
      if (lapsEl) lapsEl.innerHTML = '';
      startBtn.disabled = false;
    }

    function setCountdown(minutes) {
      if (running) pauseTimer();
      mode = 'countdown';
      countdownTarget = minutes * 60 * 1000;
      elapsed = countdownTarget;
      display.textContent = formatTime(elapsed);
      document.querySelectorAll('.timer-mode-btn').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-mode') === 'countdown');
      });
    }

    // Mode toggle
    document.querySelectorAll('.timer-mode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (running) pauseTimer();
        mode = this.getAttribute('data-mode');
        document.querySelectorAll('.timer-mode-btn').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        resetTimer();
      });
    });

    startBtn.addEventListener('click', function () {
      if (running) {
        pauseTimer();
      } else {
        if (mode === 'countdown' && elapsed <= 0) return;
        startTimer();
      }
    });

    lapBtn.addEventListener('click', function () {
      if (mode !== 'stopwatch' || !running) return;
      lapCount++;
      var li = document.createElement('div');
      li.className = 'timer-lap-item';
      li.innerHTML = '<span>Lap ' + lapCount + '</span><span>' + formatTime(elapsed) + '</span>';
      if (lapsEl) lapsEl.appendChild(li);
    });

    resetBtn.addEventListener('click', resetTimer);

    // Presets
    presets.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var min = parseInt(this.getAttribute('data-minutes'));
        setCountdown(min);
      });
    });

    customMin.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var val = parseInt(this.value);
        if (val && val > 0) setCountdown(val);
      }
    });
  }

  /* -------------------------------------------------------
     APP: TERMINAL
  ------------------------------------------------------- */
  function initTerminal() {
    var output = document.getElementById('terminal-output');
    var input = document.getElementById('terminal-input');
    var prompt = document.getElementById('terminal-prompt');
    if (!output || !input) return;

    var hist = [];
    var histIdx = -1;

    function writeLine(text, cls) {
      var line = document.createElement('div');
      line.className = 'term-line' + (cls ? ' ' + cls : '');
      line.innerHTML = text;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    }

    function processCommand(cmd) {
      var parts = cmd.trim().split(/\s+/);
      var command = parts[0].toLowerCase();
      var args = parts.slice(1);

      switch (command) {
        case 'help':
          writeLine('Available commands:');
          writeLine('  ls [path]       - list directory contents');
          writeLine('  cd &lt;path&gt;       - change directory');
          writeLine('  pwd             - print working directory');
          writeLine('  mkdir &lt;name&gt;   - create directory');
          writeLine('  touch &lt;name&gt;   - create empty file');
          writeLine('  rm &lt;name&gt;      - remove file/directory');
          writeLine('  cat &lt;file&gt;     - view file contents');
          writeLine('  echo &lt;text&gt;    - print text');
          writeLine('  clear           - clear terminal');
          writeLine('  date            - show current date/time');
          writeLine('  whoami          - show current user');
          writeLine('  neofetch        - show system info');
          writeLine('  help            - this help message');
          break;

        case 'ls': {
          var path = args[0] || vfs.getPath();
          var fullPath = vfs.normalize(path);
          var items = vfs.ls(fullPath);
          if (items.length === 0) {
            writeLine('(empty directory)');
          } else {
            items.forEach(function (item) {
              var icon = item.node.type === 'dir' ? '📁' : '📄';
              writeLine(icon + ' ' + item.name + (item.node.type === 'dir' ? '/' : ''));
            });
          }
          break;
        }

        case 'cd':
          if (!args[0]) {
            vfs.setPath('/');
          } else {
            var target = vfs.normalize(args[0]);
            var r = vfs.resolve(target);
            if (r && r.node.type === 'dir') {
              vfs.setPath(target);
            } else {
              writeLine('cd: ' + args[0] + ': No such directory');
            }
          }
          break;

        case 'pwd':
          writeLine(vfs.getPath());
          break;

        case 'mkdir':
          if (!args[0]) { writeLine('mkdir: missing operand'); break; }
          if (vfs.mkdir(vfs.normalize(vfs.getPath() + '/' + args[0]))) {
            notify('Directory Created', args[0], 'success');
          } else {
            writeLine('mkdir: cannot create directory "' + args[0] + '": already exists');
          }
          break;

        case 'touch':
          if (!args[0]) { writeLine('touch: missing operand'); break; }
          vfs.touch(vfs.normalize(vfs.getPath() + '/' + args[0]));
          notify('File Created', args[0], 'success');
          break;

        case 'rm':
          if (!args[0]) { writeLine('rm: missing operand'); break; }
          if (vfs.rm(vfs.normalize(vfs.getPath() + '/' + args[0]))) {
            notify('Removed', args[0], 'warning');
          } else {
            writeLine('rm: cannot remove "' + args[0] + '": not found');
          }
          break;

        case 'cat':
          if (!args[0]) { writeLine('cat: missing operand'); break; }
          var content = vfs.read(vfs.normalize(vfs.getPath() + '/' + args[0]));
          if (content !== null) {
            writeLine(content);
          } else {
            writeLine('cat: ' + args[0] + ': No such file');
          }
          break;

        case 'echo':
          writeLine(args.join(' '));
          break;

        case 'clear':
          output.innerHTML = '';
          break;

        case 'date':
          writeLine(new Date().toString());
          break;

        case 'whoami':
          writeLine('guest');
          break;

        case 'neofetch': {
          var logo = [
            '  ┌─────────────────────────────┐',
            '  │  █████╗ ██╗██╗  ██╗███████╗██╗     ██████╗ ███████╗  │',
            '  │  ██╔══██╗██║╚██╗██╔╝██╔════╝██║    ██╔═══██╗██╔════╝  │',
            '  │  ██████╔╝██║ ╚███╔╝ █████╗  ██║    ██║   ██║███████╗  │',
            '  │  ██╔═══╝ ██║ ██╔██╗ ██╔══╝  ██║    ██║   ██║╚════██║  │',
            '  │  ██║     ██║██╔╝ ██╗███████╗███████╗╚██████╔╝███████║  │',
            '  │  ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚══════╝  │',
            '  └─────────────────────────────┘',
          ];
          var html = '<div class="neofetch-wrap">';
          logo.forEach(function (line) {
            html += '<div class="term-line" style="color:#00ff41;font-size:10px;line-height:1.3;letter-spacing:1px;">' + line + '</div>';
          });
          html += '<div class="neofetch-scan"></div></div>';
          html += '<div class="term-line" style="color:rgba(0,255,65,0.3);font-size:8px;line-height:1.5;">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>';

          var bootTime = Math.floor((Date.now() - performance.now()) / 1000);
          var info = [
            ['OS', 'PixelOS v1.0'],
            ['Host', 'Hack Club Stardance'],
            ['Kernel', 'JavaScript ES6'],
            ['Uptime', bootTime + 's'],
            ['Shell', 'pixel-sh v1.0'],
            ['Resolution', window.innerWidth + 'x' + window.innerHeight],
            ['Theme', document.body.getAttribute('data-theme') || 'day'],
            ['Terminal', 'pixel-term v1.0'],
          ];
          info.forEach(function (pair) {
            html += '<div class="term-line" style="font-size:11px;line-height:1.6;color:rgba(0,255,65,0.5);">' +
              '<span style="color:rgba(0,255,65,0.35);width:100px;display:inline-block;">' + pair[0] + '</span>' +
              '<span style="color:#fff;">' + pair[1] + '</span></div>';
          });
          html += '<div class="term-line" style="color:rgba(0,255,65,0.3);font-size:8px;line-height:1.5;">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>';

          var line = document.createElement('div');
          line.className = 'term-line';
          line.innerHTML = html;
          output.appendChild(line);
          output.scrollTop = output.scrollHeight;
          break;
        }

        case '':
          break;

        default:
          writeLine(command + ': command not found. Type "help" for available commands.');
      }
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var cmd = input.value;
        var pwd = vfs.getPath();
        if (prompt) prompt.textContent = 'guest@PixelOS:' + pwd + '$';
        writeLine('<span style="color:#888">' + prompt.textContent + '</span> ' + cmd);
        processCommand(cmd);
        if (cmd.trim()) {
          hist.push(cmd);
          histIdx = hist.length;
        }
        input.value = '';
        output.scrollTop = output.scrollHeight;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (hist.length > 0 && histIdx > 0) {
          histIdx--;
          input.value = hist[histIdx];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (histIdx < hist.length - 1) {
          histIdx++;
          input.value = hist[histIdx];
        } else {
          histIdx = hist.length;
          input.value = '';
        }
      }
    });
  }

  /* -------------------------------------------------------
     INIT
  ------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    renderAllSprites();
    initBootScreen();
    updateClock();
    initParticles();
    initRain();
    initDrag();
    initWindowControls();
    initWindowResize();
    initStartMenu();
    initDock();
    initDesktopIcons();
    initLofi();
    initDiary();
    initPixelEditor();
    initBrowser();
    initDesktopSearch();
    initCalc();
    initClockWidget();
    initCalendarWidget();
    initSettings();
    initExplorer();
    initStickyNotes();
    initSnake();
    initTimer();
    initTerminal();
    setInterval(updateClock, 1000);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    window.addEventListener('resize', handleResize);

    // Attach resize move/end to document
    document.addEventListener('mousemove', function (e) {
      handleResizeMove(e);
    });
    document.addEventListener('mouseup', function () {
      resizeState = null;
    });
  });

})();
