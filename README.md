# Recoverer

Recoverer is an Firefox-Extension that lets you log on to websites 
using the password recovery. It generates a new secure password each time you login.   
For research purpose only, so don't expect everything to work smoothly.     
Uses the GMail-API, so only GMail-Accounts are supported.

##Currently supported websites

- amazon.de
- facebook.com
- github.com

## Build

This project uses grunt to build the plugin.

### What you need

- Node.js >= 0.8.0
- Firefox > 31
- install grunt-cli   
  `npm install grunt-cli -g`
- install npm modules   
  `npm install`
- Add the paths of your firefox binary and profile to the config.json 

### Build the plugin
To build the plugin simply run `grunt build`, which will create a build folder with the xpi file.
You can run the unit tests via `grunt test`.
