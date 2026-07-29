/**
 * Progreso, logros, racha, maestro, accesibilidad y resumen semanal
 */
(function (global) {
  const TEACHER_KEY = "comprension-galactica-teacher";
  const DEFAULT_PIN = "2024";

  function freshMeta() {
    return {
      completed: { readings: {}, games: {}, ritmo: [], seasonal: [], videos: {} },
      stats: { correct: 0, readingsDone: 0, gamesDone: 0, cpEarned: 0 },
      achievements: [],
      claimedAchievements: [],
      streak: { count: 0, lastDate: null },
      weeklyLog: {},
      settings: { dyslexia: false, highContrast: false, tts: false, ttsSpeed: 1.0, ttsVolume: 1.0, sfxVolume: 1.0, fontSize: "normal" },
      questionFails: {},
    };
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function weekKey(d) {
    const date = d || new Date();
    const onejan = new Date(date.getFullYear(), 0, 1);
    const millis = date - onejan;
    const week = Math.ceil((millis / 86400000 + onejan.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${week}`;
  }

  function getTeacherSettings() {
    try {
      return JSON.parse(localStorage.getItem(TEACHER_KEY)) || { pin: DEFAULT_PIN };
    } catch (_) {
      return { pin: DEFAULT_PIN };
    }
  }

  function setTeacherPin(pin) {
    localStorage.setItem(TEACHER_KEY, JSON.stringify({ pin: String(pin) }));
  }

  function verifyTeacherPin(pin) {
    return String(pin) === getTeacherSettings().pin;
  }

  function countAllReadings(meta) {
    let n = 0;
    Object.values(meta.completed?.readings || {}).forEach((arr) => {
      n += (arr || []).length;
    });
    return n;
  }

  function countAllGames(meta) {
    let n = 0;
    Object.values(meta.completed?.games || {}).forEach((arr) => {
      n += (arr || []).length;
    });
    return n;
  }

  function syncStatsFromCompleted(meta) {
    const readings = countAllReadings(meta);
    const games = countAllGames(meta);
    meta.stats.readingsDone = Math.max(meta.stats.readingsDone || 0, readings);
    meta.stats.gamesDone = Math.max(meta.stats.gamesDone || 0, games);
  }

  /** Repara perfiles viejos o incompletos para que medallas y contadores cuadren */
  function normalizeMeta(meta) {
    if (!meta) return freshMeta();
    if (!meta.completed) {
      meta.completed = { readings: {}, games: {}, ritmo: [], seasonal: [], videos: {} };
    }
    if (!meta.completed.readings) meta.completed.readings = {};
    if (!meta.completed.games) meta.completed.games = {};
    if (!Array.isArray(meta.completed.ritmo)) meta.completed.ritmo = [];
    if (!Array.isArray(meta.completed.seasonal)) meta.completed.seasonal = [];
    if (!meta.completed.videos) meta.completed.videos = {};
    if (!meta.stats) {
      meta.stats = { correct: 0, readingsDone: 0, gamesDone: 0, cpEarned: 0 };
    } else {
      meta.stats.correct = meta.stats.correct || 0;
      meta.stats.readingsDone = meta.stats.readingsDone || 0;
      meta.stats.gamesDone = meta.stats.gamesDone || 0;
      meta.stats.cpEarned = meta.stats.cpEarned || 0;
    }
    if (!Array.isArray(meta.achievements)) meta.achievements = [];
    if (!Array.isArray(meta.claimedAchievements)) meta.claimedAchievements = [];
    if (!meta.streak) meta.streak = { count: 0, lastDate: null };
    if (!meta.weeklyLog) meta.weeklyLog = {};
    if (!meta.settings) meta.settings = {};
    meta.settings.dyslexia = !!meta.settings.dyslexia;
    meta.settings.highContrast = !!meta.settings.highContrast;
    meta.settings.tts = !!meta.settings.tts;
    meta.settings.ttsSpeed = typeof meta.settings.ttsSpeed === "number" ? meta.settings.ttsSpeed : 1.0;
    meta.settings.ttsVolume = typeof meta.settings.ttsVolume === "number" ? meta.settings.ttsVolume : 1.0;
    meta.settings.sfxVolume = typeof meta.settings.sfxVolume === "number" ? meta.settings.sfxVolume : 1.0;
    meta.settings.fontSize = meta.settings.fontSize || "normal";
    if (!meta.questionFails) meta.questionFails = {};
    syncStatsFromCompleted(meta);
    return meta;
  }

  function ensureGradeBucket(completed, type, grade) {
    const g = String(grade);
    if (!completed[type][g]) completed[type][g] = [];
    return completed[type][g];
  }

  function markComplete(meta, type, grade, id) {
    normalizeMeta(meta);
    if (type === "ritmo" || type === "seasonal") {
      if (!meta.completed[type].includes(id)) meta.completed[type].push(id);
      return true;
    }
    const bucket = ensureGradeBucket(meta.completed, type, grade);
    if (bucket.includes(id)) return false;
    bucket.push(id);
    if (type === "readings") meta.stats.readingsDone++;
    if (type === "games") meta.stats.gamesDone++;
    if (type === "videos") meta.stats.videosDone = (meta.stats.videosDone || 0) + 1;
    syncStatsFromCompleted(meta);
    return true;
  }

  function isComplete(meta, type, grade, id) {
    if (type === "ritmo" || type === "seasonal") return meta.completed[type].includes(id);
    const g = String(grade);
    return (meta.completed[type][g] || []).includes(id);
  }

  function countCompleted(meta, type, grade, total) {
    if (type === "ritmo") return meta.completed.ritmo.length;
    const g = String(grade);
    const n = (meta.completed[type][g] || []).length;
    return total != null ? `${n}/${total}` : n;
  }

  function recordCorrect(meta, cpAmount) {
    meta.stats.correct++;
    logWeekly(meta, { correct: 1, cp: cpAmount || 0 });
  }

  function recordCpEarned(meta, amount) {
    meta.stats.cpEarned += amount;
    logWeekly(meta, { cp: amount });
  }

  function logWeekly(meta, patch) {
    const wk = weekKey();
    if (!meta.weeklyLog[wk]) {
      meta.weeklyLog[wk] = { cp: 0, readings: 0, games: 0, correct: 0, days: {} };
    }
    const log = meta.weeklyLog[wk];
    const day = todayKey();
    if (!log.days[day]) log.days[day] = true;
    if (patch.cp) log.cp += patch.cp;
    if (patch.readings) log.readings += patch.readings;
    if (patch.games) log.games += patch.games;
    if (patch.correct) log.correct += patch.correct;
  }

  function getWeeklySummary(meta) {
    const wk = weekKey();
    const log = meta.weeklyLog[wk] || { cp: 0, readings: 0, games: 0, correct: 0, days: {} };
    return {
      cp: log.cp,
      readings: log.readings,
      games: log.games,
      correct: log.correct,
      activeDays: Object.keys(log.days).length,
      streak: meta.streak.count,
    };
  }

  function updateStreak(meta) {
    const today = todayKey();
    const last = meta.streak.lastDate;
    if (last === today) return { updated: false, bonus: 0, streak: meta.streak.count };
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().slice(0, 10);
    if (last === yKey) meta.streak.count++;
    else meta.streak.count = 1;
    meta.streak.lastDate = today;
    let bonus = 5;
    if (meta.streak.count >= 3 && meta.streak.count % 3 === 0) bonus += 10;
    return { updated: true, bonus, streak: meta.streak.count };
  }

  function recordQuestionFail(meta, key) {
    meta.questionFails[key] = (meta.questionFails[key] || 0) + 1;
    return meta.questionFails[key];
  }

  function clearQuestionFail(meta, key) {
    delete meta.questionFails[key];
  }

  function checkAchievements(meta, APP_DATA) {
    normalizeMeta(meta);
    const defs = APP_DATA.ACHIEVEMENTS || [];
    const unlocked = [];
    defs.forEach((a) => {
      if (meta.achievements.includes(a.id)) return;
      try {
        if (a.check(meta)) {
          meta.achievements.push(a.id);
          unlocked.push(a);
        }
      } catch (err) {
        console.warn("Logro no evaluado:", a.id, err);
      }
    });
    return unlocked;
  }

  function getGalacticRank(cp) {
    const points = Number(cp) || 0;
    if (points >= 1000) return { title: "Maestro del Universo", icon: "👑", level: 5, nextCp: null, minCp: 1000 };
    if (points >= 600) return { title: "Comandante Galáctico", icon: "🌌", level: 4, nextCp: 1000, minCp: 600 };
    if (points >= 300) return { title: "Piloto de Estrellas", icon: "🚀", level: 3, nextCp: 600, minCp: 300 };
    if (points >= 100) return { title: "Explorador Órbita", icon: "🛰️", level: 2, nextCp: 300, minCp: 100 };
    return { title: "Novato Estelar", icon: "🧑‍🚀", level: 1, nextCp: 100, minCp: 0 };
  }

  function getUserLevel(cp) {
    const points = Math.max(0, Number(cp) || 0);
    const level = Math.min(50, Math.floor(points / 100) + 1);
    const currentXp = points % 100;
    const nextLevelXp = 100;
    const progressPercent = level >= 50 ? 100 : Math.min(100, Math.round((currentXp / nextLevelXp) * 100));
    return { level, currentXp, nextLevelXp, progressPercent };
  }

  function getActivityLevel(index, total) {
    const idx = Number(index) || 0;
    const tot = Math.max(1, Number(total) || 1);
    const ratio = idx / tot;
    if (ratio < 0.34) return { level: 1, label: "Nivel 1 — Fácil", icon: "🟢", color: "#44ff88" };
    if (ratio < 0.67) return { level: 2, label: "Nivel 2 — Intermedio", icon: "🟡", color: "#ffe844" };
    return { level: 3, label: "Nivel 3 — Avanzado", icon: "🔴", color: "#ff4466" };
  }

  function exportStudentDataCSV(meta, studentName) {
    normalizeMeta(meta);
    const name = studentName || "Estudiante";
    const rank = getGalacticRank(meta.stats.cpEarned || 0);
    const summary = getWeeklySummary(meta);

    let csv = "REPORTE DE PROGRESO - COMPRENSION GALACTICA\n";
    csv += `Estudiante,${name}\n`;
    csv += `Fecha de Exportación,${new Date().toLocaleDateString("es-MX")}\n`;
    csv += `Puntos Totales (CP),${meta.stats.cpEarned || 0}\n`;
    csv += `Rango Galáctico,${rank.title}\n`;
    csv += `Aciertos Totales,${meta.stats.correct || 0}\n`;
    csv += `Lecturas Completadas,${meta.stats.readingsDone || 0}\n`;
    csv += `Juegos Completados,${meta.stats.gamesDone || 0}\n`;
    csv += `Racha Actual (Días),${meta.streak.count || 0}\n`;
    csv += `Días Activos esta Semana,${summary.activeDays}\n\n`;

    csv += "HISTORIAL DE ERRORES REGISTRADOS\n";
    csv += "ID / Referencia de Pregunta,Cantidad de Errores\n";
    const fails = meta.questionFails || {};
    const failKeys = Object.keys(fails);
    if (failKeys.length === 0) {
      csv += "Ningún error registrado,Excelente progreso\n";
    } else {
      failKeys.forEach((k) => {
        csv += `"${k}",${fails[k]}\n`;
      });
    }

    return csv;
  }

  function exportBackupJSON(meta, studentName) {
    normalizeMeta(meta);
    const payload = {
      version: "2.0",
      exportDate: new Date().toISOString(),
      studentName: studentName || "Estudiante",
      meta: meta,
    };
    return JSON.stringify(payload, null, 2);
  }

  function importBackupJSON(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.meta) {
        return { success: true, meta: normalizeMeta(parsed.meta), studentName: parsed.studentName || "" };
      }
      if (parsed && parsed.completed) {
        return { success: true, meta: normalizeMeta(parsed), studentName: "" };
      }
      return { success: false, error: "Formato de archivo no válido." };
    } catch (e) {
      return { success: false, error: "Error al leer el archivo JSON." };
    }
  }

  function getFailDiagnostics(meta) {
    normalizeMeta(meta);
    const fails = meta.questionFails || {};
    const items = Object.entries(fails).map(([key, count]) => ({ key, count }));
    items.sort((a, b) => b.count - a.count);
    return items;
  }

  function applyAccessibility(settings) {
    const s = settings || {};
    document.body.classList.toggle("a11y-dyslexia", !!s.dyslexia);
    document.body.classList.toggle("a11y-high-contrast", !!s.highContrast);
    document.body.classList.toggle("a11y-font-large", s.fontSize === "large");
    document.body.classList.toggle("a11y-font-xlarge", s.fontSize === "xlarge");
  }

  // --- CACHE DE VOCES Y DESBLOQUEO DE AUDIO / VOZ EN MÓVILES ---
  let cachedVoices = [];
  function populateVoices() {
    if (global.speechSynthesis && typeof global.speechSynthesis.getVoices === "function") {
      cachedVoices = global.speechSynthesis.getVoices() || [];
    }
  }

  if (global.speechSynthesis) {
    populateVoices();
    if (typeof global.speechSynthesis.onvoiceschanged !== "undefined") {
      global.speechSynthesis.onvoiceschanged = populateVoices;
    }
  }

  // Prevención de Garbage Collection de Utterances en Chromium / Android WebView
  global._activeUtterances = global._activeUtterances || [];
  let speechKeepAliveInterval = null;

  function stopSpeech() {
    if (speechKeepAliveInterval) {
      clearInterval(speechKeepAliveInterval);
      speechKeepAliveInterval = null;
    }
    if (global.speechSynthesis) {
      try {
        global.speechSynthesis.cancel();
      } catch (e) {}
    }
    global._activeUtterances = [];
  }

  let htmlAudioFallback = null;
  function speakWithHtmlAudio(text, onEnd) {
    try {
      if (htmlAudioFallback) {
        htmlAudioFallback.pause();
        htmlAudioFallback = null;
      }
      const clean = encodeURIComponent(text.slice(0, 200));
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${clean}&tl=es&client=tw-ob`;
      htmlAudioFallback = new Audio(url);
      htmlAudioFallback.onended = () => {
        if (onEnd) onEnd();
      };
      htmlAudioFallback.onerror = () => {
        if (onEnd) onEnd();
      };
      const playPromise = htmlAudioFallback.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (onEnd) onEnd();
        });
      }
      return true;
    } catch (e) {
      if (onEnd) onEnd();
      return false;
    }
  }

  function speakText(text, enabled, voicePref, onEndCallback, options) {
    if (!enabled) return false;

    const opts = typeof options === "object" && options !== null ? options : {};
    const ttsSpeed = opts.speed != null ? opts.speed : 1.0;
    const ttsVolume = opts.volume != null ? opts.volume : 1.0;
    const boundaryCb = opts.onBoundary || null;
    
    // Si ya se está reproduciendo algo, detener (efecto toggle)
    if (global.speechSynthesis && (global.speechSynthesis.speaking || global.speechSynthesis.pending || (htmlAudioFallback && !htmlAudioFallback.paused))) {
      stopSpeech();
      if (htmlAudioFallback) {
        htmlAudioFallback.pause();
        htmlAudioFallback = null;
      }
      if (onEndCallback) onEndCallback();
      return false;
    }
    
    stopSpeech();

    const cleanText = (text || "").replace(/\s+/g, " ").trim();
    if (!cleanText) return false;

    // Desbloquear estado de síntesis en Android WebView si estaba pausado
    if (global.speechSynthesis) {
      if (global.speechSynthesis.paused) {
        try { global.speechSynthesis.resume(); } catch (e) {}
      }
    }

    // Dividir el texto en fragmentos (oraciones) para evitar que Android WebView TTS se congele o limite por longitud
    const chunks = cleanText
      .split(/(?<=[.!?;\n])\s+/)
      .filter((s) => s.trim().length > 0);

    if (chunks.length === 0) chunks.push(cleanText);

    if (!global.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
      return speakWithHtmlAudio(cleanText, onEndCallback);
    }

    if (cachedVoices.length === 0) populateVoices();

    let selectedVoice = null;
    const esVoices = cachedVoices.filter((v) => v.lang && v.lang.toLowerCase().startsWith("es"));

    if (esVoices.length > 0) {
      if (voicePref === "female") {
        selectedVoice = esVoices.find((v) => {
          const n = v.name.toLowerCase();
          return n.includes("female") || n.includes("mujer") || n.includes("sabina") || n.includes("google") || n.includes("monica") || n.includes("paulina");
        });
      } else if (voicePref === "male") {
        selectedVoice = esVoices.find((v) => {
          const n = v.name.toLowerCase();
          return n.includes("male") || n.includes("hombre") || n.includes("google-m") || n.includes("jorge");
        });
      }
      if (!selectedVoice) {
        selectedVoice = esVoices.find((v) => v.lang.toLowerCase() === "es-mx") ||
                        esVoices.find((v) => v.lang.toLowerCase().startsWith("es-")) ||
                        esVoices[0];
      }
    }

    let chunkIndex = 0;
    let textOffset = 0;

    function speakNextChunk() {
      if (chunkIndex >= chunks.length) {
        stopSpeech();
        if (onEndCallback) onEndCallback();
        return;
      }

      const chunkText = chunks[chunkIndex];
      const utter = new SpeechSynthesisUtterance(chunkText);
      utter.lang = (selectedVoice && selectedVoice.lang) ? selectedVoice.lang : "es-MX";
      utter.rate = Math.max(0.5, Math.min(2.0, 0.92 * ttsSpeed));
      utter.pitch = 1.0;
      utter.volume = Math.max(0.0, Math.min(1.0, ttsVolume));

      if (selectedVoice) {
        utter.voice = selectedVoice;
      }

      if (typeof boundaryCb === "function") {
        utter.onboundary = (evt) => {
          boundaryCb(textOffset + evt.charIndex, evt.charLength || 0);
        };
      }

      utter.onend = () => {
        textOffset += chunkText.length + 1;
        const idx = global._activeUtterances.indexOf(utter);
        if (idx !== -1) global._activeUtterances.splice(idx, 1);
        chunkIndex++;
        speakNextChunk();
      };

      utter.onerror = (evt) => {
        console.warn("Error en reproducción de voz TTS:", evt);
        textOffset += chunkText.length + 1;
        const idx = global._activeUtterances.indexOf(utter);
        if (idx !== -1) global._activeUtterances.splice(idx, 1);
        chunkIndex++;
        if (chunkIndex < chunks.length) {
          speakNextChunk();
        } else {
          stopSpeech();
          if (onEndCallback) onEndCallback();
        }
      };

      // Guardar en array global para evitar Garbage Collection prematuro en Android Chromium
      global._activeUtterances.push(utter);

      try {
        global.speechSynthesis.speak(utter);
      } catch (err) {
        console.warn("speechSynthesis.speak falló:", err);
        speakWithHtmlAudio(chunkText, onEndCallback);
      }
    }

    // Intervalo de reinicio de seguridad para Android Chromium bug (evita que TTS se pause tras 14 segundos)
    speechKeepAliveInterval = setInterval(() => {
      if (global.speechSynthesis) {
        if (global.speechSynthesis.speaking && !global.speechSynthesis.paused) {
          global.speechSynthesis.pause();
          global.speechSynthesis.resume();
        }
      }
    }, 10000);

    speakNextChunk();
    return true;
  }

  function buildPrintHtml(reading) {
    const qs = (reading.questions || [])
      .map(
        (q, i) =>
          `<p><strong>${i + 1}. ${q.q}</strong></p><ul>${q.options.map((o) => `<li>${o}</li>`).join("")}</ul>`
      )
      .join("");
    return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${reading.title}</title>
<style>body{font-family:Georgia,serif;max-width:720px;margin:2rem auto;line-height:1.6}
h1{font-size:1.5rem} .text{margin:1rem 0;padding:1rem;border:1px solid #ccc;white-space:pre-wrap}</style></head>
<body><h1>${reading.title}</h1><div class="text">${reading.text}</div><h2>Preguntas</h2>${qs}
<p><em>Comprensión Galáctica</em></p></body></html>`;
  }

  function printReading(reading) {
    const w = window.open("", "_blank");
    if (!w) return false;
    w.document.write(buildPrintHtml(reading));
    w.document.close();
    w.focus();
    w.print();
    return true;
  }

  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = global.AudioContext || global.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && (audioCtx.state === 'suspended' || audioCtx.state === 'interrupted')) {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playSFX(type, volumeMultiplier) {
    if (!global.AudioContext && !global.webkitAudioContext) return;
    const volMult = typeof volumeMultiplier === "number" ? volumeMultiplier : 1.0;
    if (volMult <= 0) return;

    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const playTone = () => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          const now = ctx.currentTime;
          if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
            gain.gain.setValueAtTime(0.1 * volMult, now);
            gain.gain.exponentialRampToValueAtTime(0.01 * volMult, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
          } else if (type === 'correct') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(660, now + 0.1);
            osc.frequency.setValueAtTime(880, now + 0.2);
            gain.gain.setValueAtTime(0.1 * volMult, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
          } else if (type === 'wrong') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);
            gain.gain.setValueAtTime(0.1 * volMult, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
          } else if (type === 'reward') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(554, now + 0.1);
            osc.frequency.setValueAtTime(659, now + 0.2);
            osc.frequency.setValueAtTime(880, now + 0.3);
            gain.gain.setValueAtTime(0.05 * volMult, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
          }
        } catch (err) {}
      };

      if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
        ctx.resume().then(playTone).catch(playTone);
      } else {
        playTone();
      }
    } catch (e) {}
  }

  // Rutina de desbloqueo de Audio y Voz para dispositivos móviles (iOS y Android)
  function unlockMobileMedia() {
    const unlock = () => {
      try {
        const ctx = initAudio();
        if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted')) {
          ctx.resume().catch(() => {});
        }
      } catch (e) {}

      // Activar motor de Text-To-Speech en móviles Android/iOS
      try {
        if (global.speechSynthesis) {
          if (global.speechSynthesis.paused) {
            global.speechSynthesis.resume();
          }
        }
      } catch (e) {}
    };

    ['click', 'touchstart', 'touchend', 'pointerdown'].forEach((evt) => {
      document.addEventListener(evt, unlock, { passive: true });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', unlockMobileMedia);
  } else {
    unlockMobileMedia();
  }

  function buildCertificateHtml(meta, studentName, studentGrade) {
    normalizeMeta(meta);
    const name = studentName || "Explorador Galáctico";
    const gradeText = studentGrade ? `${studentGrade}° Grado de Primaria` : "Primaria Galáctica";
    const cp = meta ? (meta.stats ? meta.stats.cpEarned || 0 : 0) : 0;
    const rank = getGalacticRank(cp);
    const lvlInfo = getUserLevel(cp);
    const readings = meta ? (meta.stats ? meta.stats.readingsDone || countAllReadings(meta) : 0) : 0;
    const games = meta ? (meta.stats ? meta.stats.gamesDone || countAllGames(meta) : 0) : 0;
    const achCount = meta ? ((meta.claimedAchievements || meta.achievements || []).length) : 0;
    const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Diploma Galáctico — ${name}</title>
  <style>
    @page { size: landscape; margin: 0; }
    body {
      margin: 0;
      padding: 2rem;
      box-sizing: border-box;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #0b1120;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cert-frame {
      width: 100%;
      max-width: 960px;
      padding: 2.5rem 3rem;
      box-sizing: border-box;
      background: linear-gradient(145deg, #111a2e 0%, #1a2744 100%);
      border: 8px double #fbbf24;
      border-radius: 24px;
      box-shadow: 0 0 40px rgba(251, 191, 36, 0.3);
      position: relative;
      text-align: center;
    }
    .cert-corner {
      position: absolute;
      font-size: 2.2rem;
    }
    .corner-tl { top: 15px; left: 20px; }
    .corner-tr { top: 15px; right: 20px; }
    .corner-bl { bottom: 15px; left: 20px; }
    .corner-br { bottom: 15px; right: 20px; }

    .cert-header {
      font-size: 1.2rem;
      font-weight: 800;
      letter-spacing: 0.25em;
      color: #38bdf8;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }
    .cert-title {
      font-size: 2.6rem;
      font-weight: 900;
      color: #fbbf24;
      margin: 0 0 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      text-shadow: 0 2px 10px rgba(251, 191, 36, 0.4);
    }
    .cert-sub {
      font-size: 1.15rem;
      color: #cbd5e1;
      margin-bottom: 0.5rem;
    }
    .cert-name {
      font-size: 3rem;
      font-weight: 900;
      color: #ffffff;
      margin: 0.4rem 0 1.1rem;
      border-bottom: 3px solid #38bdf8;
      display: inline-block;
      padding: 0 2rem 0.3rem;
      font-family: Georgia, serif;
    }
    .cert-body {
      font-size: 1.2rem;
      line-height: 1.6;
      color: #e2e8f0;
      max-width: 780px;
      margin: 0 auto 1.5rem;
    }
    .cert-badge-row {
      display: flex;
      justify-content: center;
      gap: 1.2rem;
      margin-bottom: 1.8rem;
    }
    .cert-badge {
      background: rgba(255, 255, 255, 0.08);
      border: 1.5px solid rgba(251, 191, 36, 0.5);
      border-radius: 16px;
      padding: 0.65rem 1.1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.05rem;
      font-weight: 700;
    }
    .cert-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px dashed rgba(255, 255, 255, 0.2);
    }
    .cert-sig-block {
      text-align: center;
      min-width: 200px;
    }
    .sig-line {
      border-bottom: 2px solid #cbd5e1;
      height: 30px;
      margin-bottom: 0.4rem;
    }
    .sig-lbl {
      font-size: 0.9rem;
      color: #94a3b8;
      font-weight: 600;
    }

    @media print {
      body { background: none !important; color: #000 !important; padding: 0 !important; }
      .cert-frame {
        background: #ffffff !important;
        color: #0f172a !important;
        border-color: #d97706 !important;
        box-shadow: none !important;
      }
      .cert-header { color: #0284c7 !important; }
      .cert-title { color: #d97706 !important; text-shadow: none !important; }
      .cert-sub, .cert-body { color: #334155 !important; }
      .cert-name { color: #0f172a !important; border-color: #0284c7 !important; }
      .cert-badge { background: #f8fafc !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
      .sig-line { border-color: #334155 !important; }
      .sig-lbl { color: #475569 !important; }
    }
  </style>
</head>
<body>
  <div class="cert-frame">
    <div class="cert-corner corner-tl">⭐</div>
    <div class="cert-corner corner-tr">🚀</div>
    <div class="cert-corner corner-bl">🛸</div>
    <div class="cert-corner corner-br">🌟</div>

    <div class="cert-header">🚀 COMPRENSIÓN GALÁCTICA 🚀</div>
    <div class="cert-title">DIPLOMA DE EXCELENCIA LECTORA</div>
    <div class="cert-sub">Otorgado con orgullo al explorador(a):</div>
    <div class="cert-name">${name}</div>

    <div class="cert-body">
      Por haber demostrado un destacado entusiasmo, dedicación y superación en el programa de comprensión lectora de <strong>${gradeText}</strong>.
    </div>

    <div class="cert-badge-row">
      <div class="cert-badge"><span>${rank.icon}</span> <span>Rango: ${rank.title}</span></div>
      <div class="cert-badge"><span>🏅</span> <span>Medallas: ${achCount}</span></div>
      <div class="cert-badge"><span>📖</span> <span>Lecturas: ${readings}</span></div>
      <div class="cert-badge"><span>✨</span> <span>Puntos: ${cp} CP</span></div>
    </div>

    <div class="cert-footer">
      <div class="cert-sig-block">
        <div class="sig-lbl">Fecha de expedición:<br><strong>${today}</strong></div>
      </div>
      <div class="cert-sig-block">
        <div class="sig-line"></div>
        <div class="sig-lbl">Firma del Maestro(a) / Tutor</div>
      </div>
      <div class="cert-sig-block">
        <div class="sig-lbl">Misión Galáctica<br><strong>Comprensión Lectora</strong></div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  function printCertificate(meta, studentName, studentGrade) {
    const w = window.open("", "_blank");
    if (!w) return false;
    w.document.write(buildCertificateHtml(meta, studentName, studentGrade));
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
    }, 400);
    return true;
  }

  global.AppFeatures = {
    freshMeta,
    normalizeMeta,
    syncStatsFromCompleted,
    countAllReadings,
    countAllGames,
    todayKey,
    weekKey,
    getTeacherSettings,
    setTeacherPin,
    verifyTeacherPin,
    markComplete,
    isComplete,
    countCompleted,
    recordCorrect,
    recordCpEarned,
    logWeekly,
    getWeeklySummary,
    updateStreak,
    recordQuestionFail,
    clearQuestionFail,
    checkAchievements,
    applyAccessibility,
    getGalacticRank,
    getUserLevel,
    getActivityLevel,
    exportStudentDataCSV,
    exportBackupJSON,
    importBackupJSON,
    getFailDiagnostics,
    speakText,
    stopSpeech,
    playSFX,
    printReading,
    buildCertificateHtml,
    printCertificate,
    DEFAULT_PIN,
  };
})(window);
