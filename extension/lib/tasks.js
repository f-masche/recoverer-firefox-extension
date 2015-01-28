//dependencies get resolved on packing, so dynamic loading is not possible
const tasks = [
  require("tasks/github-task").task,
  require("tasks/amazon-task").task,
  require("tasks/facebook-task").task,
  require("tasks/twitter-task").task
];

function getTasks() {
  //return a copy
  return tasks.slice();
}

function getTaskForName(name) {
  return tasks.find((t) => t.name === name);
}


exports.getTasks = getTasks;

exports.getTaskForName = getTaskForName;

