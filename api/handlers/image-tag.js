const uuidv4 = require('uuid/v4')
const {wrapHandler} = require('./util')
const pgp = require('pg-promise')

async function handleGet(req, res, next, plugins) {
  const {db} = plugins;
  let where = []
  let params = {};
  params['image_id'] = req.query.image_id;
  params['stack_id'] = req.query.stack_id || 'default'

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
        it.image_stack_id,
        tag.tag_id,
        tag.name,
        (SELECT array_agg(
          ARRAY[
            ST_XMin(b),
            ST_YMin(b),
            ST_XMax(b),
            ST_YMax(b)])
        FROM (
          SELECT Box2D(
            (ST_Dump(geometry)).geom
          ) AS b
        ) AS c) AS boxes,
        it.tagger,
        it.validator,
        it.created
      FROM tag
      JOIN image_tag it
        ON it.tag_id = tag.tag_id
      JOIN image_stack USING (image_stack_id)
      WHERE image_stack.image_id = $(image_id)
        AND image_stack.stack_id = $(stack_id)
      ${where.length ? ' AND ' + where.join(' AND ') : ''}
    `, params);

    res.reply(req, res, next, tags);

  } catch (error) {
    return res.error(req, res, next,
      error.toString(), 500);
  }
}

async function handlePost(req, res, next, plugins) {
  const {db} = plugins;
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

  // We should consider setting image_stack_id at
  // UI level
  let {image_stack_id} = await db.one(`
    SELECT image_stack_id
    FROM image_stack
    WHERE stack_id = $(stack_id)
      AND image_id = $(image_id)`, {
      image_id: req.query.image_id,
      stack_id: req.query.stack_id || 'default'
    });


  try {
    for (tag of incoming.tags) {

      let {x, y, width, height, tag_id, image_tag_id} = tag
      let {tagger, validator} = incoming

      let xMax = x + width
      let yMax = y + height

      // Construct array of BBoxes
      let coords = [[
        tag.x, tag.y, xMax, yMax
      ]]

      let rects = coords.map( d => {
        return pgp.as.format("ST_MakeEnvelope($1,$2,$3,$4)", d)
      })

      let geomArray = pgp.as.format("ARRAY[$(geoms:value)]", {geoms: rects.join(", ")})

      let params = {
        image_tag_id,
        image_stack_id,
        tag_id,
        geomArray,
        tagger,
        validator: validator || null,
        rects
      };

      await db.none(`
        INSERT INTO image_tag (
          image_tag_id,
          image_stack_id,
          tag_id,
          geometry,
          tagger,
          validator
        )
        SELECT
          $(image_tag_id),
          $(image_stack_id),
          $(tag_id),
          ST_Collect($(geomArray:value)),
          $(tagger),
          $(validator)`, params);

    }
    // Finished inserting tags
    res.reply(req, res, next, incoming.tags)
  } catch (error) {
    console.log(error)
    return res.error(req, res, next, 'An error occurred while inserting tags', 500)
  }
}

module.exports = (tablename) => {
  const handler = (req, res, next, plugins) => {
    if (req.method === 'GET') {
      return handleGet(req, res, next, plugins)
    } else {
      return handlePost(req, res, next, plugins)
    }
  }
  return wrapHandler(handler);
};

