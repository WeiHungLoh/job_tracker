import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string

// Makes req.user able to be inferred
interface AuthenticatedRequest extends Request {
    user?: string | jwt.JwtPayload
}

const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Extracts JWT from the Authorization header in the format: "Bearer <token>".
  // The token is sent by the frontend (after sign in) and included in requests
  // to protected routes like /exam or /assignment.
  // It is initially saved in localStorage upon successful sign-in.
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).send('Please login')
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET)

    // Save decoded token data (userid and email) so it can be used in protected routes (/exam and /assignment)
    req.user = decoded
    next()
  } catch (error: unknown) {
    if (error instanceof Error) {
        return res.status(401).send(error.message)
    } else {
        return res.status(401).send(error)
    }
  }
}

export default verifyToken
