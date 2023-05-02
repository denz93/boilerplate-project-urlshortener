const mongoose = require('mongoose')

const IncrementSchema = new mongoose.Schema({
  collectionName: {
    type: String,
    index: true
  },
  
  counter: {
    type: Number,
  }
})

const IncrementModel = mongoose.model('Increment', IncrementSchema)


let mongooseConnection = null;

function MongooseAutoIncrementPLugin (schema, collectionName) {
  
  IncrementModel.findOne({collectionName}).then(async (isCollectionFound) => {
    if (!isCollectionFound) {
      const increment = new IncrementModel({ collectionName, counter: 0})
      await increment.save()
    }
  })
  

  schema.path('_id', {type: Number, default: 0})

  
  schema.pre('validate', function insidePlugin (next) {
    const doc = this
    console.log(`hook validate. isNew ${this.$isNew}`)
    if (!this.$isNew) return next()
    
    IncrementModel.findOneAndUpdate(
      {collectionName},
      {$inc: {counter: 1}},
      {returnDocument: 'after'}
    ).then(increment => doc._id = increment.counter)
    .then(_ => next())

  })

}

const init = (conn) => {
  if (typeof conn !== mongoose.Connection) {
    console.log(`"${typeof conn}" is not a connection`)
    return
  } 

  mongooseConnection = conn 

  
}

module.exports = {
  init,
  plugin: MongooseAutoIncrementPLugin
}