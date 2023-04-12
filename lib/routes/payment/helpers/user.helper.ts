// NPM Dependencies
import * as status from "http-status";
import { User } from '../../../db'
import * as StandardError from "standard-error";


// Internal Dependencies
export class UsersHelpers {
  public static findOne = async (id: string) => {
    return await User.findById(id).populate("");
  };
  public static findAll = async (query) => {
    return await User.find(query).populate("");
  };
  public static findAndUpdate = async ({ id, update }) => {
    return await User.findByIdAndUpdate(id, update, { new: true });
  };
  public static create = async (document) => {
    return await User.create(document);
  };
  public static hardDelete = async (id) => {
    return await User.findByIdAndRemove(id)
  };
  public static renewSubscription = async ({ id, endDate }) => {
    await User
      .findByIdAndUpdate(id, { 'subscriptionActiveUntil': endDate }, { new: true, context: 'query' });
  }
}
