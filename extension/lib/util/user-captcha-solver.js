const { Class } = require("sdk/core/heritage");

const UserCaptchaSolver = Class({
  initialize: function(worker) {
    this._worker = worker;
  },
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
