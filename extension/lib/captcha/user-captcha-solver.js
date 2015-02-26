const { Class } = require("sdk/core/heritage");

/**
* This is a captcha solver that works to the main content script.
* It lets the user solve the captcha.
*/
const UserCaptchaSolver = Class({

  /**
  * @param {Worker} worker
  *   Worker connected to the `main.js` content script.
  */
  initialize: function(worker) {
    this._worker = worker;
  },

  /**
  * Solves a captcha.
  *
  * @param {Srting} imageSrc
  *   Src URL of the image
  * @return {Promise} 
  *   A promise that gets resolved with the user provided solution.
  */
  solveCaptcha: function(imageSrc) {
    const self = this;

    this._worker.tab.activate();

    this._worker.port.emit("solveCaptcha", imageSrc);
    
    return new Promise(function(resolve, reject) {
      self._worker.port.once("solvedCaptcha", function(solution, error) {
        if(error) {
          reject(error);
        } else {
          resolve(solution);
        }
      });
    });
  }
});

exports.UserCaptchaSolver = UserCaptchaSolver;
