/* globals document, self */

const popup = document.createElement("div");
popup.setAttribute("class", "recoverer-popup");


const loginButton = document.createElement("button");
loginButton.setAttribute("class", "recoverer-btn");
loginButton.textContent = "Login with Recoverer";

loginButton.addEventListener("click", function() {
  self.port.emit("clickedLoginButton");
});

const closeButton = document.createElement("button");
closeButton.setAttribute("class", "recoverer-btn");
closeButton.textContent = "x";

closeButton.addEventListener("click", function() {
  document.body.removeChild(popup);
});

popup.appendChild(loginButton);
popup.appendChild(closeButton);

document.body.appendChild(popup);