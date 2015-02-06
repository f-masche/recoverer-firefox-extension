const { Class } = require("sdk/core/heritage");
const { Operation } = require("scraper/operation");


/**
* The LoadURL operation loads a specific URL in the scraper tab.
*/
const LoadURL = Class({

  extends: Operation,

  /**
  * Creates a new LoadURL operation.
  *
  * @param {String} url 
  *   The URL to load
  */
  initialize: function(url) {
    Operation.prototype.initialize.call(this, "goTo");
    this.url = url;
  },

  handler: function(runtime, success) {
    console.log("Going to " + this.url);

    runtime.tab.url = this.url;
    success();
  }
});


exports.LoadURL = LoadURL;