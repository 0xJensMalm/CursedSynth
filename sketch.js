let synthImg;
let keyboard; // Instance of the Keyboard class
let arpeggioInterval;
let arpeggioSpeedSlider;
let lastArpeggioTriggerTime = 0;
let nextNoteTime = 0;
let arpeggioActive = false;
let arpeggioToggleButton;
let activeOsc = null;
let envelope;
let amplitude; // Add this with the global variables

let lineStartX = 215; // Adjust as needed
let lineStartY = 110; // Adjust as needed
let lineEndX = 615; // Adjust as needed
let lineEndY = 110; // Adjust as needed
let minAmplitudeThreshold = 0.0001;

// Frequencies for C3 to B3 octave, corrected
let frequencies = [
  130.81,
  138.59,
  146.83,
  155.56,
  164.81, // C3 to E3
  174.61,
  185.0,
  196.0,
  207.65,
  220.0, // F3 to A3
  233.08,
  246.94, // A#3/Bb3 to B3
];

// Key dimensions and positions
let whiteKeyWidth = 83;
let whiteKeyHeight = 200;
let blackKeyWidth = 50;
let blackKeyHeight = 100;
let startY = 560;
let startX = 108;

function preload() {
  synthImg = loadImage("synth.png"); // Ensure 'synth.png' is in the project directory
}

function setup() {
  createCanvas(800, 800);
  image(synthImg, 0, 0, 800, 800);

  keyboard = new Keyboard(
    startX,
    startY,
    whiteKeyWidth,
    whiteKeyHeight,
    blackKeyWidth,
    blackKeyHeight,
    frequencies
  );

  envelope = new p5.Envelope();
  envelope.setADSR(0.001, 0.3, 0.2, 8); // Short attack, longer decay, low sustain, moderate release
  envelope.setRange(3, 0); // Maximum amplitude to 1, minimum to 0

  arpeggioSpeedSlider = createSlider(50, 600, 300, 1);
  arpeggioSpeedSlider.position(607, 300);
  arpeggioSpeedSlider.style("rotate", "-90deg");

  arpeggioToggleButton = createButton("Toggle");
  arpeggioToggleButton.position(690, 260);
  arpeggioToggleButton.mousePressed(toggleArpeggioActive);

  amplitude = new p5.Amplitude();
}

function draw() {
  keyboard.drawKeys();

  push();
  fill(arpeggioActive ? "green" : "red");
  ellipse(710, 315, 30, 30);

  drawSoundLines();
  pop();
}

class Keyboard {
  constructor(
    startX,
    startY,
    whiteKeyWidth,
    whiteKeyHeight,
    blackKeyWidth,
    blackKeyHeight,
    frequencies
  ) {
    this.keys = [];
    this.startX = startX;
    this.startY = startY;
    this.frequencies = frequencies;
    this.setupKeys(
      whiteKeyWidth,
      whiteKeyHeight,
      blackKeyWidth,
      blackKeyHeight
    );
  }

  setupKeys(whiteKeyWidth, whiteKeyHeight, blackKeyWidth, blackKeyHeight) {
    let freqIndex = 0;
    for (let i = 0; i < 7; i++) {
      this.keys.push(
        new Key(
          this.startX + i * whiteKeyWidth,
          this.startY,
          whiteKeyWidth,
          whiteKeyHeight,
          255,
          this.frequencies[freqIndex++]
        )
      );
      if (i !== 2 && i !== 6) {
        this.keys.push(
          new Key(
            this.startX + (i + 1) * whiteKeyWidth - blackKeyWidth / 2,
            this.startY,
            blackKeyWidth,
            blackKeyHeight,
            0,
            this.frequencies[freqIndex++]
          )
        );
      }
    }
  }

  drawKeys() {
    this.keys.forEach((key) => {
      fill(
        key.color === 255 ? (key.isPressed ? 200 : 255) : key.isPressed ? 80 : 0
      );
      rect(key.x, key.y + (key.isPressed ? 2 : 0), key.width, key.height);
    });
  }

  checkPressedKeys(mouseX, mouseY) {
    let keyFound = false;
    this.keys.forEach((key) => {
      if (
        mouseX > key.x &&
        mouseX < key.x + key.width &&
        mouseY > this.startY &&
        mouseY < this.startY + key.height
      ) {
        key.isPressed = true;
        keyFound = true;
        if (arpeggioActive) {
          startArpeggio([key.freq]); // Modified to pass an array of notes
        } else {
          playNote(key.freq);
        }
        return true; // Found and processed a key
      }
    });
    return keyFound;
  }

  resetKeys() {
    this.keys.forEach((key) => (key.isPressed = false));
  }
}

class Key {
  constructor(x, y, width, height, color, freq) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.freq = freq;
    this.isPressed = false;
  }
}

function playNote(frequency) {
  if (activeOsc) activeOsc.stop();
  activeOsc = new p5.Oscillator("sine");
  activeOsc.freq(frequency);
  activeOsc.start();
  envelope.play(activeOsc);
  console.log(`Playing note: ${frequency} Hz`);
}

function startArpeggio(notes) {
  console.log("Starting arpeggio");
  if (arpeggioInterval) clearInterval(arpeggioInterval); // Clear existing interval if any

  let noteIndex = 0;
  arpeggioInterval = setInterval(() => {
    let currentTime = millis();
    if (currentTime >= nextNoteTime) {
      playNote(notes[noteIndex % notes.length]);
      noteIndex++;

      let sliderValue = arpeggioSpeedSlider.value();
      let adjustedSliderValue = 600 - sliderValue; // Adjust the speed based on the slider
      nextNoteTime = currentTime + adjustedSliderValue; // Set the time for the next note
      console.log(
        `Arpeggio note played. Next note in: ${adjustedSliderValue} ms`
      );
    }
  }, 10); // Check every 10 milliseconds to maintain responsiveness
}

function stopArpeggio() {
  if (arpeggioInterval) {
    clearInterval(arpeggioInterval);
    arpeggioInterval = null;
    nextNoteTime = 0; // Reset the next note time
    console.log("Arpeggio stopped");
  }
}

function toggleArpeggioActive() {
  arpeggioActive = !arpeggioActive;
  console.log(`Arpeggio active: ${arpeggioActive}`);
  if (!arpeggioActive) stopArpeggio();
}

function drawSoundLines() {
  let level = amplitude.getLevel(); // Get the current amplitude level

  // Calculate the current length of the lines based on the amplitude level
  let currentLineLength = map(level, 0, 1, 0, lineEndX - lineStartX);
  let lineMidPointX = (lineStartX + lineEndX) / 2; // Midpoint of the line's original start and end points
  let currentStartX = lineMidPointX - currentLineLength / 2; // Adjusted start point based on the current line length
  let currentEndX = lineMidPointX + currentLineLength / 2; // Adjusted end point based on the current line length

  // Set the color for the 3 lines
  stroke(255, 255, 0); // Yellow color
  strokeWeight(2); // Line thickness

  // Draw 3 lines that consolidate towards the center based on the amplitude level
  line(currentStartX, lineStartY - 20, currentEndX, lineEndY - 20); // Upper line
  line(currentStartX, lineStartY, currentEndX, lineEndY); // Middle line
  line(currentStartX, lineStartY + 20, currentEndX, lineEndY + 20); // Lower line

  // Only draw noise pattern if the amplitude is above a certain threshold
  if (level > minAmplitudeThreshold) {
    let noiseScale = map(level, 0, 1, 0.01, 0.1);
    noiseDetail(8, 0.5);

    // Create a cool noise pattern in the middle of the lines
    beginShape();
    noFill(); // No fill for the shape

    for (let x = currentStartX; x <= currentEndX; x += 10) {
      let noiseVal = noise((x + frameCount) * noiseScale) * 100; // Generate noise value
      let y = lineStartY + noiseVal - 50; // Adjust Y position based on noise
      stroke(255, 255, 0, 150); // Semi-transparent yellow
      strokeWeight(1); // Thinner lines for the noise pattern
      vertex(x, y);
    }

    endShape();
  }
}

function mousePressed() {
  userStartAudio().then(() => {
    // Check if the mouse interaction is on the slider
    if (
      mouseY >= 300 - 15 &&
      mouseY <= 300 + 15 &&
      mouseX >= 607 &&
      mouseX <= 907
    ) {
      console.log("Interacting with slider, arpeggio will not stop.");
      // Possibly update something here if needed, but do not stop the arpeggio
    } else {
      // Proceed with the original functionality if not interacting with the slider
      if (!keyboard.checkPressedKeys(mouseX, mouseY)) {
        stopArpeggio(); // No key was pressed, stop arpeggio if it's not due to slider interaction
      }
    }
  });
}

function mouseReleased() {
  keyboard.resetKeys();
  // Consider adding a similar condition here if necessary
}
