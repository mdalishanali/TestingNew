// Internal Dependencies
import { Refund } from '../../../db';
import { PaginatedSearchQuery } from '../../../interfaces/query';
import { RefundInterface } from '../../../interfaces/schemaInterface';

export class RefundHelpers {
  public static findOne = async (id: string) => {
    const data = await Refund.findById(id).populate('');
    return data;
  }

  public static findAll = async (query: PaginatedSearchQuery) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.pageSize) || 50;
    const skips = (page - 1) * limit;
    const searchValue = query.searchValue;
    const matchObj: { $text ?: { $search?: string } } = {};
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
      const numberAfterDecimal = 2;
      const penny = 100;
      item.amount = Number((item.amount / penny).toFixed(numberAfterDecimal));
      return item;
    });

    data[0].data = processedData;
    return data;
  }

  public static findAndUpdate = async ({ id, update }: {id: string, update: RefundInterface}) => {
    const data = await Refund.findByIdAndUpdate(id, update, { new: true }).populate(
      ''
    );
    return data;
  }

  public static create = async (document: RefundInterface) => {
    const data = await Refund.create(document);
    return data;
  }

  public static softDelete = async (id: string) => {
    const data = await Refund.findByIdAndUpdate(id, { isVisible: false });
    return data;
  }
}
