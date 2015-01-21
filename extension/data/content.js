/* globals document, self, setTimeout */

const popup = document.createElement("div");
popup.setAttribute("class", "recoverer-popup");


const infoText = document.createElement("p");
infoText.classList.add("recoverer-popup-info");
infoText.textContent = "Do you want to login with Recoverer?";

const loginButton = document.createElement("button");
loginButton.classList.add("recoverer-popup-btn");
loginButton.textContent = "Yes";

loginButton.addEventListener("click", function() {
  self.port.emit("clickedLoginButton");
});

const closeButton = document.createElement("button");
closeButton.classList.add("recoverer-popup-btn");
closeButton.textContent = "No";

closeButton.addEventListener("click", function() {
  popup.classList.remove("recoverer-popup-show");

  setTimeout(function() {
    document.body.removeChild(popup);
  }, 1000);
});

popup.appendChild(infoText);
popup.appendChild(loginButton);
popup.appendChild(closeButton);

document.body.appendChild(popup);

setTimeout(function() {
  popup.classList.add("recoverer-popup-show");
}, 500);