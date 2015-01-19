//dependencies get resolved on packing, so dynamic loading is not possible
const tasks = [
  require("github-task").task,
  require("amazon-task").task,
  require("facebook-task").task
];


console.log(tasks);

function getTasks() {
  //return a copy
  return tasks.slice();
}

function getTaskForName(name) {
  let task = null;

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

