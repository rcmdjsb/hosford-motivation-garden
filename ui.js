/**
 * Hosford Motivation Garden — UI Controller, HUD, Reflection Overlays & SVG Radar Chart
 */

import {
  STATIONS,
  FOUNTAIN,
  SKY_INSPIRATIONS,
  loadState,
  saveState,
  resetState,
  getStationById,
  getSkyInspirationById,
  getCompletedCount,
  isAllComplete,
  buildClassroomSummaryText,
} from './stations.js';
import { initGarden } from './garden.js';

// --- Application State ---
let state = loadState();
let activeStationId = null;
let activeSkyId = null;
let activeSkyFilter = 'all';
let activeGuideStationId = null;
let guideDismissedForProximity = null;
const guideLineIndices = {};
let isGuideSpeaking = false;
let isLookingAtSky = false;
let currentProximityId = null;
let currentTravelTarget = FOUNTAIN.id;
let resetConfirmTimer = null;
let toastCounter = 0;

// --- DOM References ---
const canvas = document.getElementById('garden-canvas');
const markerLayer = document.getElementById('marker-layer');
const skyMarkerLayer = document.getElementById('sky-marker-layer');
const crosshair = document.getElementById('crosshair');

const progressDotsEl = document.getElementById('progress-dots');
const progressTextEl = document.getElementById('progress-text');
const btnLookSky = document.getElementById('btn-look-sky');
const lookSkyLabel = document.getElementById('look-sky-label');
const skyGazeBanner = document.getElementById('sky-gaze-banner');
const btnBrowseSky = document.getElementById('btn-browse-sky');
const btnBlueprintHud = document.getElementById('btn-blueprint-hud');
const btnPointerLock = document.getElementById('btn-pointer-lock');
const pointerLockLabel = document.getElementById('pointer-lock-label');
const btnHelp = document.getElementById('btn-help');

const proximityPrompt = document.getElementById('proximity-prompt');
const btnProximityOpen = document.getElementById('btn-proximity-open');
const proximityLabel = document.getElementById('proximity-label');

// 3D Animal Guide Speech Bubble
const guideDialogue = document.getElementById('guide-dialogue');
const guideAvatar = document.getElementById('guide-avatar');
const guideNameEl = document.getElementById('guide-name');
const guideRoleEl = document.getElementById('guide-role');
const guideSpeechText = document.getElementById('guide-speech-text');
const btnCloseGuide = document.getElementById('btn-close-guide');
const btnGuideNext = document.getElementById('btn-guide-next');
const btnGuideSpeak = document.getElementById('btn-guide-speak');
const btnGuideReflect = document.getElementById('btn-guide-reflect');

const quickTravelButtonsEl = document.getElementById('quick-travel-buttons');
const toastRegion = document.getElementById('toast-region');

const welcomeOverlay = document.getElementById('welcome-overlay');
const btnEnterGarden = document.getElementById('btn-enter-garden');

const helpOverlay = document.getElementById('help-overlay');
const btnCloseHelp = document.getElementById('btn-close-help');
const btnHelpDone = document.getElementById('btn-help-done');

// Shrine Reflection Modal
const shrineModal = document.getElementById('shrine-modal');
const shrineForm = document.getElementById('shrine-form');
const shrineZoneBadge = document.getElementById('shrine-zone-badge');
const shrineTitle = document.getElementById('shrine-title');
const autosavePill = document.getElementById('autosave-pill');
const btnCloseShrine = document.getElementById('btn-close-shrine');
const btnCancelShrine = document.getElementById('btn-cancel-shrine');
const btnSubmitShrine = document.getElementById('btn-submit-shrine');
const fuelLabel = document.getElementById('fuel-label');
const fuelDescription = document.getElementById('fuel-description');
const fuelValueDisplay = document.getElementById('fuel-value-display');
const fuelSlider = document.getElementById('fuel-slider');
const btnEnergyHigh = document.getElementById('btn-energy-high');
const btnEnergyLow = document.getElementById('btn-energy-low');
const habitOptionsEl = document.getElementById('habit-options');
const reflectionPromptLabel = document.getElementById('reflection-prompt-label');
const reflectionInput = document.getElementById('reflection-input');
const charCountEl = document.getElementById('char-count');
const validationMsgEl = document.getElementById('shrine-validation-msg');

// Central Fountain Blueprint Modal
const blueprintModal = document.getElementById('blueprint-modal');
const btnCloseBlueprint = document.getElementById('btn-close-blueprint');
const blueprintCelebration = document.getElementById('blueprint-celebration');
const studentNameInput = document.getElementById('student-name-input');
const printMetaLine = document.getElementById('print-meta-line');
const bpCompletedCount = document.getElementById('bp-completed-count');
const bpAvgFuel = document.getElementById('bp-avg-fuel');
const radarChartContainer = document.getElementById('radar-chart-container');
const bpHabitsList = document.getElementById('bp-habits-list');
const bpReflectionsList = document.getElementById('bp-reflections-list');
const btnCopySummary = document.getElementById('btn-copy-summary');
const btnPrintPdf = document.getElementById('btn-print-pdf');
const btnResetGarden = document.getElementById('btn-reset-garden');

// Sky of Stories Modal
const skyModal = document.getElementById('sky-modal');
const skyTypeBadge = document.getElementById('sky-type-badge');
const skyModalTitle = document.getElementById('sky-modal-title');
const skyExploredPill = document.getElementById('sky-explored-pill');
const btnCloseSky = document.getElementById('btn-close-sky');
const skyFilterTabsEl = document.getElementById('sky-filter-tabs');
const skyPillStripEl = document.getElementById('sky-pill-strip');
const skyModalBody = document.getElementById('sky-modal-body');
const btnSkyPrev = document.getElementById('btn-sky-prev');
const btnSkyNext = document.getElementById('btn-sky-next');
const btnSkyDone = document.getElementById('btn-sky-done');

// --- Helper: Toast Notifications ---
function showToast(message, { celebrate = false, duration = 3600 } = {}) {
  const toast = document.createElement('div');
  toast.className = `toast${celebrate ? ' is-celebrate' : ''}`;
  toast.textContent = message;
  toast.dataset.id = String(++toastCounter);
  toastRegion.appendChild(toast);

  window.setTimeout(() => {
    toast.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-6px)';
    window.setTimeout(() => toast.remove(), 300);
  }, duration);
}

// --- Build Floating 3D-to-2D Landmark Markers ---
const markerElements = {};

function buildWorldMarkers() {
  markerLayer.innerHTML = '';
  const items = [
    { id: FOUNTAIN.id, name: FOUNTAIN.name, icon: '◈' },
    ...STATIONS.map((s) => ({ id: s.id, name: s.name, icon: s.icon })),
  ];

  for (const item of items) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'world-marker';
    btn.dataset.id = item.id;
    btn.hidden = true;
    btn.innerHTML = `
      <span class="marker-dot" aria-hidden="true"></span>
      <span class="marker-name">${item.name}</span>
      <span class="marker-dist"></span>
    `;
    btn.addEventListener('click', () => {
      if (currentProximityId === item.id) {
        handleInteract(item.id);
      } else {
        selectQuickTravel(item.id);
      }
    });
    markerLayer.appendChild(btn);
    markerElements[item.id] = {
      el: btn,
      distEl: btn.querySelector('.marker-dist'),
    };
  }
}

function updateWorldMarkers(projectedList) {
  for (const m of projectedList) {
    const ref = markerElements[m.id];
    if (!ref) continue;
    // Hide marker if very close (proximity pill already active) or off-screen
    if (!m.visible || m.distance < 5.5) {
      ref.el.hidden = true;
      continue;
    }
    ref.el.hidden = false;
    ref.el.style.transform = `translate(${m.x.toFixed(1)}px, ${m.y.toFixed(1)}px) translate(-50%, -100%)`;
    ref.distEl.textContent = `${Math.round(m.distance)}m`;
  }
}

// --- Build Quick-Travel Bottom HUD Bar ---
function buildQuickTravelBar() {
  quickTravelButtonsEl.innerHTML = '';

  const targets = [
    { id: FOUNTAIN.id, label: FOUNTAIN.shortName, isFountain: true },
    ...STATIONS.map((s) => ({
      id: s.id,
      label: `${s.zoneNumber}. ${s.shortName}`,
      isFountain: false,
    })),
  ];

  for (const t of targets) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'qt-btn';
    btn.dataset.targetId = t.id;
    btn.innerHTML = `
      <span class="qt-status-dot" aria-hidden="true"></span>
      <span>${t.label}</span>
    `;
    btn.addEventListener('click', () => selectQuickTravel(t.id));
    quickTravelButtonsEl.appendChild(btn);
  }
}

function selectQuickTravel(targetId) {
  currentTravelTarget = targetId;
  garden.travelTo(targetId);
  refreshHud();
}

// --- Refresh Top HUD, Markers & Quick-Travel Lit States ---
function refreshHud() {
  const completedCount = getCompletedCount(state);
  const allLit = isAllComplete(state);

  // Progress dots
  progressDotsEl.innerHTML = '';
  for (const station of STATIONS) {
    const dot = document.createElement('span');
    dot.className = `progress-dot${state.stations[station.id]?.completed ? ' is-lit' : ''}`;
    dot.title = `${station.name}: ${
      state.stations[station.id]?.completed ? 'Illuminated' : 'Unlit'
    }`;
    progressDotsEl.appendChild(dot);
  }
  progressTextEl.textContent = allLit
    ? '4 / 4 Shrines Lit ✦'
    : `${completedCount} / ${STATIONS.length} Shrines Lit`;

  // Blueprint HUD button state
  btnBlueprintHud.classList.toggle('is-locked', completedCount === 0);
  btnBlueprintHud.classList.toggle('is-unlocked', completedCount > 0 && !allLit);
  btnBlueprintHud.classList.toggle('is-complete', allLit);

  // Quick-travel buttons
  const qtBtns = quickTravelButtonsEl.querySelectorAll('.qt-btn');
  for (const btn of qtBtns) {
    const id = btn.dataset.targetId;
    const isLit =
      id === FOUNTAIN.id ? completedCount > 0 : Boolean(state.stations[id]?.completed);
    btn.classList.toggle('is-lit', isLit);
    btn.classList.toggle('is-active', currentTravelTarget === id);
  }

  // World marker lit badges
  for (const station of STATIONS) {
    const ref = markerElements[station.id];
    if (ref) {
      ref.el.classList.toggle('is-lit', Boolean(state.stations[station.id]?.completed));
    }
  }
  if (markerElements[FOUNTAIN.id]) {
    markerElements[FOUNTAIN.id].el.classList.toggle('is-lit', completedCount > 0);
  }

  // Sky constellation explored badges
  const exploredSet = new Set(state.exploredSkyIds || []);
  for (const item of SKY_INSPIRATIONS) {
    const ref = skyMarkerElements[item.id];
    if (ref) {
      const done = exploredSet.has(item.id);
      ref.el.classList.toggle('is-explored', done);
      ref.checkEl.hidden = !done;
    }
  }

  updateProximityPromptUI();
  updateSkyGazeUI();
}

function updateProximityPromptUI() {
  if (!currentProximityId || isAnyOverlayOpen() || isLookingAtSky) {
    proximityPrompt.hidden = true;
    return;
  }

  proximityPrompt.hidden = false;
  if (currentProximityId === FOUNTAIN.id) {
    const count = getCompletedCount(state);
    proximityLabel.textContent =
      count > 0
        ? 'Open Garden Blueprint Card — Central Fountain'
        : 'Central Fountain — Light 1 Shrine First to Unlock Blueprint';
  } else {
    const station = getStationById(currentProximityId);
    if (station) {
      const lit = state.stations[station.id]?.completed;
      proximityLabel.textContent = lit
        ? `Revisit Reflection — ${station.name}`
        : `Reflect & Plant Habit — ${station.name}`;
    }
  }
}

function isAnyOverlayOpen() {
  return (
    shrineModal.open ||
    blueprintModal.open ||
    skyModal.open ||
    !welcomeOverlay.hidden ||
    !helpOverlay.hidden
  );
}

function updateSkyGazeUI() {
  const showBanner = isLookingAtSky && !isAnyOverlayOpen();
  skyGazeBanner.hidden = !showBanner;
  btnLookSky.setAttribute('aria-pressed', String(isLookingAtSky));
  lookSkyLabel.textContent = isLookingAtSky ? 'Look Back Down' : 'Look Up: Sky Stories';
}

function syncPauseState() {
  const paused = isAnyOverlayOpen();
  garden.setControlsPaused(paused);
  if (paused) stopGuideSpeech();
  updateProximityPromptUI();
  updateSkyGazeUI();
  updateGuideDialogueUI();
}

// --- 3D Animal Guide Dialogue & Optional Speech Synthesis ---
function stopGuideSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  isGuideSpeaking = false;
  btnGuideSpeak.setAttribute('aria-pressed', 'false');
  btnGuideSpeak.textContent = '🔊 Read Aloud';
}

function getGuideLinesForStation(station) {
  const isLit = Boolean(state.stations[station.id]?.completed);
  return isLit ? station.guide.litLines : station.guide.lines;
}

function renderGuideDialogue(station, { advance = false, pulse = false } = {}) {
  const lines = getGuideLinesForStation(station);
  const key = `${station.id}:${state.stations[station.id]?.completed ? 'lit' : 'unlit'}`;
  let idx = guideLineIndices[key] ?? 0;
  if (advance) {
    idx = (idx + 1) % lines.length;
  } else {
    idx = idx % lines.length;
  }
  guideLineIndices[key] = idx;

  const isLit = Boolean(state.stations[station.id]?.completed);
  guideDialogue.classList.toggle('is-lit', isLit);
  guideAvatar.textContent = station.guide.emoji;
  guideNameEl.textContent = station.guide.name;
  guideRoleEl.textContent = `${station.guide.role} • ${station.name}`;
  guideSpeechText.textContent = lines[idx];
  btnGuideNext.textContent =
    lines.length > 1 ? `Next Tip (${idx + 1}/${lines.length}) →` : 'Say Hi Again';
  btnGuideReflect.textContent = isLit ? '✦ Revisit Shrine' : '✦ Reflect Here';

  if (!('speechSynthesis' in window)) {
    btnGuideSpeak.hidden = true;
  }

  if (pulse) {
    garden.pulseGuide(station.id);
  }
}

function updateGuideDialogueUI() {
  if (isAnyOverlayOpen() || isLookingAtSky || !activeGuideStationId) {
    guideDialogue.hidden = true;
    return;
  }
  const station = getStationById(activeGuideStationId);
  if (!station) {
    guideDialogue.hidden = true;
    return;
  }
  renderGuideDialogue(station, { advance: false, pulse: false });
  guideDialogue.hidden = false;
}

function openGuideForStation(stationId, { advanceIfOpen = false, pulse = true } = {}) {
  const station = getStationById(stationId);
  if (!station) return;
  stopGuideSpeech();
  const alreadyShowing = !guideDialogue.hidden && activeGuideStationId === stationId;
  activeGuideStationId = stationId;
  guideDismissedForProximity = null;
  renderGuideDialogue(station, { advance: advanceIfOpen && alreadyShowing, pulse });
  guideDialogue.hidden = isAnyOverlayOpen() || isLookingAtSky;
}

function speakCurrentGuideLine() {
  if (!('speechSynthesis' in window) || !activeGuideStationId) return;
  if (isGuideSpeaking) {
    stopGuideSpeech();
    return;
  }
  const station = getStationById(activeGuideStationId);
  if (!station) return;
  const text = guideSpeechText.textContent;
  if (!text) return;

  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.98;
  utter.pitch = station.guide.voicePitch || 1.0;
  utter.onend = () => {
    isGuideSpeaking = false;
    btnGuideSpeak.setAttribute('aria-pressed', 'false');
    btnGuideSpeak.textContent = '🔊 Read Aloud';
  };
  utter.onerror = () => {
    isGuideSpeaking = false;
    btnGuideSpeak.setAttribute('aria-pressed', 'false');
    btnGuideSpeak.textContent = '🔊 Read Aloud';
  };
  isGuideSpeaking = true;
  btnGuideSpeak.setAttribute('aria-pressed', 'true');
  btnGuideSpeak.textContent = '⏹ Stop Audio';
  garden.pulseGuide(station.id);
  window.speechSynthesis.speak(utter);
}

// --- Floating Overhead Sky Constellation Markers ---
const skyMarkerElements = {};

function buildSkyMarkers() {
  skyMarkerLayer.innerHTML = '';
  for (const item of SKY_INSPIRATIONS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sky-marker';
    btn.dataset.id = item.id;
    btn.dataset.type = item.type;
    btn.hidden = true;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'sky-marker-type';
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.textContent = item.icon;

    const labelSpan = document.createElement('span');
    labelSpan.textContent = item.shortLabel;

    const checkSpan = document.createElement('span');
    checkSpan.className = 'sky-marker-check';
    checkSpan.textContent = '✓';
    checkSpan.hidden = true;

    btn.appendChild(iconSpan);
    btn.appendChild(labelSpan);
    btn.appendChild(checkSpan);

    btn.addEventListener('click', () => openSkyModal(item.id));
    skyMarkerLayer.appendChild(btn);
    skyMarkerElements[item.id] = { el: btn, checkEl: checkSpan };
  }
}

function updateSkyMarkers(projectedList, lookingUp) {
  if (lookingUp !== isLookingAtSky) {
    isLookingAtSky = lookingUp;
    updateSkyGazeUI();
    updateProximityPromptUI();
    updateGuideDialogueUI();
  }
  for (const m of projectedList) {
    const ref = skyMarkerElements[m.id];
    if (!ref) continue;
    if (!m.visible) {
      ref.el.hidden = true;
      continue;
    }
    ref.el.hidden = false;
    ref.el.style.opacity = m.opacity.toFixed(2);
    ref.el.style.transform = `translate(${m.x.toFixed(1)}px, ${m.y.toFixed(1)}px) translate(-50%, -125%)`;
  }
}

const guideMarkerElements = {};

function buildGuideMarkers() {
  for (const station of STATIONS) {
    const firstName = station.guide.name.split(' ')[0];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'guide-world-marker';
    btn.dataset.stationId = station.id;
    btn.hidden = true;

    const emojiSpan = document.createElement('span');
    emojiSpan.setAttribute('aria-hidden', 'true');
    emojiSpan.textContent = station.guide.emoji;

    const nameSpan = document.createElement('span');
    nameSpan.textContent = firstName;

    const hintSpan = document.createElement('span');
    hintSpan.className = 'guide-marker-hint';
    hintSpan.textContent = '• Talk';

    btn.appendChild(emojiSpan);
    btn.appendChild(nameSpan);
    btn.appendChild(hintSpan);

    btn.addEventListener('click', () => {
      openGuideForStation(station.id, { advanceIfOpen: true, pulse: true });
    });

    markerLayer.appendChild(btn);
    guideMarkerElements[station.id] = btn;
  }
}

function updateGuideMarkers(projectedList) {
  for (const m of projectedList) {
    const el = guideMarkerElements[m.id];
    if (!el) continue;
    if (!m.visible) {
      el.hidden = true;
      continue;
    }
    el.hidden = false;
    el.style.transform = `translate(${m.x.toFixed(1)}px, ${m.y.toFixed(1)}px) translate(-50%, -100%)`;
  }
}

// --- Initialize 3D Garden Engine ---
buildWorldMarkers();
buildGuideMarkers();
buildSkyMarkers();
buildQuickTravelBar();

const garden = initGarden({
  canvas,
  initialState: state,
  onInteract: handleInteract,
  onProximityChange: (id) => {
    currentProximityId = id;
    if (id) currentTravelTarget = id;

    if (id && getStationById(id)) {
      if (guideDismissedForProximity !== id) {
        openGuideForStation(id, { advanceIfOpen: false, pulse: true });
      }
    } else {
      // Left shrine proximity — hide guide bubble & stop audio cleanly
      stopGuideSpeech();
      activeGuideStationId = null;
      guideDismissedForProximity = null;
      guideDialogue.hidden = true;
    }

    refreshHud();
  },
  onPointerLockChange: (locked) => {
    btnPointerLock.setAttribute('aria-pressed', String(locked));
    pointerLockLabel.textContent = locked ? 'Pointer Lock (Esc)' : 'Drag Look';
    crosshair.hidden = !locked;
  },
  onMarkersUpdate: updateWorldMarkers,
  onSkyMarkersUpdate: updateSkyMarkers,
  onGuideMarkersUpdate: updateGuideMarkers,
});

// --- Interaction Router (Beacon Click / Animal Guide Click / Press E / Fountain / Sky Constellation Click) ---
function handleInteract(id) {
  if (isAnyOverlayOpen()) return;
  if (typeof id === 'string' && id.startsWith('guide:')) {
    openGuideForStation(id.slice(6), { advanceIfOpen: true, pulse: true });
    return;
  }
  if (typeof id === 'string' && id.startsWith('sky:')) {
    openSkyModal(id.slice(4));
    return;
  }
  if (id === FOUNTAIN.id) {
    openBlueprintModal();
    return;
  }
  const station = getStationById(id);
  if (station) {
    openShrineModal(station);
  }
}

// --- Shrine Reflection Overlay Logic ---
function flashAutosave() {
  autosavePill.textContent = 'Auto-saved ✓';
  window.clearTimeout(flashAutosave._timer);
  flashAutosave._timer = window.setTimeout(() => {
    autosavePill.textContent = 'Auto-saved';
  }, 1200);
}

function setEnergyToggleUI(energyState) {
  const isHigh = energyState !== 'Battery Low';
  btnEnergyHigh.setAttribute('aria-pressed', String(isHigh));
  btnEnergyLow.setAttribute('aria-pressed', String(!isHigh));
}

function renderHabitOptions(station, selectedHabit) {
  habitOptionsEl.innerHTML = '';
  station.habits.forEach((habitText, index) => {
    const label = document.createElement('label');
    label.className = `habit-card${selectedHabit === habitText ? ' is-selected' : ''}`;

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'shrine-habit';
    radio.value = habitText;
    radio.id = `habit-opt-${index}`;
    radio.checked = selectedHabit === habitText;

    radio.addEventListener('change', () => {
      if (!activeStationId) return;
      state.stations[activeStationId].habit = habitText;
      state.stations[activeStationId].updatedAt = new Date().toISOString();
      saveState(state);
      flashAutosave();
      validationMsgEl.textContent = '';

      const cards = habitOptionsEl.querySelectorAll('.habit-card');
      cards.forEach((c) => c.classList.remove('is-selected'));
      label.classList.add('is-selected');
    });

    const span = document.createElement('span');
    span.className = 'habit-text';
    span.textContent = habitText;

    label.appendChild(radio);
    label.appendChild(span);
    habitOptionsEl.appendChild(label);
  });
}

function openShrineModal(station) {
  activeStationId = station.id;
  const data = state.stations[station.id];

  shrineZoneBadge.textContent = `Zone ${station.zoneNumber} • ${station.theme}`;
  shrineTitle.textContent = station.name;
  fuelLabel.textContent = station.fuelLabel;
  fuelDescription.textContent = station.fuelDescription;
  fuelSlider.value = String(data.fuel);
  fuelValueDisplay.textContent = String(data.fuel);
  setEnergyToggleUI(data.energyState);
  renderHabitOptions(station, data.habit);

  reflectionPromptLabel.textContent = station.prompt;
  reflectionInput.placeholder = station.placeholder;
  reflectionInput.value = data.reflection;
  charCountEl.textContent = `${data.reflection.length} / 600`;
  validationMsgEl.textContent = '';
  autosavePill.textContent = 'Auto-saved';

  btnSubmitShrine.textContent = data.completed
    ? '✦ Update Shrine Reflection'
    : '✦ Plant Habit & Light Shrine';

  if (!shrineModal.open) {
    shrineModal.showModal();
  }
  syncPauseState();
}

function closeShrineModal() {
  if (shrineModal.open) {
    shrineModal.close();
  }
  activeStationId = null;
  syncPauseState();
}

// Live Auto-Save Handlers for Shrine Form
fuelSlider.addEventListener('input', () => {
  const val = Number(fuelSlider.value);
  fuelValueDisplay.textContent = String(val);
  if (!activeStationId) return;
  state.stations[activeStationId].fuel = val;
  state.stations[activeStationId].updatedAt = new Date().toISOString();
  saveState(state);
  flashAutosave();
});

[btnEnergyHigh, btnEnergyLow].forEach((btn) => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.energy;
    setEnergyToggleUI(mode);
    if (!activeStationId) return;
    state.stations[activeStationId].energyState = mode;
    state.stations[activeStationId].updatedAt = new Date().toISOString();
    saveState(state);
    flashAutosave();
  });
});

reflectionInput.addEventListener('input', () => {
  const text = reflectionInput.value;
  charCountEl.textContent = `${text.length} / 600`;
  validationMsgEl.textContent = '';
  if (!activeStationId) return;
  state.stations[activeStationId].reflection = text;
  state.stations[activeStationId].updatedAt = new Date().toISOString();
  saveState(state);
  flashAutosave();
});

shrineForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!activeStationId) return;
  const station = getStationById(activeStationId);
  const data = state.stations[activeStationId];

  if (!data.habit) {
    validationMsgEl.textContent = 'Choose 1 High School Readiness Habit to plant at this shrine.';
    habitOptionsEl.querySelector('input')?.focus();
    return;
  }

  if (data.reflection.trim().length < 3) {
    validationMsgEl.textContent = 'Add a short reflection above before lighting this shrine.';
    reflectionInput.focus();
    return;
  }

  const wasAlreadyLit = data.completed;
  data.completed = true;
  data.updatedAt = new Date().toISOString();
  saveState(state);

  const justCompletedAll = isAllComplete(state) && !state.celebratedAll;
  if (justCompletedAll) {
    state.celebratedAll = true;
    saveState(state);
  }

  const litStationId = station.id;
  closeShrineModal();

  // Trigger 3D visual reward: lantern lights up, cyan beacon, glowing crystal-tree grows!
  garden.syncState(state, { newlyLitId: wasAlreadyLit ? null : litStationId });
  if (currentProximityId === litStationId || activeGuideStationId === litStationId) {
    openGuideForStation(litStationId, { advanceIfOpen: false, pulse: true });
  }
  refreshHud();

  if (justCompletedAll) {
    garden.celebrateAllComplete();
    showToast(
      '✦ All 4 Shrines Illuminated! Visit the Central Fountain for your Garden Blueprint Card.',
      { celebrate: true, duration: 5400 }
    );
  } else if (!wasAlreadyLit) {
    const count = getCompletedCount(state);
    showToast(
      `✦ ${station.name} illuminated! (${count}/4 lit — a glowing crystal tree blooms beside the shrine)`
    );
  } else {
    showToast(`Updated your reflection at ${station.name}.`);
  }
});

btnCloseShrine.addEventListener('click', closeShrineModal);
btnCancelShrine.addEventListener('click', closeShrineModal);
shrineModal.addEventListener('close', () => {
  activeStationId = null;
  syncPauseState();
});
shrineModal.addEventListener('click', (e) => {
  if (e.target === shrineModal) closeShrineModal();
});

// --- Central Fountain: SVG 4-Axis Motivation Radar Chart ---
function renderMotivationRadarSVG() {
  const cx = 190;
  const cy = 168;
  const maxR = 98;
  const levels = [2, 4, 6, 8, 10];

  // 4 axes: Top (Curiosity), Right (Family Pride), Bottom (Future Ready), Left (Independence)
  const axes = [
    { station: STATIONS[0], angle: -Math.PI / 2, anchor: 'middle', dx: 0, dy: -28 },
    { station: STATIONS[1], angle: 0, anchor: 'start', dx: 14, dy: -4 },
    { station: STATIONS[2], angle: Math.PI / 2, anchor: 'middle', dx: 0, dy: 24 },
    { station: STATIONS[3], angle: Math.PI, anchor: 'end', dx: -14, dy: -4 },
  ];

  // Concentric diamond guide rings
  const gridPolys = levels
    .map((lv) => {
      const r = (lv / 10) * maxR;
      const pts = axes
        .map((a) => `${(cx + Math.cos(a.angle) * r).toFixed(1)},${(cy + Math.sin(a.angle) * r).toFixed(1)}`)
        .join(' ');
      return `<polygon class="radar-grid" points="${pts}" fill="none" stroke="rgba(124,201,232,${
        lv === 10 ? 0.42 : 0.2
      })" stroke-width="${lv === 10 ? 1.4 : 1}" />`;
    })
    .join('');

  // Axis lines + ring scale numbers
  const axisLines = axes
    .map((a) => {
      const x2 = cx + Math.cos(a.angle) * maxR;
      const y2 = cy + Math.sin(a.angle) * maxR;
      return `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(
        1
      )}" stroke="rgba(124,201,232,0.3)" stroke-width="1" />`;
    })
    .join('');

  const scaleLabels = [2, 6, 10]
    .map((lv) => {
      const y = cy - (lv / 10) * maxR;
      return `<text x="${cx + 5}" y="${(y + 3).toFixed(
        1
      )}" font-size="9" fill="rgba(255,255,255,0.52)">${lv}</text>`;
    })
    .join('');

  // Data polygon vertices
  const dataVertices = axes.map((a) => {
    const d = state.stations[a.station.id];
    const value = d?.completed ? d.fuel : 0;
    const r = (value / 10) * maxR;
    return {
      x: cx + Math.cos(a.angle) * r,
      y: cy + Math.sin(a.angle) * r,
      completed: Boolean(d?.completed),
      fuel: value,
      energyState: d?.energyState || 'Running High',
      axis: a,
    };
  });

  const dataPointsStr = dataVertices
    .map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`)
    .join(' ');

  const vertexDots = dataVertices
    .map((v) => {
      if (!v.completed) return '';
      return `
        <circle class="radar-dot" cx="${v.x.toFixed(1)}" cy="${v.y.toFixed(
        1
      )}" r="5.2" fill="#FFFFFF" stroke="#7CC9E8" stroke-width="2.2" />
      `;
    })
    .join('');

  // Axis labels with Fuel score + Energy badge
  const labelsSvg = dataVertices
    .map((v) => {
      const lx = cx + Math.cos(v.axis.angle) * maxR + v.axis.dx;
      const ly = cy + Math.sin(v.axis.angle) * maxR + v.axis.dy;
      const subText = v.completed
        ? `${v.fuel}/10 • ${v.energyState === 'Battery Low' ? 'Battery Low' : 'High'}`
        : 'Not lit yet';
      const subFill = v.completed
        ? v.energyState === 'Battery Low'
          ? '#FFD996'
          : '#7CC9E8'
        : 'rgba(255,255,255,0.45)';
      return `
        <g>
          <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${
        v.axis.anchor
      }" font-size="11.5" font-weight="700" fill="#FFFFFF">${v.axis.station.axisLabel}</text>
          <text x="${lx.toFixed(1)}" y="${(ly + 14).toFixed(1)}" text-anchor="${
        v.axis.anchor
      }" font-size="10" font-weight="600" fill="${subFill}">${subText}</text>
        </g>
      `;
    })
    .join('');

  radarChartContainer.innerHTML = `
    <svg class="radar-svg" viewBox="0 0 380 340" role="img" aria-label="4-Axis Motivation Radar Chart showing Curiosity, Family Pride, Future Readiness, and Independent Thinking fuel levels">
      <defs>
        <radialGradient id="radarFillGrad" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.34" />
          <stop offset="100%" stop-color="#7CC9E8" stop-opacity="0.38" />
        </radialGradient>
      </defs>
      ${gridPolys}
      ${axisLines}
      ${scaleLabels}
      <polygon
        class="radar-poly"
        points="${dataPointsStr}"
        fill="url(#radarFillGrad)"
        stroke="#7CC9E8"
        stroke-width="2.4"
        stroke-linejoin="round"
      />
      ${vertexDots}
      ${labelsSvg}
    </svg>
  `;
}

// --- Central Fountain Blueprint Modal Rendering ---
function renderBlueprintCard() {
  const completedCount = getCompletedCount(state);
  const allLit = isAllComplete(state);

  blueprintCelebration.hidden = !allLit;
  studentNameInput.value = state.studentName || '';
  bpCompletedCount.textContent = `${completedCount} / ${STATIONS.length}`;

  // Average fuel across lit shrines
  const litFuels = STATIONS.filter((s) => state.stations[s.id]?.completed).map(
    (s) => state.stations[s.id].fuel
  );
  bpAvgFuel.textContent =
    litFuels.length > 0
      ? `${(litFuels.reduce((a, b) => a + b, 0) / litFuels.length).toFixed(1)} / 10`
      : '—';

  updatePrintMetaLine();
  renderMotivationRadarSVG();

  // Planted Habits List
  bpHabitsList.innerHTML = '';
  for (const station of STATIONS) {
    const data = state.stations[station.id];
    const item = document.createElement('div');
    item.className = `bp-habit-item${data.completed ? '' : ' is-unlit'}`;

    const top = document.createElement('div');
    top.className = 'bp-habit-top';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'bp-zone-name';
    titleSpan.textContent = `${station.icon} ${station.name}`;
    top.appendChild(titleSpan);

    const chip = document.createElement('span');
    if (data.completed) {
      chip.className = `bp-energy-chip${data.energyState === 'Battery Low' ? ' is-low' : ''}`;
      chip.textContent = `${data.fuel}/10 • ${data.energyState}`;
    } else {
      chip.className = 'bp-energy-chip';
      chip.textContent = 'Unlit';
    }
    top.appendChild(chip);
    item.appendChild(top);

    const habitP = document.createElement('p');
    habitP.className = 'bp-habit-copy';
    habitP.textContent = data.completed
      ? data.habit
      : `Visit ${station.name} to plant your ${station.theme} habit.`;
    item.appendChild(habitP);

    if (!data.completed) {
      const jumpBtn = document.createElement('button');
      jumpBtn.type = 'button';
      jumpBtn.className = 'bp-jump-btn';
      jumpBtn.textContent = `Glide to ${station.shortName} →`;
      jumpBtn.addEventListener('click', () => {
        closeBlueprintModal();
        selectQuickTravel(station.id);
      });
      item.appendChild(jumpBtn);
    }

    bpHabitsList.appendChild(item);
  }

  // Written Reflections List
  bpReflectionsList.innerHTML = '';
  for (const station of STATIONS) {
    const data = state.stations[station.id];
    const card = document.createElement('div');
    card.className = 'bp-reflection-item';

    const zoneTitle = document.createElement('div');
    zoneTitle.className = 'bp-zone-name';
    zoneTitle.textContent = `Zone ${station.zoneNumber}: ${station.theme}`;

    const promptEl = document.createElement('p');
    promptEl.className = 'bp-reflection-prompt';
    promptEl.textContent = station.prompt;

    const answerEl = document.createElement('p');
    answerEl.className = 'bp-reflection-answer';
    answerEl.textContent = data.completed
      ? data.reflection.trim()
      : 'Shrine not yet illuminated.';

    card.appendChild(zoneTitle);
    card.appendChild(promptEl);
    card.appendChild(answerEl);
    bpReflectionsList.appendChild(card);
  }
}

function updatePrintMetaLine() {
  const name = state.studentName && state.studentName.trim() ? state.studentName.trim() : 'Hosford Student';
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  printMetaLine.textContent = `${name}  •  ${dateStr}  •  ${getCompletedCount(state)} / ${STATIONS.length} Shrines Illuminated`;
}

function openBlueprintModal() {
  if (getCompletedCount(state) === 0) {
    showToast('Visit and illuminate at least 1 shrine to unlock your Garden Blueprint Card!');
    return;
  }
  renderBlueprintCard();
  resetResetButton();
  if (!blueprintModal.open) {
    blueprintModal.showModal();
  }
  syncPauseState();
}

function closeBlueprintModal() {
  if (blueprintModal.open) {
    blueprintModal.close();
  }
  resetResetButton();
  syncPauseState();
}

studentNameInput.addEventListener('input', () => {
  state.studentName = studentNameInput.value;
  saveState(state);
  updatePrintMetaLine();
});

btnCloseBlueprint.addEventListener('click', closeBlueprintModal);
blueprintModal.addEventListener('close', () => {
  resetResetButton();
  syncPauseState();
});
blueprintModal.addEventListener('click', (e) => {
  if (e.target === blueprintModal) closeBlueprintModal();
});

// --- One-Click Copy Summary to Clipboard (Google Classroom Ready) ---
async function copySummaryToClipboard() {
  const summary = buildClassroomSummaryText(state);
  let copied = false;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(summary);
      copied = true;
    } catch {
      copied = false;
    }
  }

  if (!copied) {
    const tempArea = document.createElement('textarea');
    tempArea.value = summary;
    tempArea.setAttribute('readonly', '');
    tempArea.style.position = 'fixed';
    tempArea.style.opacity = '0';
    document.body.appendChild(tempArea);
    tempArea.select();
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }
    tempArea.remove();
  }

  if (copied) {
    const originalText = btnCopySummary.textContent;
    btnCopySummary.textContent = '✓ Copied for Google Classroom!';
    showToast('Garden Blueprint copied! Ready to paste into Google Classroom.');
    window.setTimeout(() => {
      btnCopySummary.textContent = originalText;
    }, 2400);
  } else {
    showToast('Could not access clipboard automatically — try Print / Save PDF instead.');
  }
}

btnCopySummary.addEventListener('click', copySummaryToClipboard);

// --- One-Click Print / Save PDF ---
btnPrintPdf.addEventListener('click', () => {
  updatePrintMetaLine();
  window.print();
});

// --- Safe 2-Step Reset Garden (Classroom Chromebook Friendly) ---
function resetResetButton() {
  btnResetGarden.dataset.confirm = 'false';
  btnResetGarden.classList.remove('is-confirming');
  btnResetGarden.textContent = 'Reset Garden';
  window.clearTimeout(resetConfirmTimer);
}

btnResetGarden.addEventListener('click', () => {
  if (btnResetGarden.dataset.confirm !== 'true') {
    btnResetGarden.dataset.confirm = 'true';
    btnResetGarden.classList.add('is-confirming');
    btnResetGarden.textContent = 'Click Again to Clear Progress';
    resetConfirmTimer = window.setTimeout(resetResetButton, 4500);
    return;
  }

  state = resetState();
  garden.syncState(state, { instant: true });
  closeBlueprintModal();
  refreshHud();
  showToast('Garden progress reset. Ready for a fresh reflection!');
});

// --- Sky of Stories Modal Logic (Quotes, Videos & True Resilience Stories) ---
function getFilteredSkyItems() {
  if (activeSkyFilter === 'all') return SKY_INSPIRATIONS;
  return SKY_INSPIRATIONS.filter((item) => item.type === activeSkyFilter);
}

function markSkyExplored(skyId) {
  if (!Array.isArray(state.exploredSkyIds)) {
    state.exploredSkyIds = [];
  }
  if (!state.exploredSkyIds.includes(skyId)) {
    state.exploredSkyIds.push(skyId);
    saveState(state);
    garden.syncState(state);
    refreshHud();
  }
}

function renderSkyPillStrip() {
  const items = getFilteredSkyItems();
  const exploredSet = new Set(state.exploredSkyIds || []);
  skyPillStripEl.innerHTML = '';

  for (const item of items) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `sky-item-pill${item.id === activeSkyId ? ' is-current' : ''}`;
    btn.textContent = `${item.icon} ${item.shortLabel}${exploredSet.has(item.id) ? ' ✓' : ''}`;
    btn.addEventListener('click', () => {
      openSkyModal(item.id, { aimSky: true });
    });
    skyPillStripEl.appendChild(btn);
  }
}

function appendSkyVideoBlock(container, item) {
  if (!item.youtubeId) return;

  const videoSection = document.createElement('div');
  videoSection.className = 'sky-video-section';

  if (item.videoTitle) {
    const header = document.createElement('div');
    header.className = 'sky-video-heading';
    header.textContent = `▶ Watch: ${item.videoTitle}`;
    videoSection.appendChild(header);
  }

  const wrap = document.createElement('div');
  wrap.className = 'sky-video-frame-wrap';
  const iframe = document.createElement('iframe');
  iframe.className = 'sky-video-frame';
  iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(item.youtubeId)}?rel=0`;
  iframe.title = item.videoTitle || item.title;
  iframe.loading = 'lazy';
  iframe.allow =
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.allowFullscreen = true;
  wrap.appendChild(iframe);
  videoSection.appendChild(wrap);

  const fallbackRow = document.createElement('div');
  fallbackRow.className = 'sky-video-fallback';
  const note = document.createElement('span');
  const durationPrefix = item.duration ? `${item.duration} • ` : '';
  note.textContent = `${durationPrefix}If YouTube embeds are restricted on school Wi-Fi, open directly:`;
  const link = document.createElement('a');
  link.className = 'sky-external-link';
  link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(item.youtubeId)}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Watch on YouTube ↗';
  fallbackRow.appendChild(note);
  fallbackRow.appendChild(link);
  videoSection.appendChild(fallbackRow);

  container.appendChild(videoSection);
}

function renderSkyContent(item) {
  skyTypeBadge.textContent = `${item.icon} ${item.typeLabel} • ${item.theme}`;
  skyModalTitle.textContent = item.title;
  const exploredCount = (state.exploredSkyIds || []).length;
  skyExploredPill.textContent = `${exploredCount} / ${SKY_INSPIRATIONS.length} Stars Explored`;

  skyModalBody.innerHTML = '';

  // Person & Role header
  const metaRow = document.createElement('div');
  metaRow.className = 'sky-person-meta';
  const nameEl = document.createElement('span');
  nameEl.className = 'sky-person-name';
  nameEl.textContent = item.person;
  const roleEl = document.createElement('span');
  roleEl.className = 'sky-person-role';
  roleEl.textContent = item.role;
  metaRow.appendChild(nameEl);
  metaRow.appendChild(roleEl);
  skyModalBody.appendChild(metaRow);

  if (item.type === 'quote') {
    const bq = document.createElement('blockquote');
    bq.className = 'sky-quote-card';
    bq.textContent = item.quote;
    skyModalBody.appendChild(bq);

    appendSkyVideoBlock(skyModalBody, item);

    const backstoryBox = document.createElement('div');
    backstoryBox.className = 'sky-info-box';
    const h4 = document.createElement('h4');
    h4.textContent = 'The Challenge Behind the Quote';
    const p = document.createElement('p');
    p.textContent = item.backstory;
    backstoryBox.appendChild(h4);
    backstoryBox.appendChild(p);
    skyModalBody.appendChild(backstoryBox);

    const callout = document.createElement('div');
    callout.className = 'sky-takeaway-callout';
    const strong = document.createElement('strong');
    strong.textContent = 'Try This Today: ';
    callout.appendChild(strong);
    callout.appendChild(document.createTextNode(item.takeaway));
    skyModalBody.appendChild(callout);
  } else if (item.type === 'video') {
    appendSkyVideoBlock(skyModalBody, item);

    const summaryBox = document.createElement('div');
    summaryBox.className = 'sky-info-box';
    const h4 = document.createElement('h4');
    h4.textContent = 'Key Takeaways';
    const p = document.createElement('p');
    p.textContent = item.summary;
    p.style.marginBottom = '8px';
    const ul = document.createElement('ul');
    ul.className = 'sky-takeaways-list';
    for (const point of item.takeaways) {
      const li = document.createElement('li');
      li.textContent = point;
      ul.appendChild(li);
    }
    summaryBox.appendChild(h4);
    summaryBox.appendChild(p);
    summaryBox.appendChild(ul);
    skyModalBody.appendChild(summaryBox);
  } else if (item.type === 'story') {
    appendSkyVideoBlock(skyModalBody, item);

    const grid = document.createElement('div');
    grid.className = 'sky-story-grid';

    const stages = [
      { heading: '1. The Challenge', body: item.challenge },
      { heading: '2. The Turning Point', body: item.turningPoint },
      { heading: '3. The Breakthrough', body: item.breakthrough },
    ];
    for (const stage of stages) {
      const box = document.createElement('div');
      box.className = 'sky-info-box';
      const h4 = document.createElement('h4');
      h4.textContent = stage.heading;
      const p = document.createElement('p');
      p.textContent = stage.body;
      box.appendChild(h4);
      box.appendChild(p);
      grid.appendChild(box);
    }
    skyModalBody.appendChild(grid);

    const callout = document.createElement('div');
    callout.className = 'sky-takeaway-callout';
    const strong = document.createElement('strong');
    strong.textContent = 'Takeaway for High School: ';
    callout.appendChild(strong);
    callout.appendChild(document.createTextNode(item.takeaway));
    skyModalBody.appendChild(callout);
  }
}

function openSkyModal(skyId, { aimSky = false } = {}) {
  const item = getSkyInspirationById(skyId) || SKY_INSPIRATIONS[0];
  if (!item) return;

  activeSkyId = item.id;
  // Ensure the active filter includes this item
  if (activeSkyFilter !== 'all' && activeSkyFilter !== item.type) {
    activeSkyFilter = 'all';
    updateSkyFilterTabsUI();
  }

  markSkyExplored(item.id);
  renderSkyPillStrip();
  renderSkyContent(item);

  if (aimSky) {
    garden.focusSkyStar(item.id);
  }

  if (!skyModal.open) {
    skyModal.showModal();
  }
  syncPauseState();
}

function closeSkyModal() {
  if (skyModal.open) {
    skyModal.close();
  }
  // Clear body so embedded YouTube video stops playing cleanly
  skyModalBody.innerHTML = '';
  activeSkyId = null;
  syncPauseState();
}

function updateSkyFilterTabsUI() {
  const tabs = skyFilterTabsEl.querySelectorAll('.sky-tab');
  for (const tab of tabs) {
    const isMatch = tab.dataset.filter === activeSkyFilter;
    tab.classList.toggle('is-active', isMatch);
    tab.setAttribute('aria-selected', String(isMatch));
  }
}

skyFilterTabsEl.addEventListener('click', (e) => {
  const tab = e.target.closest('.sky-tab');
  if (!tab) return;
  activeSkyFilter = tab.dataset.filter || 'all';
  updateSkyFilterTabsUI();
  const filtered = getFilteredSkyItems();
  if (filtered.length > 0 && !filtered.some((i) => i.id === activeSkyId)) {
    openSkyModal(filtered[0].id, { aimSky: true });
  } else {
    renderSkyPillStrip();
  }
});

function stepSkyItem(delta) {
  const list = getFilteredSkyItems();
  if (list.length === 0) return;
  const idx = list.findIndex((i) => i.id === activeSkyId);
  const nextIdx = (idx === -1 ? 0 : idx + delta + list.length) % list.length;
  openSkyModal(list[nextIdx].id, { aimSky: true });
}

btnSkyPrev.addEventListener('click', () => stepSkyItem(-1));
btnSkyNext.addEventListener('click', () => stepSkyItem(1));
btnCloseSky.addEventListener('click', closeSkyModal);
btnSkyDone.addEventListener('click', closeSkyModal);
skyModal.addEventListener('close', () => {
  skyModalBody.innerHTML = '';
  activeSkyId = null;
  syncPauseState();
});
skyModal.addEventListener('click', (e) => {
  if (e.target === skyModal) closeSkyModal();
});

// --- Animal Guide Speech Card Buttons ---
btnCloseGuide.addEventListener('click', () => {
  stopGuideSpeech();
  guideDismissedForProximity = activeGuideStationId;
  activeGuideStationId = null;
  guideDialogue.hidden = true;
});

btnGuideNext.addEventListener('click', () => {
  if (!activeGuideStationId) return;
  stopGuideSpeech();
  const station = getStationById(activeGuideStationId);
  if (station) {
    renderGuideDialogue(station, { advance: true, pulse: true });
  }
});

btnGuideSpeak.addEventListener('click', speakCurrentGuideLine);

btnGuideReflect.addEventListener('click', () => {
  if (!activeGuideStationId) return;
  stopGuideSpeech();
  const station = getStationById(activeGuideStationId);
  if (station) openShrineModal(station);
});

// --- Top HUD & Overlay Buttons ---
btnLookSky.addEventListener('click', () => {
  const gazingUp = garden.toggleSkyGaze();
  if (gazingUp) {
    showToast('✦ Gazing up at the Sky of Stories — click any glowing star or constellation!');
  }
});
btnBrowseSky.addEventListener('click', () => {
  openSkyModal(activeSkyId || SKY_INSPIRATIONS[0].id);
});
btnBlueprintHud.addEventListener('click', openBlueprintModal);
btnPointerLock.addEventListener('click', () => garden.togglePointerLock());
btnProximityOpen.addEventListener('click', () => {
  if (currentProximityId) handleInteract(currentProximityId);
});

btnHelp.addEventListener('click', () => {
  helpOverlay.hidden = false;
  syncPauseState();
  btnHelpDone.focus();
});

function closeHelpOverlay() {
  helpOverlay.hidden = true;
  syncPauseState();
}
btnCloseHelp.addEventListener('click', closeHelpOverlay);
btnHelpDone.addEventListener('click', closeHelpOverlay);
helpOverlay.addEventListener('click', (e) => {
  if (e.target === helpOverlay) closeHelpOverlay();
});

btnEnterGarden.addEventListener('click', () => {
  welcomeOverlay.hidden = true;
  state.hasSeenWelcome = true;
  saveState(state);
  syncPauseState();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !helpOverlay.hidden) {
    closeHelpOverlay();
  }
});

// --- Initial Startup ---
refreshHud();
if (!state.hasSeenWelcome) {
  welcomeOverlay.hidden = false;
  syncPauseState();
}
