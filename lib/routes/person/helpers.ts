
      // NPM Dependencies
      import * as status from 'http-status';
      import * as StandardError from 'standard-error';

      // Internal Dependencies
      import { Person } from '../../db';
      export class PersonHelpers {
    
      public static findOne = async (id: string, companyId: string) => {
        return await Person
          .findOne({ _id: id, companyId })
          .populate('');
      };
      
    public static findAll = async (query,user) => {
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
      const searchFilter = ["name","areaType"]
      searchFilter.forEach((key) => {
        if (filter[key]) {
          const data = {
            [key]: filter[key],
          };
          applyFilter.push(data);
        }
      });
      const booleanFilter = ["isAgree"]
        booleanFilter.forEach((key) => {
        if (filter[key]) {
          const data = {
            [key]: filter[key]==='true',
          };
          applyFilter.push(data);
        }
      });
      
    }
    
      if (filter?.dob) {
        const query = dateFilterQuery(filter.dob,'dob')
        query ? applyFilter.push(query):null;
      }
      
      if (filter?.pinCode) {
        const query = numberQuery(filter.pinCode,'pinCode')
        query ? applyFilter.push(query):null;
      }
      
      if (applyFilter.length) {
        allFilter.$and = applyFilter
      }
      if (filter?.gender?.length) {
        allFilter.gender = {
          '$in': filter.gender
        }
      }
      
      if (filter?.skills?.length) {
        allFilter.skills = {
          '$in': filter.skills
        }
      }
      
      if (filter?.food?.length) {
        allFilter.food = {
          '$in': filter.food
        }
      }
      
    const matchQuery = {
      $match: allFilter
    }
    if (user.roles === 'Admin') {
      allFilter['companyId'] = user.companyId._id;
    } else {
      allFilter['userId'] = user._id;
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
    const data = await  Person.aggregate(aggregatePipeline)
    return data;
  }
    public static findAndUpdate = async ({ id, update }) => {
  return await Person
        .findByIdAndUpdate(id, update, { new: true })
    .populate('');
}
public static create = async (document) => {
  return await Person
                .create(document);
};
public static softDelete = async (id, user) => {
  const data = await Person
        .findByIdAndUpdate(id, { isVisible: false }).setOptions({
    deleteOperation: true,
    user,
  });
  return data
}
public static authenticate = (doc, user) => {
        if (doc.companyId.toString() !== user.companyId._id.toString()) {
          throw new StandardError({ message: 'This document does not belong to the user', code: status.UNAUTHORIZED })
        }
      }}
    
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
    