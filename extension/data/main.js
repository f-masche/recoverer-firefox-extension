/*
* This is the main content script for the recoverer application.
*/


const recoverer = angular.module("Recoverer", []); //jshint ignore:line


/**
* Main controller for the application.
*/
recoverer.controller("AppController", function($scope, port) {

  port.on(port.events.getTasks, function(tasks) {
    $scope.tasks = tasks;
  });

  port.on(port.events.getTask, function(task) {
    $scope.task = $scope.tasks.find((t) => t.name === task.name);
    $scope.view = "signIn";
  });

  port.on(port.events.setStatus, function(status, statusMessage) {
    $scope.status = status;

    if(status === "error") {
      $scope.errorMessage = statusMessage;
    }
  });

  port.on(port.events.solveCaptcha, function(captchaSrc) {
    $scope.view = "captcha";
    $scope.captchaSrc = captchaSrc;
  });

  $scope.toSignInView = function() {
    $scope.view = "signIn";
  };

  $scope.toHomeView = function() {
    $scope.view = "home";
  };

  $scope.login = function(email) {
    port.emit("runTask", $scope.task.name, email);
    $scope.status = null;
    $scope.view = "pending";
  };

  $scope.solvedCaptcha = function(solution) {
    port.emit(port.events.solvedCaptcha, solution);
    $scope.view = "pending";
  };

  $scope.clickedTask = function(task) {
    $scope.task = task;
    $scope.view = "signIn";
  };

  $scope.view = "home";
});


/**
* Angular module wrapper for the Addon-SDKs `self.port` object.
*/
recoverer.service("port", function($rootScope) {
  this.events = {
    setTasks: "setTasks",
    setTask: "setTask",
    setStatus: "setStatus",
    solveCaptcha: "solveCaptcha",
    solvedCaptcha: "solvedCaptcha"
  };

  this.on = function(key, callback) {
    self.port.on(key, function() {
      callback.apply(null, arguments);
      $rootScope.$apply();
    });
  };

  this.emit = self.port.emit.bind(self);
});


/**
* This filter translates any url to the corresponding favicon src.
*/
recoverer.filter("favicon", function($window) {
  const link = $window.document.createElement("a");
  return function(href) {
    link.href = href;
    return link.protocol + link.host + "/favicon.ico";
  };
});