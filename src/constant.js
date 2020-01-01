const ONE_MIN = 60 * 1000;

module.exports = {
  SESS_TTL_DELAY: ONE_MIN,
  SESS_AFR_MAX_AGE: ONE_MIN * 10, // AFR: away from request
  WS_HEART_BEAT_DELAY: ONE_MIN
}