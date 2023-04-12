export class ErrorService {
  constructor() {}

  public static handleError = ({ res, error }) => {
    res.error(error);
  }
}
