const wrapHandler = handler => {
  return (req, res, next, plugins)=> {
    return handler(req, res, next, plugins).catch( error => {
      // Should probably only do this in development
      return res.error(req, res, next, error.toString(), 500)
    })
  }
};

const buildWhereClause = filters => {
  if (!filters || filters.length == 0) return '';
  return "WHERE "+filters.join("\n  AND ");
}

module.exports = {
  wrapHandler,
  buildWhereClause
};
