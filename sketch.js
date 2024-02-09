let synthImg;
let keys = []; // Combine white and black keys into a single array for simplicity
let arpeggioInterval;
let arpeggioSpeedSlider;
let lastArpeggioTriggerTime = 0;

//let holdIndicatorX = 710; // X position for the hold indicator
//let holdIndicatorY = 315; // Y position for the hold indicator

let arpeggioActive = false; // To toggle the arpeggio active state
let arpeggioToggleButton; // Button for toggling arpeggio

let activeOsc = null;

let envelope;

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
  setupKeys();

  // Initialize the envelope with attackTime, decayTime, sustainRatio, releaseTime
  envelope = new p5.Envelope();
  envelope.setADSR(0.001, 0.3, 0.2, 8); // Short attack, longer decay, low sustain, moderate release
  envelope.setRange(3, 0); // Maximum amplitude to 1, minimum to 0

  // Initialize the arpeggio speed slider
  arpeggioSpeedSlider = createSlider(50, 600, 300, 1); // Min, Max, Default values and step
  arpeggioSpeedSlider.position(607, 300);
  arpeggioSpeedSlider.style("rotate", "-90deg"); // Rotate slider to vertical

  arpeggioToggleButton = createButton("Toggle");
  arpeggioToggleButton.position(690, 260);
  arpeggioToggleButton.mousePressed(toggleArpeggioActive);
}

function toggleArpeggioActive() {
  arpeggioActive = !arpeggioActive; // Toggle the arpeggio active state

  if (!arpeggioActive) {
    stopArpeggio(); // Stop the arpeggio if it's deactivated
  }
}

function draw() {
  drawKeys();

  // Draw the arpeggio indicator light with a glow effect when active
  push(); // Start a new drawing state
  fill(arpeggioActive ? "green" : "red"); // Green if arpeggio is active, red otherwise
  ellipse(710, 315, 30, 30); // Position and size of the indicator light
  pop(); // Restore original drawing state
}

function setupKeys() {
  let freqIndex = 0; // Index to track the frequency array

  for (let i = 0; i < 7; i++) {
    // Add white keys
    keys.push({
      x: startX + i * whiteKeyWidth,
      color: 255, // White color
      width: whiteKeyWidth,
      height: whiteKeyHeight,
      isPressed: false,
      freq: frequencies[freqIndex++], // Assign frequency and increment index
    });

    // Add black keys conditionally, except after the 3rd and 7th white keys
    if (i !== 2 && i !== 6) {
      keys.push({
        x: startX + (i + 1) * whiteKeyWidth - blackKeyWidth / 2, // Adjust position to be between white keys
        color: 0, // Black color
        width: blackKeyWidth,
        height: blackKeyHeight,
        isPressed: false,
        freq: frequencies[freqIndex++], // Assign frequency and increment index
      });
    }
  }
}

function drawKeys() {
  // Draw all keys, but draw black keys on a separate pass to ensure they are on top
  keys.forEach((key) => {
    if (key.color === 255) {
      // White keys
      fill(key.isPressed ? 200 : 255);
      rect(key.x, key.isPressed ? startY + 2 : startY, key.width, key.height);
    }
  });

  keys.forEach((key) => {
    if (key.color === 0) {
      // Black keys
      fill(key.isPressed ? 80 : 0);
      rect(key.x, key.isPressed ? startY + 2 : startY, key.width, key.height);
    }
  });
}

function playNote(frequency) {
  if (activeOsc) {
    activeOsc.stop();
  }
  activeOsc = new p5.Oscillator("sine"); // Use a sine wave for a smoother sound
  activeOsc.freq(frequency);

  // Start the oscillator without an explicit amplitude
  activeOsc.start();

  // Use the envelope to control the amplitude of the oscillator
  envelope.play(activeOsc);
}

function startArpeggio(frequency) {
  if (!arpeggioInterval) {
    // Only set up the interval if it's not already running
    lastArpeggioTriggerTime = millis(); // Initialize with the current time
    arpeggioInterval = setInterval(() => {
      let currentTime = millis();
      // Check if enough time has passed based on the current slider value
      if (
        currentTime - lastArpeggioTriggerTime >=
        arpeggioSpeedSlider.value()
      ) {
        playNote(frequency); // Play the same note
        lastArpeggioTriggerTime = currentTime; // Reset the last trigger time
      }
    }, 10); // Check every 10 milliseconds to see if it's time to play the note
  }
}
function stopArpeggio() {
  if (arpeggioInterval) {
    clearInterval(arpeggioInterval);
    arpeggioInterval = null; // Clear the interval variable
  }
}
function mousePressed() {
  userStartAudio().then(() => {
    let keyFound = false; // Flag to indicate if a key has been found and played

    // Check black keys first since they are on top and have smaller area
    for (let key of keys) {
      if (key.color === 0) {
        // Black keys
        if (
          mouseX > key.x &&
          mouseX < key.x + key.width &&
          mouseY > startY &&
          mouseY < startY + key.height
        ) {
          key.isPressed = true;
          if (arpeggioActive) {
            startArpeggio(key.freq); // Start arpeggio if arpeggio is active
          } else {
            playNote(key.freq); // Play a single note if arpeggio is not active
          }
          keyFound = true;
          break; // Exit the loop after pressing a key to avoid triggering a white key
        }
      }
    }

    // If no black key was pressed, check white keys
    if (!keyFound) {
      for (let key of keys) {
        if (key.color === 255) {
          // White keys
          if (
            mouseX > key.x &&
            mouseX < key.x + key.width &&
            mouseY > startY &&
            mouseY < startY + key.height
          ) {
            key.isPressed = true;
            if (arpeggioActive) {
              startArpeggio(key.freq); // Also start arpeggio for white keys if arpeggio is active
            } else {
              playNote(key.freq); // Play a single note for white keys if arpeggio is not active
            }
            break; // Exit the loop after pressing a key
          }
        }
      }
    }
  });
}

function mouseReleased() {
  keys.forEach((key) => {
    key.isPressed = false; // Reset key pressed states
  });

  // Stop the arpeggio when the mouse is released if the arpeggio is not set to hold
  if (arpeggioActive) {
    // If arpeggio is active, it should continue playing even after the mouse is released
    // You might want to add logic here if you need to handle something when the mouse is released while the arpeggio is active
  } else {
    stopArpeggio(); // Stop the arpeggio if it's not active
  }
}
