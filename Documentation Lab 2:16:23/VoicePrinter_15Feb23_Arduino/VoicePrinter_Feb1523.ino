/* Title: Thermal Printer Communicate with JS via p5.webserial
Source: 
Tom Igoe PComp Lab: Serial Output from P5.js using p5.webserial Library
<https://itp.nyu.edu/physcomp/labs/labs-serial-communication/lab-webserial-output-from-p5-js/>
Description:
JS communicate Arduino via P5.webserial and print to printer
Created: Dec 16, 2022
Modified: Dec 16, 2022
*/

#include "Adafruit_Thermal.h" // Thermal Printer library
// Here's the new syntax when using SoftwareSerial (e.g. Arduino Uno) ----
// If using hardware serial instead, comment out or remove these lines:

#include "SoftwareSerial.h"
#define TX_PIN 6 // Arduino transmit  YELLOW WIRE  labeled RX on printer
#define RX_PIN 5 // Arduino receive   GREEN WIRE   labeled TX on printer

SoftwareSerial mySerial(RX_PIN, TX_PIN); // Declare SoftwareSerial obj first
Adafruit_Thermal printer(&mySerial);     // Pass addr to printer constructor

// char density[9] = {' ', '.', '•', ':', ';', '░', '▒', '▓', '█'};
//char density[9] = {'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'};
// char density[11] = {' ', '.', ':', '-', 'i', '|', '=', '+', '%', 'O', '#'};

//const density = " .•:;░▒▓█";
//W$9876543210?!abc;:+=-,._ 
//  .:-i|=+%O#



char st[13];

#define SOP '<'
#define EOP '>'

bool started = false;
bool ended = false;

char inData[12];
char index;


void setup() {
// NOTE: SOME PRINTERS NEED 9600 BAUD instead of 19200, check test page.
  mySerial.begin(19200);  // Initialize SoftwareSerial
  Serial.begin(9600);    // Initialize serial communications
  Serial.setTimeout(10);
  // Serial.setTimeout(10); // Set the timeout for parseInt
  printer.begin();        // Init printer (same regardless of serial type)

  printer.setFont('B');   // Set font to style 'B'
  printer.setSize('S');   // Set font size to smallest
  printer.setLineHeight(24);  // Set line height to 24px
  //printer.justify('C');

  //printer.println("Start"); // Printer print text: "cheeseTest"
  //printer.feed(3);
    // printer.println("12345678901234567890123456789012345678901234567890");
  //printer.setDefault(); // Restore printer to defaults
}

void loop() {
    //Serial.flush();
    /*
    if (Serial.available() > 0) {
      char inByteArr[36];
      int size = Serial.readBytesUntil('\n', inByteArr, 36);
      //printer.print(inByteArr);
      // for(char n=0; n<size; n++){
      //   //inByteArr[n] = Serial.read();

      //   const char len = 9;    // Number reflects density array
      //   const char charIndex = floor(map(inByteArr[n], 0, 255, 0, len));
      //   //printer.print(density[charIndex]);
      //   //printer.print(density[charIndex]);
      //   //printer.print(density[charIndex]);
      // }
      printer.println();
    }
    */
    


  // if (Serial.available() >= 12) {
  //   Serial.readBytes(st, 12);
  //   //st[36] = 0;

  //   printer.println(st);
  // }


  // Read all serial data available, as fast as possible
  while(Serial.available() > 0)
  {
    char inChar = Serial.read();
    if(inChar == SOP)
    {
       index = 0;
       inData[index] = '\0';
       started = true;
       ended = false;
    }
    else if(inChar == EOP)
    {
       ended = true;
       printData();
       break;
    }
    else
    {
      if(index < 11)
      {
        inData[index] = inChar;
        index++;
        inData[index] = '\0';
      }
    }
  }

  // We are here either because all pending serial
  // data has been read OR because an end of
  // packet marker arrived. Which is it?
  if(started && ended)
  {
    // Reset for the next packet
    started = false;
    ended = false;
    index = 0;
    inData[index] = '\0';
  }

}

void printData(){
  for(int i=0; i< 12; i++){
    printer.print(inData[i]);
    printer.print(inData[i]);
    printer.print(inData[i]);
  }
  printer.println();
}