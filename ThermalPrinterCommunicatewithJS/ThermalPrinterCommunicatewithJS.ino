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

void setup() {
// NOTE: SOME PRINTERS NEED 9600 BAUD instead of 19200, check test page.
  mySerial.begin(19200);  // Initialize SoftwareSerial
  Serial.begin(19200);    // Initialize serial communications
  // Serial.setTimeout(10); // Set the timeout for parseInt
  printer.begin();        // Init printer (same regardless of serial type)

  printer.setFont('B');   // Set font to style 'B'
  printer.setSize('S');   // Set font size to smallest
  printer.setLineHeight(24);  // Set line height to 24px

  printer.println("cheeseTest"); // Printer print text: "cheeseTest"

  printer.setDefault(); // Restore printer to defaults
}

void loop() {
    if (Serial.available() > 0) {
      // printer.println("serial available!");
      int inByte = Serial.read();
      //int inByte = Serial.parseInt();  // Read incoming string

      Serial.write(inByte);
      printer.println(inByte);

      if (inByte > 0) {
        Serial.write(inByte);   // Send back as raw binary and show in console 
      }
    }
}
