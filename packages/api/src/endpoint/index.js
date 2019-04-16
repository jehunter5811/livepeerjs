import { Router } from 'express'
import schema from './schema.json'
import Ajv from 'ajv'
import uuid from 'uuid/v4'

var ajv = new Ajv() // options can be passed, e.g. {allErrors: true}
var validate = ajv.compile(schema)

const router = Router()
router.post('/', (req, res) => {
  const { body } = req

  if (body.id || body.streamKey) {
    res.status(422)
    return res.json({
      errors: ['id and streamKey are generated by the server'],
    })
  }

  const data = {
    id: uuid(),
    streamKey: uuid(),
    ...body,
  }

  var valid = validate(data)
  if (!valid) {
    res.status(422)
    return res.json({
      errors: validate.errors.map(({ message }) => message),
    })
  }

  res.status(201)
  res.json(data)
})

export default router
