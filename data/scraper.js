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
    if(type === "checkbox") {
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

console.log("scraper.js loaded on " + window.location);

self.port.emit("loaded", window.location.href);


