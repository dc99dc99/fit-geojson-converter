var EasyFit = require('easy-fit').default
var parseStringAsync = require('xml2js').parseStringPromise;
const util = require('util')
const fs = require('fs').promises

module.exports = {
    transformGpx: parseGpxFile,
    transformFit: parseFitFile
};

function get_gpx_data(node, result) {
    if (!result) result = { segments: [] }
    switch (node.nodeName) {
      case 'name':
        result.name = node.textContent
        break
      case 'trkseg':
        var segment = []
        result.segments.push(segment)
        for (var i = 0; i < node.childNodes.length; i++) {
          var snode = node.childNodes[i]
          if (snode.nodeName == 'trkpt') {
            var trkpt = {
              loc: [
                parseFloat(snode.attributes['lat'].value),
                parseFloat(snode.attributes['lon'].value)
              ]
            }
            for (var j = 0; j < snode.childNodes.length; j++) {
              var ssnode = snode.childNodes[j]
              switch (ssnode.nodeName) {
                case 'time':
                  trkpt.time = new Date(ssnode.childNodes[0].data)
                  break
                case 'ele':
                  trkpt.ele = parseFloat(ssnode.childNodes[0].data)
                  break
                case 'extensions':
                  var extNodes = ssnode.childNodes
                  for (
                    var idxExtNode = 0;
                    idxExtNode < extNodes.length;
                    idxExtNode++
                  ) {
                    var extNode = extNodes[idxExtNode]
                    if (extNode.nodeName == 'gpxtpx:TrackPointExtension') {
                      var trackPointNodes = extNode.childNodes
                      for (
                        var idxTrackPointNode = 0;
                        idxTrackPointNode < trackPointNodes.length;
                        idxTrackPointNode++
                      ) {
                        var trackPointNode =
                          trackPointNodes[idxTrackPointNode]
                        if (trackPointNode.nodeName.startsWith('gpxtpx:')) {
                          var gpxName = trackPointNode.nodeName.split(':')
                          trkpt[gpxName[1]] =
                            trackPointNode.childNodes[0].data
                        }
                      }
                    }
                  }
                  break
              }
            }
            segment.push(trkpt)
          }
        }
        break
    }
    for (
      var idxChildNodes = 0;
      idxChildNodes < node.childNodes.length;
      idxChildNodes++
    ) {
      this.get_gpx_data(node.childNodes[idxChildNodes], result)
    }
    return result
}

function transformGpxData(data) {
    
    let geo = {}
    geo.type = 'FeatureCollection'
    geo.features = []
    if (data && data.segments) {
      let prev_position_long = 0
      let prev_position_lat = 0
      let idx_records = 0
      let element = {}
      for (
        idx_records = 0;
        idx_records < data.segments[0].length;
        idx_records++
      ) {
        element = data.segments[0][idx_records]
        //data.segments[0].forEach(element => {
        //console.error('elemento', element)
        if (Array.isArray(element.loc)) {
          if (idx_records > 0) {
            let f = {}
            f.type = 'Feature'
            f.properties = element
            f.geometry = {}
            f.geometry.type = 'LineString'
            f.geometry.coordinates = [
              [prev_position_long, prev_position_lat],
              [element.loc[1], element.loc[0]]
            ]
            geo.features.push(f)
          }
          prev_position_long = element.loc[1]
          prev_position_lat = element.loc[0]
        } else {
          //console.error(element.loc)
        }
      }
    }
    return geo
}

async function parseGpxFile(gpxContent) {

    try{
        var xml = await parseStringAsync(xml);
    }catch(error){
        console.log(error)
    }

    if (xml) {
        var objGpx = get_gpx_data(xml.documentElement)
        console.log("loaded GPX data")
        return transformGpxData(objGpx)
    } else {
        console.log("Error loading GPX data")
    }
}

function transformFitData(data) {
    let geo = {}
    geo.type = 'FeatureCollection'
    geo.features = []
    if (data && data.records) {
      let prev_position_long = 0
      let prev_position_lat = 0
      let idx_records = 0
      let element = {}
      for (
        idx_records = 0;
        idx_records < data.records.length;
        idx_records++
      ) {
        element = data.records[idx_records]
        if (idx_records > 0) {
          let f = {}
          f.type = 'Feature'
          f.properties = element
          f.geometry = {}
          f.geometry.type = 'LineString'
          f.geometry.coordinates = [
            [prev_position_long, prev_position_lat],
            [element.position_long, element.position_lat]
          ]
          geo.features.push(f)
        }
        prev_position_long = element.position_long
        prev_position_lat = element.position_lat
      }
    }
    return geo
}

async function parseFitFile(data) {

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
        return transformFitData(result)
    }catch(error){
        console.log(error)
        return error
    }
}

function convertGeojson2CSV() {
    let items = JSON.parse(this.geojson).features
    const replacer = (key, value) => (value === null ? '' : value)
    const headers = ['lat', 'long', ...Object.keys(items[0].properties)]
    items = items.map(el => {
      for (let i of Object.keys(el.properties)) {
        el.properties[i] = Array.isArray(el.properties[i])
          ? el.properties[i].flat().join(',')
          : el.properties[i]
      }
      return {
        lat: el.geometry.coordinates[0][1],
        long: el.geometry.coordinates[0][0],
        ...el.properties
      }
    })
    let csv = items.map(row =>
      headers
        .map(fieldName => JSON.stringify(row[fieldName], replacer))
        .join(',')
    )
    csv.unshift(headers.join(','))
    return csv.join('\r\n')
}
