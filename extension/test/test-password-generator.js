var passwordGenerator = require("util/password-generator");


exports["test password should generate a password"] = function(assert) {
  const password = passwordGenerator.generatePassword();
  assert.ok(password.length === 14);
};

exports["test password should generate different passwords"] = function(assert) {
  const password1 = passwordGenerator.generatePassword();
  const password2 = passwordGenerator.generatePassword();

  assert.ok(password1 !== password2);
};

exports["test password should convert bytes to ASCII"] = function(assert) {
  const asciiBytes = [];

  for(let i = 33; i <= 126; i++) {
    asciiBytes.push(i);
  }

  const shiftedAsciiBytes = [];

  for(let i = 0; i < asciiBytes.length; i++) {
    shiftedAsciiBytes[i] = asciiBytes[i] + 94 * Math.round(Math.random() * 10);
  }

  const string = passwordGenerator.bytesToASCII(shiftedAsciiBytes);

  var equal = true;

  for(let i = 0; i < asciiBytes.length; i++) {
    if(string.charCodeAt(i) !== asciiBytes[i]) {
      equal = false;
    }
  }

  assert.ok(equal);
};

require("sdk/test").run(exports);
