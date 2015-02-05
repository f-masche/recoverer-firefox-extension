/* globals module */



module.exports = function(grunt) {

  var config = grunt.file.readJSON("config.json");
  var file = grunt.option("file");

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    watch: {
      js: {
        files: ["**/*.js"],
        tasks: ["jshint"],
        options: {
          interrupt: true,
        }
      },
      html: {
        files: ["extension/data/**/*.html"],
        tasks: ["validation"],
        options: {
          interrupt: true,
        }
      }
    },

    validation: {
        options: {
          reset: true,
          stoponerror: true,
          reportpath: false
        },
        files: {
          src: ["extension/data/*.html"]
        }
    },

    jshint: {
      all: [
        "Gruntfile.js", 
        "extension/data/*.js",
        "extension/lib/*.js",
        "!extension/data/angular.min.js"
      ],
      options: {
        jshintrc: true
      } 
    },

    sass: {                        
      build: {
        options: {                 
          style: "compressed",
          sourcemap: "none",
          update: true
        },
        files: {        
          "extension/data/content.css": "extension/sass/content.scss",     
          "extension/data/style.css": "extension/sass/main.scss"
        }
      }
    },

    "mozilla-addon-sdk": {
      "latest": {
        options: {
          revision: "latest", // default official revision
          dest_dir: "build_tools/"  // jshint ignore:line
        }
      }
    },

    "mozilla-cfx": {
      test: {
        options: {
          "mozilla-addon-sdk": "latest",
          extension_dir: "extension", // jshint ignore:line
          command: "test",
          arguments: (file ? "-f " + file : "") +
            (config.firefox.bin ? " -b " + config.firefox.bin : "") +
            (config.firefox.profile ? " --profiledir " + config.firefox.profile  : ""),
          pipe_output: true // jshint ignore:line
        }
      },

      run: {
        options: {
          "mozilla-addon-sdk": "latest",
          extension_dir: "extension", // jshint ignore:line
          command: "run",
          arguments: 
            (config.firefox.bin ? "-b " + config.firefox.bin + " " : "") +
            (config.firefox.profile ? " --profiledir " + config.firefox.profile  : ""),          pipe_output: true // jshint ignore:line
        }
      }
    },

    "mozilla-cfx-xpi": {
      "stable": {
        options: {
          "mozilla-addon-sdk": "latest",
          extension_dir: "extension",   // jshint ignore:line
          dist_dir: "build/dist-stable" // jshint ignore:line
        }
      }
    }
  });

  // Load tasks
  grunt.loadNpmTasks("grunt-html-validation");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-sass");
  grunt.loadNpmTasks("grunt-mozilla-addon-sdk");

  // Register task.
  grunt.registerTask("default", ["jshint:all", "validation", "sass", "mozilla-addon-sdk", "mozilla-cfx:run"]);
  grunt.registerTask("test", [ "jshint:all", "validation", "sass", "mozilla-addon-sdk", "mozilla-cfx:test"]);
  grunt.registerTask("build", ["test", "mozilla-cfx-xpi:stable"]);
};