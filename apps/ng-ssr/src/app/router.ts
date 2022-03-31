import * as express from 'express'
import { getUsers } from './users'

export const V1 = () => {
  const router = express.Router()
  router.route('/users').get(handleErrorAsync(getUsers))

  return router
}

const handleErrorAsync =
  (handler: express.RequestHandler) =>
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      handler(req, res, next)
    } catch (error) {
      next(error)
    }
  }
