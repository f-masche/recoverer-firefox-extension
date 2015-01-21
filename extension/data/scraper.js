/* globals self, window, $ */

/**
* Sets the value of a form field.
* Supports text/email/password and checkbox
*
* @param {String} selector The CSS selector of the field
* @param {String} value The new value of the field
*/
self.port.on("fillIn", function(selector, value) {
  var $element = $(selector);

  if($element.length) {
     var type = $element.attr("type");
    if(type === "checkbox" || type === "radio") {
      $element.attr("checked", !!value);
    } else {
      $element.val(value);
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
  var $element = $(selector);

  if($element.length) {
    $element.click();
    self.port.emit("clickedOn");
  } else {
    self.port.emit("clickedOn", "element does not exist: " + selector);
  }
});


self.port.on("getText", function(selector) {
  var $element = $(selector);

  if($element.length) {
    self.port.emit("gotText", $element.text());
  } else {
    self.port.emit("gotText", "", "element does not exist: " + selector);
  }
});

self.port.on("getElement", function(selector) {
  var $element = $(selector);

  if($element.length) {
    self.port.emit("gotElement");
  } else {
    self.port.emit("gotElement", "", "Element does not exist: " + selector);
  }
});

self.port.on("getValue", function(selector) {
  var $element = $(selector);

  if($element.length) {
    self.port.emit("gotValue", $element.val());
  } else {
    self.port.emit("gotValue", null, "Element does not exist: " + selector);
  }
});

self.port.on("getAttribute", function(selector, attributeName) {
  console.log(selector);
  const $element = $(selector);

  let attribute = null;

  if($element.length) {
    if(false && attributeName === "src" && $element[0].tagName === "IMG") {
      const canvas = $("<canvas/>")[0];
      const ctx = canvas.getContext("2d");
      canvas.width = $element.width();
      canvas.height = $element.height();

      ctx.drawImage($element[0], 0, 0);

      attribute = canvas.toDataURL();
    } else {
      attribute = $element.attr(attributeName);
    }
  }
  
  if(attribute) {
    self.port.emit("gotAttribute", attribute);
  } else {
    self.port.emit("gotAttribute", null, "attribute `" + attributeName + "` does not exist: " + selector);
  }
});

self.port.on("waitForElement", function(selector, time) {

  const start = Date.now();

  const wait = function() {
    const $element = $(selector);

    if($element.length) {
      self.port.emit("waitedForElement");
    } else if (Date.now() - start > time){
      self.port.emit("waitedForElement", "timed out waiting for element " + selector);
    } else {
      window.setTimeout(wait, 200);
    }
  };

  wait();
});


self.port.emit("loaded", window.location.href);
