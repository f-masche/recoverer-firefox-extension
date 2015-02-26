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
  const alphabet = "abcde";
  const bytes = [0,2,1,4,3];

  const string = passwordGenerator.bytesToASCII(bytes, alphabet);

  assert.equal("acbed", string, "generated string is correct");
};

require("sdk/test").run(exports);
