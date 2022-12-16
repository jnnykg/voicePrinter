"use strict";
/**************************************************************************
  Voice Printer
  REFERENCES:
  # Michael Simpson's Listening Machines - Fall 2022 - Week 3 collection: https://editor.p5js.org/mgs/sketches/PbKpTBsub
  created 13 Oct 2022
  modified 15 Dec 2022
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
const density = 'Ñ@#W$9876543210?!abc;:+=-,._ '

// variable to hold an instance of the p5.webserial library:
const serial = new p5.WebSerial();
let portButton;
let inData;             

let outByte;

function setup() {
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

  let cnv = createCanvas((windowHeight / 11) * 8.5, windowHeight); //letter size ratio
  cnv.position(480, 0);
  background(255);

  inp = select("#superstar");
  startBtn = select("#startBtn");
  startBtn.mousePressed(setupMeyda);

  saveBtn = select("#saveBtn");
  saveBtn.mousePressed(saveResult);
}

function draw() {
  noStroke();
  let x = 1;
  let currHeight = height - counter;
  let outByte =[];
  if (micStarted) {
    if (chromaData && energyData) {
      // send chroma data

      for (let i = 0; i < chromaData.length; i++) {
        let chromaClr = map(chromaData[i], 0.3, 1, 210, 10);
        let skip = floor(255 / chromaClr);
        
        for (let p = 0; p < 32; p++) {
          let index = 32 * i + p
       
          // serial.write(outByte);
          if (p % skip == 0) {
            outByte[index] = 0;
            // serial.write(outByte);
          } else{
            outByte[index] = 1;
          }
          
        }
      //  serial.write(byte(outByte));
      }
      //console.log(byte(outByte));
      serial.write(byte(outByte));

//  console.log("outByte: " + outByte);

 for(let i=0; i<outByte.length; i++){
  if(outByte[i]==0){

    fill(0);
  }else if(outByte[i]==1){
    fill(255);
  }
  rect(i, counter, 1, 2);
 }

      //draw chroma data
      // for (let i = 0; i < chromaData.length - 1; i++) {
      //   let chromaClr = map(chromaData[i], 0.3, 1, 210, 10);
      //   let skip = floor(255 / chromaClr);

      //   for (let p = 0; p < 30; p++) {
      //     if (p % skip == 0) {
      //       fill(0);
      //       rect(i * 30 + p + random(6), counter, x, 2);
      //     }
      //   }
      // }

      // if (energyData > 0.3) {
      //   fill(0);
      //   rect(x * chromaData.length - 1, counter, 5, 1);
      // }

      //draw a white rect
      fill(255);
      rect(0, counter + 1, width, currHeight - 1);
      drawLabels(x, counter + 10);

      //update counter
      counter++;
    }

    //reset
    if (counter > height) {
      micStarted = false;
      displayText();
      startBtn.html("restart");
      startBtn.removeClass("pauseBtn");
      saveBtn.removeClass("hide");
      again = true;
      counter = 0;
    }
  }
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

//result---------------------------------
function displayText() {
  let superstar = inp.value();
  if (!superstar) {
    superstar = "Anonymous Superstar";
  }
  let referX = (width / 40) * 39;
  let referY = height - 50;
  let fsize = 12;
  let lineHeight = fsize * 1.5;
  let currTime = `${month()}/${day()}/${year()} ${hour()}:${minute()}:${second()}`;
  fill(0);
  textFont("monospace", fsize);
  textAlign(RIGHT);

  text(superstar, referX, referY);
  text(currTime, referX, referY + lineHeight);
  text("You sound so beautiful!", referX, referY + lineHeight * 2);
}

function drawLabels(x, y) {
  let pitchClasses = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  textFont("monospace", 10);
  textAlign(LEFT);
  fill(0);
  for (let i = 0; i < pitchClasses.length; i++) {
    text(pitchClasses[i], x * i, y);
  }
  text("rms", x * 12 + 5, y);
}

function saveResult() {
  let superstar = inp.value();
  saveCanvas("voiceprinter_" + superstar, "png");
}


//Serial =============================================
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