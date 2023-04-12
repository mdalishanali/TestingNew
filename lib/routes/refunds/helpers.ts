// NPM Dependencies
import * as moment from 'moment';
import * as mongoose from 'mongoose';

// Internal Dependencies
import { Payment, Refund } from '../../db';
import { PaginatedSearchQuery } from '../../interfaces/query';

const ObjectId = mongoose.Types.ObjectId;

export class RefundHelpers {
    public static getAllRefunds = async (query: PaginatedSearchQuery, userId: string) => {
        const page = Number(query.page) || 1;
        const limit = Number(query.pageSize) || 50;
        const skips = (page - 1) * limit;
        const searchValue = query.searchValue;
        const matchObj: any = { user: ObjectId(userId) };
        if (Boolean(searchValue)) {
        matchObj.$text = { $search: searchValue };
        }
        const data = await Refund.aggregate([
        {
            $match: matchObj
        },
        {
            $sort: { createdAt: -1 }
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
        const processedData = data[0].data.map((item) => {
            const penny = 100;
            const numberAfterDecimal = 2;
            item.amount = Number((item.amount / penny).toFixed(numberAfterDecimal));
            item.formattedTime = moment(item.createdAt).format(
              'MMMM Do YYYY, h:mm:ss a'
            );
            return item;
          });

          data[0].data = processedData;

        return data;
    }
}
