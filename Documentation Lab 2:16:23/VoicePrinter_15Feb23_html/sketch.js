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
let loudData;

let lastChroma;
let lastRms;

let inp;
let startBtn;
let saveBtn;
let micStarted = false;
let counter = 0;
let again = false;
//const strArr = ['a', 'b', 'c', 'd', 'e', 'f', 'g','h', 'i', 'j', 'k', 'l'];

let myFont;

//const density = "Ñ@#W$9876543210?!abc;:+=-,._                    ";
const strArr = "  .:i|+%O#".split('');
//const strArr = "    .•:;░▒▓█".split('');
//const strArr = "@9c;:+=-,._ ".split('');


// variable to hold an instance of the p5.webserial library:
const serial = new p5.WebSerial();
let portButton;
let inData;
let outByte = [];

let energySlider;


function setup() {
  let cnv = createCanvas((windowHeight / 11) * 8.5, windowHeight); //letter size ratio
  cnv.position(480, 0);
  background(255);

  startBtn = select("#startBtn");
  startBtn.mousePressed(setupMeyda);

  // WebSerial setup....................
  if (!navigator.serial) {
    alert("WebSerial is not supported in this browser. Try Chrome or MS Edge.");
  }
  // if serial is available, add connect/disconnect listeners:
  navigator.serial.addEventListener("connect", portConnect);
  navigator.serial.addEventListener("disconnect", portDisconnect);
  // check for any ports that are available:
  serial.getPorts();
  makePortButton();
  // if there's no port chosen, choose one:
  // serial.on("noport", makePortButton);
  // open whatever port is available:
  serial.on("portavailable", openPort);
  // handle serial errors:
  serial.on("requesterror", portError);
  // handle any incoming serial data:
  serial.on("data", serialEvent);
  serial.on("close", makePortButton);
  serial.open();

  energySlider = createSlider(3, 8, 5);
  energySlider.position(15, 120);
  energySlider.style('width', '150px');


}

//const minEnergy = 0.7;

function draw() {
  serial.clear();
  noStroke();
  let x = 1;
  let currHeight = height - counter;
  //serial.clear();

  let minEnergy = energySlider.value()*0.1;

  if (micStarted) {
    let outString = '<';
    if (chromaData && energyData && loudData) {
      //const loudness = max(0, min(1, map(loudData, 10, 20, 0, 1)));
      //const loudness = max(0, min(1, map(loudData, 10, 20, 0, 1)));
      for (let i = 0; i < chromaData.length; i++) {
        //let chromaClr = max(0, min(density.length - 1, round(map(loudness*chromaData[i], minEnergy, 1, density.length - 1, 0))));
        let chr = max(0, min(strArr.length-1, round(map(chromaData[i],0.3,1,strArr.length-1,0))));

        outString += strArr[chr];
        //outString += i%10;
      }
      outString += ">";
      
      if (energyData > minEnergy) {
        //while(outString.length<12){};
        console.log(outString);
        //console.log(outByte, outByte.map(i => density[i]).join(''));
        //serial.println(outByte);
        
        serial.write(outString);

        //fill(0);
        //rect(x * chromaData.length - 1, counter, 5, 1);
      }

      //update counter
      //counter++;
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

    // if (again) {
    //   counter = 0;
    //   background(255);
    //   saveBtn.class("hide");
    //   again = false;
    // }

    createMicSrcFrom(audioCtx)
      .then((src) => {
        let analyzer = Meyda.createMeydaAnalyzer({
          audioContext: audioCtx,
          source: src,
          bufferSize: 512,
          featureExtractors: ["chroma", "energy","loudness"],
          callback: (features) => {
            if (micStarted) {
              chromaData = features.chroma;
              //console.log(`loudness: ${features.loudness.total}`);
              loudData = features.loudness.total;
              energyData = features.energy;
              //console.log('amplitudeSpectrum', max(...features.amplitudeSpectrum));
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

//Web Serial =============================================
// if there's no port selected,
// make a port select button appear:
function makePortButton() {
  // create and position a port chooser button:
  portButton = createButton("choose port");
  portButton.position(15, 10);
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
  function initiateSerial(p) {
    console.log("port open");
    serial.clear();
  }
  // hide the port button once a port is chosen:
  // if (portButton) portButton.hide();
}

// pop up an alert if there's a port error:
function portError(err) {
  alert("Serial port error: " + err);
}
// read any incoming data as a string
// (assumes a newline at the end of it):
function serialEvent() {
  console.log(serial.readBytes());
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
