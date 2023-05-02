require('dotenv').config();
const mongoose = require('mongoose')
const autoIncement = require('./mongoose-auto-increment')
const bodyParser = require('body-parser')
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('node:dns');
const dnsPromises = dns.promises;


async function validateUrl(req, res, next) {
  console.log('validate')
  const {url: url_input} = req.body 
  console.log({url_input})
  try {
    if (!url_input)  { 
      res.json({error: 'invalid url'})
      return next(new Error('invalid url'))
    }
    const url = new URL('', url_input)
    await dnsPromises.lookup(url.hostname) 
  } catch (err) {
    console.log({err})
    res.json({error: 'invalid url'})
    next(new Error('invalid url'))
  }
  next()
}

async function main() {
  //connect to db
  const db = await mongoose.connect(process.env.MONGO_URI, { dbName: 'ffc_db' })

  //auto increment init
  // autoIncement.initialize(db)

  //URL Schema
  const URLSchema = new mongoose.Schema({
    originalUrl: {
      type: String,
      required: true,
      unique: true,
      index: true
    }
  })

  URLSchema.plugin(autoIncement.plugin, 'URL')
  const URLModel = mongoose.model('URL', URLSchema)



  // Basic Configuration
  const port = process.env.PORT || 3000;

  app.use(cors());
  app.use(bodyParser.urlencoded({extended: false}))
  app.use('/public', express.static(`${process.cwd()}/public`));

  app.get('/', function(req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

  // Your first API endpoint
  app.get('/api/shorturl/:id', async function(req, res) {
    const id = req.params.id
    const record = await URLModel.findById(id)
    if (record) {
      res.redirect(record.originalUrl)
    } else {
      res.status(404).send('No redirection')
    }
  });

  app.post('/api/shorturl', validateUrl, async function (req, res) {
    const url_input = req.body.url
    
    let record = await URLModel.findOne({originalUrl: url_input})
    if (!record) {
      record = await URLModel()
      record.originalUrl = url_input
      await record.save()
    } 
    res.json({
      original_url: record.originalUrl,
      short_url: record._id
    })
  })

  app.listen(port, function() {
    console.log(`Listening on port ${port}`);
  });
}

main()
