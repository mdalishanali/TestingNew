
    // NPM Dependencies
    import * as status from 'http-status';
    import * as StandardError from 'standard-error';

    // Internal Dependencies
    import { Products } from '../../../db';
    export class ProductsHelpers {
      public static findOne = async (id: string) => {
        return await Products
          .findById(id)
          .populate('');
      };
      
    public static findAll = async (query) => {
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.pageSize) || 50;
      const skips = (page - 1) * limit;
      const searchValue = query.searchValue;
      const allFilter: any = {};
      const filter = query.filter;
      let applyFilter = [];
      
      const addToAllFilter = (query) => {
        if (allFilter['$and'] && allFilter['$and'].length) {
          allFilter['$and'] = [...allFilter['$and'], query]
        } else {
          allFilter['$and'] = [query]
        }
      }
      
    if (filter && Object.keys(filter).length) {
      const searchFilter = ["name"]
      searchFilter.forEach((key) => {
        if (filter[key]) {
          const data = {
            [key]: filter[key],
          };
          applyFilter.push(data);
        }
      });
    }
    
      if (filter?.price) {
        const query = numberQuery(filter.price,'price')
        query ? applyFilter.push(query):null;
      }
      
      if (applyFilter.length) {
        allFilter.$and = applyFilter
      }
      if (filter?.category?.length) {
        allFilter.category = {
          '$in': filter.category
        }
      }
      
    const matchQuery = {
      $match: allFilter
    }


      
const paginationQuery = {
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
        $count: "count",
      },
    ],
  },
}
    let aggregatePipeline = [
      
      
      matchQuery,
      
      paginationQuery
    ]
    
    if (searchValue.length) {
      const searchQuery = { $match: { $text: { $search: searchValue } } };
      aggregatePipeline = [searchQuery, ...aggregatePipeline]
    }
    const data = await  Products.aggregate(aggregatePipeline)
    return data;
  }
    public static findAndUpdate = async ({ id, update }) => {
  return await Products
        .findByIdAndUpdate(id, update, { new: true })
    .populate('');
}
public static create = async (document) => {
  return await Products
                .create(document);
};
public static softDelete = async (id) => {
  await Products
        .findByIdAndUpdate(id, { isVisible: false });
  return { del: 'ok' }
}
}
    
    const dateFilterQuery = (filter,key)=>{
      if (filter?.from && filter?.to) {
        const dateQuery = {
          [key]: {
            $gte: new Date(filter.from),
            $lt: new Date(filter.to)
          }
        }
        return dateQuery;
      }
    }
    
    const numberQuery = (filter, key) => {
      if (filter?.min && filter?.max) {
        const numberQuery = {
          [key]: {
            $gte: parseInt(filter.min),
            $lte: parseInt(filter.max),
          }
        }
        return numberQuery;
      }
    }
    
    const regexSearchQuery = (key, value) => {
      return { [key]: { $regex: '_*' + value + "_*", $options: "i" } }
    }
    