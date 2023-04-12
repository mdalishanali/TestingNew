// Internal Dependencies
import { User as users } from '../../../db';
export class AdminUsersHelpers {
  public static findAll = async ({ page, limit, searchValue }: { page?: number, limit?: number, searchValue?: string }) => {
    const skip = (page - 1) * limit;
    const limits = Number(limit);

    if (searchValue.length) {
      return await users.aggregate([
        {
          $match: {
            $text: { $search: searchValue },
          },
        },
        {
          $facet: {
            data: [
              {
                $skip: skip,
              },
              {
                $limit: limits,
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
    } else {
      return await users.aggregate([
        {
          $facet: {
            data: [
              {
                $skip: skip,
              },
              {
                $limit: limits,
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
  }

  public static findOne = async (id: string) => {
    return await users.findById(id);
  }
}
