const { PageMod } = require("sdk/page-mod");
const self = require("sdk/self");
const { MainController } = require("main-controller");
const tasks = require("tasks");

const pageMods = [];

tasks.getTasks().forEach(function(task) {
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
  worker.port.on("clickedLoginButton", function() {
    worker.tab.url = self.data.url("./index.html");

    //attach task to tab
    worker.tab.task = task;
  });
}


PageMod({
  include: self.data.url("./index.html"),
  contentScriptFile: ["./zepto.js", "./main.js"],
  onAttach: function(worker) {
    MainController(worker);
  }
});



