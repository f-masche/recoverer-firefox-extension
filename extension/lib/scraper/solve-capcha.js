const { Class } = require("sdk/core/heritage");
const { Operation } = require("scraper/operation");

/**
* The SolveCaptcha solves a captcha image.
*/
const SolveCaptcha = Class({

  extends: Operation,

  /**
  * Creates a new SolveCaptcha operation.
  */
  initialize: function(captchaImgSelector, capchaInputSelector) {
    Operation.prototype.initialize.call(this, "solveCaptcha");
    this.captchaImgSelector = captchaImgSelector;
    this.capchaInputSelector = capchaInputSelector;
  },

  handler: function(runtime, success, failure) {
    var self = this;

    this.runtime.worker.emit("getAttribute", this.captchaImgSelector, "src");

    this.runtime.worker.once("gotAttribute", function(imgSrc, error) {
      if(error) {
        failure(error);
      } else {
        runtime.capchaSolver.solveCaptcha(imgSrc).then(function(solution) {
          runtime.worker.emit("setValue", self.capchaInputSelector, solution);

          runtime.worker.once("setValue", function(error) {
            if(error) {
              failure(error);
            } else {
              success();
            }
          });
        }, failure);
      }
    });
  }
});

exports.SolveCaptcha = SolveCaptcha;