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
  var task = null;

  for(let i = 0; i < tasks.length; i++) {
    if(tasks[i].name === name) {
      task = tasks[i];
      break;
    }
  }

  return task;
}


exports.getTasks = getTasks;

exports.getTaskForName = getTaskForName;

