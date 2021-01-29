#!/usr/bin/env node

var fitGjsonConverter = require('./index')
var fs = require('fs')

var argv = require('minimist')(process.argv.slice(2))
var concat = require('concat-stream')

var usage = `fit-geojson-converter <fit-file|gpx-file>`
var stdin

if (argv.help) {
  console.log(usage)
  process.exit()
}

if (argv._[0] && argv._[0] !== '-') {
  stdin = fs.createReadStream(argv._[0])
} else if (!process.stdin.isTTY || argv._[0] === '-') {
  stdin = process.stdin
} else {
  console.log(usage)
  process.exit(1)
}

stdin.pipe(concat(function (buffer) {

	   
	if(argv._[0].toLowerCase().endsWith(".gpx")){
		fit2gjson.transformGpx(buffer).then(
			function(result){
				console.log(JSON.stringify(result, null, 0))
			}
		)
	}
	else if(argv._[0].toLowerCase().endsWith(".fit")){
		fit2gjson.transformFit(buffer).then(
			function(result){
				console.log(JSON.stringify(result, null, 0))
			}
		)
	}
	else{
		console.log("file must end with .gpx or .fit")
	}
}))
