/*
* This content script displays a popover on a login page,
* to let the user sign in with recoverer.
*/

const EVENTS = {
  showPopup: "showPopup",
  elementExists: "elementExists",
  clickedLoginButton: "clickedLoginButton"
};

/**
* Shows the popup
*/
self.port.on(EVENTS.showPopup, showPopup);

/**
* Checks if an element exists on the current page.
* @param {String} selector The CSS selector for the element.
*/
self.port.on(EVENTS.elementExists, function(selector) {
  const elementExists = document.querySelector(selector) !== null;
  self.port.emit(EVENTS.elementExists, elementExists);
});


/**
* Creates and displays the popup.
*/
function showPopup() {
  const popup = document.createElement("div");
  popup.className = "recoverer-popup recoverer-popup-hidden";

  const infoText = document.createElement("p");
  infoText.className = "recoverer-popup-info";
  infoText.textContent = "Do you want to login with Recoverer?";

  const loginButton = document.createElement("button");
  loginButton.className = "recoverer-popup-btn";
  loginButton.textContent = "Yes";

  loginButton.addEventListener("click", function() {
    self.port.emit(EVENTS.clickedLoginButton);
  });

  const closeButton = document.createElement("button");
  closeButton.className = "recoverer-popup-btn";
  closeButton.textContent = "No";

  closeButton.addEventListener("click", function() {
    popup.classList.add("recoverer-popup-hidden");

    window.setTimeout(function() {
      document.body.removeChild(popup);
    }, 1000);
  });

  popup.appendChild(infoText);
  popup.appendChild(loginButton);
  popup.appendChild(closeButton);

  document.body.appendChild(popup);

  window.setTimeout(function() {
    popup.classList.remove("recoverer-popup-hidden");
  }, 500);
}