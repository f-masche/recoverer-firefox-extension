/* globals self, window, document, Event */

/**
* Sets the value of a form field.
* Supports text/email/password and checkbox
*
* @param {String} selector The CSS selector of the field
* @param {String} value The new value of the field
*/
self.port.on("fillIn", function(selector, value) {
  var element = document.querySelector(selector);

  if(element) {
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

    self.port.emit("filledIn");
  } else {
    self.port.emit("filledIn", "Element does not exist: " + selector);
  }
});

/**
* Clicks on an element.
*
* @param {String} selector The CSS selector for the element.
*/
self.port.on("clickOn", function(selector) {
  var element = document.querySelector(selector);

  if(element) {
    element.click();
    self.port.emit("clickedOn");
  } else {
    self.port.emit("clickedOn", "Element does not exist: " + selector);
  }
});


self.port.on("getText", function(selector) {
  var element = document.querySelector(selector);

  if(element) {
    self.port.emit("gotText", element.textContent);
  } else {
    self.port.emit("gotText", "", "Element does not exist: " + selector);
  }
});

self.port.on("getElement", function(selector) {
  var element = document.querySelector(selector);

  if(element) {
    self.port.emit("gotElement");
  } else {
    self.port.emit("gotElement", "", "Element does not exist: " + selector);
  }
});

self.port.on("getValue", function(selector) {
  var element = document.querySelector(selector);

  if(element) {
    self.port.emit("gotValue", element.value);
  } else {
    self.port.emit("gotValue", null, "Element does not exist: " + selector);
  }
});

self.port.on("getAttribute", function(selector, attributeName) {
  const element = document.querySelector(selector);

  let attribute = null;

  if(element) {
    // if(attributeName === "src" && element.tagName === "IMG") {
    //   const canvas = document.createElement("canvas");
    //   const ctx = canvas.getContext("2d");
    //   canvas.width = element.width;
    //   canvas.height = element.height;

    //   ctx.drawImage(element, 0, 0);

    //   attribute = canvas.toDataURL();
    // } else {

    attribute = element.getAttribute(attributeName);

    //}
  }
  
  if(attribute) {
    self.port.emit("gotAttribute", attribute);
  } else {
    self.port.emit("gotAttribute", null, "Attribute " + attributeName + " does not exist on " + selector);
  }
});

self.port.on("waitForElement", function(selector, time) {

  const start = Date.now();

  const wait = function() {
    const element = document.querySelector(selector);

    if(element) {
      self.port.emit("waitedForElement");
    } else if (Date.now() - start > time){
      self.port.emit("waitedForElement", "Timed out waiting for element " + selector);
    } else {
      window.setTimeout(wait, 200);
    }
  };

  wait();
});


self.port.on("showErrorDialog", function(error) {
  const popup = document.createElement("div");
  popup.className = "recoverer-popup recoverer-popup-error";

  const errorMessage = document.createElement("p");
  errorMessage.className = "recoverer-popup-info";
  errorMessage.textContent = error;
  
  popup.appendChild(errorMessage);

  document.body.appendChild(popup);
});

self.port.emit("loaded", window.location.href);

