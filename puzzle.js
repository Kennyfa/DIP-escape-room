// ------------------------------------
// Outputs from earlier rooms
// ------------------------------------
const room1_output = 4;
const room2_output = 7;

// ------------------------------------
// Target signal parameters
// ------------------------------------
const targetFrequency = room1_output;  // 0–9
const targetAmplitude = room2_output;  // 0–9
const targetPhase = 2;                 // 0–9

// ------------------------------------
// Get UI elements
// ------------------------------------
const freqSlider  = document.getElementById("freqSlider");
const ampSlider   = document.getElementById("ampSlider");
const phaseSlider = document.getElementById("phaseSlider");

const freqVal  = document.getElementById("freqVal");
const ampVal   = document.getElementById("ampVal");
const phaseVal = document.getElementById("phaseVal");

const canvas = document.getElementById("waveCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 420;
canvas.height = 220;

const result = document.getElementById("result");

// Max error when each knob is 0..9
const maxError = 27;

// ------------------------------------
// Audio system
// ------------------------------------
let audioCtx = null;
let oscillator = null;
let gainNode = null;
let currentAudioState = "";
let audioStarted = false;
let successTimeout = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function startTone(freq, type = "sine", volume = 0.02) {
  if (!audioCtx) return;

  stopTone();

  oscillator = audioCtx.createOscillator();
  gainNode = audioCtx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = freq;
  gainNode.gain.value = volume;

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
}

function stopTone() {
  if (oscillator) {
    oscillator.stop();
    oscillator.disconnect();
    oscillator = null;
  }

  if (gainNode) {
    gainNode.disconnect();
    gainNode = null;
  }
}

function playSuccessChime() {
  if (!audioCtx) return;

  stopTone();

  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.type = "sine";
  osc1.frequency.value = 880;
  gain1.gain.value = 0.025;
  osc1.connect(gain1);
  gain1.connect(audioCtx.destination);
  osc1.start();
  osc1.stop(audioCtx.currentTime + 0.15);

  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = "sine";
  osc2.frequency.value = 1320;
  gain2.gain.value = 0.025;
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc2.start(audioCtx.currentTime + 0.16);
  osc2.stop(audioCtx.currentTime + 0.35);
}

function updateAudioFromError(error) {
  if (!audioCtx) return;

  if (error === 0) {
    if (currentAudioState !== "success") {
      currentAudioState = "success";
      playSuccessChime();
    }
    return;
  }

  let state = "";
  let freq = 0;
  let type = "sine";
  let volume = 0.02;

  if (error <= 3) {
    state = "close";
    freq = 660;
    type = "sine";
    volume = 0.018;
  } else if (error <= 8) {
    state = "mid";
    freq = 440;
    type = "sine";
    volume = 0.02;
  } else {
    state = "far";
    freq = 220;
    type = "triangle";
    volume = 0.02;
  }

  if (state !== currentAudioState) {
    currentAudioState = state;
    startTone(freq, type, volume);
  }
}

function getCurrentError() {
  const f = parseInt(freqSlider.value, 10);
  const a = parseInt(ampSlider.value, 10);
  const p = parseInt(phaseSlider.value, 10);

  return (
    Math.abs(f - targetFrequency) +
    Math.abs(a - targetAmplitude) +
    Math.abs(p - targetPhase)
  );
}

function unlockAudio() {
  if (!audioStarted) {
    initAudio();
    audioStarted = true;
  }

  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().then(() => {
      updateAudioFromError(getCurrentError());
    });
  } else {
    updateAudioFromError(getCurrentError());
  }
}

function startExperience() {
  unlockAudio();
  document.getElementById("startupModal").style.display = "none";
  document.body.classList.remove("modal-open");
}

document.body.addEventListener("click", unlockAudio, { once: false });
document.body.addEventListener("touchstart", unlockAudio, { once: false });

// ------------------------------------
// Event listeners
// ------------------------------------
freqSlider.addEventListener("input", handleSliderInput);
ampSlider.addEventListener("input", handleSliderInput);
phaseSlider.addEventListener("input", handleSliderInput);

function handleSliderInput() {
  unlockAudio();
  updateSignal();
}

// ------------------------------------
// Core update loop
// ------------------------------------
function updateSignal() {
  result.style.opacity = "0";

  // Cancel pending success reveal if user starts moving again
  if (successTimeout) {
    clearTimeout(successTimeout);
    successTimeout = null;
  }

  const f = parseInt(freqSlider.value, 10);
  const a = parseInt(ampSlider.value, 10);
  const p = parseInt(phaseSlider.value, 10);

  freqVal.textContent = f;
  ampVal.textContent = a;
  phaseVal.textContent = p;

  const error =
    Math.abs(f - targetFrequency) +
    Math.abs(a - targetAmplitude) +
    Math.abs(p - targetPhase);

  updateAudioFromError(error);
  drawWave(f, a, p, error);
}

// ------------------------------------
// Button check
// ------------------------------------
function checkSignal() {
  const f = parseInt(freqSlider.value, 10);
  const a = parseInt(ampSlider.value, 10);
  const p = parseInt(phaseSlider.value, 10);

  const error =
    Math.abs(f - targetFrequency) +
    Math.abs(a - targetAmplitude) +
    Math.abs(p - targetPhase);

  if (error <= 0) {
    result.style.opacity = "1";
    result.innerText = "Signal stabilised...\nDecoding transmission...";

    successTimeout = setTimeout(() => {
      result.innerHTML =
        'See? All it takes is a little push.<br><span class="code-glow">Final Escape Code: 5283</span>';
      successTimeout = null;
    }, 2000);
  } else {
    result.style.opacity = "1";
    result.innerText = "Seems like chaos is not your strong suit.\nTry again.";
  }
}

// ------------------------------------
// Waveform drawing (with noise)
// ------------------------------------
function drawWave(frequency, amplitude, phase, error) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (error === 0) {
    drawSmile();
    return;
  }

  // Center baseline
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 1;
  ctx.stroke();

  const match = Math.max(0, 100 - (error / maxError) * 100);

  let waveColor = "#144444";
  if (match >= 90) {
    waveColor = "#00ffff";
  } else if (match >= 75) {
    waveColor = "#00d5d5";
  } else if (match >= 50) {
    waveColor = "#009999";
  } else {
    waveColor = "#144444";
  }

  ctx.beginPath();

  for (let x = 0; x < canvas.width; x++) {
    const noise = (Math.random() - 0.5) * error * 1.2;

    const y =
      canvas.height / 2 +
      Math.sin((x / 50) * frequency + phase) * amplitude * 10 +
      noise;

    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  if (match >= 90) {
    ctx.shadowColor = waveColor;
    ctx.shadowBlur = 8;
  } else {
    ctx.shadowBlur = 0;
  }

  ctx.strokeStyle = waveColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.shadowBlur = 0;
}

// ------------------------------------
// Joker smile
// ------------------------------------
function drawSmile() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2 - 10;

  ctx.strokeStyle = "#39ff14";
  ctx.fillStyle = "#39ff14";
  ctx.lineWidth = 4;

  const glow = 8 + Math.sin(smilePulse) * 6;

  ctx.shadowColor = "#39ff14";
  ctx.shadowBlur = glow;

  // Eyes
  ctx.beginPath();
  ctx.arc(centerX - 40, centerY - 25, 8, 0, 2 * Math.PI);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX + 40, centerY - 25, 8, 0, 2 * Math.PI);
  ctx.fill();

  // Mouth
  ctx.beginPath();
  ctx.arc(centerX, centerY + 5, 60, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  ctx.shadowBlur = 0;
}

// ------------------------------------
// Animation loop
// ------------------------------------
let phaseShift = 0;
let smilePulse = 0;

function animate() {
  const f = parseInt(freqSlider.value, 10);
  const a = parseInt(ampSlider.value, 10);
  const p = parseInt(phaseSlider.value, 10);

  const error =
    Math.abs(f - targetFrequency) +
    Math.abs(a - targetAmplitude) +
    Math.abs(p - targetPhase);

  drawWave(f, a, p + phaseShift, error);

  // Faster when far, slower when close
  const speed = 0.005 + error * 0.003;
  phaseShift += speed;

  smilePulse += 0.05;

  requestAnimationFrame(animate);
}

animate();

// ------------------------------------
// Initial render
// ------------------------------------
updateSignal();