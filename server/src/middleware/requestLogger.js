/**
 * Request logging middleware for Express.
 * Logs HTTP Method, Path, Status Code, and Latency without recording sensitive tokens or PII.
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Color indicators for console clarity
    const statusCategory = Math.floor(statusCode / 100);
    const colorCode =
      statusCategory === 2 ? '\x1b[32m' : // Green
      statusCategory === 3 ? '\x1b[36m' : // Cyan
      statusCategory === 4 ? '\x1b[33m' : // Yellow
      '\x1b[31m';                         // Red
    const resetCode = '\x1b[0m';

    console.log(
      `[API] ${req.method} ${req.originalUrl} - ${colorCode}${statusCode}${resetCode} (${duration}ms)`
    );
  });

  next();
};
