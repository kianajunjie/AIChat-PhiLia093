export function errorHandler(err, req, res, _next) {
  console.error(`[${new Date().toISOString()}] Error:`, err.message)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  })
}
