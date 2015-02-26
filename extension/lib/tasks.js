/**
* This modules purpose is to load and organize the tasks.
*/

//dependencies get resolved on packing, so dynamic loading is not possible
const tasks = [
  require("tasks/github-task"),
  require("tasks/amazon-task"),
  require("tasks/facebook-task"),
  require("tasks/twitter-task"),
  require("tasks/auto-task")
];

const TAG = "tasks:";


/**
* Returns a list of all task names.
*
* @return {Array<string>}
*   Array of task names
*/
const getTaskNames = function() {
  return tasks.map(t => t.prototype.name);
};


/**
* Returns a task instance for a name
*
* @param {String} name
*   Name of a task
* @return {Task} 
*   A Task
*/
const getTaskForName = function(name) {
  const task = tasks.find((t) => t.prototype.name === name);

  if(!task) {
    throw new Error(TAG, "Could not find task with name " + name);
  }
  return task.task();
};


exports.getTaskNames = getTaskNames;

exports.getTaskForName = getTaskForName;

