const { Page } = require("sdk/page-worker"); 
const { setTimeout, clearTimeout } = require("sdk/timers");
const { Class } = require("sdk/core/heritage");

const TAG = "scraper:";


const Action = Class({

  initialize: function(scraper, name) {
    this.scraper = scraper;
    this.name = name;
  },

  run: function() {
    return new Promise(this.callback.bind(this));
  }
});


const WaitForLoadingAction = Class({

  extends: Action,

  initialize: function(scraper, selector) {
    Action.prototype.initialize.call(this, scraper, "waitForLoading");
    this.selector = selector;
  },

  callback: function(resolve, reject) {
    console.log("scraper: waiting for load");

    const timeoutId = setTimeout(function() {
      console.error(TAG, "timed out while waiting for page to load");
      reject("Timed out while waiting for page to load");
    }, 5000);

    this.scraper._worker.port.once("loaded", function(url) {
      console.log(TAG, "loaded " + url);
      clearTimeout(timeoutId);
      resolve(url);
    });
  }
});


const GetTextAction = Class({

  extends: Action,

  initialize: function(scraper, selector) {
    Action.prototype.initialize.call(this, scraper, "getText");
    this.selector = selector;
  },

  callback: function(resolve, reject) {
    const self = this;

    console.log(TAG, "searching text in " + this.selector);

    this.scraper._worker.port.emit("getText", this.selector);

    this.scraper._worker.port.once("gotText", function(text, error) {
      if (error) {
        console.log(TAG, error);
        reject("Could not get text in " + self.selector);
      } else {
        console.log(TAG, "Got text: " + text);
        self.scraper.results.push(text);
        resolve(text);
      }
    });
  }
});


const FillInAction = Class({

  extends: Action,

  initialize: function(scraper, selector, value) {
    Action.prototype.initialize.call(this, scraper, "fillIn");
    this.selector = selector;
    this.value = value;
  },

  callback: function(resolve, reject) {
    const self = this;

    console.log(TAG, "filling in value " + this.value + " in to " + this.selector);

    this.scraper._worker.port.emit("fillIn", this.selector, this.value);

    this.scraper._worker.port.once("filledIn", function(error) {
      if(error) {
        console.log(TAG, error);
        reject("Could not fill in " + self.value + " into " + self.selector);
      } else {
        console.log(TAG, "filled in value " + self.value + " in to " + self.selector);
        resolve();
      }
    });
  }
});


const ClickOnAction = Class({

  extends: Action,

  initialize: function(scraper, selector) {
    Action.prototype.initialize.call(this, scraper, "clickOn");
    this.selector = selector;
  },

  callback: function(resolve, reject) {
    const self = this;

    console.log(TAG, "clicking on " + this.selector);

    this.scraper._worker.port.emit("clickOn", this.selector);

    this.scraper._worker.port.once("clickedOn", function(error) {
      if(error) {
        console.log(TAG, error);
        reject("Could not click on " + self.selector);
      } else {
        console.log(TAG, "clicked on " + self.selector);
        resolve();
      }
    });
  }
});


const GetAttributeAction = Class({

  extends: Action,

  initialize: function(scraper, selector, attribute) {
    Action.prototype.initialize.call(this, scraper, "getAttribute");
    this.selector = selector;
    this.attribute = attribute;
  },

  callback: function(resolve, reject) {
    const self = this;

    console.log(TAG, "get attribute " + this.attribute + " on " + this.selector);

    this.scraper._worker.port.emit("getAttribute", this.selector, this.attribute);

    this.scraper._worker.port.once("gotAttribute", function(value, error) {

      if (error) {
        console.log(TAG, "could not find attribute " + value);
        reject("Could not find attribute " + self.attribute + " on " + self.selector);
      } else {
        console.log(TAG, "found attribute " + value);
        self.scraper.results.push(value);
        resolve(value);
      }
    });
  }
});


const SolveCaptchaAction = Class({

  extends: Action,

  initialize: function(scraper, captchaImgSelector, captchaInputSelector, captchaSolver) {
    Action.prototype.initialize.call(this, scraper, "solveCaptcha");
    this.captchaImgSelector = captchaImgSelector;
    this.captchaInputSelector = captchaInputSelector;
    this.captchaSolver = captchaSolver;
  },

  callback: function(resolve, reject) {
    const self = this;

    this.scraper._worker.port.emit("getAttribute", this.captchaImgSelector, "src");

    this.scraper._worker.port.on("gotAttribute", function(value, error) {

      if(error) {
        console.log(TAG, "Could not find captcha image :" + self.captchaImgSelector);
        reject("Could not find captcha image :" + self.captchaImgSelector);
      } else {

        self.scraper._captchaSolver.solveCaptcha(value).then(function(solution) {

          self.scraper._worker.port.emit("fillIn", self.captchaInputSelector, solution);

          self.scraper._worker.port.once("filledIn", function(error) {
            if(error) {
              console.log(TAG, "Could not find captcha input field: " + self.captchaInputSelector);
              reject("Could not find captcha input field: " + self.captchaInputSelector);
            } else {
              resolve(solution);
            }
          });

        }, reject);
      }
    });
  }
});


const WaitForElementAction = Class({

  extends: Action,

  initialize: function(scraper, selector) {
    Action.prototype.initialize.call(this, scraper, "waitForElement");
    this.selector = selector;
  },

  callback: function(resolve, reject) {
    console.log(TAG, "Waiting for element " + this.selector);

    const self = this;
    const time = 2000;

    let timeoutId = -1;

    this.scraper._worker.port.emit("waitForElement", this.selector, time);

    const handler = function(error) {
      console.log(TAG, "Waited for element " + this.selector);
      clearTimeout(timeoutId);

      if(error) {
        console.log(TAG, "Timed out while waiting for element " + self.selector);
        reject("Timed out while waiting for element " + self.selector);
      } else {
        resolve();
      }
    };

    this.scraper._worker.port.once("waitedForElement", handler);
  
    //set a second timeout independent to the content script
    //the content script could be unloaded so the event never gets fired
    timeoutId = setTimeout(function() {
      self.scraper._worker.port.off("waitedForElement", handler);
      console.log(TAG, "Timed out while waiting for element " + self.selector);
      reject("Timed out while waiting for element " + self.selector);
    }, time * 1.5);
  }
});


const ThenAction = Class({

  extends: Action,

  initialize: function(scraper, onResolve, onReject) {
    Action.prototype.initialize.call(this, scraper, "then");
    this.onResolve = onResolve;
    this.onReject = onReject;

    this.scraper._stackInsertIndex -= 1;
    this.lastAction = this.scraper._stack.splice(this.scraper._stackInsertIndex, 1)[0];
  },

  run: function() {
    this.scraper._stackInsertIndex = 0;
    return this.lastAction.run().then(this.onResolve, this.onReject);
  }
});



const Scraper =  Class({

  initialize: function(url, captchaSolver) {
    const self = this;

    this.results = [];
    this._captchaSolver = captchaSolver;
    this._stack = [];
    this._stackInsertIndex = 0;

    this._worker = Page({
      contentScriptFile: ["./zepto.js","./scraper.js"],
      contentURL: url,
      contentScriptWhen: "ready"
    }); 

    this._worker.port.on("loaded", function(url) {
      self.url = url;
    });

    //wait for initial loading
    this.waitForLoading();

    console.log(TAG, "new scraper on: " + url);
  },

  waitForLoading: function() {
    this._addAction(WaitForLoadingAction(this));
    return this;
  },

  waitForElement: function(selector) {
    this._addAction(WaitForElementAction(this, selector));
    return this;
  },

  fillIn: function(selector, value) {
    this._addAction(FillInAction(this, selector, value));
    return this;
  },

  check: function(selector) {
    return this.fillIn(selector, true);
  },

  clickOn: function(selector) {
    this._addAction(ClickOnAction(this, selector));
    return this;
  },

  solveCaptcha: function(captchaImgSelector, captchaInputSelector) {
    this._addAction(SolveCaptchaAction(this, captchaImgSelector, captchaInputSelector));
    return this;
  },

  getText: function(selector) {
    this._addAction(GetTextAction(this, selector));
    return this;
  },

  getAttribute: function(selector, attribute) {
    this._addAction(GetAttributeAction(this, selector, attribute));
    return this;
  },

  then: function(onResolve, onReject) {
    this._addAction(ThenAction(this, onResolve, onReject));
  },

  run: function() {
    if(this._running) {
      throw new Error("This scraper is already running");
    }

    const self = this;

    this._running = true;
    console.log(TAG, "started");

    function runAction() {
      console.log(TAG, "stack size = " + self._stack.length);

      if(self._stack.length) {
        let action = self._stack.shift();

        console.log(TAG, "running " + action.name);

        if(self._stackInsertIndex > 0) {
          self._stackInsertIndex -= 1;
        }
        return action.run().then(runAction);
      } else {
        console.log(TAG, "finished");
        let result = Promise.resolve(self.results);
        self.results = [];
        self._running = false;
        return result;
      }
    }

    return runAction();
  },

  _addAction: function(action) {
    console.log(TAG, "add action: " + action.name);
    this._stack.splice(this._stackInsertIndex, 0, action);
    this._stackInsertIndex += 1; 
  }
});

exports.Scraper = Scraper;