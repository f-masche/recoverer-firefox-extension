/*
* This service attaches the tasks to their respective webpage.
* The main purpose is to add the content script `content.js` to the page specified by the task.
* It also attaches the content scripts for the extensions main page.
*/

require("toolbar-button");

const { PageMod } = require("sdk/page-mod");
const self = require("sdk/self");
const { MainController } = require("main-controller");
const { ContentController } = require("content-controller");
const tasks = require("tasks");

const TAG = "main: ";

const pageMods = [];


//register a page mod for each task
tasks.getTaskNames().forEach(function(name) {
  console.log(TAG, "Registering page mod for " + task.name + " " + task.loginUrlPattern);

  const task = tasks.getTaskForName(name);

  const pageMod = PageMod({
    include: task.loginUrlPattern,
    contentScriptWhen: "ready",
    contentScriptFile: "./js/content.js",
    contentStyleFile: "./css/content.css",
    onAttach: function(worker) {
      ContentController(worker, name);
    }
  });

  pageMods.push(pageMod);
});


//register a page mod for the main extension window
PageMod({
  include: self.data.url("./index.html") + "*",
  contentScriptFile: ["./js/angular.min.js", "./js/main.js"],
  onAttach: function(worker) {
    MainController(worker);
  }
});



