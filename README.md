# Recoverer

Recoverer is an Firefox-Extension that lets you log on to websites 
using the password-recovery.   
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
- grunt-cli 
  npm install grunt-cli -g
- Firefox > 31
- Add the paths of your firefox binary and profile to the config.json 

### Build the plugin
To build the plugin simply run `grunt build`, which will create a build folder with the xpi file.
You can run the unit tests via `grunt test`.
