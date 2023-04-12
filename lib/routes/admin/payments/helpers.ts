import { Payment, Refund } from '../../../db';
import * as moment from 'moment';
import { PaginatedSearchQuery } from '../../../interfaces/query';

export interface RefundData  {
  user?: string;
  paymentId ?: string;
  charge ?: string;
  status ?: string;
  created ?: number;
  id ?: string;
  reason?: string;
  amount ?: number;
  currency ?: string;
}

interface PayementsQuery extends PaginatedSearchQuery {
  dateFrom?: string;
  dateTo?: string;
}

export class PaymentHelpers {
  public static getAllPayments = async (query: PayementsQuery) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.pageSize) || 50;
    const skips = (page - 1) * limit;
    const searchValue = query.searchValue;
    const matchObj: { $text ?: { $search?: string }, createdAt?: { $gte?: Date, $lt?: Date } } = {};
    if (Boolean(searchValue)) {
      matchObj.$text = { $search: searchValue };
    }
    if (Boolean(query.dateFrom) && Boolean(query.dateTo)) {
      matchObj.createdAt = { $gte: new Date(query.dateFrom), $lt: new Date(query.dateTo) };
    }
    const data = await Payment.aggregate([
      {
        $match: matchObj
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData',
        },
      },
      {
        $lookup: {
          from: 'refunds',
          localField: '_id',
          foreignField: 'paymentId',
          as: 'refunds',
        },
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
      item.amount = (item.amount / penny).toFixed(numberAfterDecimal);
      item.userName = `${item.userData[0].name.first} ${item.userData[0].name.last}`;
      item.epochTime = moment(item.createdAt).valueOf();
      delete item.userData;
      item.refunds = item.refunds.map((refund) => {
        refund.amount = (refund.amount / penny).toFixed(numberAfterDecimal);
        refund.epochTime = moment(refund.createdAt).valueOf();
        return refund;
      });
      return item;
    });

    data[0].data = processedData;

    return data;
  }

  public static getPaymentById = async (id: string) => {
    const data = await Payment.findById(id);
    return data;
  }

  public static createRefund = async (redundData: RefundData) => {
    const refundObj = {
      paymentId: redundData.paymentId,
      chargeId: redundData.charge,
      status: redundData.status,
      created: redundData.created,
      refundId: redundData.id,
      reason: redundData.reason,
      amount: redundData.amount,
      currency: redundData.currency,
      user: redundData.user
    };

    const data = await Refund.create(refundObj);
    return data;
  }
}
