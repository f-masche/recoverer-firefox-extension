/* globals self, $ */
const views = {
  home: $("#home-view"),
  login: $("#login-view"),
  pending: $("#pending-view")
};

const $gmailLoginForm = $("#gmail-login-form");
const $gmailEmail = $("#gmail-email");
const $taskName = $("#task-name");

const $captchaForm = $("#captcha-form");
const $pendingMessage = $("#pending-message");
const $errorMessage = $("#error-message");
const $captchaBox = $("#captcha-box");
const $supportedSitesList = $("#supported-sites");

let $currentView = null;

$supportedSitesList.on("click", "li > a", function() {
  self.port.emit("clickedOnTask", this.textContent);
});

$gmailLoginForm.on("submit", function(event) {
  self.port.emit("submitedLoginForm", $gmailEmail.val());
  $gmailEmail.val("");
  event.preventDefault();
});

$captchaForm.on("submit", function(event) {
  const $input = $captchaForm.find("input[name=captcha]");
  self.port.emit("solvedCaptcha", $input.val());
  $input.val("");
  $captchaForm.addClass("hidden");
  $pendingMessage.removeClass("hidden");
  $("#pending-spinner").removeClass("hidden");

  event.preventDefault();
});

$("#cancel-button").on("click", function() {
  self.port.emit("cancelButtonClicked");
});

self.port.on("setSupportedSites", function(siteNames) {
  $supportedSitesList.children().remove();

  siteNames.forEach(function(name) {
    $supportedSitesList.append("<li><a href='#'>" + name + "</a></li>");
  });
});

self.port.on("solveCaptcha", function(imageSrc) {
  $captchaForm.removeClass("hidden");
  $pendingMessage.addClass("hidden");
  $("#pending-spinner").addClass("hidden");

  const $captchaImg = $("<img class='img-thumbnail center-block' src='" + imageSrc + "' alt='captcha'/>");

  $captchaBox.children().remove();
  $captchaBox.append($captchaImg);
});

self.port.on("showView", function(name) {
  showView(name);
});

self.port.on("setTask", function(name) {
  $taskName.text(name);
  $errorMessage.addClass("hidden");
});

self.port.on("setPendingMessage", function(message) {
  console.log(message);
  $pendingMessage.text(message);
});

self.port.on("showErrorMessage", function(message) {
  $errorMessage.text(message);
  $errorMessage.removeClass("hidden");
});

showView("home");
self.port.emit("loaded");


function showView(name) {
  const $view = views[name];

  if($view) {
    if($currentView) {
      $currentView.addClass("hidden");
    }

    $view.removeClass("hidden");
    $currentView = $view; 
  }
}
