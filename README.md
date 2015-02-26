# Recoverer [![Build Status](https://travis-ci.org/pyche/recoverer-firefox-extension.svg?branch=master)](https://travis-ci.org/pyche/recoverer-firefox-extension)

Recoverer is a Firefox-Extension that lets you log on to websites 
using the password recovery function.  
It generates a new secure password every time you login.   

For research purpose only, so don't expect everything to work smoothly.     
Uses the GMail-API, so only GMail-Accounts are supported at the moment.

##Currently supported websites

- amazon.de
- facebook.com
- github.com
- twitter.com

## Build

This project uses Grunt to build the plugin.

### What you need

- Node.js >= 0.8.0
- Sass
  `gem install sass`
- Firefox > 31
- Grunt   
  `npm install grunt-cli -g`
- install npm modules   
  `npm install`
- Add the paths of your firefox binary and profile to the config.json 


### Build the plugin
To build the plugin simply run `grunt build`, which will create a build folder with the xpi file.
You can run the unit tests via `grunt test`.
To run the extension just use `grunt`