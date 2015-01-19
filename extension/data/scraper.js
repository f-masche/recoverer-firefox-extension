/* globals self, document, window */

/**
* Sets the value of a form field.
* Supports text/email/password and checkbox
*
* @param {String} selector The CSS selector of the field
* @param {String} value The new value of the field
*/
self.port.on("fillIn", function(selector, value) {
  console.log("fillIn", selector, value);
  var element = document.querySelector(selector);

  if(element) {
     var type = element.getAttribute("type");
    if(type === "checkbox" || type === "radio") {
      element.checked = value;
    } else {
      element.value = value;
    } 
    self.port.emit("filledIn");
  } else {
    self.port.emit("filledIn", "element does not exist: " + selector);
  }
});

/**
* Clicks on an element.
*
* @param {String} selector The CSS selector for the element.
*/
self.port.on("clickOn", function(selector) {
  var button = document.querySelector(selector);

  if(button) {
    button.click();
    self.port.emit("clickedOn");
  } else {
    self.port.emit("clickedOn", "element does not exist: " + selector);
  }
});


self.port.on("findText", function(selector) {
  var element = document.querySelector(selector);

  if(element) {
    self.port.emit("foundText", element.textContent);
  } else {
    self.port.emit("foundText", "", "element does not exist: " + selector);
  }
});

self.port.on("findAttribute", function(selector, attributeName) {
  const element = document.querySelector(selector);

  let attribute = null;

  if(element) {
    if(attributeName === "src" && element.tagName === "IMG") {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = element.width;
      canvas.height = element.height;
      ctx.drawImage(element, 0, 0);
      attribute = canvas.toDataURL();
    } else {
      attribute = element.getAttribute(attributeName);
    }
  }
  
  if(attribute) {
    self.port.emit("foundAttribute", attribute);
  } else {
    self.port.emit("foundAttribute", null, "attribute `" + attributeName + "` does not exist: " + selector);
  }
});

self.port.on("waitForElement", function(selector, timeout) {

  const start = Date.now();

  const wait = function() {
    var element = document.querySelector(selector);

    if(element) {
      self.port.emit("waitedForElement");
    } else if (Date.now() - start > timeout){
      self.port.emit("waitedForElement", "timed out waiting for element " + selector);
    } else {
      window.setTimeout(wait, 200);
    }
  };

  wait();
});



window.onunload = function() {
  self.port.emit("unload", window.location.href);
};

self.port.emit("loaded", window.location.href);


