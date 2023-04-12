// NPM Dependencies
import * as status from "http-status";
import { User } from '../../../db'
import * as StandardError from "standard-error";


// Internal Dependencies
export class UsersHelpers {
  public static findOne = async (id: string) => {
    return await User.findById(id).populate("");
  };
}
