/**
* This module provides a convenient method to use the XMLHttpRequest.
*/

const { XMLHttpRequest } = require("sdk/net/xhr");
const { extend } = require("sdk/core/heritage");


/**
* The default options.
*/
var defaults = {
  url: "",
  headers: null,
  method: "get",
  format: "text"
};


/**
* Sends an http request.
* @options {Object}
*
*/
function send(options) {

  var currentOptions = extend(defaults, options);

  var request = new XMLHttpRequest();

  request.open(currentOptions.method, currentOptions.url, true);

  if(currentOptions.headers) {
    for(let header in currentOptions.headers) {
      request.setRequestHeader(header, currentOptions.headers[header]);
    }
  }

  if(currentOptions.data) {
    const json = JSON.stringify(currentOptions.data);
    request.setRequestHeader("Content-Type", "application/json");
    request.send(json);
  } else {
    request.send();
  }

  return new Promise(function(resolve, reject) {
    request.onreadystatechange = function() {
      if(request.readyState === 4) {
        if(request.status === 200) {
          if(currentOptions.format === "json") {
            resolve(JSON.parse(request.response));
          } else {
            resolve(request.response);
          }
        } else {
          reject("error fetching " + currentOptions.url + ": " + request.status);
        }
      }
    };
  }); 
}

exports.send = send;