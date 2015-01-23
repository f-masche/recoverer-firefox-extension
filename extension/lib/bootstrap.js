const { PageMod } = require("sdk/page-mod");
const self = require("sdk/self");
const { MainController } = require("main-controller");
const tasks = require("tasks");

const pageMods = [];

tasks.getTasks().forEach(function(task) {
  console.log("registering page mod for " + task.name + " " + task.loginUrlPattern);
  const pageMod = PageMod({
    include: task.loginUrlPattern,
    contentScriptWhen: "ready",
    contentScriptFile: "./content.js",
    contentStyleFile: "./content.css",
    onAttach: function(worker) {
      handleTaskAttach(worker, task);
    }
  });

  pageMods.push(pageMod);
});

function handleTaskAttach(worker, task) {
  console.log("On login page of " + task.name);

  if(task.loginUrlSelector) {
    console.log("Checking for selector " + task.loginUrlSelector);

    worker.port.emit("elementExists", task.loginUrlSelector);

    worker.port.once("elementExists", function(exists) {
      if(exists) {
        console.log("Element exists, showing popup");
        worker.port.emit("showPopup");
      } else {
        console.log("Element doesn't exist, aborting");
        worker.detach();
      }
    });
  } else {
    worker.port.emit("showPopup");
  }

  worker.port.on("clickedLoginButton", function() {
    worker.tab.url = self.data.url("./index.html?task=" + task.name);
  });
}


PageMod({
  include: self.data.url("./index.html") + "*",
  contentScriptFile: "./main.js",
  onAttach: function(worker) {
    MainController(worker);
  }
});



