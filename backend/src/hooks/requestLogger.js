export async function requestLogger(req) {
  req.log.info({ method: req.method, url: req.url, ip: req.ip });
}
