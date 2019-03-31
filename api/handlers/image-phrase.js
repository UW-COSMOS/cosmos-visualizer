const uuidv4 = require('uuid/v4')
const {wrapHandler} = require('./util')
const pgp = require('pg-promise')

async function handleGet(req, res, next, plugins) {
  const {db} = plugins;
  let where = []
  let params = {};
  params['image_id'] = req.query.image_id;
  params['stack_id'] = req.query.stack_id || 'default'

  try {
    let tags = await db.any(`
      SELECT
        row_number,
        bbox_array(geometry) boxes,
        text,
        tag_id,
        equation_text,
        symbols,
        sentence_text
      FROM equations.phrase
      WHERE phrase.image_id = $(image_id)
       AND phrase_page::integer = page_no::integer
       AND geometry IS NOT null
    `, params);
    // We should *not* have to filter out null geometries
    // because they shouldn't exist but whatever

    res.reply(req, res, next, tags);

  } catch (error) {
    return res.error(req, res, next,
      error.toString(), 500);
  }
}

module.exports = handleGet;
