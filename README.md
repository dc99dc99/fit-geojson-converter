A Small utility to convert Garmin fit files to geojson, a popular mapping json format.  The FIT track will be converted to a set of LineString objects contained within a single feature in the geojson file.


*Usage*

```
npm install fit2geojson
```

You may use fit2geojson to convert a fit file to geojson, optionally constraining the number of vertices per line:

```
const fit2geojson = require('fit2geojson')
const fs = require('fs')

let source = fs.readFileSync(req.params.name +".fit")
let geojson = await fit2geojson.transformFit(source)

```