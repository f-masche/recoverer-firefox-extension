const { Class } = require("sdk/core/heritage");
const { Operation } = require("scraper/operation");
const { setTimeout, clearTimeout } = require("sdk/timers");

/**
* The WaitForLoad operation waits until the ready event is fired on the scraper tab.
*/
const WaitForLoad = Class({

  extends: Operation,

  maxTime: 5000,

  /**
  * Creates a new WaitForLoad operation.
  *
  */
  initialize: function() {
    Operation.prototype.initialize.call(this, "waitForLoading");
  },

  handler: function(runtime, success, failure) {
    console.log("Waiting for load");

    const timeoutId = setTimeout(function() {
      runtime.tab.off("load", onReadyHandler);
      console.error("Timed out while waiting for page to load");
      failure("Timed out while waiting for page to load");
    }, this.maxTime);

    const onReadyHandler = function(tab) {
      console.log("Loaded " + tab.url);

      clearTimeout(timeoutId);
      
      // bugfix
      // If this is the last action in the stack, firefox throws a
      // TypeError "can't access dead object"
      // The source of the error is unknown, but the timeout seems to prevent it
      setTimeout(function() {
        success();
      }, 1);
    };

    runtime.tab.once("load", onReadyHandler);
  }
});


exports.WaitForLoad = WaitForLoad;