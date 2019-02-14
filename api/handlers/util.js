const wrapHandler = handler => {
  return (req, res, next, plugins)=> {
    return handler(req, res, next, plugins).catch( error => {
      // Should probably only do this in development
      return res.error(req, res, next, error.toString(), 500)
    })
  }
};

module.exports = {
  wrapHandler
};
