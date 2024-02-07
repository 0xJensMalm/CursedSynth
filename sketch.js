let backgroundImage, fingerLayerImage; // Variables for the background and finger layer images
let eyeImage1, eyeImage2; // Variables for the eye images
let buttons = []; // Array to hold the button objects
let currentEyeImage; // Variable to keep track of which eye image to display
let switchInterval = 200; // Interval in milliseconds for switching images
let lastSwitchTime = 0; // Time since last image switch
let oscillators = []; // Array to hold the oscillators for each tone
let lastPressTime = []; // Array to hold the last press time for each button

function preload() {
  backgroundImage = loadImage("background.png"); // Load the background image
  fingerLayerImage = loadImage("fingerLayer.png"); // Load the finger layer image
  eyeImage1 = loadImage("eye1.png"); // Load the first eye image
  eyeImage2 = loadImage("eye2.png"); // Load the second eye image
}

function setup() {
  createCanvas(700, 700);
  // Initialize buttons, oscillators, and lastPressTime
  for (let i = 0; i < 6; i++) {
    buttons.push(new Button(100 + i * 85, 650, 50, i));
    let osc = new p5.Oscillator("sawtooth");
    osc.freq(110 * pow(2, i / 12));
    osc.amp(0);
    osc.start();
    oscillators.push(osc);
    lastPressTime.push(0); // Initialize the last press time for each button
  }
  currentEyeImage = eyeImage1;
}

function draw() {
  background(backgroundImage); // Display the background image

  // Check if any oscillator is playing
  let anyOscillatorPlaying = oscillators.some((osc) => osc.amp().value > 0.01);

  // Draw the finger layer image
  image(fingerLayerImage, 0, 0, width, height);

  // Visualization container (the area for sound visualization)
  if (anyOscillatorPlaying) {
    // Placeholder for sound visualization
    // You can add your sound visualization logic here
    stroke(255, 0, 0); // Red frame for visualization container
    noFill();
    ellipse(width / 2, height / 2, 200); // Visualization area
  }

  // Only activate the eye flickering effect if a sound is playing
  if (anyOscillatorPlaying && millis() - lastSwitchTime > switchInterval) {
    currentEyeImage = currentEyeImage === eyeImage1 ? eyeImage2 : eyeImage1;
    lastSwitchTime = millis();
  }

  // Display the current eye image on top of everything
  image(currentEyeImage, 0, 0, width, height);

  // Display and handle button presses
  buttons.forEach((button, index) => {
    button.display(); // Make sure buttons are always displayed

    if (button.isPressed(mouseX, mouseY) && mouseIsPressed) {
      if (lastPressTime[index] === 0 || millis() - lastPressTime[index] > 500) {
        // Update if not pressed before or it's been more than 500ms
        lastPressTime[index] = millis(); // Update the last press time
      }
      let currentTime = millis();
      let modulationSpeed = 20; // Speed of the amplitude modulation
      let modulationAmount = 0.25; // How much the amplitude varies
      let timeSincePressed = currentTime - lastPressTime[index]; // Calculate time since the button was pressed

      if (timeSincePressed < 500) {
        // Apply modulation for the first 500ms
        let modulation =
          Math.abs(Math.sin(currentTime / modulationSpeed)) * modulationAmount;
        oscillators[index].amp(0.5 + modulation, 0.05); // Apply the modulated amplitude
      } else {
        oscillators[index].amp(0.5, 0.05); // After 500ms, stabilize the tone
      }
    } else {
      oscillators[index].amp(0, 0.5); // Fade out the tone
    }
  });
}

// Button class to handle button creation, display, and press detection
class Button {
  constructor(x, y, diameter, toneIndex) {
    this.x = x;
    this.y = y;
    this.diameter = diameter;
    this.toneIndex = toneIndex; // Associate each button with a tone
  }

  display() {
    fill(255, 0, 0); // Red color for the buttons
    ellipse(this.x, this.y, this.diameter); // Draw the button
  }

  isPressed(px, py) {
    let d = dist(px, py, this.x, this.y);
    return d < this.diameter / 2; // Returns true if mouse is over the button
  }
}