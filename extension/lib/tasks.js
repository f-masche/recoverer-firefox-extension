//dependencies get resolved on packing, so dynamic loading is not possible
const tasks = [
  require("tasks/github-task").task,
  require("tasks/amazon-task").task,
  require("tasks/facebook-task").task,
  require("tasks/twitter-task").task,
  require("tasks/auto-task").task
];

function getTasks() {
  console.log(tasks[0], JSON.stringify(tasks[0]));
  //return a copy
  return tasks.slice();
}

function getTaskForName(name) {
  return tasks.find((t) => t.name === name);
}


exports.getTasks = getTasks;

exports.getTaskForName = getTaskForName;

