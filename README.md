A Small utility to convert Garmin fit files to geojson, a popular mapping json format.  The FIT track will be converted to a set of LineString objects contained within a single feature in the geojson file.

# Installation
```
npm install fit-geojson-converter
```

# Usage

You may use fit-geojson-converter to convert a fit file to geojson, optionally constraining the number of vertices per line:

```
const fitGeojsonConverter = require('fit-geojson-converter')
const fs = require('fs')

let source = fs.readFileSync(my_fit_file.fit")
let geojson = await fitGeojsonConverter.transformFit(source)

```

There is one method `transformFit()` which takes an optiona maxLineElements second parameter which will split long lines into separate line features

```
//generates a geojson file containing LineString features, each 
//containing a maximum of 10 coordinates per feature

let maxElements = 10;

let geojson = await fitGeojsonConverter.transformFit(source, maxElements)

``
