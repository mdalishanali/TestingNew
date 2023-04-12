import { gender,skills,foods, } from '../../../shared/enums/enum';
    // NPM Dependencies
    import * as status from 'http-status';
    import * as express from 'express';

    // Internal Dependencies
    import { PersonHelpers } from './helpers';
    import { AuthenticatedRequest } from 'interfaces/authenticated-request';

    export class PersonRoutes {
    
    public static get = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const query = req.query;
    const user = req.user;
    const data = await PersonHelpers.findAll(query, user);
        
const filter = [
  
      {
        fieldName:"name",
        filterType:"Search",
        
        collection:"Person"
      },
      {
        fieldName:"pinCode",
        filterType:"Number",
        
        
      },
      {
        fieldName:"gender",
        filterType:"Enum",
        filterOption:gender,
        
      },
      {
        fieldName:"skills",
        filterType:"Enum",
        filterOption:skills,
        
      },
      {
        fieldName:"food",
        filterType:"Enum",
        filterOption:foods,
        
      },
      {
        fieldName:"areaType",
        filterType:"Search",
        
        collection:"Person"
      },
      {
        fieldName:"dob",
        filterType:"Date",
        
        
      },
      {
        fieldName:"isAgree",
        filterType:"Boolean",
        
        
      }
]

    res.locals.code = status.OK;
    res.locals.res_obj = { data,filter }
    return next();
  } catch (error) {
    next(error);
  }
}
    public static getOne = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const id = req.params.id;
    
      const companyId = req.user.companyId
      const data = await PersonHelpers.findOne(id, companyId);
    res.locals.code = status.OK;
    res.locals.res_obj = { data };
    return next();
  } catch (error) {
    next(error);
  }
}
    public static update = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const id = req.params.id;
    const update = req.body.update;
    const doc = await PersonHelpers.findOne(id, req.user.companyId);
      PersonHelpers.authenticate(doc, req.user);
    const data = await PersonHelpers.findAndUpdate({ id, update });
    res.locals.code = status.OK;
    res.locals.res_obj = { data };
    return next();
  } catch (error) {
    next(error);
  }
}
    public static create = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const document = req.body.document;
     document.companyId = req.user.companyId;
    document.userId = req.user._id;
    const data = await PersonHelpers.create(document);
    res.locals.code = status.OK;
    res.locals.res_obj = { data };
    return next();
  } catch (error) {
    next(error);
  }
}
    public static delete = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const id = req.params.id;
    const user = req.user
    const doc = await PersonHelpers.findOne(id, user.companyId);
      PersonHelpers.authenticate(doc, user);
    const data = PersonHelpers.softDelete(id, user);
    res.locals.code = status.OK;
    res.locals.res_obj = { data };
    return next();
  } catch (error) {
    next(error);
  }
}
    }
    