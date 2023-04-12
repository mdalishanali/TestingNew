import * as mongoose from 'mongoose';
import { FcmTokens } from '../../db';

import { PaginatedSearchQuery } from '../../interfaces/query';
import { FcmTokenInterface } from '../../interfaces/schemaInterface';

export class FcmTokensHelpers {
    public static findAll = async (query: PaginatedSearchQuery) => {
        const page = Number(query.page) || 1;
        const limit = Number(query.pageSize) || 50;
        const skips = (page - 1) * limit;
        return await FcmTokens.aggregate([
            {
              $match: {
                isDeleted: false
              }
            },
            {
              $facet: {
                data: [
                  {
                    $skip: skips,
                  },
                  {
                    $limit: limit,
                  },
                ],
                count: [
                  {
                    $count: 'count',
                  },
                ],
              },
            },
          ]);
    }
    public static findOne = async (id: string) => {
        return await FcmTokens
            .findById(id)
            .populate('');
    }
    public static findtoken = async (id: string, token: string) => {
      return await FcmTokens
          .find({ userId: mongoose.Types.ObjectId(id), token, isDeleted: false })
          .populate('');
  }
    public static create = async (document: FcmTokenInterface) => {
        return await FcmTokens
            .create(document);
      }
    public static getUserTokens = async (id: string) => {
        return await FcmTokens
            .find({ userId: id, isDeleted: false })
            .populate('');
    }
    public static findAndUpdate = async ({ id, update }: { id: string, update: FcmTokenInterface }) => {
        return await FcmTokens.findByIdAndUpdate(id, update, {
          new: true,
        }).populate('');
      }

    public static deleteToken = async (token: string, userId: string) => {
      const data =  await FcmTokens.updateOne({ token, userId }, { isDeleted: true });
      return { message: 'token deleted' };
    }
}
