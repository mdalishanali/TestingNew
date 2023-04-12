import * as express from 'express';
import * as status from 'http-status';
import { User } from './../../db/index';
import { AuthenticatedRequest } from 'lib/interfaces/authenticated-request';
import * as mongoose from 'mongoose';


export class ChatRoutes {

  public static searchUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const queryValue = req.query.email;
      const users = await User.aggregate([
        {
          $match: {
            email: queryValue
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1
          }
        }
      ]);
      res.locals.code = status.OK;
      res.locals.res_obj = { users };
      return next();
    } catch (error) {
      next(error);
    }
  }

  public static addUserDataToQuery = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) =>  {
    try {
      const usersList = req.body.users;
      const userId = req.user._id;
      const newList = await Promise.all(usersList.map(async (element) => {
        const chatUsers =  Object.keys(element.users);
        chatUsers.splice(chatUsers.indexOf(userId.toString()), 1);
        const differentUserInfo = await User.aggregate([
          {
            $match: {
              _id:  mongoose.Types.ObjectId(chatUsers[0])
            }
          },
          {
            $project: {
              name: 1,
              _id: 0
            }
          }
        ]);
        element.differentUser = differentUserInfo[0];
        return element;
      }));
      res.locals.code = status.OK;
      res.locals.res_obj = newList;
      return next();
    } catch (error) {
      next(error);
    }
  }
}
