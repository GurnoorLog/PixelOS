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
    var display = document.getElementById('calc-display');
    var sub = document.getElementById('calc-sub');
    if (!display) return;

    var current = '0';
    var prev = '';
    var operation = null;
    var resetNext = false;

    function updateDisplay() {
      display.textContent = current.length > 14 ? parseFloat(current).toExponential(4) : current;
    }

    function updateSub(text) {
      if (sub) sub.textContent = text || '';
    }

    function handleButton(val) {
      if (val === 'C') {
        current = '0';
        prev = '';
        operation = null;
        resetNext = false;
        updateSub('');
        updateDisplay();
        return;
      }

      if (val === '±') {
        current = String(parseFloat(current) * -1);
        updateDisplay();
        return;
      }

      if (val === '%') {
        current = String(parseFloat(current) / 100);
        updateDisplay();
        return;
      }

      if (val === '=') {
        if (!operation || !prev) return;
        var result = calculate(parseFloat(prev), parseFloat(current), operation);
        updateSub(prev + ' ' + opSymbol(operation) + ' ' + current + ' =');
        current = String(result);
        operation = null;
        prev = '';
        resetNext = true;
        updateDisplay();
        return;
      }

      if (['+', '-', '×', '÷'].indexOf(val) !== -1) {
        if (operation && !resetNext) {
          prev = String(calculate(parseFloat(prev), parseFloat(current), operation));
          current = '0';
          updateDisplay();
          updateSub(prev + ' ' + opSymbol(val));
          operation = val;
          return;
        }
        prev = current;
        operation = val;
        resetNext = false;
        updateSub(current + ' ' + opSymbol(val));
        return;
      }

      // Number or decimal
      if (resetNext) {
        current = '0';
        resetNext = false;
        updateSub('');
      }

      if (val === '.') {
        if (current.indexOf('.') === -1) current += '.';
      } else {
        if (current === '0') current = '';
        current += val;
      }
      updateDisplay();
    }

    function calculate(a, b, op) {
      switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '×': return a * b;
        case '÷': return b !== 0 ? a / b : 'ERR';
      }
      return b;
    }

    function opSymbol(op) {
      return op;
    }

    document.querySelectorAll('.calc-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var val = this.getAttribute('data-v');
        if (val) handleButton(val);
      });
    });
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
    var loader = document.getElementById('boot-loader');
    var msg = document.getElementById('boot-msg');
    if (!boot) return;
    var messages = [
      'initializing pixel engine...',
      'mounting glass filesystem...',
      'loading sprite database...',
      'calibrating blur kernels...',
      'warming up neon tubes...',
      'PixelOS ready.'
    ];
    var progress = 0;
    var msgIdx = 0;
    var interval = setInterval(function () {
      progress += 8 + Math.floor(Math.random() * 12);
      if (loader) loader.style.width = Math.min(progress, 100) + '%';
      if (progress >= 20 && msgIdx === 0) { msgIdx = 1; if (msg) msg.textContent = messages[1]; }
      if (progress >= 40 && msgIdx === 1) { msgIdx = 2; if (msg) msg.textContent = messages[2]; }
      if (progress >= 55 && msgIdx === 2) { msgIdx = 3; if (msg) msg.textContent = messages[3]; }
      if (progress >= 75 && msgIdx === 3) { msgIdx = 4; if (msg) msg.textContent = messages[4]; }
      if (progress >= 95 && msgIdx === 4) { msgIdx = 5; if (msg) msg.textContent = messages[5]; }
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(function () {
          boot.classList.add('done');
        }, 400);
      }
    }, 200);
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
        t.closest('select') || t.closest('iframe') || t.closest('.dock-icon')) return;
    createSparkles(e.clientX, e.clientY);
  });

  /* -------------------------------------------------------
     ACTIVE WINDOW GLOW — update bringToFront
  ------------------------------------------------------- */
  // Override the original bringToFront to add glow effect
  var origBringToFront = bringToFront;
  bringToFront = function (win) {
    document.querySelectorAll('.window').forEach(function (w) {
      w.classList.remove('active-glow');
    });
    if (win) {
      win.classList.add('active-glow');
      origBringToFront(win);
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
