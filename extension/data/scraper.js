/* 
* This content script contains all callbacks for the `util/scraper` class.
*/

const EVENTS = {
  fillIn: "fillIn",
  filledIn: "filledIn",
  clickOn: "clickOn",
  clickedOn: "clickedOn",
  getText: "getText",
  gotText: "gotText",
  getElement: "getElement",
  gotElement: "gotElement",
  getValue: "getValue",
  gotValue: "gotValue",
  getAttribute: "getAttribute",
  gotAttribute: "gotAttribute",
  waitForElement: "waitForElement",
  waitedForElement: "waitedForElement",
  showErrorDialog: "showErrorDialog",
  loaded: "loaded"
};

/**
* Sets the value of a form field.
* Supports text/email/password and checkbox
*
* @param {String} selector The CSS selector of the field
* @param {String} value The new value of the field
*/
self.port.on(EVENTS.fillIn, function(selector, value) {
  var elements = document.querySelectorAll(selector);

  if(elements.length) {
    for(let i = 0;  i < elements.length; i++) {
      const element = elements[i];

      var type = element.getAttribute("type");
      if(type === "checkbox" || type === "radio") {
        element.checked = !!value;
      } else {
        element.value = value;
      } 

      //fake a change event
      //needed to trigger client side scripts, e.g. form validation
      const fakeChangeEvent = new Event("change");
      fakeChangeEvent.target = element;
      element.dispatchEvent(fakeChangeEvent);
    }

    self.port.emit(EVENTS.filledIn);
  } else {
    self.port.emit(EVENTS.filledIn, "Element does not exist: " + selector);
  }
});

/**
* Clicks on an element.
*
* @param {String} selector The CSS selector for the element.
*/
self.port.on(EVENTS.clickOn, function(selector) {
  var element = document.querySelector(selector);

  if(element) {
    element.click();
    self.port.emit(EVENTS.clickedOn);
  } else {
    self.port.emit(EVENTS.clickedOn, "Element does not exist: " + selector);
  }
});

/**
* Gets the text inside an element.
*
* @param {String} selector The CSS selector for the element.
*/
self.port.on(EVENTS.getText, function(selector) {
  var element = document.querySelector(selector);

  if(element) {
    self.port.emit(EVENTS.gotText, element.textContent);
  } else {
    self.port.emit(EVENTS.gotText, "", "Element does not exist: " + selector);
  }
});


/**
* Gets an element.
* Returns nothing, but an error if the element doesn't exist
*
* @param {String} selector The CSS selector for the element.
*/
self.port.on(EVENTS.getElement, function(selector) {
  var element = document.querySelector(selector);

  if(element) {
    self.port.emit(EVENTS.gotElement);
  } else {
    self.port.emit(EVENTS.gotElement, "Element does not exist: " + selector);
  }
});


/**
* Gets the value of an element.
*
* @param {String} selector The CSS selector for the element.
*/
self.port.on(EVENTS.getValue, function(selector) {
  var element = document.querySelector(selector);

  if(element) {
    self.port.emit(EVENTS.gotValue, element.value);
  } else {
    self.port.emit(EVENTS.gotValue, null, "Element does not exist: " + selector);
  }
});


/**
* Gets an attribute value of an element.
* An image src attribute will be parsed into a dataUrl if possible.
*
* @param {String} selector The CSS selector for the element.
* @param {String} attributeName Name of the attribute.
*/
self.port.on(EVENTS.getAttribute, function(selector, attributeName) {
  const element = document.querySelector(selector);

  let attribute = null;

  if(element) {
    if(attributeName === "src" && element.tagName === "IMG") {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = element.width;
      canvas.height = element.height;

      ctx.drawImage(element, 0, 0);

      try {
        // may fail due to cross origin policy
        attribute = canvas.toDataURL();
      } catch (e) {
        attribute = element.src;
      }
    } else {
      attribute = element.getAttribute(attributeName);
    }
  }
  
  if(attribute) {
    self.port.emit(EVENTS.gotAttribute, attribute);
  } else {
    self.port.emit(EVENTS.gotAttribute, null, "Attribute " + attributeName + " does not exist on " + selector);
  }
});


/**
* Waits a specified amound of time for an element to appear.
*
* @param {String} selector The CSS selector for the element.
* @param {String} time Maximal time to wait
*/
self.port.on(EVENTS.waitForElement, function(selector, time) {

  const start = Date.now();

  const wait = function() {
    const element = document.querySelector(selector);

    if(element) {
      self.port.emit(EVENTS.waitedForElement);
    } else if (Date.now() - start > time){
      self.port.emit(EVENTS.waitedForElement, "Timed out waiting for element " + selector);
    } else {
      window.setTimeout(wait, 200);
    }
  };

  wait();
});


/**
* Displays a simple message box with an error.
*
* @param {String} error The error message
*/
self.port.on(EVENTS.showErrorDialog, function(error) {
  const popup = document.createElement("div");
  popup.className = "recoverer-popup recoverer-popup-error";

  const errorMessage = document.createElement("p");
  errorMessage.className = "recoverer-popup-info";
  errorMessage.textContent = error;
  
  popup.appendChild(errorMessage);

  popup.addEventListener("click", function() {
    document.body.removeChild(popup);
  });

  document.body.appendChild(popup);
});



self.port.emit(EVENTS.loaded, window.location.href);

