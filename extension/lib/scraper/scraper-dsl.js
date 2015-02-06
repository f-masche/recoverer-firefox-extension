const { Class } = require("sdk/core/heritage");
const { setTimeout } = require("sdk/timers");
const tabs = require("sdk/tabs");
const { JumpFalse } = require("scraper/jump-false");
const { ElementExists } = require("scraper/element-exists");
const { LoadURL } = require("scraper/load-url");
const { Label } = require("scraper/label");
const { WaitForLoad } = require("scraper/wait-for-load");

const TAG = "scraper: ";


const LabelStack = Class({
  initialize: function() {
    this.stack = [];
  },
  pushLabel: function() {
    const label = this.stack.length;
    this.stack.push(label);
    return label;
  },
  popLabel: function() {
    this.stack.pop();
  },
  getLabel: function(n) {
    return this.stack[this.stack.length + n];
  }
});


const Runtime = Class({
  stack: [],
  pointer: 0,
  labels: [],
  initialize: function(operations) {
    this.operations = operations;

    for(let i = 0; i < operations.length; i++) {
      console.log(i, operations[i].name);
    }
  },
  init: function() {
    const self = this;

    const handleTabOpen = function(tab, resolve) {

      self.tab = tab;

      tab.on("load", function(tab) {
        console.log(TAG, "on " + tab.url);
        self.url = tab.url;
        self.worker = tab.attach({
          contentScriptFile: ["./scraper.js"]
        });
      });

      tab.once("load", function() {
        //bugfix @see WaitForLoadingOperation#handler
        setTimeout(resolve, 1);
      });
    };

    return new Promise(function(resolve) {
      tabs.open({
        url: "about:blank",
        onOpen: function(tab) {
          handleTabOpen(tab, resolve);
        }
      });
    });
  },

  run: function() {
    const self = this;

    this.stack = [];
    this.pointer = 0;
    this.labels = [];

    const next = function(success, failure) {
      const op = self.operations[self.pointer];
      console.log(self.pointer);
      self.pointer++;

      if(op) {
        op.handler(self, function() {
          next(success, failure);
        }, failure);       
      } else {
        success();
      }
    };

    return new Promise(next);
  },
  goToLabel: function(labelId) {
    var label = null;
    for(let i = 0; i < this.operations.length; i++) {
      const operation = this.operations[i];
      if(operation.name === "label" && operation.label === labelId) {
        label = i;
        break;
      }
    }

    if(label === null) {
      throw new Error("No label exists with id " + labelId);
    }
    console.log("Juming to " + label);
    this.pointer = label;
  }
});




const ElementCondition = Class({
  initialize: function(operations, labelStack, selector) {
    this.operations = operations;
    this.labelStack = labelStack;
    this.selector = selector;
  },
  exists: function(callback) {

    const endLabel = this.labelStack.pushLabel();

    this.operations.push(ElementExists(this.selector));
    this.operations.push(JumpFalse(endLabel));

    callback.call(Command(this.operations, this.labelStack));

    this.operations.push(Label(endLabel));

    this.labelStack.popLabel();
  },
  not: function() {

  }
});

const Element = Class({
  text: function() {

  },
  value: function() {

  }
});

const Command = Class({
  initialize: function(operations, labelStack) {
    this.operations = operations;
    this.labelStack = labelStack;
  },
  goTo: function(url) {
    this.operations.push(LoadURL(url));
    this.operations.push(WaitForLoad());
  },
  getElement: function(selector) {
    return Element(this.operations, this.labelStack, selector);
  },
  whenElement: function(selector) {
    return ElementCondition(this.operations, this.labelStack, selector);
  }
});




const Scraper = Class({

  initialize: function() {
  },
  run: function(callback) {
    const operations = [];
    const labelStack = LabelStack();
    const command = Command(operations, labelStack);
    callback.call(command);

    const runtime = Runtime(operations);

    return runtime.init().then(function() {
      return runtime.run();  
    });
  }
});

exports.Scraper = Scraper;