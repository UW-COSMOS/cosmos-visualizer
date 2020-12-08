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
        bbox_array(geometry) boxes,
        equation_text,
        tag_id,
        document_name,
        doc_id,
        page_no,
        image_id
      FROM equations.equation
      WHERE equation.image_id = $(image_id)
    `, params);

    res.reply(req, res, next, tags);

  } catch (error) {
    return res.error(req, res, next,
      error.toString(), 500);
  }
}

module.exports = handleGet;
