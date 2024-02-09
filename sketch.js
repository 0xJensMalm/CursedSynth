let synthImg;
let keys = []; // Combine white and black keys into a single array for simplicity

let arpeggioOn = false;
let holdMode = false;
let arpeggioSpeed = 1000; // Milliseconds between note changes
let arpeggioInterval;
let activeOsc = null;

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
  //synthImg = loadImage("data:image/png;base64," + base64Img); TEST BASE 64
}

function setup() {
  createCanvas(800, 800);
  image(synthImg, 0, 0, 800, 800);
  setupKeys();

  // Arpeggio toggle button
  let arpButton = createButton("Arpeggio");
  arpButton.position(20, 20);
  arpButton.mousePressed(toggleArpeggio);

  // Hold mode toggle button
  let holdButton = createButton("Hold");
  holdButton.position(20, 50);
  holdButton.mousePressed(toggleHold);

  // Arpeggio speed slider
  let speedSlider = createSlider(50, 600, 300);
  speedSlider.position(20, 80);
  speedSlider.input(() => adjustArpeggioSpeed(speedSlider.value()));
}

function toggleArpeggio() {
  arpeggioOn = !arpeggioOn;
}

function toggleHold() {
  holdMode = !holdMode;
}

function draw() {
  drawKeys();
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
  // Stop the previous oscillator if one is active
  if (activeOsc) {
    activeOsc.stop();
  }

  // Create a new oscillator for the new note
  activeOsc = new p5.Oscillator("sawtooth");
  activeOsc.freq(frequency);
  activeOsc.start();
  activeOsc.amp(0.5, 0.05);

  // Do not automatically stop the oscillator after a fixed duration
  // The oscillator will be stopped when a new note is played or when the mouse is released
}

function startArpeggio(startFreq) {
  if (arpeggioInterval) clearInterval(arpeggioInterval); // Clear any existing interval

  let arpeggioNotes = [startFreq];
  let currentIndex = frequencies.indexOf(startFreq);

  // Add next two frequencies for a simple arpeggio
  if (currentIndex + 1 < frequencies.length)
    arpeggioNotes.push(frequencies[currentIndex + 1]);
  if (currentIndex + 2 < frequencies.length)
    arpeggioNotes.push(frequencies[currentIndex + 2]);

  let noteIndex = 0;

  // Function to cycle through arpeggio notes
  const cycleNotes = () => {
    playNote(arpeggioNotes[noteIndex % arpeggioNotes.length]);
    noteIndex++;
  };

  cycleNotes(); // Start with the first note immediately
  arpeggioInterval = setInterval(cycleNotes, arpeggioSpeed); // Set up the interval to cycle through the notes
}

function adjustArpeggioSpeed(newSpeed) {
  arpeggioSpeed = newSpeed;
  if (arpeggioOn && activeOsc) {
    clearInterval(arpeggioInterval);
    startArpeggio(activeOsc.freq().value); // Restart the arpeggio with the new speed
  }
}

function stopArpeggio() {
  if (arpeggioInterval) clearInterval(arpeggioInterval);
}

function mousePressed() {
  userStartAudio().then(() => {
    if (holdMode) {
      // In hold mode, stop the previous note (if any) when a new key is pressed
      if (activeOsc) {
        activeOsc.stop();
      }
    }

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
          if (arpeggioOn) {
            startArpeggio(key.freq); // Start arpeggio with the pressed key's frequency
          } else {
            playNote(key.freq); // Play the note corresponding to the key's frequency
          }
          keyFound = true;
          break; // Exit the loop after pressing a key
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
            if (arpeggioOn) {
              startArpeggio(key.freq); // Similarly start arpeggio for white keys
            } else {
              playNote(key.freq); // Play the note for white keys
            }
            break; // Exit the loop after pressing a key
          }
        }
      }
    }

    if (!keyFound && arpeggioOn) {
      stopArpeggio(); // Stop arpeggio if no key is pressed and arpeggio is on
    }
  });
}

function mouseReleased() {
  if (!holdMode) {
    if (arpeggioOn) {
      clearInterval(arpeggioInterval); // Stop the arpeggio
      if (activeOsc) {
        activeOsc.stop(); // Stop the active oscillator
        activeOsc = null;
      }
    }
    keys.forEach((key) => (key.isPressed = false)); // Reset key pressed states
  }
}

//let base64Img = "xxx";
