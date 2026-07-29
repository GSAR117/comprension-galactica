/**
 * Comprensión Galáctica — App principal
 */
(function () {
  const LEGACY_STORAGE_KEY = "comprension-galactica-v1";
  const STUDENTS_META_KEY = "comprension-galactica-students";

  const state = {
    cp: 0,
    inventory: [],
    activeRewards: [],
    currentGrade: null,
    currentModule: null,
    hints: 0,
    confettiOwned: false,
    shipColor: "default",
    extraLives: 0,
    heroicShield: 0,
    timeBoosts: 0,
    studentId: null,
    studentName: "",
    rewardsBackScreen: "grade-select",
    rewardsShopGrade: null,
    meta: null,
  };

  const FE = () => window.AppFeatures;

  let studentsMeta = { activeId: null, students: [] };
  let activeStudentId = null;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function stateStorageKey(studentId) {
    return `comprension-galactica-v1-${studentId}`;
  }

  function freshProgress() {
    return {
      cp: 0,
      inventory: [],
      activeRewards: [],
      hints: 0,
      confettiOwned: false,
      shipColor: "default",
      extraLives: 0,
      heroicShield: 0,
      timeBoosts: 0,
      meta: FE()?.freshMeta() || {},
    };
  }

  function applyProgress(data) {
    const p = data || freshProgress();
    state.cp = p.cp ?? 0;
    state.inventory = Array.isArray(p.inventory) ? [...p.inventory] : [];
    state.activeRewards = Array.isArray(p.activeRewards) ? [...p.activeRewards] : [];
    state.hints = p.hints ?? 0;
    state.confettiOwned = !!p.confettiOwned;
    state.shipColor = p.shipColor || "default";
    state.extraLives = p.extraLives ?? 0;
    state.heroicShield = p.heroicShield ?? 0;
    state.timeBoosts = p.timeBoosts ?? 0;
    state.meta = p.meta && typeof p.meta === "object" ? p.meta : FE()?.freshMeta() || {};
    FE()?.normalizeMeta(state.meta);
    migrateLegacyRewards();
    FE()?.applyAccessibility(state.meta.settings || {});
  }

  /** Compatibilidad con recompensas antiguas */
  function migrateLegacyRewards() {
    const legacyToggle = {
      confetti: "confetti",
      "ship-color": "ship-color",
      "night-mode": "night-mode",
      "ritmo-bonus": "ritmo-bonus",
      "frame-neon": "neon-frame",
    };
    state.inventory.forEach((id) => {
      if (legacyToggle[id] && !state.activeRewards.includes(legacyToggle[id])) {
        if (state.confettiOwned && id === "confetti") state.activeRewards.push("confetti");
      }
    });
    if (state.inventory.includes("song-unlock") && !state.inventory.includes("g1-ritmo")) {
      state.inventory.push("g1-ritmo");
    }
    if (state.confettiOwned && !state.activeRewards.includes("confetti")) {
      state.activeRewards.push("confetti");
    }
    if (state.inventory.includes("g2-pdf-zoom") && !state.inventory.includes("g2-letras")) {
      state.inventory.push("g2-letras");
    }
    state.inventory = state.inventory.filter((id) => id !== "g2-pdf-zoom");
    state.activeRewards = state.activeRewards.filter((e) => e !== "pdf-zoom");
  }

  function findReward(id) {
    const all = APP_DATA.getAllRewards?.() || [];
    const found = all.find((r) => r.id === id);
    if (found) return found;
    const legacy = {
      confetti: { id: "confetti", name: "Confeti", icon: "🎉", type: "toggle", effect: "confetti" },
      "ship-color": { id: "ship-color", name: "Cohete", icon: "🚀", type: "toggle", effect: "ship-color" },
      "night-mode": { id: "night-mode", name: "Modo aurora", icon: "🌌", type: "toggle", effect: "night-mode" },
      "ritmo-bonus": { id: "ritmo-bonus", name: "Ritmo extra", icon: "🗣️", type: "toggle", effect: "ritmo-bonus" },
      "hint-pack": { id: "hint-pack", name: "Pistas", icon: "💡", type: "consumable", effect: "hint", amount: 3 },
      "extra-life": { id: "extra-life", name: "Vidas", icon: "❤️", type: "consumable", effect: "extra-life", amount: 3 },
    };
    return legacy[id] || null;
  }

  function isEffectActive(effect) {
    return state.activeRewards.includes(effect);
  }

  function grantConsumable(reward) {
    const n = reward.amount || 1;
    if (reward.effect === "hint") {
      state.hints += n;
    } else if (reward.effect === "extra-life") {
      state.extraLives += n;
    } else if (reward.effect === "heroic-shield") {
      state.heroicShield += n;
    } else if (reward.effect === "time-boost") {
      state.timeBoosts += n;
    }
    // Ensure hints are reflected in UI after granting
    updateModuleRewardsBar();
  }

  function resetProgress() {
    applyProgress(freshProgress());
    state.currentGrade = null;
    state.currentModule = null;
  }

  function showAchievementToast(achievement) {
    FE()?.playSFX('reward', state.meta?.settings?.sfxVolume);
    const toastEl = $("#achievement-toast");
    const titleEl = $("#achievement-toast-title");
    const descEl = $("#achievement-toast-desc");
    if (!toastEl) return;
    
    if (titleEl) titleEl.textContent = `🏅 ¡Logro: ${achievement.name}!`;
    if (descEl) descEl.textContent = achievement.desc || "¡Has desbloqueado una nueva medalla galáctica!";
    
    toastEl.classList.add("show");
    setTimeout(() => {
      toastEl.classList.remove("show");
    }, 4500);
  }

  function unlockAchievements() {
    const unlocked = FE()?.checkAchievements(state.meta, APP_DATA) || [];
    if (unlocked.length) {
      saveState();
      unlocked.forEach((a) => showAchievementToast(a));
      celebrate();
    }
    return unlocked;
  }

  function processStreakLogin() {
    const r = FE()?.updateStreak(state.meta);
    if (r?.updated && r.bonus) {
      state.cp += r.bonus;
      FE()?.recordCpEarned(state.meta, r.bonus);
      toast(`🔥 Racha ${r.streak} días — +${r.bonus} CP`);
      saveState();
      unlockAchievements();
    }
    updateStreakUI();
  }

  function updateStreakUI() {
    const el = $("#streak-badge");
    if (!el) return;
    const n = state.meta?.streak?.count || 0;
    if (n > 0) {
      el.classList.remove("hidden");
      el.textContent = `🔥 Racha: ${n} día${n > 1 ? "s" : ""}`;
    } else el.classList.add("hidden");
  }

  function getReadingList(grade) {
    return APP_DATA.READINGS[grade] || [];
  }

  function getGameList(grade) {
    return APP_DATA.GAMES[grade] || [];
  }

  function updateHubProgress(grade) {
    const el = $("#hub-progress");
    if (!el) return;
    const rTotal = getReadingList(grade).length;
    const gTotal = getGameList(grade).length;
    const rDone = (state.meta.completed.readings[String(grade)] || []).length;
    const gDone = (state.meta.completed.games[String(grade)] || []).length;
    let parts = [`📖 Lectura ${rDone}/${rTotal}`, `🎮 Juegos ${gDone}/${gTotal}`];
    if (grade === 1) {
      const ritmoTotal = (APP_DATA.RITMO_PRIMERO || []).length;
      parts.push(`🗣️ Ritmo ${state.meta.completed.ritmo.length}/${ritmoTotal}`);
    }
    let spData = APP_DATA.SEASONAL_READINGS || [];
    if (!Array.isArray(spData)) spData = spData[grade] || spData["default"] || [];
    const espIcons = { 1: "🌟", 2: "🍁", 3: "❄️", 4: "🎃", 5: "🎄", 6: "☔" };
    const icon = espIcons[grade] || "🌟";
    parts.push(`${icon} Especiales ${state.meta.completed.seasonal.length}/${spData.length}`);
    el.textContent = parts.join(" · ");
  }

  function markModuleComplete(type, grade, id) {
    const f = FE();
    if (!f || !state.meta) return false;
    if (f.markComplete(state.meta, type, grade, id)) {
      if (type === "readings") f.logWeekly(state.meta, { readings: 1 });
      if (type === "games") f.logWeekly(state.meta, { games: 1 });
      if (type === "seasonal") f.logWeekly(state.meta, { readings: 1 });
      saveState();
      unlockAchievements();
      if (grade) updateHubProgress(grade);
      return true;
    }
    return false;
  }

  /* ——— Animación cohete ——— */
  const ROCKET_MSGS = [
    "¡Excelente trabajo! 🌟",
    "¡Eres un explorador increíble! 🚀",
    "¡Misión completada! 🎯",
    "¡Lo lograste, campeón! 🏆",
    "¡Despegando al siguiente nivel! ✨",
    "¡Fantástico, sigue así! 💫",
  ];

  function showRocketAnimation(onDone) {
    const overlay = document.getElementById("rocket-overlay");
    const msgEl   = document.getElementById("rocket-msg");
    if (!overlay) { if (onDone) onDone(); return; }

    // Pick a random message
    msgEl.textContent = ROCKET_MSGS[Math.floor(Math.random() * ROCKET_MSGS.length)];

    // Force CSS animation restart by re-inserting animated elements
    const rocket  = overlay.querySelector(".rocket-overlay__rocket");
    const flame   = overlay.querySelector(".rocket-overlay__flame");
    const stars   = overlay.querySelector(".rocket-overlay__stars-fx");
    [rocket, flame, stars].forEach(el => {
      if (!el) return;
      el.style.animation = "none";
      el.offsetHeight; // reflow
      el.style.animation = "";
    });

    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    // After animation (3.2s) hide and navigate
    setTimeout(() => {
      overlay.classList.add("hidden");
      document.body.style.overflow = "";
      if (onDone) onDone();
    }, 3200);
  }

  function loadStudentsMeta() {
    try {
      const raw = localStorage.getItem(STUDENTS_META_KEY);
      if (raw) studentsMeta = JSON.parse(raw);
    } catch (_) {
      studentsMeta = { activeId: null, students: [] };
    }
    if (!Array.isArray(studentsMeta.students)) studentsMeta.students = [];
  }

  function saveStudentsMeta() {
    localStorage.setItem(STUDENTS_META_KEY, JSON.stringify(studentsMeta));
  }

  function migrateLegacyStorage() {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy || studentsMeta.students.length > 0) return;
    const id = "explorador-" + Date.now();
    studentsMeta.students.push({
      id,
      name: "Explorador",
      createdAt: Date.now(),
    });
    studentsMeta.activeId = id;
    localStorage.setItem(stateStorageKey(id), legacy);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    saveStudentsMeta();
  }

  function getStudentById(id) {
    return studentsMeta.students.find((s) => s.id === id);
  }

  function loadStateForStudent(studentId) {
    const student = getStudentById(studentId);
    if (!student) return false;

    activeStudentId = studentId;
    studentsMeta.activeId = studentId;
    saveStudentsMeta();

    state.studentId = studentId;
    state.studentName = student.name;
    state.studentGrade = student.grade || null;
    resetProgress();

    try {
      const raw = localStorage.getItem(stateStorageKey(studentId));
      if (raw) applyProgress(JSON.parse(raw));
    } catch (_) {}

    unlockAchievements();
    updateStudentLabel();
    processStreakLogin();
    applyRewardEffects();
    updateCpDisplays();
    return true;
  }

  function saveState() {
    if (!activeStudentId) return;
    const payload = {
      cp: state.cp,
      inventory: state.inventory,
      activeRewards: state.activeRewards,
      hints: state.hints,
      confettiOwned: state.confettiOwned,
      shipColor: state.shipColor,
      extraLives: state.extraLives,
      heroicShield: state.heroicShield,
      timeBoosts: state.timeBoosts,
      meta: state.meta,
    };
    localStorage.setItem(stateStorageKey(activeStudentId), JSON.stringify(payload));
    updateCpDisplays();
  }

  function createNewStudent(name, grade) {
    const trimmed = (name || "").trim();
    if (!trimmed) {
      toast("Escribe un nombre para el alumno", "error");
      return null;
    }
    const parsedGrade = parseInt(grade, 10);
    const id = "stu-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    const avatars = ["🧑‍🚀", "⭐", "👽", "🤖", "👾", "🚀", "🛸", "☄️", "🪐", "🌙", "🐱", "🐶", "🦊", "🐰", "🦁", "🐼"];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    studentsMeta.students.push({
      id,
      name: trimmed,
      grade: isNaN(parsedGrade) ? null : parsedGrade,
      avatar: randomAvatar,
      createdAt: Date.now()
    });
    studentsMeta.activeId = id;
    saveStudentsMeta();
    localStorage.setItem(stateStorageKey(id), JSON.stringify(freshProgress()));
    loadStateForStudent(id);
    toast(`¡Hola, ${trimmed}! Empiezas con 0 CP y sin recompensas en ${parsedGrade}° grado 🌟`);
    return id;
  }

  function updateStudentLabel() {
    const el = $("#student-active-label");
    if (el) {
      let petIcon = "";
      if (isEffectActive("pet-egg")) petIcon = "🥚";
      if (isEffectActive("pet-cat")) petIcon = "🐱";
      if (isEffectActive("pet-dog")) petIcon = "🐶";
      if (isEffectActive("pet-alien")) petIcon = "👽";
      if (isEffectActive("pet-dragon")) petIcon = "🐉";
      
      let suitIcon = "";
      if (isEffectActive("suit-helmet")) suitIcon = "🪖";
      if (isEffectActive("suit-neon")) suitIcon = "👨‍🚀";
      if (isEffectActive("suit-jetpack")) suitIcon = "🚀";
      if (isEffectActive("suit-cape")) suitIcon = "🦸";
      if (isEffectActive("suit-crown")) suitIcon = "👑";

      const rank = FE()?.getGalacticRank(state.cp || 0) || { title: "Novato Estelar", icon: "🧑‍🚀" };
      const lvlInfo = FE()?.getUserLevel(state.cp || 0) || { level: 1 };
      const gradeText = state.studentGrade ? ` (${state.studentGrade}° Grado)` : "";
      el.textContent = state.studentName ? `${suitIcon} Explorador: ${state.studentName}${gradeText} · Niv. ${lvlInfo.level} · ${rank.icon} ${rank.title} ${petIcon}` : "";
    }
  }

  function updateModuleRewardsBar() {
    const bar = $("#module-rewards-bar");
    if (!bar) return;
    const parts = [];
    if (state.hints > 0) parts.push(`💡 ${state.hints}`);
    if (state.extraLives > 0) parts.push(`❤️ ${state.extraLives}`);
    if (state.heroicShield > 0) parts.push(`🛡️ ${state.heroicShield}`);
    if (state.timeBoosts > 0) parts.push(`⏱️ ${state.timeBoosts}`);
    bar.textContent = parts.length ? parts.join(" · ") : "";
    bar.classList.toggle("hidden", parts.length === 0);
  }

  function applyRewardEffects() {
    const stars = $("#stars");
    if (isEffectActive("night-mode") && stars) {
      stars.style.background =
        "linear-gradient(165deg, #0f1a28 0%, #1a2840 50%, #1f1a38 100%)";
    } else if (stars) {
      stars.style.background = "";
    }
    const rocket = document.querySelector(".splash__rocket");
    if (rocket) {
      rocket.style.filter = isEffectActive("ship-color") ? "hue-rotate(90deg)" : "";
    }
    document.body.classList.toggle("reward-big-text", isEffectActive("big-text"));
    document.body.classList.toggle("reward-neon-frame", isEffectActive("neon-frame"));
    document.body.classList.toggle("reward-pdf-zoom", isEffectActive("pdf-zoom"));
    document.body.classList.toggle("reward-mascot", isEffectActive("mascot"));

    updateCompanionWidget();
    updateStudentLabel();
    updateModuleRewardsBar();
  }

  function updateCompanionWidget() {
    let widget = $("#active-companion-widget");
    let petIcon = "";
    let petName = "";
    let phrase = "";

    if (isEffectActive("pet-egg")) { petIcon = "🥚"; petName = "Huevo Cósmico"; phrase = "¡Casi listo para nacer!"; }
    else if (isEffectActive("pet-cat")) { petIcon = "🐱"; petName = "Gato Espacial"; phrase = "¡Miau! ¡Sigue leyendo!"; }
    else if (isEffectActive("pet-dog")) { petIcon = "🐶"; petName = "Perro Robot"; phrase = "¡Bip bop! ¡Gran trabajo!"; }
    else if (isEffectActive("pet-alien")) { petIcon = "👽"; petName = "Alien Amistoso"; phrase = "¡Zorp! ¡Tú puedes!"; }
    else if (isEffectActive("pet-dragon")) { petIcon = "🐉"; petName = "Dragón Estelar"; phrase = "¡Fuego lector activado!"; }
    else if (isEffectActive("suit-helmet")) { petIcon = "🪖"; petName = "Casco de Novato"; phrase = "¡Cabeza protegida!"; }
    else if (isEffectActive("suit-neon")) { petIcon = "👨‍🚀"; petName = "Traje Neón"; phrase = "¡Brillando en el espacio!"; }
    else if (isEffectActive("suit-jetpack")) { petIcon = "🚀"; petName = "Propulsores Jet"; phrase = "¡Volando alto!"; }
    else if (isEffectActive("suit-cape")) { petIcon = "🦸"; petName = "Capa Cósmica"; phrase = "¡Súper explorador!"; }
    else if (isEffectActive("suit-crown")) { petIcon = "👑"; petName = "Corona Legendaria"; phrase = "¡Rey de las palabras!"; }

    if (petIcon) {
      if (!widget) {
        widget = document.createElement("div");
        widget.id = "active-companion-widget";
        widget.title = "Toca a tu compañero galáctico";
        document.body.appendChild(widget);
        widget.addEventListener("click", () => {
          FE()?.playSFX('correct');
          toast(`${petIcon} ${petName}: "¡Estoy listo para ayudarte en tus lecturas y juegos! 🌟"`);
        });
      }
      widget.innerHTML = `
        <span class="companion-avatar">${petIcon}</span>
        <span class="companion-speech">${phrase}</span>
      `;
    } else if (widget) {
      widget.remove();
    }
  }

  function applyCosmetics() {
    applyRewardEffects();
  }

  function renderStudentSelect() {
    const list = $("#student-list");
    if (!list) return;
    list.innerHTML = "";

    if (studentsMeta.students.length === 0) {
      list.innerHTML = `<p class="empty-msg">Aún no hay alumnos. Crea el primero con el botón de abajo.</p>`;
      return;
    }

    studentsMeta.students.forEach((student) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "student-card" + (student.id === activeStudentId ? " student-card--active" : "");
      let cp = 0;
      try {
        const raw = localStorage.getItem(stateStorageKey(student.id));
        if (raw) cp = JSON.parse(raw).cp ?? 0;
      } catch (_) {}
      const rank = FE()?.getGalacticRank(cp) || { title: "Novato Estelar", icon: "🧑‍🚀" };
      const lvlInfo = FE()?.getUserLevel(cp) || { level: 1 };
      const gradeText = student.grade ? ` · ${student.grade}° Grado` : "";
      const displayAvatar = student.avatar || "🧑‍🚀";
      btn.innerHTML = `
        <span class="student-card__avatar">${displayAvatar}</span>
        <span class="student-card__name">${student.name}${gradeText}</span>
        <span class="student-card__cp">⭐ Niv. ${lvlInfo.level} · ✨ ${cp} CP · ${rank.icon} ${rank.title}</span>
      `;
      btn.addEventListener("click", () => {
        loadStateForStudent(student.id);
        showScreen("grade-select");
        toast(`¡Listo, ${student.name}!`);
      });
      list.appendChild(btn);
    });
  }

  /* ═══════════════════════════════════════════
     SISTEMA DE MODALES CÓSMICOS (Sin alerts nativos)
  ═══════════════════════════════════════════ */
  let currentModalResolve = null;

  function closeGalacticModal(result = null) {
    const modal = $("#galactic-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
    }
    if (currentModalResolve) {
      currentModalResolve(result);
      currentModalResolve = null;
    }
  }

  function showGalacticModal({ icon = "✨", title = "", subtitle = "", bodyHtml = "", footerHtml = "" }) {
    const modal = $("#galactic-modal");
    const iconEl = $("#galactic-modal-icon");
    const titleEl = $("#galactic-modal-title");
    const subEl = $("#galactic-modal-subtitle");
    const bodyEl = $("#galactic-modal-body");
    const footerEl = $("#galactic-modal-footer");
    const closeBtn = $("#galactic-modal-close");

    if (!modal) return Promise.resolve(null);

    if (iconEl) iconEl.textContent = icon;
    if (titleEl) titleEl.textContent = title;
    if (subEl) {
      if (subtitle) {
        subEl.textContent = subtitle;
        subEl.classList.remove("hidden");
      } else {
        subEl.classList.add("hidden");
      }
    }
    if (bodyEl) bodyEl.innerHTML = bodyHtml;
    if (footerEl) footerEl.innerHTML = footerHtml;

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");

    return new Promise((resolve) => {
      currentModalResolve = resolve;

      if (closeBtn) {
        closeBtn.onclick = () => closeGalacticModal(null);
      }

      modal.onclick = (e) => {
        if (e.target === modal) closeGalacticModal(null);
      };
    });
  }

  function showGalacticAlert(message, title = "Aviso Galáctico", icon = "🚀") {
    const bodyHtml = `<p style="text-align:center;">${message.replace(/\n/g, '<br>')}</p>`;
    const footerHtml = `<button type="button" class="btn btn--accent btn--wide" id="modal-alert-ok">¡Entendido!</button>`;
    
    const promise = showGalacticModal({ icon, title, bodyHtml, footerHtml });
    setTimeout(() => {
      $("#modal-alert-ok")?.addEventListener("click", () => closeGalacticModal(true));
    }, 0);
    return promise;
  }

  function showGalacticConfirm(message, { title = "Confirmación", confirmText = "Aceptar", cancelText = "Cancelar", isDanger = false, icon = "❓" } = {}) {
    const bodyHtml = `<p style="text-align:center;">${message.replace(/\n/g, '<br>')}</p>`;
    const btnClass = isDanger ? "btn--danger" : "btn--accent";
    const footerHtml = `
      <button type="button" class="btn btn--ghost" id="modal-confirm-cancel">${cancelText}</button>
      <button type="button" class="btn ${btnClass}" id="modal-confirm-ok">${confirmText}</button>
    `;

    const promise = showGalacticModal({ icon, title, bodyHtml, footerHtml });
    setTimeout(() => {
      $("#modal-confirm-cancel")?.addEventListener("click", () => closeGalacticModal(false));
      $("#modal-confirm-ok")?.addEventListener("click", () => closeGalacticModal(true));
    }, 0);
    return promise;
  }

  function showGalacticPrompt(message, { title = "Ingresa un dato", defaultValue = "", placeholder = "", inputType = "text", confirmText = "Aceptar", cancelText = "Cancelar", icon = "✏️" } = {}) {
    const bodyHtml = `
      <p style="text-align:center; margin-bottom: 0.75rem;">${message.replace(/\n/g, '<br>')}</p>
      <input type="${inputType}" id="modal-prompt-input" class="modal-input" value="${defaultValue}" placeholder="${placeholder}" autofocus />
    `;
    const footerHtml = `
      <button type="button" class="btn btn--ghost" id="modal-prompt-cancel">${cancelText}</button>
      <button type="button" class="btn btn--accent" id="modal-prompt-ok">${confirmText}</button>
    `;

    const promise = showGalacticModal({ icon, title, bodyHtml, footerHtml });
    setTimeout(() => {
      const input = $("#modal-prompt-input");
      if (input) {
        input.focus();
        input.select();
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            closeGalacticModal(input.value);
          }
        });
      }
      $("#modal-prompt-cancel")?.addEventListener("click", () => closeGalacticModal(null));
      $("#modal-prompt-ok")?.addEventListener("click", () => closeGalacticModal(input ? input.value : ""));
    }, 0);
    return promise;
  }

  // Sobrescribir dialogos nativos del navegador para evitar alert/prompt flotantes arriba
  window.alert = (msg) => showGalacticAlert(String(msg));
  window.prompt = (msg, def) => showGalacticPrompt(String(msg), { defaultValue: def || "" });
  window.confirm = (msg) => {
    showGalacticConfirm(String(msg));
    return false;
  };

  function openNewStudentModal() {
    let selectedGrade = 1;

    const bodyHtml = `
      <div class="modal-field-group">
        <label class="modal-field-label" for="modal-student-name">Nombre del explorador</label>
        <input type="text" id="modal-student-name" class="modal-input" placeholder="Ej: Luis, Sofía, Mateo" autofocus />
      </div>

      <div class="grade-picker-label">Elige su grado de primaria:</div>
      <div class="grade-picker-grid">
        <button type="button" class="grade-pill active" data-grade="1">1° Grado</button>
        <button type="button" class="grade-pill" data-grade="2">2° Grado</button>
        <button type="button" class="grade-pill" data-grade="3">3° Grado</button>
        <button type="button" class="grade-pill" data-grade="4">4° Grado</button>
        <button type="button" class="grade-pill" data-grade="5">5° Grado</button>
        <button type="button" class="grade-pill" data-grade="6">6° Grado</button>
      </div>

      <div id="modal-student-error" class="modal-error hidden"></div>
    `;

    const footerHtml = `
      <button type="button" class="btn btn--ghost" id="modal-student-cancel">Cancelar</button>
      <button type="button" class="btn btn--accent" id="modal-student-submit">🚀 ¡Despegar!</button>
    `;

    showGalacticModal({
      icon: "🧑‍🚀",
      title: "Nuevo Explorador",
      subtitle: "Ingresa el nombre y selecciona el grado escolar",
      bodyHtml,
      footerHtml
    });

    setTimeout(() => {
      const nameInput = $("#modal-student-name");
      const errorDiv = $("#modal-student-error");
      const gradeBtns = $$(".grade-pill");

      if (nameInput) nameInput.focus();

      gradeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          gradeBtns.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          selectedGrade = parseInt(btn.getAttribute("data-grade"), 10) || 1;
        });
      });

      const showError = (msg) => {
        if (errorDiv) {
          errorDiv.textContent = msg;
          errorDiv.classList.remove("hidden");
        }
      };

      const handleSubmit = () => {
        let name = (nameInput ? nameInput.value : "").trim();
        if (!name) {
          showError("Por favor ingresa un nombre para el alumno.");
          return;
        }

        const validNameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
        if (!validNameRegex.test(name)) {
          showError("El nombre solo debe contener letras. Sin números ni símbolos.");
          return;
        }

        const badWords = window.APP_BADWORDS || [
          "maldito","maldita","maricon","maricón","joton","jotón","gays","gay","joto","jota",
          "lesbiana","gordo","gorda","negro","negra","puto","puta","mampo","puñal",
          "desgraciado","desgraciada","mensa","menso","pendejo","pendeja",
          "cabron","cabrón","verga","pito","culo","idiota","estupido","estúpido",
          "estupida","estúpida","zorra","perra","mierda","chingada","chingado",
          "chinga","culero","culera","mamada"
        ];
        const lowerName = name.toLowerCase();
        const hasBadWord = badWords.some(word => lowerName.includes(word));
        if (hasBadWord) {
          showError("⛔ Ese nombre no está permitido. Por favor usa un nombre respetuoso.");
          return;
        }

        if (!createNewStudent(name, selectedGrade)) return;
        closeGalacticModal(true);
        renderStudentSelect();
        showScreen("grade-select");
      };

      $("#modal-student-submit")?.addEventListener("click", handleSubmit);
      $("#modal-student-cancel")?.addEventListener("click", () => closeGalacticModal(false));

      nameInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleSubmit();
      });
    }, 0);
  }

  function promptNewStudent() {
    openNewStudentModal();
  }

  function checkRankUp(oldCp, newCp) {
    const oldRank = FE()?.getGalacticRank(oldCp);
    const newRank = FE()?.getGalacticRank(newCp);
    
    const oldLvl = FE()?.getUserLevel(oldCp);
    const newLvl = FE()?.getUserLevel(newCp);

    if (newLvl && oldLvl && newLvl.level > oldLvl.level) {
      showLevelUpToast(newLvl.level);
    } else if (oldRank && newRank && newRank.level > oldRank.level) {
      showRankUpToast(newRank);
    }
  }

  function showLevelUpToast(level) {
    FE()?.playSFX('reward', state.meta?.settings?.sfxVolume);
    celebrate();
    const toastEl = $("#achievement-toast");
    const titleEl = $("#achievement-toast-title");
    const descEl = $("#achievement-toast-desc");
    if (!toastEl) return;
    
    if (titleEl) titleEl.textContent = `⭐ ¡HAS SUBIDO DE NIVEL!`;
    if (descEl) descEl.textContent = `¡Felicidades! Has alcanzado el NIVEL ${level} 🚀`;
    
    toastEl.classList.add("show");
    setTimeout(() => {
      toastEl.classList.remove("show");
    }, 6000);
  }

  function showRankUpToast(rank) {
    FE()?.playSFX('reward', state.meta?.settings?.sfxVolume);
    celebrate();
    const toastEl = $("#achievement-toast");
    const titleEl = $("#achievement-toast-title");
    const descEl = $("#achievement-toast-desc");
    if (!toastEl) return;
    
    if (titleEl) titleEl.textContent = `🚀 ¡NUEVO RANGO ALCANZADO!`;
    if (descEl) descEl.textContent = `¡Felicidades! Has ascendido a: ${rank.icon} ${rank.title}`;
    
    toastEl.classList.add("show");
    setTimeout(() => {
      toastEl.classList.remove("show");
    }, 6000);
  }

  function updateCpDisplays() {
    const rank = FE()?.getGalacticRank(state.cp || 0) || { title: "Novato Estelar", icon: "🧑‍🚀" };
    const lvlInfo = FE()?.getUserLevel(state.cp || 0) || { level: 1, currentXp: 0, progressPercent: 0 };

    ["cp-total-grade", "cp-total-hub", "cp-total-module", "cp-total-rewards", "cp-total-weekly"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = `Niv. ${lvlInfo.level} · ${state.cp} CP <div class="xp-progress-bar" title="XP al siguiente nivel: ${lvlInfo.currentXp}/100"><div class="xp-progress-fill" style="width:${lvlInfo.progressPercent}%"></div></div> (${rank.icon} ${rank.title})`;
      }
    });
    updateStudentLabel();
  }

  function showScreen(id) {
    $$(".screen").forEach((s) => s.classList.remove("screen--active"));
    const screen = document.getElementById(id);
    if (screen) {
      screen.classList.add("screen--active");
      screen.style.animation = "none";
      void screen.offsetWidth;
      screen.style.animation = "";
    }
  }

  function toast(msg, type = "ok") {
    const t = $("#toast");
    t.textContent = msg;
    t.className = "toast";
    if (type === "error") t.style.borderColor = "#ff4466";
    else t.style.borderColor = "var(--neon-green)";
    setTimeout(() => t.classList.add("hidden"), 2800);
  }

  function celebrate() {
    FE()?.playSFX('reward');
    const box = $("#celebration");
    if (!box) return;
    box.classList.remove("hidden");
    box.innerHTML = "";
    const emojis = ["⭐", "🎉", "✨", "🌟", "💫", "🚀", "👑"];
    for (let i = 0; i < 24; i++) {
      const s = document.createElement("span");
      s.textContent = emojis[i % emojis.length];
      s.style.left = Math.random() * 100 + "%";
      s.style.top = "-10%";
      s.style.animationDelay = Math.random() * 0.5 + "s";
      box.appendChild(s);
    }
    setTimeout(() => box.classList.add("hidden"), 2200);
  }

  function addCp(amount, reason) {
    const oldCp = state.cp;
    state.cp += amount;
    const newCp = state.cp;
    FE()?.recordCpEarned(state.meta, amount);
    saveState();
    toast(`+${amount} CP — ${reason}`);
    checkRankUp(oldCp, newCp);
    if (isEffectActive("confetti") || state.confettiOwned) celebrate();
  }

  function awardCorrect(difficulty = "easy", moduleClass = "") {
    let pts = APP_DATA.CP_PER_CORRECT[difficulty] || 10;
    if (moduleClass === "card--ritmo" && isEffectActive("ritmo-bonus")) pts += 5;
    FE()?.recordCorrect(state.meta, pts);
    FE()?.logWeekly(state.meta, { correct: 1 });
    FE()?.playSFX('correct');
    addCp(pts, "¡Respuesta correcta!");
    unlockAchievements();
  }

  /* ——— Navegación ——— */
  function initNavigation() {
    $("#btn-start").addEventListener("click", () => {
      renderStudentSelect();
      showScreen("student-select");
    });

    $("#btn-new-student")?.addEventListener("click", promptNewStudent);

    $("#btn-change-student")?.addEventListener("click", () => {
      renderStudentSelect();
      showScreen("student-select");
    });

    $$(".btn--back").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.back;
        if (target) showScreen(target);
      });
    });

    $("#btn-rewards").addEventListener("click", () => openRewards("hub"));
    $("#btn-rewards-grade")?.addEventListener("click", () => openRewards("grades"));
    $("#btn-rewards-back")?.addEventListener("click", () => showScreen(state.rewardsBackScreen));
    $("#btn-weekly")?.addEventListener("click", () => {
      renderWeekly();
      showScreen("weekly");
    });
    $("#btn-options")?.addEventListener("click", () => {
      renderOptions();
      showScreen("options");
    });
    $("#btn-teacher")?.addEventListener("click", () => {
      renderTeacherGate();
      showScreen("teacher");
    });
    $("#btn-teacher-enter")?.addEventListener("click", tryTeacherLogin);
    $("#teacher-pin-input")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        tryTeacherLogin();
      }
    });
    $("#btn-change-pin")?.addEventListener("click", changeTeacherPin);
    $("#btn-gate-change-pin")?.addEventListener("click", changeTeacherPin);
    initAnexos();
  }

  function openRewards(from) {
    if (from === "hub") {
      state.rewardsBackScreen = "grade-hub";
      state.rewardsShopGrade = state.currentGrade;
    } else {
      state.rewardsBackScreen = "grade-select";
      state.rewardsShopGrade = null;
    }
    const backBtn = $("#btn-rewards-back");
    if (backBtn) {
      backBtn.textContent = from === "hub" ? "← Menú del grado" : "← Grados";
    }
    renderRewards();
    showScreen("rewards");
  }

  function renderRewardsGradePicker() {
    const picker = $("#rewards-grade-picker");
    if (!picker) return;
    picker.innerHTML = "";
    picker.classList.remove("hidden");
    const labels = APP_DATA.GRADE_LABELS || {};
    for (let g = 1; g <= 6; g++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rewards-grade-chip" + (state.rewardsShopGrade === g ? " rewards-grade-chip--active" : "");
      btn.innerHTML = `<span class="rewards-grade-chip__num">${g}°</span><span>${labels[g] || `Grado ${g}`}</span>`;
      btn.addEventListener("click", () => {
        state.rewardsShopGrade = g;
        renderRewards();
      });
      picker.appendChild(btn);
    }
  }

  function gradeCardShortLabel(g, labels) {
    const full = labels[g] || `Grado ${g}`;
    const short = String(full).replace(/^\d+°\s*/, "").trim();
    return short || full;
  }

  function renderGradeGrid() {
    const grid = $("#grade-grid");
    if (!grid) return;
    grid.innerHTML = "";
    const labels = window.APP_DATA?.GRADE_LABELS || { 1: "1°", 2: "2°", 3: "3°", 4: "4°", 5: "5°", 6: "6°" };
    for (let g = 1; g <= 6; g++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "grade-card";
      const rDone = (state.meta?.completed?.readings[String(g)] || []).length;
      const rTotal = getReadingList(g).length;
      const cardLabel = gradeCardShortLabel(g, labels);
      btn.innerHTML = `<span class="grade-card__num">${g}°</span><span class="grade-card__label">${cardLabel}</span><span class="grade-card__prog">📖 ${rDone}/${rTotal}</span>`;
      btn.addEventListener("click", () => {
        openGradeHub(g);
      });
      grid.appendChild(btn);
    }
  }

  function openGradeHub(grade) {
    state.currentGrade = grade;
    const title = $("#hub-grade-title");
    if (title) {
      const labels = window.APP_DATA?.GRADE_LABELS || {};
      title.textContent = labels[grade] || `Grado ${grade}`;
    }
    const hubRitmo = $("#hub-ritmo");
    if (hubRitmo) hubRitmo.classList.toggle("hidden", grade !== 1);
    const hubMisterio = $("#hub-misterio");
    if (hubMisterio) {
      hubMisterio.classList.toggle("hidden", grade !== 5);
      const mistDesc = hubMisterio.querySelector(".hub-card__desc");
      if (mistDesc && grade === 5) {
        const d = (state.meta.completed.misterios || []).length;
        const t = (APP_DATA.MISTERIOS_QUINTO || []).length;
        mistDesc.textContent = `Casos ${d}/${t}`;
      }
    }
    const juegosDesc = document.querySelector(".hub-card--juegos .hub-card__desc");
    if (juegosDesc) {
      if (grade === 5) juegosDesc.textContent = "Modo Heroica ⚔️";
      else if (grade === 6) juegosDesc.textContent = "Modo Legendaria 👑";
      else juegosDesc.textContent = "Memoria, emparejar y más";
    }
    const lecturaDesc = document.querySelector(".hub-card--lectura .hub-card__desc");
    if (lecturaDesc) {
      const d = (state.meta.completed.readings[String(grade)] || []).length;
      const t = getReadingList(grade).length;
      lecturaDesc.textContent = t ? `Historias ${d}/${t}` : "Historias y comprensión";
    }
    const juegosHubDesc = document.querySelector(".hub-card--juegos .hub-card__desc");
    if (juegosHubDesc && grade !== 5 && grade !== 6) {
      const d = (state.meta.completed.games[String(grade)] || []).length;
      const t = getGameList(grade).length;
      juegosHubDesc.textContent = `Juegos ${d}/${t}`;
    }
    const espDesc = document.querySelector(".hub-card--especial .hub-card__desc");
    if (espDesc) {
      const d = state.meta.completed.seasonal.length;
      let spData = APP_DATA.SEASONAL_READINGS || [];
      if (!Array.isArray(spData)) spData = spData[grade] || spData["default"] || [];
      espDesc.textContent = `Temporada ${d}/${spData.length}`;
    }
    const espIcon = document.querySelector(".hub-card--especial .hub-card__icon");
    if (espIcon) {
      const icons = { 1: "🌟", 2: "🍁", 3: "❄️", 4: "🎃", 5: "🎄", 6: "☔" };
      espIcon.textContent = icons[grade] || "🌟";
    }
    const anexosDesc = document.querySelector(".hub-card--anexos .hub-card__desc");
    if (anexosDesc) {
        const count = loadAnexos(grade).length;
        anexosDesc.textContent = `${count} archivo${count !== 1 ? 's' : ''}`;
    }
    updateHubProgress(grade);
    applyRewardEffects();
    showScreen("grade-hub");
  }

  /* ——— Anexos ——— */
  function getAnexosKey(grade) { return `anexos_grade_${grade}`; }
  function loadAnexos(grade) {
    try { return JSON.parse(localStorage.getItem(getAnexosKey(grade)) || "[]"); } catch { return []; }
  }
  function saveAnexos(grade, list) {
    localStorage.setItem(getAnexosKey(grade), JSON.stringify(list));
  }

  function renderAnexos(container, grade) {
    container.innerHTML = "";
    const list = loadAnexos(grade);
    const card = document.createElement("div");
    card.className = "card card--lectura";

    if (list.length === 0) {
      card.innerHTML = `
        <p class="card__title">📎 Anexos de ${grade}° grado</p>
        <p class="empty-msg">El maestro aún no ha subido archivos para este grado.</p>
      `;
      container.appendChild(card);
      return;
    }

    card.innerHTML = `<p class="card__title">📎 Archivos de ${grade}° grado</p><p class="section-sub">Toca un archivo para abrirlo o descargarlo.</p>`;
    const ul = document.createElement("ul");
    ul.className = "anexos-list";

    list.forEach(a => {
      const li = document.createElement("li");
      li.className = "anexo-item";
      const icon = a.type === "pdf" ? "📄" : a.type === "image" ? "🖼️" : a.type === "link" ? "🔗" : "📁";
      li.innerHTML = `
        <a class="anexo-link" href="${a.url}" target="_blank" download="${a.name}">
          <span class="anexo-icon">${icon}</span>
          <span class="anexo-name">${a.name}</span>
          <span class="anexo-dl">⬇ Abrir</span>
        </a>
      `;
      ul.appendChild(li);
    });

    card.appendChild(ul);
    container.appendChild(card);
  }

  function initAnexos() {
    const addBtn = $("#btn-add-anexo");
    const fileInput = $("#anexo-file");
    if (!addBtn) return;

    fileInput?.addEventListener("change", () => {
      const f = fileInput.files[0];
      if (f) $("#anexo-name").value = $("#anexo-name").value || f.name;
    });

    addBtn.addEventListener("click", () => {
      const grade = parseInt($("#anexo-grade-select").value);
      const name = $("#anexo-name").value.trim();
      const url = $("#anexo-url").value.trim();
      const file = fileInput?.files[0];

      if (!name) { toast("Escribe un nombre para el archivo", "error"); return; }
      if (!url && !file) { toast("Pega un link o selecciona un archivo", "error"); return; }

      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          const ext = file.name.split(".").pop().toLowerCase();
          const type = ext === "pdf" ? "pdf" : ["png","jpg","jpeg","webp"].includes(ext) ? "image" : "file";
          const list = loadAnexos(grade);
          list.push({ id: Date.now().toString(), name, url: e.target.result, type });
          saveAnexos(grade, list);
          clearAnexoForm();
          renderTeacherAnexos();
          toast(`Anexo agregado a ${grade}° grado`);
        };
        reader.readAsDataURL(file);
      } else {
        const list = loadAnexos(grade);
        list.push({ id: Date.now().toString(), name, url, type: "link" });
        saveAnexos(grade, list);
        clearAnexoForm();
        renderTeacherAnexos();
        toast(`Anexo agregado a ${grade}° grado`);
      }
    });

    renderTeacherAnexos();
  }

  function clearAnexoForm() {
    $("#anexo-name").value = "";
    $("#anexo-url").value = "";
    const fi = $("#anexo-file");
    if (fi) fi.value = "";
  }

  function renderTeacherAnexos() {
    const box = $("#teacher-anexos-list");
    if (!box) return;
    box.innerHTML = "";
    for (let g = 1; g <= 6; g++) {
      const list = loadAnexos(g);
      if (list.length === 0) continue;
      const section = document.createElement("div");
      section.className = "teacher-section__grade";
      section.innerHTML = `<strong>${g}° Grado (${list.length} archivo${list.length !== 1 ? "s" : ""})</strong>`;
      list.forEach(a => {
        const row = document.createElement("div");
        row.className = "teacher-anexo-row";
        row.innerHTML = `
          <span>${a.name}</span>
          <button type="button" class="btn btn--danger btn--small" data-id="${a.id}" data-grade="${g}">🗑️ Eliminar</button>
        `;
        row.querySelector("button").addEventListener("click", e => {
          const id = e.target.dataset.id;
          const grade = parseInt(e.target.dataset.grade);
          const updated = loadAnexos(grade).filter(x => x.id !== id);
          saveAnexos(grade, updated);
          renderTeacherAnexos();
          toast("Anexo eliminado");
        });
        section.appendChild(row);
      });
      box.appendChild(section);
    }
    if (box.innerHTML === "") box.innerHTML = `<p class="empty-msg">No hay anexos cargados aún.</p>`;
  }

  /* ——— Misterios ——— */
  function initHub() {
    $$(".hub-card").forEach((card) => {
      card.addEventListener("click", () => {
        const mod = card.dataset.module;
        if (mod) openModule(mod);
      });
    });
  }

  function openModule(mod) {
    state.currentModule = mod;
    const moduleScreen = $("#module");
    moduleScreen.classList.remove("module--lectura", "module--juegos", "module--ritmo", "module--especial", "module--misterio");
    if (mod) moduleScreen.classList.add("module--" + mod);

    const g = state.currentGrade;
    const espIcons = { 1: "🌟", 2: "🍁", 3: "❄️", 4: "🎃", 5: "🎄", 6: "☔" };
    const titles = {
      lectura: "📖 Lectura",
      juegos: "🎮 Juegos",
      ritmo: "🗣️ Rimas y ritmo",
      especial: "🌟 Especiales",
      anexos: "📎 Anexos",
    };
    $("#module-title").textContent = titles[mod] || mod;
    const content = $("#module-content");
    content.innerHTML = "";


    if (mod === "lectura") renderLectura(content, g);
    else if (mod === "juegos") renderJuegos(content, g);
    else if (mod === "ritmo" && g === 1) renderRitmo(content);
    else if (mod === "especial") renderSeasonal(content);
    else if (mod === "anexos") renderAnexos(content, g);

    updateModuleRewardsBar();
    showScreen("module");
  }

  /* ——— Lectura ——— */
  async function renderLectura(container, grade) {
    if (grade === 2) {
      renderReadings(container, grade, { showPdf: true });
    } else {
      renderReadings(container, grade);
    }
  }

  async function appendPdfSection(container, grade) {
    const pdfs = await AssetLoader.loadSegundoPdfs();
    const card = document.createElement("div");
    card.className = "card card--lectura";

    if (pdfs.length === 0) {
      const folder = AssetLoader.ASSET_PATHS.pdfSegundo;
      card.innerHTML = `
        <p class="card__title">PDF de ${grade}° grado</p>
        <div class="empty-msg">
          Coloca tus archivos PDF en:<br/>
          <code>${folder}</code>
        </div>
      `;
      container.appendChild(card);
    } else {
      card.innerHTML = `<p class="card__title">Lee el PDF y responde</p><div class="pdf-list" id="pdf-tabs"></div>`;
      const iframe = document.createElement("iframe");
      iframe.className = "pdf-viewer";
      iframe.title = "Lector PDF";
      card.appendChild(iframe);
      container.appendChild(card);

      const tabs = card.querySelector("#pdf-tabs");
      pdfs.forEach((pdf, i) => {
        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = "pdf-tab" + (i === 0 ? " active" : "");
        tab.textContent = pdf.name;
        tab.addEventListener("click", () => {
          $$(".pdf-tab").forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");
          iframe.src = pdf.url;
        });
        tabs.appendChild(tab);
        if (i === 0) iframe.src = pdf.url;
      });
    }

    const questions = APP_DATA.PDF_FOLLOWUP_QUESTIONS[grade] || [];
    renderQuestionBlock(container, questions, 0);
  }

  function renderReadings(container, grade, opts = {}) {
    const readings = APP_DATA.READINGS[grade] || [];
    if (readings.length === 0) {
      container.innerHTML = `<div class="card card--lectura"><p class="empty-msg">No hay lecturas para este grado.</p></div>`;
      if (opts.showPdf) appendPdfSection(container, grade);
      return;
    }
    let idx = 0;

    function readingToolbar(card, r) {
      const bar = document.createElement("div");
      bar.className = "reading-toolbar";
      const done = FE()?.isComplete(state.meta, "readings", grade, r.id);
      if (done) {
        const badge = document.createElement("span");
        badge.className = "done-badge";
        badge.textContent = "✓ Completada";
        bar.appendChild(badge);
      }

      const printBtn = document.createElement("button");
      printBtn.type = "button";
      printBtn.className = "btn btn--ghost btn--small";
      printBtn.textContent = "🖨 Imprimir";
      printBtn.addEventListener("click", () => {
        if (!FE()?.printReading(r)) toast("Permite ventanas emergentes para imprimir", "error");
      });
      bar.appendChild(printBtn);
      card.insertBefore(bar, card.querySelector(".reading-text") || card.firstChild);
    }

    function showReading() {
      container.innerHTML = "";
      if (!readings[idx]) {
        updateHubProgress(grade);
        showRocketAnimation(() => {
          openGradeHub(grade);
        });
        return;
      }
      const r = readings[idx];
      const card = document.createElement("div");
      card.className = "card card--lectura";
      card.innerHTML = `
        <p class="card__title">${r.title}</p>
        <div class="progress-bar"><div class="progress-bar__fill" style="width:${((idx + 1) / readings.length) * 100}%"></div></div>
        <p class="reading-text reading-text--large">${r.text}</p>
      `;
      readingToolbar(card, r);
      container.appendChild(card);
      renderQuestionBlock(
        container,
        r.questions,
        0,
        () => {
          markModuleComplete("readings", grade, r.id);
          idx++;
          showReading();
        },
        "card--lectura",
        { failKey: `r${grade}-${r.id}`, reading: r }
      );
    }
    showReading();
  }

  function renderSeasonal(container) {
    let readings = APP_DATA.SEASONAL_READINGS || [];
    if (!Array.isArray(readings)) readings = readings[state.currentGrade] || readings["default"] || [];
    let idx = 0;
    function show() {
      container.innerHTML = "";
      if (!readings[idx]) {
        updateHubProgress(state.currentGrade);
        showRocketAnimation(() => {
          openGradeHub(state.currentGrade);
        });
        return;
      }
      const r = readings[idx];
      const card = document.createElement("div");
      card.className = "card card--lectura";
      card.innerHTML = `
        <p class="card__title">${r.title}</p>
        <div class="progress-bar"><div class="progress-bar__fill" style="width:${((idx + 1) / readings.length) * 100}%"></div></div>
        <p class="reading-text reading-text--large">${r.text}</p>
      `;
      container.appendChild(card);
      renderQuestionBlock(
        container,
        r.questions,
        0,
        () => {
          markModuleComplete("seasonal", null, r.id);
          idx++;
          show();
        },
        "card--lectura",
        { failKey: `sp-${r.id}`, reading: r }
      );
    }
    show();
  }



  function getShuffledOptions(q) {
    const items = q.options.map((text, origIndex) => ({
      text,
      isCorrect: origIndex === q.correct,
    }));
    return shuffle(items);
  }

  function renderQuestionBlock(container, questions, qIndex, onComplete, moduleClass = "card--lectura", opts = {}) {
    if (!questions || !questions[qIndex]) {
      if (onComplete) onComplete();
      return;
    }
    const q = questions[qIndex];
    const shuffled = getShuffledOptions(q);
    const block = document.createElement("div");
    block.className = `card ${moduleClass} question-block`;
    block.innerHTML = `<p>${q.q}</p>`;
    const answered = { done: false };
    const hintUsed = { done: false };
    const hintBtn = document.createElement("button");
    hintBtn.type = "button";
    hintBtn.className = "btn btn--ghost btn--hint";
    hintBtn.textContent = state.hints > 0 ? `💡 Usar pista (${state.hints})` : `💡 Pista (0) — ¡Consigue en tienda!`;
    hintBtn.addEventListener("click", () => {
      if (answered.done) return;
      if (state.hints <= 0) {
        toast("Tienes 0 Pistas Mágicas. ¡Ve a Recompensas 🎁 para canjear más!", "error");
        return;
      }
      if (hintUsed.done) return;
      hintUsed.done = true;
      state.hints--;
      saveState();
      updateModuleRewardsBar();
      const wrongBtns = [...block.querySelectorAll('.btn--answer[data-correct="false"]')];
      shuffle(wrongBtns)
        .slice(0, 2)
        .forEach((b) => {
          b.disabled = true;
          b.classList.add("hint-hidden");
        });
      hintBtn.disabled = true;
      hintBtn.textContent = "💡 Pista usada";
      toast("¡Pista! Se ocultaron 2 opciones incorrectas");
    });
    block.appendChild(hintBtn);

    shuffled.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn--answer";
      btn.textContent = opt.text;
      btn.dataset.correct = opt.isCorrect ? "true" : "false";
      btn.addEventListener("click", () => {
        if (answered.done) return;
        answered.done = true;
        block.querySelectorAll(".btn--answer").forEach((b) => (b.disabled = true));
        if (opt.isCorrect) {
          btn.classList.add("correct");
          if (opts.failKey) FE()?.clearQuestionFail(state.meta, `${opts.failKey}-q${qIndex}`);
          awardCorrect(q.difficulty || "easy", moduleClass);
          setTimeout(() => {
            block.remove();
            renderQuestionBlock(container, questions, qIndex + 1, onComplete, moduleClass, opts);
          }, 700);
        } else {
          btn.classList.add("wrong");
          setTimeout(() => {
            block.remove();
            renderQuestionBlock(container, questions, qIndex + 1, onComplete, moduleClass, opts);
          }, 550);
        }
      });
      block.appendChild(btn);
    });
    container.appendChild(block);
  }

  /* ——— Rimas y ritmo (solo 1°) ——— */
  function renderRitmo(container) {
    const actividades = APP_DATA.RITMO_PRIMERO || [];
    let idx = 0;

    const tipoEmoji = { rima: "🎵", trabalengua: "👅", eco: "🔁", silabas: "👏" };

    function showActividad() {
      container.innerHTML = "";
      if (!actividades[idx]) {
        addCp(20, "¡Terminaste Rimas y ritmo!");
        showRocketAnimation(() => {
          openGradeHub(1);
        });
        return;
      }

      const a = actividades[idx];
      const intro =
        idx === 0
          ? `<p class="game-instructions">Lee en <strong>voz alta</strong> (sin música). Rimás, trabalenguas y lectura en eco.</p>`
          : "";
      const card = document.createElement("div");
      card.className = "card card--ritmo";
      card.innerHTML = `
        ${intro}
        <p class="ritmo-tipo">${tipoEmoji[a.tipo] || "🗣️"} ${a.tipo || "actividad"}</p>
        <p class="card__title">${a.title}</p>
        <p class="game-instructions">${a.instruction}</p>
        <div class="progress-bar"><div class="progress-bar__fill" style="width:${((idx + 1) / actividades.length) * 100}%"></div></div>
        <p class="reading-text reading-text--large ritmo-text">${a.text.replace(/\n/g, "<br/>")}</p>
      `;
      container.appendChild(card);
      renderQuestionBlock(
        container,
        a.questions,
        0,
        () => {
          markModuleComplete("ritmo", 1, a.id);
          idx++;
          showActividad();
        },
        "card--ritmo"
      );
    }

    showActividad();
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getGameTier(game, grade) {
    const tierId = game.tier || APP_DATA.GRADE_GAME_TIER?.[grade];
    if (!tierId) return null;
    return APP_DATA.GAME_TIERS?.[tierId] || null;
  }

  /* ——— Juegos interactivos ——— */
  function renderLevelPicker(container, grade) {
    container.innerHTML = "";

    const GRADE_LEVELS_META = {
      1: [
        { num: 1, name: "Inicio de Letras", desc: "Memoria de palabras, Empareja imagen y palabra, Arma la palabra con sílabas simples." },
        { num: 2, name: "Palabras en Órbita", desc: "Memoria cósmica, Empareja en órbita y Arma la palabra II." },
        { num: 3, name: "Sonidos y Dibujos", desc: "Memoria de sonidos, Une sonidos y Arma la palabra III." },
        { num: 4, name: "Despegue Lector", desc: "Memoria del despegue, Empareja y vuela y Arma la palabra IV." }
      ],
      2: [
        { num: 1, name: "Ordenar y Buscar", desc: "Sopa de la carrera, Frutas galácticas y Espacio estelar." },
        { num: 2, name: "Sílabas y Categorías", desc: "Construcción cósmica, El almacén espacial y Animales y naves." },
        { num: 3, name: "Columnas y Frases", desc: "Parejas opuestas, Sopa de la noche y Viaje espacial." },
        { num: 4, name: "Misión Final", desc: "Palabras gemelas, Biósfera galáctica y Misión despegue." }
      ],
      3: [
        { num: 1, name: "Conceptos y Clasificación", desc: "Clasifica palabras, Encuentra al intruso y Búsqueda terrestre." },
        { num: 2, name: "Exploradores de Palabras", desc: "Alimentos sanos, El intruso II y Ríos y mares en la cuadrícula." },
        { num: 3, name: "El Espacio de Sinónimos", desc: "Parejas de opuestos, El intruso de cuatro patas y Fenómenos del cielo." },
        { num: 4, name: "Misión Cosmos", desc: "Parejas de sinónimos, Útiles y diversión y Misión Cosmos final." }
      ],
      4: [
        { num: 1, name: "Estructuras y Columnas", desc: "Sopa de biblioteca, Une las columnas y Sopa de letras espacial." },
        { num: 2, name: "Guardianes de la Frase", desc: "Sopa de cuentos, Parejas de opuestos y Sopa de libros." },
        { num: 3, name: "Misión Ortografía", desc: "Clasificación por acento, Sopa del cielo y Búsqueda estelar." },
        { num: 4, name: "Exploración Planetaria", desc: "Clase de gramática, Asociación de profesiones y Misión Espacio final." }
      ],
      5: [
        { num: 1, name: "Desafíos Heroicos", desc: "Rayos de la verdad, Sopa del explorador y Sopa heroica en modo ⚔️ Heroico." },
        { num: 2, name: "Escudo del Saber", desc: "Estrategias de lectura, Sopa del sistema solar y Sopa de la Antártida." },
        { num: 3, name: "Misión Científica", desc: "Hecho contra opinión, Sopa de la fotosíntesis y Método Científico." },
        { num: 4, name: "Héroes Lectores", desc: "Gramática espacial, Vocabulario de nivel superior y Exploración Cósmica." }
      ],
      6: [
        { num: 1, name: "Misiones Legendarias", desc: "Puente de sinónimos, Hecho u opinión y Sopa legendaria en modo 👑 Legendario." },
        { num: 2, name: "Leyendas de la Lectura", desc: "Enigmas de la relatividad, Sinónimos del cosmos y Física estelar." },
        { num: 3, name: "Enigmas de la Galaxia", desc: "Categorías gramaticales avanzadas, Sopa de teorías físicas y Pioneros espaciales." },
        { num: 4, name: "Corona Lector", desc: "Lógica computacional y IA, Léxico de excelencia y Misión Suprema final." }
      ]
    };

    const allGames = APP_DATA.GAMES[grade] || [];
    const numLevels = Math.ceil(allGames.length / 3);

    const wrapper = document.createElement("div");
    wrapper.className = "level-picker-container";
    wrapper.innerHTML = `
      <p class="game-instructions" style="text-align: center; margin-bottom: 0.5rem; width: 100%; max-width: 600px;">
        Completa los bloques de juegos de cada nivel para desbloquear el siguiente y hacer despegar tu cohete 🚀
      </p>
      <div class="level-picker"></div>
    `;
    const picker = wrapper.querySelector(".level-picker");

    const levels = [];
    for (let i = 0; i < numLevels; i++) {
      const meta = GRADE_LEVELS_META[grade]?.[i] || {
        num: i + 1,
        name: `Bloque ${i + 1}`,
        desc: `Completa los juegos del bloque ${i + 1}.`
      };
      const lvlGames = allGames.slice(i * 3, (i + 1) * 3).map(g => g.id);
      levels.push({
        num: meta.num,
        name: meta.name,
        desc: meta.desc,
        games: lvlGames
      });
    }

    levels.forEach((lvl, idx) => {
      const isLvlCompleted = lvl.games.every(id => FE()?.isComplete(state.meta, "games", grade, id));
      let isLvlUnlocked = idx === 0;
      if (idx > 0) {
        const prevLvl = levels[idx - 1];
        isLvlUnlocked = prevLvl.games.every(id => FE()?.isComplete(state.meta, "games", grade, id));
      }

      let statusClass = "level-card--locked";
      let statusBadge = `<span class="level-card__badge level-card__badge--locked">🔒 Bloqueado</span>`;
      let btnLabel = "Bloqueado";
      let btnClass = "btn--disabled";

      if (isLvlUnlocked) {
        statusClass = "";
        statusBadge = `<span class="level-card__badge level-card__badge--unlocked">🟢 Disponible</span>`;
        btnLabel = "Jugar";
        btnClass = "btn--accent";
      }
      if (isLvlCompleted) {
        statusClass = "level-card--completed";
        statusBadge = `<span class="level-card__badge level-card__badge--completed">⭐ Completado</span>`;
        btnLabel = "Rejugar";
        btnClass = "btn--primary";
      }

      const card = document.createElement("div");
      card.className = `level-card ${statusClass}`;
      card.innerHTML = `
        ${statusBadge}
        <h3 class="level-card__title">Nivel ${lvl.num}: ${lvl.name}</h3>
        <p class="level-card__desc">${lvl.desc}</p>
        <button type="button" class="btn ${btnClass} btn--small" ${!isLvlUnlocked ? "disabled" : ""}>${btnLabel}</button>
      `;

      if (isLvlUnlocked) {
        card.querySelector("button").addEventListener("click", () => {
          renderJuegos(container, grade, idx);
        });
      }

      picker.appendChild(card);
    });

    container.appendChild(wrapper);
  }

  function renderJuegos(container, grade, levelIdx = null) {
    let games = APP_DATA.GAMES[grade] || [];
    if (games.length > 0) {
      if (levelIdx === null) {
        renderLevelPicker(container, grade);
        return;
      } else {
        games = games.slice(levelIdx * 3, (levelIdx + 1) * 3);
      }
    }

    let gameIdx = 0;
    const gradeTier = APP_DATA.GRADE_GAME_TIER?.[grade];
    const gradeTierMeta = gradeTier ? APP_DATA.GAME_TIERS?.[gradeTier] : null;

    if (games.length === 0) {
      container.innerHTML = `<div class="card card--juegos"><p class="empty-msg">No hay juegos para este grado todavía.</p></div>`;
      return;
    }

    function gameCp(amount, reason, tier) {
      const pts = tier?.cpHit ?? amount;
      addCp(pts, reason);
    }

    function handleGameHint(game, zone) {
      if (state.hints <= 0) return;

      let used = false;
      switch (game.type) {
        case "memory": {
          const cards = zone.querySelectorAll(".memory-card:not(.matched):not(.flipped)");
          if (cards.length >= 2) {
            cards[0].classList.add("flipped", "hint-glow-effect");
            cards[1].classList.add("flipped", "hint-glow-effect");
            cards[0].querySelector(".back")?.classList.add("hidden");
            cards[0].querySelector(".face")?.classList.remove("hidden");
            cards[1].querySelector(".back")?.classList.add("hidden");
            cards[1].querySelector(".face")?.classList.remove("hidden");
            setTimeout(() => {
              cards[0].classList.remove("hint-glow-effect");
              cards[1].classList.remove("hint-glow-effect");
              if (!cards[0].classList.contains("matched")) {
                cards[0].classList.remove("flipped");
                cards[0].querySelector(".back")?.classList.remove("hidden");
                cards[0].querySelector(".face")?.classList.add("hidden");
              }
              if (!cards[1].classList.contains("matched")) {
                cards[1].classList.remove("flipped");
                cards[1].querySelector(".back")?.classList.remove("hidden");
                cards[1].querySelector(".face")?.classList.add("hidden");
              }
            }, 2500);
            used = true;
            toast("💡 Pista: ¡Se revelaron 2 cartas por unos segundos!");
          }
          break;
        }
        case "match": {
          const cards = zone.querySelectorAll(".match-card:not(:disabled)");
          if (cards.length >= 2) {
            cards[0].classList.add("hint-glow-effect");
            cards[1].classList.add("hint-glow-effect");
            setTimeout(() => {
              cards[0]?.classList.remove("hint-glow-effect");
              cards[1]?.classList.remove("hint-glow-effect");
            }, 2500);
            used = true;
            toast("💡 Pista: ¡Mira las tarjetas destacadas!");
          }
          break;
        }
        case "order": {
          const chip = zone.querySelector(".order-chip:not(.order-chip--used):not(.order-chip--trap)");
          if (chip) {
            chip.click();
            used = true;
            toast("💡 Pista: ¡Se añadió una palabra a la frase!");
          }
          break;
        }
        case "syllables": {
          const chip = zone.querySelector(".order-chip:not(:disabled)");
          if (chip) {
            chip.click();
            used = true;
            toast("💡 Pista: ¡Se colocó la siguiente sílaba!");
          }
          break;
        }
        case "categorize": {
          const word = zone.querySelector(".cat-word:not(.cat-word--selected)");
          const bucket = zone.querySelector(".cat-bucket");
          if (word && bucket) {
            word.classList.add("hint-glow-effect");
            bucket.classList.add("hint-glow-effect");
            setTimeout(() => {
              word.classList.remove("hint-glow-effect");
              bucket.classList.remove("hint-glow-effect");
            }, 2500);
            used = true;
            toast("💡 Pista: Revisa la palabra y categoría destacadas");
          }
          break;
        }
        case "odd": {
          const cards = zone.querySelectorAll(".odd-grid .match-card:not(.wrong):not(.correct)");
          if (cards.length > 1) {
            cards[0].classList.add("hint-glow-effect");
            setTimeout(() => cards[0]?.classList.remove("hint-glow-effect"), 2500);
            used = true;
            toast("💡 Pista: ¡Atención a la tarjeta destacada!");
          }
          break;
        }
        case "truefalse": {
          const btn = zone.querySelector(".tf-btn");
          if (btn) {
            btn.classList.add("hint-glow-effect");
            setTimeout(() => btn?.classList.remove("hint-glow-effect"), 2500);
            used = true;
            toast("💡 Pista: Botón sugerido destacado");
          }
          break;
        }
        case "columns": {
          const colL = zone.querySelector(".columns-col");
          const colR = zone.querySelectorAll(".columns-col")[1];
          if (colL && colR) {
            const cardL = colL.querySelector(".columns-card:not(:disabled)");
            const cardR = colR.querySelector(".columns-card:not(:disabled)");
            if (cardL && cardR) {
              cardL.classList.add("hint-glow-effect");
              cardR.classList.add("hint-glow-effect");
              setTimeout(() => {
                cardL.classList.remove("hint-glow-effect");
                cardR.classList.remove("hint-glow-effect");
              }, 2500);
              used = true;
              toast("💡 Pista: ¡Se destacaron elementos de las columnas!");
            }
          }
          break;
        }
        case "wordsearch": {
          const cells = zone.querySelectorAll(".ws-cell:not(.ws-cell--hit)");
          if (cells.length) {
            const pick = cells[Math.floor(Math.random() * cells.length)];
            pick.classList.add("hint-glow-effect");
            setTimeout(() => pick.classList.remove("hint-glow-effect"), 2500);
            used = true;
            toast("💡 Pista: ¡Una letra clave ha sido iluminada!");
          }
          break;
        }
        case "arcade-catch": {
          toast("💡 Pista: ¡Muévete con los botones o flechas para atrapar las letras objetivo!");
          used = true;
          break;
        }
      }

      if (used) {
        state.hints--;
        saveState();
        updateModuleRewardsBar();
        FE()?.playSFX('reward');
      }
    }

    function mountGameShell(game, areaEl) {
      const tier = getGameTier(game, grade);
      const shell = document.createElement("div");
      shell.className = "card card--juegos" + (tier ? ` card--tier-${tier.id}` : "");
      const tierBadge = tier
        ? `<span class="game-tier-badge game-tier-badge--${tier.id}">${tier.icon} Nivel ${tier.label}</span>`
        : "";
      const tierIntro =
        gameIdx === 0 && gradeTierMeta
          ? `<p class="game-instructions game-instructions--tier">En ${grade}° juegas en modo <strong>${gradeTierMeta.icon} ${gradeTierMeta.label}</strong>: más recompensas y retos mayores.</p>`
          : "";
      const intro =
        gameIdx === 0 && !gradeTierMeta
          ? `<p class="game-instructions">Tienes ${games.length} juegos. Ganas CP al jugar bien. ¡Diviértete!</p>`
          : "";
      shell.innerHTML = `
        ${tierBadge}
        <p class="card__title">🎮 Juego ${gameIdx + 1} de ${games.length}: ${game.title}</p>
        ${tierIntro}
        ${intro}
        <p class="game-instructions">${game.instruction}</p>
        <div class="progress-bar"><div class="progress-bar__fill" style="width:${((gameIdx + 1) / games.length) * 100}%"></div></div>
        <p class="game-mistakes hidden" id="game-mistakes"></p>
        <p class="game-timer hidden" id="game-timer"></p>
      `;

      const powerupBar = document.createElement("div");
      powerupBar.className = "game-powerups-toolbar";

      const hintBtn = document.createElement("button");
      hintBtn.type = "button";
      hintBtn.className = "powerup-btn powerup-btn--hint";
      hintBtn.textContent = state.hints > 0 ? `💡 Usar pista (${state.hints})` : `💡 Pista (0) — Consigue en tienda 🎁`;
      hintBtn.addEventListener("click", () => {
        if (state.hints <= 0) {
          toast("Tienes 0 Pistas Mágicas. ¡Ve a Recompensas 🎁 para canjear más!", "error");
          return;
        }
        handleGameHint(game, zone);
        if (state.hints > 0) hintBtn.textContent = `💡 Usar pista (${state.hints})`;
        else hintBtn.textContent = `💡 Pista (0) — Consigue en tienda 🎁`;
      });
      powerupBar.appendChild(hintBtn);

      if (state.extraLives > 0) {
        const lifeTag = document.createElement("span");
        lifeTag.className = "powerup-btn powerup-btn--life";
        lifeTag.textContent = `❤️ Vidas (${state.extraLives})`;
        powerupBar.appendChild(lifeTag);
      }

      if (state.heroicShield > 0) {
        const shieldTag = document.createElement("span");
        shieldTag.className = "powerup-btn powerup-btn--shield";
        shieldTag.textContent = `🛡️ Escudo (${state.heroicShield})`;
        powerupBar.appendChild(shieldTag);
      }

      if (state.timeBoosts > 0) {
        const timeTag = document.createElement("span");
        timeTag.className = "powerup-btn powerup-btn--time";
        timeTag.textContent = `⏱️ Reloj (${state.timeBoosts})`;
        powerupBar.appendChild(timeTag);
      }

      shell.appendChild(powerupBar);

      const zone = document.createElement("div");
      zone.className = "game-zone";
      shell.appendChild(zone);
      container.appendChild(shell);
      areaEl(zone, tier, shell);
    }

    function finishGame(tier) {
      const g = games[gameIdx];
      if (g?.id) markModuleComplete("games", grade, g.id);
      addCp(tier?.cpComplete ?? 18, tier ? `¡Juego ${tier.label} completado!` : "¡Juego completado!");
      gameIdx++;
      showGame();
    }

    function showGame() {
      container.innerHTML = "";
      if (!games[gameIdx]) {
        const tier = gradeTierMeta;
        let tierMsg, titleMsg, bonusCp, finalCallback;
        if (levelIdx !== null) {
          titleMsg = "¡Nivel de juegos completado!";
          tierMsg = `¡Superaste con éxito el Nivel ${levelIdx + 1}! Prepárate para despegar.`;
          bonusCp = 20;
          finalCallback = () => renderJuegos(container, grade);
        } else {
          titleMsg = "¡Todos los juegos listos!";
          tierMsg = tier
            ? `Dominaste el modo ${tier.icon} ${tier.label} de ${grade}°.`
            : `Completaste los ${games.length} juegos de ${grade}°.`;
          bonusCp = tier?.cpMission ?? 25;
          finalCallback = () => openGradeHub(grade);
        }

        container.innerHTML = `
          <div class="card card--juegos${tier ? ` card--tier-${tier.id}` : ""}">
            ${tier ? `<span class="game-tier-badge game-tier-badge--${tier.id}">${tier.icon} ${tier.label}</span>` : ""}
            <p class="card__title">${titleMsg}</p>
            <p class="game-instructions">${tierMsg} 🚀</p>
          </div>`;
        addCp(bonusCp, levelIdx !== null ? `¡Nivel ${levelIdx + 1} superado!` : (tier ? `¡Misión ${tier.label}!` : "¡Misión de juegos!"));
        updateHubProgress(grade);
        if (tier) celebrate();
        showRocketAnimation(finalCallback);
        return;
      }
      const game = games[gameIdx];
      let mistakes = 0;
      const tier = getGameTier(game, grade);
      const mistakesEl = () => document.getElementById("game-mistakes");
      const timerEl = () => document.getElementById("game-timer");

      function updateMistakesUI() {
        const el = mistakesEl();
        if (!el || !tier) return;
        el.classList.remove("hidden");
        const left = Math.max(0, tier.maxMistakes - mistakes);
        el.textContent =
          left > 0
            ? `${tier.icon} Errores: ${mistakes}/${tier.maxMistakes} — te quedan ${left}`
            : `${tier.icon} ¡Última oportunidad!`;
        el.classList.toggle("game-mistakes--danger", left <= 0);
      }

      function onMistake(restartFn) {
        if (state.heroicShield > 0) {
          state.heroicShield--;
          saveState();
          updateModuleRewardsBar();
          toast("🛡️ ¡Escudo heroico activado! Error perdonado");
          FE()?.playSFX('correct');
          return false;
        }
        if (state.extraLives > 0) {
          state.extraLives--;
          saveState();
          updateModuleRewardsBar();
          toast("❤️ ¡Vida extra utilizada! Error perdonado");
          FE()?.playSFX('correct');
          return false;
        }
        if (!tier) return false;
        mistakes++;
        updateMistakesUI();
        if (mistakes > tier.maxMistakes) {
          toast(`Modo ${tier.label}: demasiados errores. ¡Reinicia el juego!`, "error");
          mistakes = 0;
          if (restartFn) restartFn();
          else showGame();
          return true;
        }
        return false;
      }

      function startTimer(onTimeout) {
        const el = timerEl();
        if (!el || !tier?.timerSec) return null;
        el.classList.remove("hidden");

        let boostBtn = null;
        if (state.timeBoosts > 0 && tier?.id === "legendary") {
          boostBtn = document.createElement("button");
          boostBtn.type = "button";
          boostBtn.className = "btn btn--ghost btn--time-boost";
          boostBtn.textContent = `⏱️ +8 s (${state.timeBoosts})`;
          el.parentElement?.insertBefore(boostBtn, el.nextSibling);
        }

        let sec = tier.timerSec;
        el.textContent = `⏱ ${sec}s`;
        let id = null;

        function tick() {
          sec--;
          el.textContent = `⏱ ${sec}s`;
          el.classList.toggle("game-timer--urgent", sec <= 4);
          if (sec <= 0) {
            clearInterval(id);
            if (boostBtn) boostBtn.remove();
            onTimeout();
          }
        }
        id = setInterval(tick, 1000);

        if (boostBtn) {
          boostBtn.addEventListener("click", () => {
            if (state.timeBoosts <= 0) return;
            state.timeBoosts--;
            sec += 8;
            saveState();
            updateModuleRewardsBar();
            boostBtn.textContent = `⏱️ +8 s (${state.timeBoosts})`;
            toast("⏱️ Reloj legendario: +8 segundos");
            if (state.timeBoosts <= 0) boostBtn.remove();
          });
        }

        return () => {
          clearInterval(id);
          if (boostBtn) boostBtn.remove();
          el.classList.add("hidden");
          el.classList.remove("game-timer--urgent");
        };
      }

      mountGameShell(game, (zone, shellTier, shell) => {
        if (shellTier) updateMistakesUI();
        const t = shellTier || tier;
        const onWin = () => finishGame(t);
        const restart = () => {
          gameIdx = games.indexOf(game);
          showGame();
        };

        switch (game.type) {
          case "memory":
            playMemory(game, zone, onWin, t);
            break;
          case "match":
            playMatch(game, zone, onWin, t);
            break;
          case "order":
            playOrder(game, zone, onWin, t, onMistake);
            break;
          case "categorize":
            playCategorize(game, zone, onWin, t, onMistake);
            break;
          case "odd":
            playOdd(game, zone, onWin, t);
            break;
          case "truefalse":
            playTrueFalse(game, zone, onWin, t, onMistake, startTimer);
            break;
          case "columns":
            playColumns(game, zone, onWin, t, onMistake, startTimer);
            break;
          case "syllables":
            playSyllables(game, zone, onWin, t);
            break;
          case "wordsearch":
            playWordsearch(game, zone, onWin, tier);
            break;
          case "arcade-catch":
            playArcadeCatch(game, zone, onWin, tier, startTimer, onMistake);
            break;
          default:
            zone.innerHTML = `<p class="empty-msg">Tipo de juego desconocido.</p>`;
        }
      });
    }

    function playMemory(game, zone, onWin, tier) {
      const cards = [];
      game.pairs.forEach((pair, pi) => {
        pair.forEach((face) => cards.push({ pairId: pi, face }));
      });
      const deck = shuffle(cards);
      let flipped = [];
      let matched = 0;
      const grid = document.createElement("div");
      grid.className = "memory-grid";
      const cols = deck.length <= 8 ? 4 : 4;
      grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

      deck.forEach((c, i) => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "memory-card";
        el.dataset.index = String(i);
        el.innerHTML = `<span class="back">?</span><span class="face hidden">${c.face}</span>`;
        el.addEventListener("click", () => {
          if (el.classList.contains("matched") || el.classList.contains("flipped") || flipped.length >= 2) return;
          el.classList.add("flipped");
          el.querySelector(".back").classList.add("hidden");
          el.querySelector(".face").classList.remove("hidden");
          flipped.push({ el, card: c });
          if (flipped.length === 2) {
            const [a, b] = flipped;
            if (a.card.pairId === b.card.pairId) {
              a.el.classList.add("matched");
              b.el.classList.add("matched");
              matched++;
              gameCp(12, "¡Par encontrado!", tier);
              flipped = [];
              if (matched === game.pairs.length) setTimeout(onWin, 600);
            } else {
              setTimeout(() => {
                [a, b].forEach(({ el: cardEl }) => {
                  cardEl.classList.remove("flipped");
                  cardEl.querySelector(".back").classList.remove("hidden");
                  cardEl.querySelector(".face").classList.add("hidden");
                });
                flipped = [];
                if (state.extraLives > 0) {
                  state.extraLives--;
                  saveState();
                  updateModuleRewardsBar();
                  toast("Vida extra usada — sigue jugando ❤️");
                } else {
                  toast("Ese par no coincide. ¡Intenta otra vez!", "error");
                }
              }, 700);
            }
          }
        });
        grid.appendChild(el);
      });
      zone.appendChild(grid);
    }

    function playMatch(game, zone, onWin, tier) {
      const items = [];
      game.pairs.forEach((pair, pi) => {
        items.push({ id: `${pi}-a`, pairId: pi, label: pair[0] });
        items.push({ id: `${pi}-b`, pairId: pi, label: pair[1] });
      });
      let selected = null;
      let done = 0;
      const grid = document.createElement("div");
      grid.className = "match-grid";
      shuffle(items).forEach((item) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "match-card";
        btn.textContent = item.label;
        btn.addEventListener("click", () => {
          if (btn.disabled) return;
          if (!selected) {
            selected = { btn, item };
            btn.classList.add("match-card--selected");
            return;
          }
          if (selected.btn === btn) {
            btn.classList.remove("match-card--selected");
            selected = null;
            return;
          }
          if (selected.item.pairId === item.pairId) {
            btn.disabled = true;
            selected.btn.disabled = true;
            btn.classList.remove("match-card--selected");
            selected.btn.classList.remove("match-card--selected");
            done++;
            gameCp(10, "¡Emparejaste!", tier);
            selected = null;
            if (done === game.pairs.length) setTimeout(onWin, 500);
          } else {
            btn.classList.add("wrong");
            selected.btn.classList.add("wrong");
            setTimeout(() => {
              btn.classList.remove("wrong", "match-card--selected");
              selected.btn.classList.remove("wrong", "match-card--selected");
              selected = null;
            }, 600);
            toast("No van juntos. Prueba otra pareja.", "error");
          }
        });
        grid.appendChild(btn);
      });
      zone.appendChild(grid);
    }

    function playOrder(game, zone, onWin, tier, onMistake) {
      const target = game.words.map((w) => w.toLowerCase());
      const decoys = (game.decoys || []).map((w) => w.toLowerCase());
      const picked = [];
      // Add hint button for phrase game
      const hintBtn = document.createElement('button');
      hintBtn.type = 'button';
      hintBtn.className = 'btn btn--accent btn--small';
      hintBtn.textContent = '💡 Pista';
      hintBtn.addEventListener('click', () => {
        if (state.hints <= 0) return toast('No tienes pistas', 'error');
        if (picked.length < target.length) {
          const next = target[picked.length];
          picked.push(next);
          row.textContent = picked.join('-');
          state.hints--;
          saveState();
          updateModuleRewardsBar();
          toast('Pista usada: palabra añadida');
          if (picked.length === target.length) {
            gameCp(12, '¡Frase completa con pista!', tier);
            setTimeout(onWin, 600);
          }
        }
      });
      zone.appendChild(hintBtn);

      const row = document.createElement("div");
      row.className = "order-picked";
      row.textContent = "Tu frase: (toca las palabras abajo)";
      const pool = document.createElement("div");
      pool.className = "order-pool";
      const words = shuffle([...game.words, ...(game.decoys || [])]);

      function resetPicked() {
        picked.length = 0;
        pool.querySelectorAll(".order-chip").forEach((b) => {
          b.disabled = false;
          b.classList.remove("order-chip--used", "order-chip--trap");
        });
        refreshPicked();
      }

      function refreshPicked() {
        row.textContent = picked.length ? picked.join(" ") : "Tu frase: (toca las palabras abajo)";
      }

      words.forEach((w) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "order-chip" + (decoys.includes(w.toLowerCase()) ? " order-chip--trap" : "");
        btn.textContent = w;
        btn.addEventListener("click", () => {
          if (btn.disabled) return;
          if (decoys.includes(w.toLowerCase())) {
            btn.classList.add("wrong");
            toast("¡Palabra trampa! No va en la frase.", "error");
            if (onMistake(() => resetPicked())) return;
            setTimeout(() => btn.classList.remove("wrong"), 600);
            return;
          }
          picked.push(w);
          btn.disabled = true;
          btn.classList.add("order-chip--used");
          refreshPicked();
          if (picked.length === game.words.length) {
            const ok = picked.every((word, i) => word.toLowerCase() === target[i]);
            if (ok) {
              row.classList.add("order-picked--ok");
              gameCp(15, "¡Frase heroica completa!", tier);
              setTimeout(onWin, 700);
            } else {
              toast("El orden no es correcto. ¡Reinicia!", "error");
              if (onMistake(() => resetPicked())) return;
              setTimeout(resetPicked, 1200);
            }
          }
        });
        pool.appendChild(btn);
      });

      const reset = document.createElement("button");
      reset.type = "button";
      reset.className = "btn btn--ghost order-reset";
      reset.textContent = "↺ Reiniciar frase";
      reset.addEventListener("click", resetPicked);

      zone.append(row, pool, reset);
    }

    function playCategorize(game, zone, onWin, tier, onMistake) {
      let selectedWord = null;
      const remaining = [];
      game.categories.forEach((cat) =>
        cat.words.forEach((w) => remaining.push({ word: w, catId: cat.id, placed: false }))
      );
      shuffle(remaining);
      let placed = 0;
      const total = remaining.length;

      const wordBar = document.createElement("div");
      wordBar.className = "cat-words";
      const buckets = document.createElement("div");
      buckets.className = "cat-buckets";

      game.categories.forEach((cat) => {
        const box = document.createElement("button");
        box.type = "button";
        box.className = "cat-bucket";
        box.dataset.cat = cat.id;
        box.innerHTML = `<span class="cat-bucket__label">${cat.label}</span><span class="cat-bucket__items"></span>`;
        box.addEventListener("click", () => {
          if (!selectedWord) {
            toast("Primero elige una palabra arriba", "error");
            return;
          }
          if (selectedWord.catId === cat.id) {
            const tag = document.createElement("span");
            tag.className = "cat-tag";
            tag.textContent = selectedWord.word;
            box.querySelector(".cat-bucket__items").appendChild(tag);
            placed++;
            selectedWord.placed = true;
            gameCp(10, "¡Bien clasificado!", tier);
            selectedWord.btn.remove();
            selectedWord = null;
            wordBar.querySelectorAll(".cat-word").forEach((b) => b.classList.remove("cat-word--selected"));
            if (placed === total) setTimeout(onWin, 500);
          } else {
            toast("Esa palabra va en otra categoría", "error");
            if (isEffectActive("classify-hint") && selectedWord) {
              const cat = game.categories.find((c) => c.id === selectedWord.catId);
              if (cat) toast(`Pista: va en ${cat.label}`, "error");
            }
            if (isEffectActive("fact-hint") && selectedWord) {
              toast(
                selectedWord.catId === "hecho"
                  ? "Pista: es algo que se puede comprobar"
                  : "Pista: es un juicio personal",
                "error"
              );
            }
            onMistake();
          }
        });
        buckets.appendChild(box);
      });

      function renderWords() {
        wordBar.innerHTML = "";
        remaining.forEach((item) => {
          if (item.placed) return;
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "cat-word";
          btn.textContent = item.word;
          item.btn = btn;
          btn.addEventListener("click", () => {
            wordBar.querySelectorAll(".cat-word").forEach((b) => b.classList.remove("cat-word--selected"));
            btn.classList.add("cat-word--selected");
            selectedWord = item;
          });
          wordBar.appendChild(btn);
        });
      }
      renderWords();
      zone.append(wordBar, buckets);
    }

    function playOdd(game, zone, onWin, tier) {
      let setIdx = 0;
      function showSet() {
        zone.innerHTML = "";
        if (setIdx >= game.sets.length) {
          onWin();
          return;
        }
        let answered = false;
        const set = game.sets[setIdx];
        const grid = document.createElement("div");
        grid.className = "odd-grid";
        shuffle([...set.items]).forEach((word) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "match-card";
          btn.textContent = word;
          btn.addEventListener("click", () => {
            if (answered) return;
            answered = true;
            grid.querySelectorAll(".match-card").forEach((b) => (b.disabled = true));
            if (word === set.odd) {
              btn.classList.add("correct");
              gameCp(14, "¡Encontraste al intruso!", tier);
              setIdx++;
              setTimeout(showSet, 700);
            } else {
              btn.classList.add("wrong");
              setIdx++;
              setTimeout(showSet, 550);
            }
          });
          grid.appendChild(btn);
        });
        zone.appendChild(grid);
      }
      showSet();
    }

    function playTrueFalse(game, zone, onWin, tier, onMistake, startTimer) {
      let i = 0;
      let stopTimer = null;
      let answered = false;

      function show() {
        if (stopTimer) stopTimer();
        stopTimer = null;
        answered = false;
        zone.innerHTML = "";
        if (i >= game.statements.length) {
          onWin();
          return;
        }
        const st = game.statements[i];
        const p = document.createElement("p");
        p.className = "tf-statement";
        p.textContent = st.text;
        const actions = document.createElement("div");
        actions.className = "tf-actions";

        function nextStep(wasCorrect) {
          if (answered) return;
          answered = true;
          if (stopTimer) stopTimer();
          if (!wasCorrect && onMistake(() => show())) {
            i = 0;
            return;
          }
          i++;
          setTimeout(show, wasCorrect ? 700 : 1100);
        }

        if (tier?.timerSec && startTimer) {
          stopTimer = startTimer(() => {
            toast("¡Se acabó el tiempo!", "error");
            nextStep(false);
          });
        }

        shuffle([
          { label: "Verdadero", isTrue: true },
          { label: "Falso", isTrue: false },
        ]).forEach((choice) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn btn--answer tf-btn";
          btn.textContent = choice.label;
          btn.addEventListener("click", () => {
            const ok = choice.isTrue === st.answer;
            actions.querySelectorAll(".tf-btn").forEach((b) => (b.disabled = true));
            if (ok) {
              btn.classList.add("correct");
              gameCp(10, tier ? `¡Acertaste! (${tier.label})` : "¡Correcto!", tier);
            } else {
              btn.classList.add("wrong");
            }
            nextStep(ok);
          });
          actions.appendChild(btn);
        });
        zone.append(p, actions);
      }
      show();
    }

    function playColumns(game, zone, onWin, tier, onMistake, startTimer) {
      const left = shuffle(game.pairs.map((p) => p.left));
      const right = shuffle(game.pairs.map((p) => p.right));
      let selLeft = null;
      let matched = 0;
      let stopTimer = null;
      const wrap = document.createElement("div");
      wrap.className = "columns-wrap";
      const colL = document.createElement("div");
      const colR = document.createElement("div");
      colL.className = "columns-col";
      colR.className = "columns-col";

      const pairMap = {};
      game.pairs.forEach((p) => {
        pairMap[p.left] = p.right;
      });

      function clearTimer() {
        if (stopTimer) {
          stopTimer();
          stopTimer = null;
        }
      }

      function armTimer() {
        clearTimer();
        if (tier?.timerSec && startTimer) {
          stopTimer = startTimer(() => {
            toast("¡Tiempo legendario agotado!", "error");
            selLeft = null;
            colL.querySelectorAll(".columns-card").forEach((b) => b.classList.remove("match-card--selected"));
            onMistake();
          });
        }
      }

      left.forEach((word) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "match-card columns-card";
        btn.textContent = word;
        btn.addEventListener("click", () => {
          if (btn.disabled) return;
          colL.querySelectorAll(".columns-card").forEach((b) => b.classList.remove("match-card--selected"));
          selLeft = word;
          btn.classList.add("match-card--selected");
          armTimer();
        });
        colL.appendChild(btn);
      });

      right.forEach((word) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "match-card columns-card";
        btn.textContent = word;
        btn.addEventListener("click", () => {
          if (!selLeft || btn.disabled) return;
          clearTimer();
          if (pairMap[selLeft] === word) {
            btn.disabled = true;
            colL.querySelector(".match-card--selected").disabled = true;
            colL.querySelector(".match-card--selected").classList.remove("match-card--selected");
            selLeft = null;
            matched++;
            gameCp(10, tier ? `¡Par legendario!` : "¡Unido!", tier);
            if (matched === game.pairs.length) {
              clearTimer();
              setTimeout(onWin, 500);
            }
          } else {
            if (isEffectActive("column-hint") && selLeft) {
              toast(`Pista: «${selLeft}» va con «${pairMap[selLeft]}»`, "error");
            } else {
              toast("Esa pareja no coincide", "error");
            }
            btn.classList.add("wrong");
            setTimeout(() => btn.classList.remove("wrong"), 600);
            selLeft = null;
            colL.querySelectorAll(".columns-card").forEach((b) => b.classList.remove("match-card--selected"));
            onMistake();
          }
        });
        colR.appendChild(btn);
      });

      wrap.append(colL, colR);
      zone.appendChild(wrap);
    }

    function playSyllables(game, zone, onWin, tier) {
      let round = 0;
      const allDecoys = ["ma", "la", "pe", "ro", "ti", "su", "na", "co", "ba", "da", "fe", "lu", "se", "mo", "te", "ni", "cu", "bo", "pi", "fa", "ce", "ci", "za"];
      function showRound() {
        zone.innerHTML = "";
        if (round >= game.rounds.length) {
          onWin();
          return;
        }
        const r = game.rounds[round];
        const picked = [];
        const target = r.parts.map((p) => p.toLowerCase());
        const prompt = document.createElement("p");
        prompt.className = "game-instructions";
        prompt.textContent = `Arma la palabra: ${r.word}`;
        const row = document.createElement("div");
        row.className = "order-picked";
        row.textContent = "Tus sílabas:";
        const pool = document.createElement("div");
        pool.className = "order-pool";
        
        const validDecoys = allDecoys.filter(d => !target.includes(d));
        const extra = shuffle(validDecoys).slice(0, 3);
        const options = [...r.parts, ...extra];
        
        shuffle(options).forEach((part) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "order-chip";
          btn.textContent = part;
          btn.addEventListener("click", () => {
            if (btn.disabled) return;
            picked.push(part);
            btn.disabled = true;
            row.textContent = picked.join("-");
            if (picked.length === r.parts.length) {
              const ok = picked.every((p, i) => p.toLowerCase() === target[i]);
              if (ok) {
                gameCp(12, "¡Palabra armada!", tier);
                round++;
                setTimeout(showRound, 600);
              } else {
                toast("Orden incorrecto — intenta de nuevo", "error");
                setTimeout(showRound, 800);
              }
            }
          });
          pool.appendChild(btn);
        });
        zone.append(prompt, row, pool);
      }
      showRound();
    }

    function playWordsearch(game, zone, onWin, tier) {
      let wordIdx = 0;
      function renderGrid() {
        zone.innerHTML = "";
        const w = game.words[wordIdx];
        if (!w) {
          onWin();
          return;
        }
        const prompt = document.createElement("p");
        prompt.className = "ws-prompt";
        prompt.textContent = `Encuentra: ${w.word} (toca las letras en orden)`;
        const grid = document.createElement("div");
        grid.className = "ws-grid";
        grid.style.gridTemplateColumns = `repeat(${game.grid[0].length}, 1fr)`;
        const picked = [];
        game.grid.forEach((row, ri) => {
          row.split("").forEach((ch, ci) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "ws-cell";
            
            // Reemplazar celdas vacías (con placeholder 'X') por letras aleatorias para aumentar dificultad
            const isWordCell = game.words.some(wObj => 
              wObj.rows.some(coords => coords[0] === ri && coords[1] === ci)
            );
            let letter = ch;
            if (!isWordCell) {
              const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
              letter = alphabet[Math.floor(Math.random() * alphabet.length)];
            }
            btn.textContent = letter;

            btn.addEventListener("click", () => {
              const expected = w.rows[picked.length];
              if (expected && expected[0] === ri && expected[1] === ci) {
                btn.classList.add("ws-cell--hit");
                picked.push([ri, ci]);
                if (picked.length === w.rows.length) {
                  gameCp(14, "¡Palabra encontrada!", tier);
                  wordIdx++;
                  setTimeout(renderGrid, 600);
                }
              } else {
                btn.classList.add("wrong");
                toast("Esa letra no sigue la palabra", "error");
                setTimeout(() => btn.classList.remove("wrong"), 400);
              }
            });
            grid.appendChild(btn);
          });
        });
        zone.append(prompt, grid);
      }
      renderGrid();
    }

    function playArcadeCatch(game, zone, onWin, tier, startTimer, onMistake) {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 300;
      canvas.style.backgroundColor = "rgba(10, 16, 30, 0.8)";
      canvas.style.border = "2px solid var(--neon-cyan)";
      canvas.style.borderRadius = "var(--radius)";
      canvas.style.display = "block";
      canvas.style.margin = "0 auto";
      canvas.style.maxWidth = "100%";
      zone.appendChild(canvas);
      
      const ctx = canvas.getContext("2d");
      let shipX = canvas.width / 2 - 20;
      const shipY = canvas.height - 40;
      const shipW = 40;
      const shipH = 20;
      
      const items = [];
      let score = 0;
      const targetScore = game.target || 5;
      let frameId;
      let isPlaying = true;
      let timerId = null;
      
      const speed = tier?.id === 'heroic' ? 3.5 : (tier?.id === 'legendary' ? 2.5 : 1.8);
      
      let leftDown = false;
      let rightDown = false;
      
      const handleKeyDown = (e) => {
        if (e.key === "ArrowLeft") leftDown = true;
        if (e.key === "ArrowRight") rightDown = true;
      };
      const handleKeyUp = (e) => {
        if (e.key === "ArrowLeft") leftDown = false;
        if (e.key === "ArrowRight") rightDown = false;
      };
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keyup", handleKeyUp);
      
      const touchZone = document.createElement("div");
      touchZone.style.display = "flex";
      touchZone.style.justifyContent = "space-between";
      touchZone.style.marginTop = "1rem";
      touchZone.style.maxWidth = "400px";
      touchZone.style.margin = "1rem auto 0";
      
      const btnLeft = document.createElement("button");
      btnLeft.className = "btn btn--accent";
      btnLeft.textContent = "⬅️ Izquierda";
      const btnRight = document.createElement("button");
      btnRight.className = "btn btn--accent";
      btnRight.textContent = "Derecha ➡️";
      
      [btnLeft, btnRight].forEach((btn, idx) => {
        const isLeft = idx === 0;
        const setDown = (val) => { if(isLeft) leftDown = val; else rightDown = val; };
        btn.addEventListener("touchstart", (e) => { e.preventDefault(); setDown(true); });
        btn.addEventListener("touchend", () => setDown(false));
        btn.addEventListener("mousedown", () => setDown(true));
        btn.addEventListener("mouseup", () => setDown(false));
        btn.addEventListener("mouseleave", () => setDown(false));
        touchZone.appendChild(btn);
      });
      zone.appendChild(touchZone);
      
      function spawnItem() {
        if (!isPlaying) return;
        const isTarget = Math.random() > 0.4;
        const textArr = isTarget ? game.targets : game.decoys;
        const text = textArr[Math.floor(Math.random() * textArr.length)];
        items.push({
          x: Math.random() * (canvas.width - 40) + 10,
          y: -20,
          text,
          isTarget
        });
        setTimeout(spawnItem, 1500 / speed);
      }
      
      function update() {
        if (!isPlaying) return;
        if (leftDown) shipX = Math.max(0, shipX - 5);
        if (rightDown) shipX = Math.min(canvas.width - shipW, shipX + 5);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#6ec9e8";
        ctx.fillRect(shipX, shipY, shipW, shipH);
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font = "16px sans-serif";
        ctx.fillText("🚀", shipX + shipW/2, shipY + 16);
        
        ctx.fillStyle = "#ffeb66";
        ctx.font = "16px sans-serif";
        ctx.fillText(`Puntos: ${score}/${targetScore}`, 50, 20);
        
        for (let i = items.length - 1; i >= 0; i--) {
          const item = items[i];
          item.y += speed;
          
          ctx.fillStyle = item.isTarget ? "#7dd99a" : "#ff6688";
          ctx.font = "18px Arial";
          ctx.fillText(item.text, item.x, item.y);
          
          if (item.y > shipY && item.y < shipY + shipH && item.x > shipX - 20 && item.x < shipX + shipW + 20) {
            items.splice(i, 1);
            if (item.isTarget) {
              score++;
              FE()?.playSFX('correct');
              gameCp(5, "¡Atrapado!", tier);
              if (score >= targetScore) {
                isPlaying = false;
                cleanUp();
                onWin();
              }
            } else {
              FE()?.playSFX('wrong');
              if (onMistake(() => { cleanUp(); playArcadeCatch(game, zone, onWin, tier, startTimer, onMistake); })) {
                isPlaying = false;
                cleanUp();
              }
            }
          } else if (item.y > canvas.height) {
            items.splice(i, 1);
          }
        }
        if (isPlaying) frameId = requestAnimationFrame(update);
      }
      
      function cleanUp() {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("keyup", handleKeyUp);
        cancelAnimationFrame(frameId);
        if (timerId) clearInterval(timerId); // Attempt to clear if it was an interval
      }
      
      if (startTimer) {
        timerId = startTimer(() => {
          isPlaying = false;
          cleanUp();
          toast("¡Tiempo agotado!", "error");
        });
      }
      
      spawnItem();
      update();
    }

    function getAppConfig() {
      return {
        GRADE_LABELS: { 1: "1°", 2: "2°", 3: "3°", 4: "4°", 5: "5°", 6: "6°" },
        CP_PER_CORRECT: { easy: 10, medium: 15, hard: 20 },
      };
    }

    function initDataIfEmpty() {
      if (!window.APP_DATA) {
        window.APP_DATA = {
          ...getAppConfig(),
          GAME_TIERS: {},
          GRADE_GAME_TIER: {},
          REWARDS_BY_GRADE: {},
          getAllRewards: () => [],
          getRewardsForGrade: () => [],
          RITMO_PRIMERO: [],
          READINGS: {},
          SEASONAL_READINGS: {},
          PDF_FOLLOWUP_QUESTIONS: {},
          GAMES: {},
          MISTERIOS_QUINTO: [],
        };
      }
    }

    showGame();
  }

  /* ——— Mi semana, opciones, maestro ——— */
  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function claimAchievement(a) {
    if (!state.meta) return;
    if (!Array.isArray(state.meta.claimedAchievements)) state.meta.claimedAchievements = [];
    if (state.meta.claimedAchievements.includes(a.id)) {
      toast("Este logro ya fue canjeado");
      return;
    }
    const rewardCp = a.cpReward || 50;
    state.cp += rewardCp;
    FE()?.recordCpEarned(state.meta, rewardCp);
    if (a.consumableReward) {
      grantConsumable(a.consumableReward);
    }
    state.meta.claimedAchievements.push(a.id);
    saveState();
    FE()?.playSFX('reward');
    celebrate();
    toast(`¡Canjeaste el logro: ${a.name}! +${rewardCp} CP 🎁`);
    renderWeekly();
  }

  /* ——— Mi semana, opciones, maestro ——— */
  function renderWeekly() {
    const box = $("#weekly-content");
    const list = $("#achievements-list");
    if (!box) return;
    unlockAchievements();
    const s = FE()?.getWeeklySummary(state.meta) || {};
    const rank = FE()?.getGalacticRank(state.cp || 0) || { title: "Novato Estelar", icon: "🧑‍🚀" };
    box.innerHTML = `
      <div style="text-align:center; margin-bottom: 1rem;">
        <div class="galactic-rank-badge">
          <span class="rank-icon">${rank.icon}</span> Rango: <strong>${rank.title}</strong>
        </div>
      </div>
      <div class="weekly-grid">
        <div class="weekly-stat"><span class="weekly-stat__val">${s.cp || 0}</span><span class="weekly-stat__lbl">CP ganados</span></div>
        <div class="weekly-stat"><span class="weekly-stat__val">${s.readings || 0}</span><span class="weekly-stat__lbl">Lecturas</span></div>
        <div class="weekly-stat"><span class="weekly-stat__val">${s.games || 0}</span><span class="weekly-stat__lbl">Juegos</span></div>
        <div class="weekly-stat"><span class="weekly-stat__val">${s.correct || 0}</span><span class="weekly-stat__lbl">Aciertos</span></div>
        <div class="weekly-stat"><span class="weekly-stat__val">${s.activeDays || 0}</span><span class="weekly-stat__lbl">Días activos</span></div>
        <div class="weekly-stat"><span class="weekly-stat__val">${s.streak || 0}</span><span class="weekly-stat__lbl">Racha actual</span></div>
      </div>
      <p class="section-sub">Total CP acumulado: ${state.cp} · Lecturas: ${state.meta.stats.readingsDone} · Juegos: ${state.meta.stats.gamesDone}</p>
      <div style="text-align:center; margin-top: 1rem;">
        <button type="button" id="btn-print-cert" class="btn btn--accent btn--wide" style="font-size:1.1rem; padding: 0.85rem 1.5rem;">
          🎓 Generar Diploma Galáctico (Imprimir / PDF)
        </button>
      </div>
    `;
    $("#btn-print-cert")?.addEventListener("click", () => {
      const ok = FE()?.printCertificate(state.meta, state.studentName, state.currentGrade || state.studentGrade);
      if (!ok) toast("Permite ventanas emergentes para imprimir o guardar tu diploma", "error");
    });
    if (list) {
      list.innerHTML = "";
      const earned = state.meta.achievements || [];
      const claimed = state.meta.claimedAchievements || [];
      (APP_DATA.ACHIEVEMENTS || []).forEach((a) => {
        const li = document.createElement("li");
        const got = earned.includes(a.id);
        const isClaimed = claimed.includes(a.id);
        const cpVal = a.cpReward || 50;

        li.className = isClaimed ? "ach-item ach-item--claimed" : (got ? "ach-item ach-item--got" : "ach-item");

        const infoDiv = document.createElement("div");
        infoDiv.className = "ach-info";
        infoDiv.innerHTML = `
          <div class="ach-title">${got ? "🏅" : "🔒"} ${a.icon} ${a.name} <small style="color:var(--neon-yellow); font-weight:bold;">(+${cpVal} CP)</small></div>
          <div class="ach-desc">${a.desc}</div>
        `;
        li.appendChild(infoDiv);

        if (got && !isClaimed) {
          const claimBtn = document.createElement("button");
          claimBtn.type = "button";
          claimBtn.className = "btn btn--small btn--claim-ach";
          claimBtn.textContent = `🎁 Canjear +${cpVal} CP`;
          claimBtn.addEventListener("click", () => claimAchievement(a));
          li.appendChild(claimBtn);
        } else if (isClaimed) {
          const claimedTag = document.createElement("span");
          claimedTag.className = "ach-claimed-tag";
          claimedTag.textContent = "✓ Canjeado";
          li.appendChild(claimedTag);
        } else {
          const lockedTag = document.createElement("span");
          lockedTag.style.fontSize = "0.8rem";
          lockedTag.style.color = "var(--text-dim)";
          lockedTag.textContent = "En progreso...";
          li.appendChild(lockedTag);
        }
        list.appendChild(li);
      });
    }
    updateCpDisplays();
  }

  function renderOptions() {
    const list = $("#options-list");
    if (!list) return;
    const s = state.meta.settings;
    list.innerHTML = "";

    // Accesibilidad básica
    [
      { key: "dyslexia", label: "Fuente amigable (Lexend)", desc: "Letras más claras para leer" },
      { key: "highContrast", label: "Alto contraste", desc: "Más contraste en pantalla" },
    ].forEach((opt) => {
      const row = document.createElement("label");
      row.className = "option-row";
      row.innerHTML = `
        <input type="checkbox" data-opt="${opt.key}" ${s[opt.key] ? "checked" : ""} />
        <span><strong>${opt.label}</strong><br/><small>${opt.desc}</small></span>
      `;
      row.querySelector("input").addEventListener("change", (e) => {
        s[opt.key] = e.target.checked;
        saveState();
        FE()?.applyAccessibility(s);
        toast(s[opt.key] ? `${opt.label} activado` : `${opt.label} desactivado`);
      });
      list.appendChild(row);
    });

    // Tamaño de fuente
    const fontRow = document.createElement("div");
    fontRow.className = "option-row";
    fontRow.innerHTML = `
      <span><strong>Tamaño de texto</strong><br/><small>Ajusta el tamaño del texto de la app</small></span>
      <select id="opt-font-size" class="teacher-input" style="width:auto; padding:0.4rem;">
        <option value="normal" ${s.fontSize === "normal" ? "selected" : ""}>Normal</option>
        <option value="large" ${s.fontSize === "large" ? "selected" : ""}>Grande (+15%)</option>
        <option value="xlarge" ${s.fontSize === "xlarge" ? "selected" : ""}>Extra grande (+30%)</option>
      </select>
    `;
    fontRow.querySelector("select").addEventListener("change", (e) => {
      s.fontSize = e.target.value;
      saveState();
      FE()?.applyAccessibility(s);
      toast(`Tamaño de texto: ${e.target.value}`);
    });
    list.appendChild(fontRow);
  }

  function renderTeacherGate() {
    $("#teacher-gate")?.classList.remove("hidden");
    $("#teacher-panel")?.classList.add("hidden");
    const inp = $("#teacher-pin-input");
    if (inp) inp.value = "";
    const sub = $("#teacher-pin-sub");
    if (sub) {
      const currentPin = FE()?.getTeacherSettings()?.pin || "2024";
      if (currentPin === "2024") {
        sub.textContent = "Ingresa el PIN (predeterminado: 2024)";
      } else {
        sub.textContent = "Ingresa tu PIN maestro personalizado";
      }
    }
  }

  function tryTeacherLogin() {
    const rawPin = $("#teacher-pin-input")?.value || "";
    const pin = String(rawPin).trim();
    const isValid = FE()?.verifyTeacherPin ? FE().verifyTeacherPin(pin) : (pin === "2024");
    if (!isValid) {
      toast("PIN incorrecto", "error");
      return;
    }
    $("#teacher-gate")?.classList.add("hidden");
    $("#teacher-panel")?.classList.remove("hidden");
    renderTeacherPanel();
  }

  function renderTeacherPanel() {
    const box = $("#teacher-students");
    if (!box) return;
    box.innerHTML = "";

    // Sección de Respaldo y Restauración Global
    const backupSectionHtml = `
      <div class="teacher-section" style="margin-bottom: 1.5rem;">
        <h3 class="teacher-section__title" style="color:var(--neon-yellow); margin-bottom: 0.5rem;">💾 Respaldo y Restauración</h3>
        <p class="section-sub" style="margin-bottom:0.75rem;">Guarda o recupera copias de seguridad de los datos.</p>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <label class="btn btn--ghost btn--small" style="cursor:pointer;">
            📥 Restaurar desde JSON
            <input type="file" id="btn-import-json" accept=".json" style="display:none;" />
          </label>
        </div>
      </div>
    `;
    box.insertAdjacentHTML('beforeend', backupSectionHtml);

    setTimeout(() => {
      const importInput = $("#btn-import-json");
      if (importInput) {
        importInput.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (evt) => {
            const res = FE()?.importBackupJSON(evt.target.result);
            if (res?.success) {
              if (activeStudentId && state.meta) {
                applyProgress({ ...state, meta: res.meta });
                saveState();
              }
              toast("¡Datos restaurados con éxito!");
              renderTeacherPanel();
            } else {
              toast(res?.error || "Error al importar el archivo", "error");
            }
          };
          reader.readAsText(file);
        };
      }
    }, 100);

    if (studentsMeta.students.length > 0) {
      const studentData = studentsMeta.students.map(st => {
        let data = {};
        try { data = JSON.parse(localStorage.getItem(stateStorageKey(st.id)) || "{}"); } catch (_) {}
        return { name: st.name.split(" ")[0], cp: data.cp ?? 0 };
      });
      const maxCp = Math.max(10, ...studentData.map(s => s.cp));
      
      const chartHtml = `
        <div class="teacher-section">
          <h3 class="teacher-section__title" style="color:var(--neon-cyan); margin-bottom: 0.5rem;">📊 Progreso de Puntos (CP)</h3>
          <div class="dashboard-chart">
            ${studentData.map(s => `
              <div class="chart-bar-container">
                <span class="chart-val">${s.cp}</span>
                <div class="chart-bar" style="height: ${(s.cp / maxCp) * 100}%"></div>
                <span class="chart-label">${s.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      box.insertAdjacentHTML('beforeend', chartHtml);
    }
    studentsMeta.students.forEach((st) => {
      let data = {};
      try {
        data = JSON.parse(localStorage.getItem(stateStorageKey(st.id)) || "{}");
      } catch (_) {}
      const meta = data.meta || FE()?.freshMeta();
      const div = document.createElement("div");
      div.className = "teacher-student";
      div.innerHTML = `
        <p><strong>${st.name}</strong></p>
        <p>CP: ${data.cp ?? 0} · Lecturas: ${meta.stats?.readingsDone ?? 0} · Juegos: ${meta.stats?.gamesDone ?? 0} · Racha: ${meta.streak?.count ?? 0}</p>
      `;

      // Exportar CSV
      const csvBtn = document.createElement("button");
      csvBtn.type = "button";
      csvBtn.className = "btn btn--accent btn--small";
      csvBtn.textContent = "📊 Exportar CSV";
      csvBtn.style.marginRight = "0.5rem";
      csvBtn.addEventListener("click", () => {
        const csvContent = FE()?.exportStudentDataCSV(meta, st.name);
        downloadFile(`Reporte_${st.name.replace(/\s+/g, "_")}.csv`, csvContent, "text/csv;charset=utf-8;");
        toast(`Reporte de ${st.name} descargado`);
      });
      div.appendChild(csvBtn);

      // Exportar JSON Backup
      const jsonBtn = document.createElement("button");
      jsonBtn.type = "button";
      jsonBtn.className = "btn btn--ghost btn--small";
      jsonBtn.textContent = "💾 Copia JSON";
      jsonBtn.style.marginRight = "0.5rem";
      jsonBtn.addEventListener("click", () => {
        const jsonContent = FE()?.exportBackupJSON(meta, st.name);
        downloadFile(`Backup_${st.name.replace(/\s+/g, "_")}.json`, jsonContent, "application/json");
        toast(`Copia de respaldo de ${st.name} guardada`);
      });
      div.appendChild(jsonBtn);

      // Botón para Imprimir Diploma Galáctico
      const certBtn = document.createElement("button");
      certBtn.type = "button";
      certBtn.className = "btn btn--accent btn--small";
      certBtn.textContent = "🎓 Imprimir Diploma";
      certBtn.style.marginRight = "0.5rem";
      certBtn.addEventListener("click", () => {
        const ok = FE()?.printCertificate(meta, st.name, st.grade);
        if (!ok) toast("Permite ventanas emergentes para imprimir o guardar el diploma", "error");
      });
      div.appendChild(certBtn);

      // Botón para Probar Ascenso de Rango (+100 CP)
      const rankTestBtn = document.createElement("button");
      rankTestBtn.type = "button";
      rankTestBtn.className = "btn btn--accent btn--small";
      rankTestBtn.textContent = "🚀 +100 CP (Subir Rango)";
      rankTestBtn.style.marginRight = "0.5rem";
      rankTestBtn.addEventListener("click", () => {
        if (st.id === activeStudentId) {
          addCp(100, "Ascenso de Rango Galáctico");
        } else {
          let sData = {};
          try { sData = JSON.parse(localStorage.getItem(stateStorageKey(st.id)) || "{}"); } catch (_) {}
          const oldCp = sData.cp || 0;
          sData.cp = oldCp + 100;
          if (!sData.meta) sData.meta = FE()?.freshMeta();
          FE()?.recordCpEarned(sData.meta, 100);
          localStorage.setItem(stateStorageKey(st.id), JSON.stringify(sData));
          toast(`+100 CP otorgados a ${st.name}`);
        }
        renderTeacherPanel();
      });
      div.appendChild(rankTestBtn);

      const reset = document.createElement("button");
      reset.type = "button";
      reset.className = "btn btn--ghost btn--small";
      reset.textContent = "Reiniciar progreso";
      reset.addEventListener("click", async () => {
        const confirmed = await showGalacticConfirm(
          `¿Reiniciar todo el progreso de ${st.name}?`,
          { title: "Reiniciar Progreso", confirmText: "Sí, reiniciar", isDanger: true, icon: "🔄" }
        );
        if (!confirmed) return;
        const fresh = freshProgress();
        fresh.cp = 0;
        localStorage.setItem(stateStorageKey(st.id), JSON.stringify(fresh));
        if (st.id === activeStudentId) loadStateForStudent(st.id);
        renderTeacherPanel();
        toast(`Progreso de ${st.name} reiniciado`);
      });
      div.appendChild(reset);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn btn--danger btn--small";
      delBtn.style.marginLeft = "0.5rem";
      delBtn.textContent = "Eliminar alumno";
      delBtn.addEventListener("click", async () => {
        const confirmed = await showGalacticConfirm(
          `¿Estás seguro de eliminar permanentemente al alumno ${st.name}? Esta acción no se puede deshacer.`,
          { title: "Eliminar Alumno", confirmText: "Sí, eliminar", isDanger: true, icon: "🗑️" }
        );
        if (!confirmed) return;
        
        studentsMeta.students = studentsMeta.students.filter((s) => s.id !== st.id);
        
        if (studentsMeta.activeId === st.id) {
          studentsMeta.activeId = null;
          activeStudentId = null;
          state.studentId = null;
          state.studentName = "";
          state.studentGrade = null;
          resetProgress();
        }
        
        saveStudentsMeta();
        localStorage.removeItem(stateStorageKey(st.id));
        
        renderTeacherPanel();
        renderStudentSelect();
        toast(`Alumno ${st.name} eliminado`);
      });
      div.appendChild(delBtn);

      box.appendChild(div);
    });
  }

  function openChangePinModal() {
    const currentSettings = FE()?.getTeacherSettings() || { pin: "2024" };
    const currentPin = currentSettings.pin || "2024";

    const bodyHtml = `
      <div class="modal-field-group">
        <label class="modal-field-label" for="modal-pin-old">PIN Actual del Maestro</label>
        <input type="password" id="modal-pin-old" class="modal-input" maxlength="8" placeholder="****" inputmode="numeric" autofocus />
      </div>

      <div class="modal-field-group">
        <label class="modal-field-label" for="modal-pin-new">NUEVO PIN Maestro (4 a 8 dígitos)</label>
        <input type="password" id="modal-pin-new" class="modal-input" maxlength="8" placeholder="Ej: 1234" inputmode="numeric" />
      </div>

      <div class="modal-field-group">
        <label class="modal-field-label" for="modal-pin-confirm">Confirma el NUEVO PIN</label>
        <input type="password" id="modal-pin-confirm" class="modal-input" maxlength="8" placeholder="Repite el nuevo PIN" inputmode="numeric" />
      </div>

      <div id="modal-pin-error" class="modal-error hidden"></div>
    `;

    const footerHtml = `
      <button type="button" class="btn btn--ghost" id="modal-pin-cancel">Cancelar</button>
      <button type="button" class="btn btn--accent" id="modal-pin-submit">🔑 Guardar PIN</button>
    `;

    showGalacticModal({
      icon: "🔑",
      title: "Cambiar PIN Maestro",
      subtitle: "Ingresa el PIN actual y establece uno nuevo",
      bodyHtml,
      footerHtml
    });

    setTimeout(() => {
      const oldInput = $("#modal-pin-old");
      const newInput = $("#modal-pin-new");
      const confirmInput = $("#modal-pin-confirm");
      const errorDiv = $("#modal-pin-error");

      if (oldInput) oldInput.focus();

      const showError = (msg) => {
        if (errorDiv) {
          errorDiv.textContent = msg;
          errorDiv.classList.remove("hidden");
        }
      };

      const handleSubmit = () => {
        const oldVal = (oldInput ? oldInput.value : "").trim();
        const newVal = (newInput ? newInput.value : "").trim();
        const confirmVal = (confirmInput ? confirmInput.value : "").trim();

        if (oldVal !== currentPin) {
          showError("El PIN actual es incorrecto.");
          return;
        }
        if (newVal.length < 4 || newVal.length > 8) {
          showError("El nuevo PIN debe tener entre 4 y 8 dígitos.");
          return;
        }
        if (newVal !== confirmVal) {
          showError("Los nuevos PIN no coinciden.");
          return;
        }

        FE()?.setTeacherPin(newVal);
        closeGalacticModal(true);
        toast("🔑 ¡PIN maestro actualizado con éxito!");

        const sub = $("#teacher-pin-sub");
        if (sub) {
          sub.textContent = "Ingresa tu PIN maestro personalizado";
        }
      };

      $("#modal-pin-submit")?.addEventListener("click", handleSubmit);
      $("#modal-pin-cancel")?.addEventListener("click", () => closeGalacticModal(false));

      [oldInput, newInput, confirmInput].forEach(inp => {
        inp?.addEventListener("keydown", (e) => {
          if (e.key === "Enter") handleSubmit();
        });
      });
    }, 0);
  }

  function changeTeacherPin() {
    openChangePinModal();
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
  }

  /* ——— Recompensas ——— */
  function renderRewards() {
    const grade = state.rewardsShopGrade;
    const list = $("#rewards-list");
    const sub = $("#rewards-grade-sub");
    const picker = $("#rewards-grade-picker");
    const fromGrades = state.rewardsBackScreen === "grade-select";

    if (fromGrades) {
      renderRewardsGradePicker();
    } else if (picker) {
      picker.classList.add("hidden");
      picker.innerHTML = "";
    }

    if (sub) {
      if (!grade) {
        sub.textContent = "Elige un grado para ver su tienda de recompensas";
      } else {
        sub.textContent = `Recompensas de ${grade}° grado — canjea y actívalas en tu inventario`;
      }
    }

    list.innerHTML = "";
    if (!grade) {
      list.innerHTML = `<p class="empty-msg">Toca un grado arriba para ver qué puedes canjear.</p>`;
      renderInventory();
      updateCpDisplays();
      return;
    }

    const shop = APP_DATA.getRewardsForGrade?.(grade) || [];
    shop.forEach((r) => {
      const ownedToggle = r.type === "toggle" && state.inventory.includes(r.id);
      const ownedConsumable = r.type === "consumable" && state.inventory.includes(r.id);
      const div = document.createElement("div");
      div.className = "reward-item" + (ownedToggle ? " owned" : "");
      div.innerHTML = `
        <span class="reward-item__icon">${r.icon}</span>
        <div class="reward-item__info">
          <div class="reward-item__name">${r.name}</div>
          <div class="reward-item__desc">${r.desc}</div>
        </div>
        <span class="reward-item__cost">${ownedToggle ? "✓ Tienes" : r.cost + " CP"}</span>
      `;
      const canBuy = r.type === "consumable" || !ownedToggle;
      if (canBuy) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn--accent btn--small";
        btn.textContent = ownedConsumable ? "Comprar más" : "Canjear";
        btn.addEventListener("click", () => buyReward(r));
        div.appendChild(btn);
      } else if (ownedToggle) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn--ghost btn--small";
        btn.textContent = isEffectActive(r.effect) ? "Desactivar" : "Activar";
        btn.addEventListener("click", () => toggleReward(r));
        div.appendChild(btn);
      }
      list.appendChild(div);
    });

    renderInventory();
    updateCpDisplays();
  }

  function renderInventory() {
    const inv = $("#inventory-list");
    if (!inv) return;
    inv.innerHTML = "";
    if (
      state.inventory.length === 0 &&
      state.hints === 0 &&
      state.extraLives === 0 &&
      state.heroicShield === 0 &&
      state.timeBoosts === 0
    ) {
      inv.innerHTML = "<li>Aún no tienes recompensas. ¡Juega y gana CP!</li>";
      return;
    }

    const consumables = [];
    if (state.hints > 0) consumables.push({ label: `💡 Pistas disponibles: ${state.hints}`, hint: "Úsalas en preguntas con el botón 💡" });
    if (state.extraLives > 0) consumables.push({ label: `❤️ Vidas extra: ${state.extraLives}`, hint: "Se usan en juegos de memoria" });
    if (state.heroicShield > 0) consumables.push({ label: `🛡️ Escudo heroico: ${state.heroicShield}`, hint: "Perdona 1 error en juegos heroicos" });
    if (state.timeBoosts > 0) consumables.push({ label: `⏱️ Reloj legendario: ${state.timeBoosts}`, hint: "Úsalo en juegos con cronómetro (+8 s)" });

    consumables.forEach((c) => {
      const li = document.createElement("li");
      li.className = "inventory-item inventory-item--charge";
      li.innerHTML = `<span>${c.label}</span><small>${c.hint}</small>`;
      inv.appendChild(li);
    });

    state.inventory.forEach((id) => {
      const r = findReward(id);
      const li = document.createElement("li");
      li.className = "inventory-item";
      const active = r?.type === "toggle" && isEffectActive(r.effect);
      li.innerHTML = `<span>${r ? `${r.icon} ${r.name}` : id}${active ? " <em>(activo)</em>" : ""}</span>`;
      if (r?.type === "toggle") {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn--ghost btn--small";
        btn.textContent = active ? "Desactivar" : "Activar";
        btn.addEventListener("click", () => toggleReward(r));
        li.appendChild(btn);
      }
      inv.appendChild(li);
    });
  }

  function buyReward(r) {
    if ((r.type === "toggle" || r.type === "pet" || r.type === "suit") && state.inventory.includes(r.id)) {
      toast("Ya tienes esto. Actívalo o desactívalo abajo.");
      return;
    }
    if (state.cp < r.cost) {
      toast(`Necesitas ${r.cost - state.cp} CP más`, "error");
      return;
    }
    state.cp -= r.cost;
    FE()?.playSFX('reward');
    if (r.type === "consumable") {
      grantConsumable(r);
      if (!state.inventory.includes(r.id)) state.inventory.push(r.id);
    } else {
      state.inventory.push(r.id);
      if (r.type === "pet") {
        state.activeRewards = state.activeRewards.filter(e => !e.startsWith("pet-"));
        state.activeRewards.push(r.effect);
      } else if (r.type === "suit") {
        state.activeRewards = state.activeRewards.filter(e => !e.startsWith("suit-"));
        state.activeRewards.push(r.effect);
      }
    }
    if (r.effect === "confetti") state.confettiOwned = true;
    saveState();
    toast(`¡Canjeaste: ${r.name}! 🎁`);
    renderRewards();
    applyRewardEffects();
  }

  function toggleReward(r) {
    if (!r || (r.type !== "toggle" && r.type !== "pet" && r.type !== "suit")) return;
    const idx = state.activeRewards.indexOf(r.effect);
    if (idx >= 0) {
      state.activeRewards.splice(idx, 1);
      toast(`${r.name} quitado`);
    } else {
      if (r.type === "pet") {
        state.activeRewards = state.activeRewards.filter(e => !e.startsWith("pet-"));
      } else if (r.type === "suit") {
        state.activeRewards = state.activeRewards.filter(e => !e.startsWith("suit-"));
      }
      state.activeRewards.push(r.effect);
      toast(`${r.name} equipado ✨`);
    }
    saveState();
    applyRewardEffects();
    renderRewards();
  }

  /* ——— Init ——— */
  function initParticles() {
    const p = $("#particles");
    if (!p || p.childElementCount > 0) return;
  }

  function init() {
    try {
      if (!window.APP_DATA) {
        window.APP_DATA = {
          GRADE_LABELS: { 1: "1°", 2: "2°", 3: "3°", 4: "4°", 5: "5°", 6: "6°" },
          CP_PER_CORRECT: { easy: 10, medium: 15, hard: 20 },
          GAME_TIERS: {},
          GRADE_GAME_TIER: {},
          REWARDS_BY_GRADE: {},
          getAllRewards: () => [],
          getRewardsForGrade: () => [],
          RITMO_PRIMERO: [],
          READINGS: {},
          SEASONAL_READINGS: {},
          PDF_FOLLOWUP_QUESTIONS: {},
          GAMES: {},
          MISTERIOS_QUINTO: [],
        };
      }
      loadStudentsMeta();
      migrateLegacyStorage();
      if (studentsMeta.activeId && getStudentById(studentsMeta.activeId)) {
        loadStateForStudent(studentsMeta.activeId);
      } else {
        resetProgress();
      }
      updateCpDisplays();
      initParticles();
      initNavigation();
      renderGradeGrid();
      initHub();
      applyRewardEffects();
      registerServiceWorker();
      updateStreakUI();
    } catch (e) {
      console.error("Error al iniciar la app:", e);
      const grid = $("#grade-grid");
      if (grid) {
        grid.innerHTML = `<div class="empty-msg">Hubo un error al cargar. Recarga la página (F5).</div>`;
      }
    }
  }

  /** Carga la lista de palabras bloqueadas desde badwords.json */
  function loadBadwords() {
    return fetch("badwords.json")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.palabras_bloqueadas)) {
          window.APP_BADWORDS = data.palabras_bloqueadas;
        }
      })
      .catch(() => {
        // Si falla (modo offline), se usa la lista embebida en promptNewStudent
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => loadBadwords().then(init));
  } else {
    loadBadwords().then(init);
  }
})();

