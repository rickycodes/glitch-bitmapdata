var nconf = require('nconf')
var bodyParser = require('body-parser')
var dataUriToBuffer = require('data-uri-to-buffer')
var express = require('express')
var uuid = require('uuid')
var gm = require('gm')
var app = express()

var exec = require('child_process').exec
var fs = require('fs')

nconf.argv().env().file({
  file: 'local.json'
})

app.use(bodyParser.json({
  limit: '2mb'
}))

app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html')
})

function chillOut(req, res) {
  console.log('chillout, bro')
  res.json(req.body)
  return false
}

var chill
app.post('/service', function(req, res) {

  if (chill) {
    chillOut(req, res)
    return false
  }

  chill = true

  var i = 0
  var frames = 5
  var upscale = (Math.floor(Math.random() * 8)) + 2
  var types = ['over', 'plus', 'minus']
  var buff = dataUriToBuffer(req.body.content.data)

  var width = 400

  var s_width = 42 * upscale
  var s_height = 48 * upscale
  var x = Math.floor(Math.random() * (width - s_width))
  var y = Math.floor(Math.random() * (width - s_height))

  // Functions

  function handle(error) {
    console.log(error)
  }

  function cleanUp() {
    exec('rm *.png *.gif', function(error, stdout, stderr) {
      if (error) handle(error)
      chill = false
      console.log('ding, fries are done!')
    })
  }

  function processFrame() {
    var png = uuid.v1() + '.png'
    var gif = uuid.v1() + '.gif'

    gm(buff)
      .resize(width)
      .command('composite')
      .in('-geometry', s_height + 'x' + s_width + '+' + x + '+' + y)
      .in('-compose', types[Math.floor(Math.random() * types.length)])
      .in('sprites/megaman/frame_' + i + '.gif')
      .write(png, function(error) {
        if (error) handle(error)
        console.log('poop!')
        i++
        if (i >= frames) {
          gm()
            .command('convert')
            .out('*.png')
            .write(gif, function(error) {
              if (error) handle(error)
              var final_buffer = fs.readFileSync(gif)
              var dataUri = 'data:image/gif;base64,' + final_buffer.toString('base64')
              req.body.content.data = dataUri
              res.json(req.body)
              cleanUp()
            })
        } else {
          processFrame()
        }
      })
  }

  // (╯°□°）╯︵sʞɔɐqןןɐɔ
  processFrame()
})

var port = nconf.get('port')
app.listen(port)
console.log('server running on port: ', port)