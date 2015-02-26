/* globals Services, Uint8Array */

/*
* This is a utility module to generate secure passwords.
* Uses the `window.crypto.getRandomValues` function.
*/

const { Cu } = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");

const DEFAULT_LENGTH = 14;

const LETTERS = ["abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"];
const DIGITS = ["1234567890"];
const SPECIAL = ["!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"];


/**
* Generates a new password.
*
* @param {int} length
*   Optional length of the password. Default is 14.
*   Must be between 1 and 128.
*
* @return {String}
*   A password
*/
function generatePassword(length) {
  if(length && length > 128 || length < 1) {
    throw new Error("Invalid password length: " + length);
  }

  const passwordLength = length || DEFAULT_LENGTH;
  const window = Services.appShell.hiddenDOMWindow;
  const bytes = new Uint8Array(passwordLength);

  window.crypto.getRandomValues(bytes);

  const password = bytesToASCII(bytes, LETTERS + DIGITS + SPECIAL);
  
  return password;
}

/**
* Converts a byte array to an ASCII string.
*
* @param {Array} bytes
*   An Array of bytes
*
* @param {String}
*   An alphabet that should be used for the conversion.
*
* @return {String}
*   The converted ASCII string
*/
function bytesToASCII(bytes, alphabet) {
  var string = "";

  for(var i = 0; i < bytes.length; i++) {
    const k = bytes[i] % alphabet.length;
    string += alphabet[k];
  }

  return string;
}

exports.generatePassword = generatePassword;
exports.bytesToASCII = bytesToASCII;