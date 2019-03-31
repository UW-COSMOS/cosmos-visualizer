const uuidv4 = require('uuid/v4')
const {wrapHandler} = require('./util')
const pgp = require('pg-promise')

async function handleGet(req, res, next, plugins) {
  const {db} = plugins;
  let where = []
  let params = {};
  params['image_id'] = req.query.image_id;
  params['stack_id'] = req.query.stack_id || 'default'

//  if ('validated' in req.query && req.query.validated === true) {
//    where.push(`it.validator IS NOT NULL`)
//  } else if ('validated' in req.query && req.query.validated === false) {
//    where.push(`it.validator IS NULL`)
//  }

//  // TODO: Make sure this is a valid validator
//  if ('validator' in req.query) {
//    where.push(`tagger != $(tagger)
//      AND (validator != $(validator)
//       OR validator IS NULL)`)
//    params['tagger'] = req.query.validator
//    params['validator'] = req.query.validator
//  }

  try {
    let tags = await db.any(`
      SELECT
        row_number,
        bbox_array(geometry) boxes,
        equation_text,
        tag_id,
        symbols,
        sentence_text
      FROM equations.sentence
      WHERE sentence.image_id = $(image_id)
      ${where.length ? ' AND ' + where.join(' AND ') : ''}
    `, params);

    res.reply(req, res, next, tags);

  } catch (error) {
    return res.error(req, res, next,
      error.toString(), 500);
  }
}

module.exports = handleGet;
