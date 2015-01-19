var Http = require("http");


// exports["test http get"] = function(assert, done) {

//   var request = Http.send({
//     url: "https://mozilla.org"
//   });

//   request.then(function() {
//     assert.pass();
//     done();
//   });
// };

// exports["test http get json"] = function(assert, done) {

//   var request = Http.send({
//     url: "https://maps.googleapis.com/maps/api/geocode/json?address=germany",
//     format: "json"
//   });

//   request.then(function(response) {
//     if(response.weather) {
//       assert.pass();
//       done();
//     }
//   });
// };

// exports["test http get with headers"] = function(assert, done) {

//   var request = Http.send({
//     url: "https://mozilla.org",
//     headers: {
//       "Content-Type": "text/javascript"
//     }
//   });

//   request.then(function() {
//     assert.pass();
//     done();
//   });
// };

require("sdk/test").run(exports);
