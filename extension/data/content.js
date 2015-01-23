/* globals document, self, setTimeout */


self.port.on("showPopup", showPopup);

self.port.on("elementExists", function(selector) {
  const elementExists = document.querySelector(selector) !== null;
  self.port.emit("elementExists", elementExists);
});

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
    self.port.emit("clickedLoginButton");
  });

  const closeButton = document.createElement("button");
  closeButton.className = "recoverer-popup-btn";
  closeButton.textContent = "No";

  closeButton.addEventListener("click", function() {
    popup.classList.add("recoverer-popup-hidden");

    setTimeout(function() {
      document.body.removeChild(popup);
    }, 1000);
  });

  popup.appendChild(infoText);
  popup.appendChild(loginButton);
  popup.appendChild(closeButton);

  document.body.appendChild(popup);

  setTimeout(function() {
    popup.classList.remove("recoverer-popup-hidden");
  }, 500);
}