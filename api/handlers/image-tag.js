const uuidv4 = require('uuid/v4')
const {wrapHandler} = require('./util')

module.exports = (tablename) => {
  const handler = async (req, res, next, plugins) => {
    const {db} = plugins;
    if (req.method === 'GET') {
      let where = []
      let params = {};
      params['image_id'] = req.query.image_id;

      if ('validated' in req.query && req.query.validated === true) {
        where.push(`it.validator IS NOT NULL`)
      } else if ('validated' in req.query && req.query.validated === false) {
        where.push(`it.validator IS NULL`)
      }

      // TODO: Make sure this is a valid validator
      if ('validator' in req.query) {
        where.push(`tagger != $(tagger)
          AND (validator != $(validator)
           OR validator IS NULL)`)
        params['tagger'] = req.query.validator
        params['validator'] = req.query.validator
      }

      try {
        let tags = await db.any(`
          SELECT
            it.image_tag_id,
            tag.tag_id,
            tag.name,
            it.x,
            it.y,
            it.width,
            it.height,
            it.tagger,
            it.validator,
            it.created
          FROM tag
          JOIN ${tablename} it
            ON it.tag_id = tag.tag_id
          WHERE it.image_id = $(image_id)
          ${where.length ? ' AND ' + where.join(' AND ') : ''}
        `, params);

        res.reply(req, res, next, tags);

      } catch (error) {
        return res.error(req, res, next,
          'An internal error occurred', 500);
      }
    } else {
      // Validate the input
      let incoming = req.body

      if (!incoming.tagger && !incoming.validator) {
        return res.error(req, res, next, 'Missing a "tagger" or "validator" property', 400)
      }
      if (!incoming.tags) {
        return res.error(req, res, next, 'Missing "tags" property', 400)
      }

      if (!(Array.isArray(incoming.tags))) {
        try {
          incoming.tags = JSON.parse(incoming.tags)
        } catch(e) {
          return res.error(req, res, next, 'Could not parse tags', 400)
        }
      }

      incoming.tags.forEach(tag => {
        if (!tag.tag_id) {
          return res.error(req, res, next, 'A tag is missing a tag_id', 400)
        }
        if (!tag.x) {
          return res.error(req, res, next, 'A tag is missing an x', 400)
        }
        if (!tag.y) {
          return res.error(req, res, next, 'A tag is missing an y', 400)
        }
        if (!tag.width) {
          return res.error(req, res, next, 'A tag is missing a width', 400)
        }
        if (!tag.height) {
          return res.error(req, res, next, 'A tag is missing a height', 400)
        }
      })

      incoming.tags = incoming.tags.map(tag => {
        if (!('image_tag_id' in tag)) {
          tag.image_tag_id = uuidv4()
        }
        return tag
      })
      // Alright...I think we are good to go

      try {
        for (tag of incoming.tags) {
          let params = [
            tag.image_tag_id,
            req.query.image_id,
            tag.tag_id,
            tag.x, tag.y,
            tag.width, tag.height,
            incoming.tagger, incoming.validator || null
          ];

          await db.none(`
            INSERT INTO image_tag (
              image_tag_id,
              image_id,
              tag_id,
              x,
              y,
              width,
              height,
              tagger,
              validator
            ) VALUES (
              $1, $2, $3,
              $4, $5, $6,
              $7, $8, $9
            )`, params);

        }
        // Finished inserting tags
        res.reply(req, res, next, incoming.tags)
      } catch (error) {
        console.log(error)
        return res.error(req, res, next, 'An error occurred while inserting tags', 500)
      }
    }
  }
  // Wrap handler in error handling code
  return wrapHandler(handler);
};

