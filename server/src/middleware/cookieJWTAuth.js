import jwt from 'jsonwebtoken'
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET

const clearAuthCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/'
}

const cookieJWTAuth = (req, res, next) => {
  const token = req.cookies.token

  if (!token) {
    console.warn('Protected route rejected: no token cookie received', {
      path: req.originalUrl,
      origin: req.get('origin'),
      host: req.get('host'),
      cookieHeaderPresent: Boolean(req.get('cookie'))
    })
    return res.status(401).json({ message: 'Unauthorized: No token. Please login' })
  }

  try {
    const user = jwt.verify(token, ACCESS_TOKEN_SECRET)

    // Save decoded token data (userid and email) so it can be used in protected routes
    req.user = user
    next()
  } catch (error) {
    console.warn('Protected route rejected: invalid token', {
      path: req.originalUrl,
      origin: req.get('origin'),
      host: req.get('host'),
      error: error.message
    })
    res.clearCookie('token', clearAuthCookieOptions)
    res.status(401).json({ message: 'Invalid or expired token. Please login' })
  }
}

export default cookieJWTAuth
