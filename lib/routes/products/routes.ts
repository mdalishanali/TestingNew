import { category, } from '../../../shared/enums/enum';
    // NPM Dependencies
    import * as status from 'http-status';
    import * as express from 'express';

    // Internal Dependencies
    import { ProductsHelpers } from './helpers';
    import { AuthenticatedRequest } from 'interfaces/authenticated-request';

    export class ProductsRoutes {
    
    public static get = async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const query = req.query;
    const user = req.user;
    const data = await ProductsHelpers.findAll(query, user);
        
const filter = [
  
      {
        fieldName:"name",
        filterType:"Search",
        
        collection:"Products"
      },
      {
        fieldName:"price",
        filterType:"Number",
        
        
      },
      {
        fieldName:"category",
        filterType:"Enum",
        filterOption:category,
        
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
      const data = await ProductsHelpers.findOne(id, companyId);
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
    const doc = await ProductsHelpers.findOne(id, req.user.companyId);
      ProductsHelpers.authenticate(doc, req.user);
    const data = await ProductsHelpers.findAndUpdate({ id, update });
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
    const data = await ProductsHelpers.create(document);
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
    const doc = await ProductsHelpers.findOne(id, user.companyId);
      ProductsHelpers.authenticate(doc, user);
    const data = ProductsHelpers.softDelete(id, user);
    res.locals.code = status.OK;
    res.locals.res_obj = { data };
    return next();
  } catch (error) {
    next(error);
  }
}
    }
    