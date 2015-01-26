var passwordGenerator = require("util/password-generator");


exports["test password generatePassword"] = function(assert) {
  const password = passwordGenerator.generatePassword();
  assert.ok(password.length === 14);
};


require("sdk/test").run(exports);
