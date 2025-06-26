import jwt from 'jsonwebtoken'
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET

const cookieJWTAuth = (req, res, next) => {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token. Please login' })
  }

  try {
    const user = jwt.verify(token, ACCESS_TOKEN_SECRET)

    // Save decoded token data (userid and email) so it can be used in protected routes
    req.user = user
    next()
  } catch (error) {
    res.clearCookie('token')
    res.status(401).json({ message: 'Invalid or expired token. Please login' })
  }
}

export default cookieJWTAuth
