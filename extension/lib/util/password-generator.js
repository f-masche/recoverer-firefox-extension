/* globals Services, Uint8Array */

/*
* This is a utility module to generate secure passwords.
* Uses the `window.crypto.getRandomValues` function.
*/

const { Cu } = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");

const PASSWORD_LENGTH = 14;

const ASCII_START = 33;

const ASCII_END = 127;


/**
* Generates a new password.
*
* @return {String}
*   A password
*/
function generatePassword() {
  const window = Services.appShell.hiddenDOMWindow;
  const bytes = new Uint8Array(PASSWORD_LENGTH);

  window.crypto.getRandomValues(bytes);

  const password = bytesToASCII(bytes);
  
  return password;
}

/**
* Converts a byte array to an ASCII string.
*
* @param {Array} bytes
*   An Array of bytes
* @return {String}
*   The converted ASCII string
*/
function bytesToASCII(bytes) {
  var string = "";

  const interval = ASCII_END - ASCII_START;

  for(var i = 0; i < bytes.length; i++) {
    const k = Math.floor((bytes[i] - ASCII_START) / interval);
    const m = bytes[i] - ASCII_START - k * interval;
    const charCode = ASCII_START + m;
    string += String.fromCharCode(charCode);
  }

  return string;
}

exports.generatePassword = generatePassword;
exports.bytesToASCII = bytesToASCII;