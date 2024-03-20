var EasyFit = require('easy-fit').default

module.exports = {
    transformFit: parseFitFile
};

function transformFitData(data, maxLineElements) {
    let geo = {}
    geo.type = 'FeatureCollection'
    geo.features = []
    if (data && data.records) {
      let idx_records = 0
      let element = {}
      let coordinates = []
      for (idx_records = 0;idx_records < data.records.length; idx_records++ ) {
        
        if(idx_records != 0 
          && ((maxLineElements && idx_records % maxLineElements == 0) 
              || idx_records == data.records.length - 1)){
          let f = {}
          f.type = 'Feature'
          f.properties = element
          f.geometry = {}
          f.geometry.type = 'LineString'
          f.geometry.coordinates = coordinates
          geo.features.push(f)
          coordinates = []
        }

        element = data.records[idx_records]
        if(element.position_long!=null &&  element.position_lat!=null)
          coordinates.push([element.position_long, element.position_lat]);
        else
          console.log(`Warning: element ${JSON.stringify(element)} was missing long or lat`)
      }
    }
    return geo
}

async function parseFitFile(data, maxLineElements) {

    var easyFit = new EasyFit({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'km',
      temperatureUnit: 'kelvin',
      elapsedRecordField: true,
      mode: 'both'
    })
    
    try{
        
        var result = await new Promise((resolve, reject) => {
            easyFit.parse(data,
                (err,res) =>{
                    if(err)
                        reject(err)
                    else
                        resolve(res)
                }
            )
        })
        console.log("loaded file data")
        console.log("transforming to geojson..")
        return transformFitData(result, maxLineElements)
    }catch(error){
        console.log(error)
        return error
    }
}
