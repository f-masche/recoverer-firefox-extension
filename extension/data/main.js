/* globals self, document  */
const views = {
  home: document.getElementById("home-view"),
  login: document.getElementById("login-view"),
  pending: document.getElementById("pending-view")
};

const gmailEmail = document.getElementById("gmail-email");
const taskName = document.getElementById("task-name");
const captchaForm = document.getElementById("captcha-form");
const pendingMessage = document.getElementById("pending-message");
const errorMessage = document.getElementById("error-message");
const captchaBox = document.getElementById("captcha-box");
const supportedSitesList = document.getElementById("supported-sites");

let currentView = null;

//add event handlers

captchaForm.addEventListener("submit", function(event) {
  const input = this.querySelector("input[name=captcha]");
  self.port.emit("solvedCaptcha", input.value);
  input.value = "";
  this.classList.add("hidden");
  
  pendingMessage.classList.remove("hidden");
  document.getElementById("pending-spinner").classList.remove("hidden");

  event.preventDefault();
});

document.getElementById("gmail-login-form")
  .addEventListener("submit", function(event) {
    self.port.emit("submitedLoginForm", gmailEmail.value);
    gmailEmail.value = "";
    event.preventDefault();
  });

document.getElementById("login-to-home-btn")
  .addEventListener("click", function(event) {
    showView("home");
    event.preventDefault();
  });


//attach port listeners

self.port.on("setSupportedSites", function(siteNames) {
  //clear list 
  supportedSitesList.innerHTML = "";

  //fill list
  siteNames.forEach(function(name) {

    const a = document.createElement("a");
    a.href = "#";
    a.textContent = name;
    a.addEventListener("click", onTaskNameClick);

    const li = document.createElement("li");
    li.appendChild(a);

    supportedSitesList.appendChild(li);
  });
});

self.port.on("solveCaptcha", function(imageSrc) {
  captchaForm.classList.remove("hidden");
  pendingMessage.classList.add("hidden");
  document.getElementById("pending-spinner").classList.remove("hidden");

  const captchaImg = document.createElement("img");
  captchaImg.classList.add("img-thumbnail");
  captchaImg.src = imageSrc;

  captchaBox.innerHTML = "";
  captchaBox.appendChild(captchaImg);
});

self.port.on("showView", function(name) {
  showView(name);
});

self.port.on("setTask", function(name) {
  taskName.textContent = name;
  errorMessage.classList.add("hidden");
});

self.port.on("setPendingMessage", function(message) {
  pendingMessage.textContent = message;
});

self.port.on("showErrorMessage", function(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
});

showView("home");
self.port.emit("loaded");


function showView(name) {
  const view = views[name];

  if(view) {
    if(currentView) {
      currentView.classList.add("hidden");
    }

    view.classList.remove("hidden");
    currentView = view; 
  }
}

function onTaskNameClick(event) {
  self.port.emit("clickedOnTask", this.textContent);
  event.preventDefault();
}