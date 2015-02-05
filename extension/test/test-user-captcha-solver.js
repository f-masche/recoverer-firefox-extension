const { UserCaptchaSolver } = require("util/user-captcha-solver");
const { setTimeout } = require("sdk/timers");

exports["test user captcha solver should solve the captcha"] = function(assert, done) {

  const worker = {
    port: {
      once: function(event, listener) {
        assert.equal(event, "solvedCaptcha", "Added the solvedCaptcha listener");
        this.listener = listener;
      },
      emit: function(event, imageSrc) {
        const self = this;
        assert.equal(event, "solveCaptcha", "Emitted the solveCaptcha event");
        assert.equal(imageSrc, "captcha.jpg", "Emitted correct captchaSrc");
        setTimeout(() => self.listener("test"), 10);
      }
    },
    tab: {
      activate: function() {}
    }
  };
  

  const captchaSrc = "captcha.jpg";

  const captchaSolver = UserCaptchaSolver(worker);

  captchaSolver.solveCaptcha(captchaSrc).then(function(solution) {
    assert.equal("test", solution, "Got the correct solution");
    done();
  });
};


require("sdk/test").run(exports);
