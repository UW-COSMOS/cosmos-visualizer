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
        equation_id,
        id,
        bbox_array(geometry) boxes,
        document_name,
        tag_id,
        equation_text,
        text,
        image_id,
        doc_id,
        page_no
      FROM equations.variable
      WHERE variable.image_id = $(image_id)
    `, params);

    res.reply(req, res, next, tags);

  } catch (error) {
    return res.error(req, res, next,
      error.toString(), 500);
  }
}

module.exports = handleGet;
