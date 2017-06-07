#!/usr/bin/env node --harmony
var co = require('co');
var chalk = require('chalk');
var prompt = require('co-prompt');
var program = require('commander');
var fs = require('fs');
var path = require('path');
var merge = require('deepmerge')

program
.version('0.0.1')
.option('-n, --name <fileName>', "The name of the resource file")
.option('-p, --path <path>', 'The path to read')
.parse(process.argv);
  co(function *() {

    const writeFile = (files, name) => {
      co(function *() {

      let json = JSON.stringify(files, null, "\t");

      /// Remove Quotes around require()
      json = json.replace(/: "(.*?)"/g,": $1");

      /// Build String
      let output = `export default ${json};`;

      /// Write to ./Images.js

      if (fs.existsSync(name)) {
          console.warn(`This will overwrite ${name}`)

          const shouldContinue = (yield prompt(`continue? (y/n)`) || 'y');
          if (shouldContinue == "n") {
            console.log(chalk.red("exiting, have a nice day :)"));

            process.exit();
          }
      }

      fs.writeFile(name, output, function(err) {
        if(err) {
          console.log(chalk.red(err));
        } else {
          console.log(chalk.green.bold("Saved!"));
          console.log(chalk.green(output))
        }
         process.exit();
       });
     });
    }


    let defaultPath = './assets/images'
    if (!fs.existsSync(defaultPath)) {
        defaultPath = './';
    }

    let path = program.path;
    let name = program.fileName;
    if (!path) {
      path = yield prompt(`path: (${defaultPath}) `) || defaultPath;
      if (!path || path == "") path = defaultPath;
    }
    console.log(chalk.cyan(path))
    if (!name) {
      name = yield prompt('name: (./Images.js) ')
      if (!name || name == "") name = "./Images.js";
    }
    console.log(chalk.cyan(name))


    if (!fs.existsSync(path)) {
      console.error(`Path: ${path} doesn't exist!`);
       process.exit();
    }

    require('node-dir').files(path, (err, files) => {
      /// Strip out invisibles
      files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));


      function assign(obj, keyPath, value) {
         lastKeyIndex = keyPath.length-1;
         for (var i = 0; i < lastKeyIndex; ++ i) {
           key = keyPath[i];
           if (!(key in obj))
             obj[key] = {}
           obj = obj[key];
         }
         obj[keyPath[lastKeyIndex]] = value;
      }

      let assets = {};
      let objs = files.map(val => {
        var settings = {};
        let components = val.split('/');
        let end = components.pop();

        components.push(end.substr(0, end.lastIndexOf('.')));
        assign(settings,  components, `require(\`./${val}\`)`) ;
        assets = merge(assets, settings);
        return settings;
      });

      writeFile(assets, name);
    });
  })
