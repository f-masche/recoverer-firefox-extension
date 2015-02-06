const { Class } = require("sdk/core/heritage");
const { Operation } = require("scraper/operation");

/**
* The Jump operation jumps to a label depending the value on top of the stack.
*/
const Jump = Class({

  extends: Operation,

  /**
  * Creates a new JumpIf operation.
  *
  * @param {String} label 
  *   The label for the jump
  */
  initialize: function(expectedValue, label, negated) {
    Operation.prototype.initialize.call(this, "jump");
    this.label = label;
    this.expectedValue = expectedValue;
    this.negated = negated;
  },

  handler: function(runtime, success) {
    const value = runtime.stack.pop();

    var jump = this.expectedValue instanceof RegExp && this.expectedValue.test(value);
    jump = jump && value === this.expectedValue;

    if(this.negated) {
      jump = !jump;
    }

    if(jump) {
      runtime.goToLabel(this.label);
    }
    success();
  }
});

exports.Jump = Jump;