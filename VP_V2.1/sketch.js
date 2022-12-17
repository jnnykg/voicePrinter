"use strict";
/**************************************************************************
  Voice Printer
  REFERENCES:
  # Michael Simpson's Listening Machines - Fall 2022 - Week 3 collection: https://editor.p5js.org/mgs/sketches/PbKpTBsub
  # Tom Igoe's Serial Output from p5.js Using the p5.webserial Library: https://itp.nyu.edu/physcomp/labs/labs-serial-communication/lab-webserial-output-from-p5-js/
  
  created 13 Oct 2022
  modified 16 Dec 2022
  by I-Jon Hsieh & Jinny Kang
 **************************************************************************/

let audioCtx;
let chromaData;
let energyData;

let lastChroma;
let lastRms;

let inp;
let startBtn;
let saveBtn;
let micStarted = false;
let counter = 0;
let again = false;

let myFont;

// variable to hold an instance of the p5.webserial library:
const serial = new p5.WebSerial();

// HTML button object:
let portButton;
let inData;                            // for incoming serial data
let outByte = 0;                       // for outgoing data

function setup() {
  let cnv = createCanvas((windowHeight / 11) * 8.5, windowHeight); //letter size ratio
  cnv.position(480, 0);
  background(255);

  startBtn = select("#startBtn");
  startBtn.mousePressed(setupMeyda);
  createCanvas(400, 300);     // make the canvas

  // check to see if serial is available:
  if (!navigator.serial) {
    alert("WebSerial is not supported in this browser. Try Chrome or MS Edge.");
  }
  // if serial is available, add connect/disconnect listeners:
  navigator.serial.addEventListener("connect", portConnect);
  navigator.serial.addEventListener("disconnect", portDisconnect);
  // check for any ports that are available:
  serial.getPorts();
  // if there's no port chosen, choose one:
  serial.on("noport", makePortButton);
  // open whatever port is available:
  serial.on("portavailable", openPort);
  // handle serial errors:
  serial.on("requesterror", portError);
  // handle any incoming serial data:
  serial.on("data", serialEvent);
  serial.on("close", makePortButton);
  serial.open(19200);
}

function draw() {
  // black background, white text:
  // background(0);
  // fill(255);
  // display the incoming serial data as a string:
  text("incoming value: " + inData, 30, 30); // Can we put this in html??
  

  noStroke();
  let x = 1;
  let currHeight = height - counter;

  if (micStarted) {
    if (chromaData && energyData) {
      //draw chroma data
      for (let i = 0; i < chromaData.length; i++) {
        let chromaClr = map(chromaData[i], 0.3, 1, 210, 10);
        let skip = floor(255 / chromaClr);

        for (let p = 0; p < 32; p++) {
          let index = 32 * i + p;

          if (p % skip == 0) {
            outByte[index]=0;
          } else {
            outByte[index] = 1;
          }
        }
      }

      if (energyData > 0.3) {
        fill(0);
        rect(x * chromaData.length - 1, counter, 5, 1);
      }

      //draw a white rect
      fill(255);
      rect(0, counter + 1, width, currHeight - 1);

      //update counter
      counter++;
    }

    //reset
    if (counter > height) {
      micStarted = false;
      startBtn.html("restart");
      startBtn.removeClass("pauseBtn");
      saveBtn.removeClass("hide");
      again = true;
      counter = 0;
    }
  }
}

function mouseDragged() {
  // map the mouseY to a range from 0 to 255:
  outByte = byte(map(mouseY, 0, height, 0, 255));
  // send it out the serial port:
  serial.write(outByte);
}

function keyPressed() {
  if (key >= 0 && key <= 9) {   // if the user presses 0 through 9
    outByte = byte(key * 25); // map the key to a range from 0 to 225
    serial.println(outByte);      // send it out the serial port
  }
  if (key === "H" || key === "L") {
    // if the user presses H or L
    serial.println(key); // send it out the serial port
  }
}

// if there's no port selected, 
// make a port select button appear:
function makePortButton() {
  // create and position a port chooser button:
  portButton = createButton('choose port');
  portButton.position(10, 10);
  // give the port button a mousepressed handler:
  portButton.mousePressed(choosePort);
}

// make the port selector window appear:
function choosePort() {
  if (portButton) portButton.show();
  serial.requestPort();
}

// open the selected port, and make the port 
// button invisible:
function openPort() {
  // wait for the serial.open promise to return,
  // then call the initiateSerial function
  serial.open().then(initiateSerial);

  // once the port opens, let the user know:
  function initiateSerial() {
    console.log("port open");
  }
  // hide the port button once a port is chosen:
  if (portButton) portButton.hide();
}

// pop up an alert if there's a port error:
function portError(err) {
  alert("Serial port error: " + err);
}
// read any incoming data as a string
// (assumes a newline at the end of it):
function serialEvent() {
  inData = Number(serial.read());
  console.log(inData);
}

// try to connect if a new serial port 
// gets added (i.e. plugged in via USB):
function portConnect() {
  console.log("port connected");
  serial.getPorts();
}

// if a port is disconnected:
function portDisconnect() {
  serial.close();
  console.log("port disconnected");
}

function closePort() {
  serial.close();
}

//meyda-----------------------------------------------------------
function createMicSrcFrom(audioCtx) {
  return new Promise((resolve, reject) => {
    /* only audio */
    let constraints = { audio: true, video: false };

    /* get microphone access */
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        /* create source from microphone input stream */
        let src = audioCtx.createMediaStreamSource(stream);
        resolve(src);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function setupMeyda() {
  audioCtx = getAudioContext();

  if (!micStarted) {
    audioCtx.resume();
    startBtn.html("pause");
    startBtn.class("pauseBtn");

    if (again) {
      counter = 0;
      background(255);
      saveBtn.class("hide");
      again = false;
    }

    createMicSrcFrom(audioCtx)
      .then((src) => {
        let analyzer = Meyda.createMeydaAnalyzer({
          audioContext: audioCtx,
          source: src,
          bufferSize: 512,
          featureExtractors: ["chroma", "energy"],
          callback: (features) => {
            if (micStarted) {
              chromaData = features.chroma;
              energyData = features.energy;
            }
          },
        });
        analyzer.start();
      })
      .catch((err) => {
        alert(err);
      });
  } else {
    startBtn.html("resume");
    startBtn.removeClass("pauseBtn");
  }
  micStarted = !micStarted;
}