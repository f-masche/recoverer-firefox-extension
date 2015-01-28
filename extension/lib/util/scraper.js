const { setTimeout, clearTimeout } = require("sdk/timers");
const { Class } = require("sdk/core/heritage");
const { contract } = require("sdk/util/contract");
const tabs = require("sdk/tabs");
const { attach } = require("sdk/content/mod");
const { Style } = require("sdk/stylesheet/style");

const TAG = "scraper:";


const Action = Class({

  initialize: function(scraper, name) {
    this.scraper = scraper;
    this.name = name;
  },

  run: function() {
    return new Promise(this.handler.bind(this));
  }
});

const InitAction = Class({

  extends: Action,

  initialize: function(scraper) {
    Action.prototype.initialize.call(this, scraper, "init");
  },

  handler: function(resolve) {
    const self = this;

    tabs.open({
      url: this.scraper.url,
      onOpen: function(tab) {
        self.initTab(tab, resolve);
      }
    });
  },

  initTab: function(tab, resolve) {
    const self = this;

    this.scraper._tab = tab;

    tab.on("ready", function(tab) {
      console.log(TAG, "on " + tab.url);
      self.scraper.url = tab.url;
      self.scraper._worker = tab.attach({
        contentScriptFile: ["./scraper.js"]
      });
    });

    tab.once("ready", function() {
      //bugfix @see WaitForLoadingAction#handler
      setTimeout(resolve, 1);
    });
  }
});


const GoToAction = Class({

  extends: Action,

  initialize: function(scraper, url) {
    Action.prototype.initialize.call(this, scraper, "goTo");
    this.url = url;
  },

  handler: function(resolve) {
    console.log(TAG, "Going to " + this.url);
    this.scraper._tab.url = this.url;
    resolve();
  }
});

const WaitForLoadingAction = Class({

  extends: Action,

  initialize: function(scraper) {
    Action.prototype.initialize.call(this, scraper, "waitForLoading");
  },

  handler: function(resolve, reject) {
    console.log(TAG, "Waiting for load");

    const self = this;

    const timeoutId = setTimeout(function() {
      self.scraper._tab.off("ready", onReadyHandler);
      console.error(TAG, "Timed out while waiting for page to load");
      reject("Timed out while waiting for page to load");
    }, 5000);

    const onReadyHandler = function(tab) {
      console.log(TAG, "Loaded " + tab.url);

      clearTimeout(timeoutId);
      
      // bugfix
      // If this is the last action in the stack, firefox throws a
      // TypeError "can't access dead object"
      // The source of the error is unknown, but the timeout seems to prevent it
      setTimeout(function() {
        resolve(tab.url);
      }, 1);
    };

    this.scraper._tab.once("ready", onReadyHandler);
  }
});



const ExpectAction = Class({

  extends: Action,

  initialize: function(scraper, selector) {
    Action.prototype.initialize.call(this, scraper, "expect");
    this.selector = selector;
  },

  handler: function(resolve, reject) {
    const self = this;

    console.log(TAG, "Looking for " + this.selector);

    this.scraper._worker.port.emit("getElement", this.selector, this.attribute);

    this.scraper._worker.port.once("gotElement", function(error) {

      if (error) {
        console.log(TAG, "Expected to see " + self.selector);
        reject("Expected to see " + self.selector);
      } else {
        console.log(TAG, "Found " + self.selector);
        resolve();
      }
    });
  }
});


const GetTextAction = Class({

  extends: Action,

  initialize: function(scraper, selector) {
    Action.prototype.initialize.call(this, scraper, "getText");
    this.selector = selector;
  },

  handler: function(resolve, reject) {
    const self = this;

    console.log(TAG, "Looking for text in " + this.selector);

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


const GetValueAction = Class({

  extends: Action,

  initialize: function(scraper, selector) {
    Action.prototype.initialize.call(this, scraper, "getValue");
    this.selector = selector;
  },

  handler: function(resolve, reject) {
    const self = this;

    console.log(TAG, "Looking for value in " + this.selector);

    this.scraper._worker.port.emit("getValue", this.selector);

    this.scraper._worker.port.once("gotValue", function(value, error) {
      if (error) {
        console.log(TAG, error);
        reject("Could not get value in " + self.selector);
      } else {
        console.log(TAG, "Got value: " + value);
        self.scraper.results.push(value);
        resolve(value);
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

  handler: function(resolve, reject) {
    const self = this;

    console.log(TAG, "Filling in value " + this.value + " in to " + this.selector);

    this.scraper._worker.port.emit("fillIn", this.selector, this.value);

    this.scraper._worker.port.once("filledIn", function(error) {
      if(error) {
        console.log(TAG, error);
        reject("Could not fill in " + self.value + " into " + self.selector);
      } else {
        console.log(TAG, "Filled in value " + self.value + " in to " + self.selector);
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

  handler: function(resolve, reject) {
    const self = this;

    console.log(TAG, "Clicking on " + this.selector);

    this.scraper._worker.port.emit("clickOn", this.selector);

    this.scraper._worker.port.once("clickedOn", function(error) {
      if(error) {
        console.log(TAG, error);
        reject("Could not click on " + self.selector);
      } else {
        console.log(TAG, "Clicked on " + self.selector);
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

  handler: function(resolve, reject) {
    const self = this;

    console.log(TAG, "Getting attribute " + this.attribute + " on " + this.selector);

    this.scraper._worker.port.emit("getAttribute", this.selector, this.attribute);

    this.scraper._worker.port.once("gotAttribute", function(value, error) {

      if (error) {
        console.log(TAG, "Could not find attribute " + value);
        reject("Could not find attribute " + self.attribute + " on " + self.selector);
      } else {
        console.log(TAG, "Found attribute " + value);
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

  handler: function(resolve, reject) {
    const self = this;

    this.scraper._worker.port.emit("getAttribute", this.captchaImgSelector, "src");

    this.scraper._worker.port.once("gotAttribute", function(value, error) {

      if(error) {
        console.log(TAG, "Could not find captcha image :" + self.captchaImgSelector);
        reject("Could not find captcha image :" + self.captchaImgSelector);
      } else {
        console.log(TAG, "Found captcha image :" + value);

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

  handler: function(resolve, reject) {
    console.log(TAG, "Waiting for element " + this.selector);

    const self = this;
    const time = 2000;

    var timeoutId = -1;

    this.scraper._worker.port.emit("waitForElement", this.selector, time);

    const handler = function(error) {
      console.log(TAG, "Waited for element " + this.selector);
      clearTimeout(timeoutId);

      //bugfix @see WaitForLoadingAction#handler
      setTimeout(function() {
        if(error) {
          console.log(TAG, "Timed out while waiting for element " + self.selector);
          reject("Timed out while waiting for element " + self.selector);
        } else {
          resolve();
        }
      }, 1);
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



const scraperContract = contract({
  url: {
    is: ["string"]
  },
  captchaSolver: {
    is: ["object"]
  }
});

const Scraper =  Class({

  initialize: function(options) {

    scraperContract(options);

    this.url = options.url;
    this.results = [];

    this._captchaSolver = options.captchaSolver;
    this._stack = [];
    this._stackInsertIndex = 0;

    this._addAction(InitAction(this));

    console.log(TAG, "new scraper on: " + this.url);
  },

  goTo: function(url) {
    this._addAction(GoToAction(this, url));
    this._addAction(WaitForLoadingAction(this));
    return this;
  },

  expect: function(selector) {
    this._addAction(ExpectAction(this, selector));
    return this;
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

  getValue: function(selector) {
    this._addAction(GetValueAction(this, selector));
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
    this.results = [];

    console.log(TAG, "started");

    function runAction() {
      console.log(TAG, "stack size = " + self._stack.length);

      if(self._stack.length) {
        var action = self._stack.shift();

        console.log(TAG, "running " + action.name);

        if(self._stackInsertIndex > 0) {
          self._stackInsertIndex -= 1;
        }

        return action.run().then(runAction);
      } else {
        console.log(TAG, "finished");
        self._running = false;
        return self.results;
      }
    }

    return runAction().catch(function(error) {
      self._running = false;
      self._tab.activate();

      const style = Style({ uri: "./content.css" });
      attach(style, self._tab);

      self._worker.port.emit("showErrorDialog", error);
      return Promise.reject(error);
    });
  },

  destroy: function() {
    if(this._tab) {
      this._tab.close();
      this._tab = null;
    }

    if(this._worker) {
      this._worker.detach();
      this._worker = null; 
    }

    this._stack = [];
  },

  _addAction: function(action) {
    console.log(TAG, "add action: " + action.name);
    this._stack.splice(this._stackInsertIndex, 0, action);
    this._stackInsertIndex += 1; 
  }
});

exports.Scraper = Scraper;