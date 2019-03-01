/*
Handler for both `image` and `image_prediction` routes
*/
const {wrapHandler} = require('./util')

module.exports = ()=> {

  const baseSelect = `
    SELECT
      i.image_id,
      doc_id,
      page_no,
      stack_id stack,
      file_path,
      i.created
    FROM image i
    JOIN image_stack istack USING (image_id)
    JOIN stack USING (stack_id)`

  const handler = async (req, res, next, plugins) => {
    const {db} = plugins;
    if (req.query.image_id === 'next') {
      type='annotation';
      let row = await db.one(`
        ${baseSelect}
        WHERE (
              tag_start IS NULL
           OR tag_start < now() - interval '5 minutes' )
          AND image_id NOT IN (
            SELECT image_id
            FROM image_tag
            JOIN image_stack
            USING (image_stack_id)
          )
          AND stack_type = $1
        ORDER BY random()
        LIMIT 1`, [type]);
      await db.query(`
        UPDATE image
        SET tag_start = now()
        WHERE image_id = $1`, [row.image_id]);
      res.reply(req, res, next, row);

    } else if ( req.query.image_id === 'validate') {
      type='annotation';
      let where = 'WHERE true'
      let params = []
      if (req.query.validated == false) {
        where = 'WHERE validator IS NULL'
      } else if (req.query.validated == true) {
        where = 'WHERE validator IS NOT NULL'
      }
      where += "\nAND stack_type = $1"

      try {
        let row = await db.one(`
          ${baseSelect}
          JOIN image_tag it
          USING (image_stack_id)
          ${where}
          ORDER BY random()
          LIMIT 1`, [type]);

        if (!row) {
          return res.reply(req, res, next, []);
        } else {
          return res.reply(req, res, next, row);
        }

        // Update the tag start
        await db.none(`
          UPDATE image
          SET tag_start = now()
          WHERE image_id = $1`, [row.image_id]);

      } catch(error) {
        console.log(error)
        return res.error(req, res, next, 'An internal error occurred', 500)
      }
      res.reply(req, res, next, row);
    } else if ( req.query.image_id === 'next_prediction') {
        //TODO : this type should key into the stack_type column in the stack table instead of the stack_id like it does now
      type='prediction';
      let where = 'WHERE true'
      let params = []
      where += "\nAND stack_type = $1"
        params.push(type)
      if (req.query.stack_id) { 
          where += "\n AND stack_id = $2"
        params.push(req.query.stack_id)
       }

      try {
        let row = await db.one(`
          ${baseSelect}
          JOIN image_tag it
          USING (image_stack_id)
          ${where}
          ORDER BY random()
          LIMIT 1`, params);

        if (!row) {
          return res.reply(req, res, next, []);
        } else {
          return res.reply(req, res, next, row);
        }

      } catch(error) {
        console.log(error)
        return res.error(req, res, next, 'An internal error occurred', 500)
      }
      res.reply(req, res, next, row);
    } else {
      let row = await db.one(`
        ${baseSelect}
        WHERE image_id = $1`,
        [req.query.image_id]
      );
      res.reply(req, res, next, row);
    }
  }

  return wrapHandler(handler);
};
