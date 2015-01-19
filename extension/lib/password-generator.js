/* globals Services, Uint8Array */

const { Cu } = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");

const PASSWORD_LENGTH = 14;

const ASCII_SIZE = 128;

const ASCII_OFFSET = 33;

function generatePassword() {
  const window = Services.appShell.hiddenDOMWindow;
  const bytes = new Uint8Array(PASSWORD_LENGTH);

  window.crypto.getRandomValues(bytes);

  const password = bytesToAscii(bytes);
  
  return password;
}

function bytesToAscii(bytes) {
  let string = "";

  for(let i = 0; i < bytes.length; i++) {
    let charCode = bytes[i] % (ASCII_SIZE - ASCII_OFFSET) + ASCII_OFFSET;
    string += String.fromCharCode(charCode);
  }

  return string;
}

exports.generatePassword = generatePassword;