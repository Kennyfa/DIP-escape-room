// ------------------------------------
// DEVELOPMENT PLACEHOLDER VALUES
// Replace these later with outputs from
// your physical puzzles
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

const matchDisplay = document.getElementById("matchPercent");
const meterFill    = document.getElementById("meterFill");

const canvas = document.getElementById("waveCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 420;
canvas.height = 220;

// Max error when each knob is 0..9
// worst-case per knob difference is 9, so total max is 27
const maxError = 27;

//Define result
const result = document.getElementById("result");

// ------------------------------------
// Event listeners
// ------------------------------------
freqSlider.addEventListener("input", updateSignal);
ampSlider.addEventListener("input", updateSignal);
phaseSlider.addEventListener("input", updateSignal);

// ------------------------------------
// Core update loop
// ------------------------------------
function updateSignal() {
  result.style.opacity = "0";
  
  const f = parseInt(freqSlider.value, 10);
  const a = parseInt(ampSlider.value, 10);
  const p = parseInt(phaseSlider.value, 10);

  freqVal.textContent = f;
  ampVal.textContent = a;
  phaseVal.textContent = p;

  // Calculate signal error (your requested formula)
  const error =
    Math.abs(f - targetFrequency) +
    Math.abs(a - targetAmplitude) +
    Math.abs(p - targetPhase);

  // Convert error -> match %
  const match = Math.max(0, 100 - (error / maxError) * 100);

  // Update UI
  matchDisplay.textContent = match.toFixed(0) + "%";
  meterFill.style.width = match + "%";

  if (match > 80) {
    meterFill.style.backgroundColor = "lime";
  } else if (match > 40) {
    meterFill.style.backgroundColor = "orange";
  } else {
    meterFill.style.backgroundColor = "red";
  }

  // Draw waveform with interference that depends on error
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

    setTimeout(() => {
      result.innerHTML =
        'See? All it takes is a little push.<br><span class="code-glow">Final Escape Code: 5283</span>';
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

  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 1;
  ctx.stroke();

  const match = Math.max(0, 100 - (error / maxError) * 100);

  let waveColor = "#144444";   // very dim
  if (match >= 90) {
    waveColor = "#00ffff";     // very bright
  } else if (match >= 75) {
    waveColor = "#00d5d5";     // bright
  } else if (match >= 50) {
    waveColor = "#009999";     // medium
  } else {
    waveColor = "#144444";     // dim
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

function drawSmile() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2 - 10;

  ctx.strokeStyle = "#39ff14";
  ctx.fillStyle = "#39ff14";
  ctx.lineWidth = 4;

  // Pulse glow strength
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

  phaseShift += 0.02;
  smilePulse += 0.05;

  requestAnimationFrame(animate);
}

animate();

// ------------------------------------
// Initial render (so it looks alive immediately)
// ------------------------------------
updateSignal();