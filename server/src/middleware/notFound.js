/**
 * Catch-all 404 handler for undefined API routes.
 * Emits standardized error JSON envelope.
 */
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`
    }
  });
};
