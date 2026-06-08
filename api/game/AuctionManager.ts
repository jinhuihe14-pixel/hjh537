
import {
  AuctionOrder,
  TradeRiskTag,
  TradeLimitConfig,
  PlayerTradeStats,
  TradeRecord,
  PriceHistory,
} from '../../shared/types/game.js';
import { Player } from './PlayerManager.js';

const TRADE_LIMIT_CONFIG: TradeLimitConfig = {
  itemDailyLimit: 100,
  itemDailyBuyLimit: 50,
  itemDailySellLimit: 50,
  accountDailyOrderLimit: 50,
  accountDailyBuyLimit: 30,
  accountDailySellLimit: 30,
  accountDailyTradeAmount: 100000,
  priceDeviationThreshold: 0.5,
  priceDeviationSoftThreshold: 0.5,
  priceDeviationHardThreshold: 1.0,
  studioBehaviorThreshold: {
    dailyTradeCount: 30,
    averageTradeSize: 5000,
    loginFrequency: 20,
    abnormalTradeRate: 0.3,
    goldAccumulationRate: 0.8,
  },
};

enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

interface ReviewOrder {
  order: AuctionOrder;
  status: ReviewStatus;
  submitTime: number;
  reviewer?: string;
  reviewTime?: number;
  reason?: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskTags: TradeRiskTag[];
}

interface RiskAccount {
  playerId: string;
  playerName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  detectedTime: number;
  tradeRestricted: boolean;
  restrictionEndTime?: number;
  notes?: string;
}

interface DailyItemCounts {
  date: string;
  buyCounts: Record<number, number>;
  sellCounts: Record<number, number>;
  dailyBuyCount: number;
  dailySellCount: number;
}

export class AuctionManager {
  private orders: Map<string, AuctionOrder> = new Map();
  private playerStats: Map<string, PlayerTradeStats> = new Map();
  private tradeRecords: TradeRecord[] = [];
  private priceHistories: Map<number, PriceHistory> = new Map();
  private maxRecords: number = 5000;
  private reviewOrders: Map<string, ReviewOrder> = new Map();
  private riskAccounts: Map<string, RiskAccount> = new Map();
  private dailyCounts: Map<string, DailyItemCounts> = new Map();

  constructor() {
    this.initMockOrders();
    this.initPriceHistories();
    this.initMockRiskAccounts();
  }

  private initMockOrders(): void {
    const mockOrders: AuctionOrder[] = [
      {
        id: 'order_1',
        sellerId: 'player_mock1',
        sellerName: '神剑骑士',
        itemId: 1002,
        itemName: '精钢长剑',
        quantity: 1,
        price: 500,
        expireTime: Date.now() + 3600000 * 12,
        timestamp: Date.now() - 3600000,
      },
      {
        id: 'order_2',
        sellerId: 'player_mock2',
        sellerName: '影子猎人',
        itemId: 2002,
        itemName: '锁子甲',
        quantity: 1,
        price: 800,
        expireTime: Date.now() + 3600000 * 8,
        timestamp: Date.now() - 7200000,
      },
      {
        id: 'order_3',
        sellerId: 'player_mock3',
        sellerName: '魔法学徒',
        itemId: 4003,
        itemName: '魔晶',
        quantity: 10,
        price: 200,
        expireTime: Date.now() + 3600000 * 24,
        timestamp: Date.now() - 1800000,
      },
    ];

    for (const order of mockOrders) {
      this.orders.set(order.id, order);
    }
  }

  private initPriceHistories(): void {
    const initialPrices: Record<number, { avg: number; min: number; max: number }> = {
      1001: { avg: 100, min: 80, max: 150 },
      1002: { avg: 500, min: 400, max: 650 },
      1003: { avg: 5000, min: 4000, max: 7000 },
      2001: { avg: 80, min: 60, max: 120 },
      2002: { avg: 800, min: 600, max: 1000 },
      3001: { avg: 20, min: 15, max: 30 },
      3002: { avg: 100, min: 80, max: 150 },
      3003: { avg: 25, min: 20, max: 35 },
      4001: { avg: 10, min: 5, max: 20 },
      4002: { avg: 15, min: 8, max: 25 },
      4003: { avg: 200, min: 150, max: 300 },
    };

    for (const [itemId, prices] of Object.entries(initialPrices)) {
      const id = parseInt(itemId);
      this.priceHistories.set(id, {
        itemId: id,
        averagePrice: prices.avg,
        minPrice: prices.min,
        maxPrice: prices.max,
        sampleCount: 50,
        lastUpdated: Date.now(),
        dailyPrices: [
          { date: this.getDateStr(-2), avgPrice: prices.avg * 0.95 },
          { date: this.getDateStr(-1), avgPrice: prices.avg * 0.98 },
          { date: this.getDateStr(0), avgPrice: prices.avg },
        ],
      });
    }
  }

  private initMockRiskAccounts(): void {
    this.riskAccounts.set('studio_bot_001', {
      playerId: 'studio_bot_001',
      playerName: '刷金小号001',
      riskLevel: 'high',
      tags: ['工作室嫌疑', '高频交易', '金币囤积'],
      detectedTime: Date.now() - 86400000 * 3,
      tradeRestricted: true,
      restrictionEndTime: Date.now() + 86400000 * 7,
      notes: '疑似工作室账号，单日交易次数异常',
    });
  }

  private getDateStr(daysOffset: number = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  }

  private getOrCreatePlayerStats(playerId: string): PlayerTradeStats {
    let stats = this.playerStats.get(playerId);
    const today = this.getDateStr();

    if (!stats) {
      stats = {
        playerId,
        dailyOrderCount: 0,
        dailyTradeAmount: 0,
        itemDailyCounts: {},
        lastResetDate: today,
        totalTrades: 0,
        riskScore: 0,
        isStudioSuspect: false,
      };
      this.playerStats.set(playerId, stats);
    }

    if (stats.lastResetDate !== today) {
      stats.dailyOrderCount = 0;
      stats.dailyTradeAmount = 0;
      stats.itemDailyCounts = {};
      stats.lastResetDate = today;
    }

    return stats;
  }

  private getOrCreateDailyCounts(playerId: string): DailyItemCounts {
    const today = this.getDateStr();
    let daily = this.dailyCounts.get(playerId);

    if (!daily || daily.date !== today) {
      daily = {
        date: today,
        buyCounts: {},
        sellCounts: {},
        dailyBuyCount: 0,
        dailySellCount: 0,
      };
      this.dailyCounts.set(playerId, daily);
    }

    return daily;
  }

  getOrders(
    page: number = 1,
    pageSize: number = 20,
    filters?: { itemId?: number; minPrice?: number; maxPrice?: number; sellerName?: string }
  ): { orders: AuctionOrder[]; total: number } {
    let orderList = Array.from(this.orders.values()).filter(
      (o) => o.expireTime > Date.now()
    );

    if (filters) {
      if (filters.itemId) {
        orderList = orderList.filter((o) => o.itemId === filters.itemId);
      }
      if (filters.minPrice !== undefined) {
        orderList = orderList.filter((o) => o.price >= filters.minPrice!);
      }
      if (filters.maxPrice !== undefined) {
        orderList = orderList.filter((o) => o.price <= filters.maxPrice!);
      }
      if (filters.sellerName) {
        orderList = orderList.filter((o) =>
          o.sellerName.includes(filters.sellerName!)
        );
      }
    }

    orderList.sort((a, b) => b.timestamp - a.timestamp);

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      orders: orderList.slice(start, end),
      total: orderList.length,
    };
  }

  createOrder(
    sellerId: string,
    sellerName: string,
    itemId: number,
    quantity: number,
    price: number,
    itemName?: string
  ): { success: boolean; order?: AuctionOrder; message?: string; riskTags?: TradeRiskTag[]; needReview?: boolean; reviewId?: string } {
    const riskAccount = this.riskAccounts.get(sellerId);
    if (riskAccount && riskAccount.tradeRestricted) {
      const restrictionEnd = riskAccount.restrictionEndTime;
      if (restrictionEnd && restrictionEnd > Date.now()) {
        return {
          success: false,
          message: '账号交易已被限制，请联系客服',
        };
      } else {
        riskAccount.tradeRestricted = false;
      }
    }

    const stats = this.getOrCreatePlayerStats(sellerId);
    const daily = this.getOrCreateDailyCounts(sellerId);

    if (stats.dailyOrderCount >= TRADE_LIMIT_CONFIG.accountDailyOrderLimit) {
      return {
        success: false,
        message: `今日上架次数已达上限 (${TRADE_LIMIT_CONFIG.accountDailyOrderLimit})`,
      };
    }

    const itemDailySellCount = daily.sellCounts[itemId] || 0;
    if (itemDailySellCount + quantity > TRADE_LIMIT_CONFIG.itemDailySellLimit) {
      return {
        success: false,
        message: `该物品今日出售数量已达上限 (${TRADE_LIMIT_CONFIG.itemDailySellLimit})`,
      };
    }

    if (daily.dailySellCount >= TRADE_LIMIT_CONFIG.accountDailySellLimit) {
      return {
        success: false,
        message: `今日出售次数已达上限 (${TRADE_LIMIT_CONFIG.accountDailySellLimit})`,
      };
    }

    const priceHistory = this.priceHistories.get(itemId);
    const riskTags: TradeRiskTag[] = [TradeRiskTag.NORMAL];
    let needReview = false;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    if (priceHistory) {
      const deviation = Math.abs(price - priceHistory.averagePrice) / priceHistory.averagePrice;
      
      if (deviation > TRADE_LIMIT_CONFIG.priceDeviationHardThreshold) {
        riskTags.push(TradeRiskTag.EXTREME_PRICE);
        riskLevel = 'high';
        needReview = true;
      } else if (deviation > TRADE_LIMIT_CONFIG.priceDeviationThreshold) {
        if (price > priceHistory.averagePrice) {
          riskTags.push(TradeRiskTag.HIGH_PRICE);
        } else {
          riskTags.push(TradeRiskTag.LOW_PRICE);
        }
        riskLevel = 'medium';
        needReview = true;
      }
    }

    if (stats.isStudioSuspect) {
      riskTags.push(TradeRiskTag.STUDIO_SUSPECT);
      riskLevel = 'high';
      needReview = true;
    }

    if (stats.totalTrades < 5) {
      riskTags.push(TradeRiskTag.FIRST_TRADE);
      if (priceHistory && price * quantity > priceHistory.averagePrice * 10) {
        riskLevel = 'medium';
        needReview = true;
      }
    }

    if (price * quantity > 50000) {
      riskTags.push(TradeRiskTag.HIGH_VALUE);
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const order: AuctionOrder = {
      id: orderId,
      sellerId,
      sellerName,
      itemId,
      itemName: itemName || `物品_${itemId}`,
      quantity,
      price,
      expireTime: Date.now() + 3600000 * 48,
      timestamp: Date.now(),
      riskTags,
    };

    if (needReview) {
      const reviewOrder: ReviewOrder = {
        order,
        status: ReviewStatus.PENDING,
        submitTime: Date.now(),
        riskLevel,
        riskTags,
      };
      this.reviewOrders.set(orderId, reviewOrder);
      return {
        success: true,
        order,
        riskTags,
        needReview: true,
        reviewId: orderId,
      };
    }

    this.orders.set(orderId, order);

    stats.dailyOrderCount++;
    stats.itemDailyCounts[itemId] = itemDailySellCount + quantity;
    daily.sellCounts[itemId] = itemDailySellCount + quantity;
    daily.dailySellCount++;

    this.updateStudioRiskScore(stats);

    return { success: true, order, riskTags, needReview: false };
  }

  buyOrder(
    orderId: string,
    buyer: Player
  ): { success: boolean; message?: string; tradeRecord?: TradeRecord; riskIntercepted?: boolean; needReview?: boolean } {
    const order = this.orders.get(orderId);
    if (!order) {
      const reviewOrder = this.reviewOrders.get(orderId);
      if (reviewOrder && reviewOrder.status === ReviewStatus.PENDING) {
        return { success: false, message: '订单正在审核中，暂时无法购买' };
      }
      return { success: false, message: '订单不存在' };
    }
    if (order.expireTime < Date.now()) return { success: false, message: '订单已过期' };
    if (buyer.data.gold < order.price * order.quantity) {
      return { success: false, message: '金币不足' };
    }
    if (order.sellerId === buyer.id) {
      return { success: false, message: '不能购买自己的订单' };
    }

    const buyerRiskAccount = this.riskAccounts.get(buyer.id);
    if (buyerRiskAccount && buyerRiskAccount.tradeRestricted) {
      if (buyerRiskAccount.restrictionEndTime && buyerRiskAccount.restrictionEndTime > Date.now()) {
        return { success: false, message: '账号交易已被限制，请联系客服' };
      }
    }

    const buyerStats = this.getOrCreatePlayerStats(buyer.id);
    const sellerStats = this.getOrCreatePlayerStats(order.sellerId);
    const buyerDaily = this.getOrCreateDailyCounts(buyer.id);
    const totalAmount = order.price * order.quantity;

    if (buyerStats.dailyTradeAmount + totalAmount > TRADE_LIMIT_CONFIG.accountDailyTradeAmount) {
      return {
        success: false,
        message: `今日交易额已达上限 (${TRADE_LIMIT_CONFIG.accountDailyTradeAmount})`,
      };
    }

    if (buyerDaily.dailyBuyCount >= TRADE_LIMIT_CONFIG.accountDailyBuyLimit) {
      return {
        success: false,
        message: `今日购买次数已达上限 (${TRADE_LIMIT_CONFIG.accountDailyBuyLimit})`,
      };
    }

    const itemDailyBuyCount = buyerDaily.buyCounts[order.itemId] || 0;
    if (itemDailyBuyCount + order.quantity > TRADE_LIMIT_CONFIG.itemDailyBuyLimit) {
      return {
        success: false,
        message: `该物品今日购买数量已达上限 (${TRADE_LIMIT_CONFIG.itemDailyBuyLimit})`,
      };
    }

    const priceHistory = this.priceHistories.get(order.itemId);
    let historicalAveragePrice = 0;
    let priceDeviationPercent = 0;
    const riskTags: TradeRiskTag[] = [TradeRiskTag.NORMAL];
    let needReview = false;

    if (priceHistory) {
      historicalAveragePrice = priceHistory.averagePrice;
      priceDeviationPercent =
        ((order.price - priceHistory.averagePrice) / priceHistory.averagePrice) * 100;

      const deviation = Math.abs(order.price - priceHistory.averagePrice) / priceHistory.averagePrice;
      
      if (deviation > TRADE_LIMIT_CONFIG.priceDeviationHardThreshold) {
        riskTags.push(TradeRiskTag.EXTREME_PRICE);
        riskTags.push(TradeRiskTag.MANUAL_REVIEW);
        needReview = true;

        return {
          success: false,
          message: '价格偏离过大，交易已被风控拦截，进入人工审核',
          riskIntercepted: true,
          needReview: true,
        };
      } else if (deviation > TRADE_LIMIT_CONFIG.priceDeviationThreshold) {
        if (order.price > priceHistory.averagePrice) {
          riskTags.push(TradeRiskTag.HIGH_PRICE);
        } else {
          riskTags.push(TradeRiskTag.LOW_PRICE);
        }
        riskTags.push(TradeRiskTag.MANUAL_REVIEW);
      }
    }

    if (sellerStats.isStudioSuspect || buyerStats.isStudioSuspect) {
      riskTags.push(TradeRiskTag.STUDIO_SUSPECT);
    }

    if (buyerDaily.dailyBuyCount > TRADE_LIMIT_CONFIG.studioBehaviorThreshold.dailyTradeCount * 0.7) {
      riskTags.push(TradeRiskTag.FREQUENT_TRADE);
    }

    if (totalAmount > 50000) {
      riskTags.push(TradeRiskTag.HIGH_VALUE);
    }

    const seller = this.getSellerPlayer(order.sellerId);

    if (seller) {
      seller.addGold(totalAmount);
    }

    buyer.addGold(-totalAmount);

    buyerStats.dailyTradeAmount += totalAmount;
    buyerStats.dailyOrderCount++;
    buyerStats.totalTrades++;
    sellerStats.dailyOrderCount++;
    sellerStats.totalTrades++;

    buyerDaily.buyCounts[order.itemId] = itemDailyBuyCount + order.quantity;
    buyerDaily.dailyBuyCount++;

    this.updateStudioRiskScore(buyerStats);
    this.updateStudioRiskScore(sellerStats);

    this.checkStudioDetection(buyer.id, buyerStats);
    this.checkStudioDetection(order.sellerId, sellerStats);

    if (priceHistory) {
      this.updatePriceHistory(order.itemId, order.price);
    }

    const tradeRecord: TradeRecord = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: order.id,
      sellerId: order.sellerId,
      sellerName: order.sellerName,
      buyerId: buyer.id,
      buyerName: buyer.data.name,
      itemId: order.itemId,
      itemName: order.itemName,
      quantity: order.quantity,
      price: order.price,
      totalAmount,
      timestamp: Date.now(),
      riskTags,
      historicalAveragePrice,
      priceDeviationPercent,
    };

    this.tradeRecords.push(tradeRecord);
    if (this.tradeRecords.length > this.maxRecords) {
      this.tradeRecords.shift();
    }

    this.orders.delete(orderId);

    return { success: true, tradeRecord, needReview };
  }

  private updatePriceHistory(itemId: number, tradePrice: number): void {
    const history = this.priceHistories.get(itemId);
    if (!history) {
      this.priceHistories.set(itemId, {
        itemId,
        averagePrice: tradePrice,
        minPrice: tradePrice,
        maxPrice: tradePrice,
        sampleCount: 1,
        lastUpdated: Date.now(),
        dailyPrices: [{ date: this.getDateStr(), avgPrice: tradePrice }],
      });
      return;
    }

    const newSampleCount = history.sampleCount + 1;
    history.averagePrice =
      (history.averagePrice * history.sampleCount + tradePrice) / newSampleCount;
    history.minPrice = Math.min(history.minPrice, tradePrice);
    history.maxPrice = Math.max(history.maxPrice, tradePrice);
    history.sampleCount = newSampleCount;
    history.lastUpdated = Date.now();

    const today = this.getDateStr();
    const todayPrice = history.dailyPrices.find((d) => d.date === today);
    if (todayPrice) {
      todayPrice.avgPrice = (todayPrice.avgPrice * 0.7 + tradePrice * 0.3);
    } else {
      history.dailyPrices.push({ date: today, avgPrice: tradePrice });
      if (history.dailyPrices.length > 30) {
        history.dailyPrices.shift();
      }
    }
  }

  private updateStudioRiskScore(stats: PlayerTradeStats): void {
    let score = 0;

    if (stats.dailyOrderCount > TRADE_LIMIT_CONFIG.studioBehaviorThreshold.dailyTradeCount) {
      score += 30;
    } else if (stats.dailyOrderCount > TRADE_LIMIT_CONFIG.studioBehaviorThreshold.dailyTradeCount * 0.6) {
      score += 15;
    }

    if (stats.totalTrades > 100) {
      score += 20;
    } else if (stats.totalTrades > 50) {
      score += 10;
    }

    const avgTradeSize = stats.dailyOrderCount > 0
      ? stats.dailyTradeAmount / stats.dailyOrderCount
      : 0;
    if (avgTradeSize > TRADE_LIMIT_CONFIG.studioBehaviorThreshold.averageTradeSize) {
      score += 25;
    } else if (avgTradeSize > TRADE_LIMIT_CONFIG.studioBehaviorThreshold.averageTradeSize * 0.5) {
      score += 12;
    }

    if (stats.dailyTradeAmount > TRADE_LIMIT_CONFIG.accountDailyTradeAmount * 0.7) {
      score += 15;
    }

    stats.riskScore = Math.min(100, score);
    stats.isStudioSuspect = stats.riskScore >= 60;
  }

  private checkStudioDetection(playerId: string, stats: PlayerTradeStats): void {
    if (stats.isStudioSuspect && !this.riskAccounts.has(playerId)) {
      const riskAccount: RiskAccount = {
        playerId,
        playerName: playerId,
        riskLevel: stats.riskScore >= 80 ? 'high' : 'medium',
        tags: ['工作室嫌疑'],
        detectedTime: Date.now(),
        tradeRestricted: stats.riskScore >= 90,
        notes: `风险评分: ${stats.riskScore}`,
      };
      this.riskAccounts.set(playerId, riskAccount);
    }
  }

  getPriceHistory(itemId: number): PriceHistory | undefined {
    return this.priceHistories.get(itemId);
  }

  getPlayerTradeStats(playerId: string): PlayerTradeStats {
    return this.getOrCreatePlayerStats(playerId);
  }

  getTradeRecords(
    filters?: {
      playerId?: string;
      itemId?: number;
      riskTag?: TradeRiskTag;
      startTime?: number;
      endTime?: number;
      minAmount?: number;
      maxAmount?: number;
    },
    limit: number = 50
  ): TradeRecord[] {
    let records = [...this.tradeRecords];

    if (filters) {
      if (filters.playerId) {
        records = records.filter(
          (r) => r.buyerId === filters.playerId || r.sellerId === filters.playerId
        );
      }
      if (filters.itemId) {
        records = records.filter((r) => r.itemId === filters.itemId);
      }
      if (filters.riskTag) {
        records = records.filter((r) => r.riskTags.includes(filters.riskTag!));
      }
      if (filters.startTime) {
        records = records.filter((r) => r.timestamp >= filters.startTime!);
      }
      if (filters.endTime) {
        records = records.filter((r) => r.timestamp <= filters.endTime!);
      }
      if (filters.minAmount !== undefined) {
        records = records.filter((r) => r.totalAmount >= filters.minAmount!);
      }
      if (filters.maxAmount !== undefined) {
        records = records.filter((r) => r.totalAmount <= filters.maxAmount!);
      }
    }

    return records.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  getReviewOrders(status?: ReviewStatus, limit: number = 50): ReviewOrder[] {
    let orders = Array.from(this.reviewOrders.values());
    if (status) {
      orders = orders.filter((o) => o.status === status);
    }
    return orders.sort((a, b) => b.submitTime - a.submitTime).slice(0, limit);
  }

  reviewOrder(
    orderId: string,
    reviewer: string,
    decision: 'approve' | 'reject',
    reason?: string
  ): { success: boolean; message?: string; order?: AuctionOrder } {
    const reviewOrder = this.reviewOrders.get(orderId);
    if (!reviewOrder) {
      return { success: false, message: '审核订单不存在' };
    }
    if (reviewOrder.status !== ReviewStatus.PENDING) {
      return { success: false, message: '订单已审核' };
    }

    reviewOrder.reviewer = reviewer;
    reviewOrder.reviewTime = Date.now();
    reviewOrder.reason = reason;

    if (decision === 'approve') {
      reviewOrder.status = ReviewStatus.APPROVED;
      this.orders.set(orderId, reviewOrder.order);
      return { success: true, order: reviewOrder.order };
    } else {
      reviewOrder.status = ReviewStatus.REJECTED;
      return { success: true };
    }
  }

  getRiskAccounts(
    filters?: { riskLevel?: string; tradeRestricted?: boolean },
    limit: number = 50
  ): RiskAccount[] {
    let accounts = Array.from(this.riskAccounts.values());

    if (filters) {
      if (filters.riskLevel) {
        accounts = accounts.filter((a) => a.riskLevel === filters.riskLevel);
      }
      if (filters.tradeRestricted !== undefined) {
        accounts = accounts.filter((a) => a.tradeRestricted === filters.tradeRestricted);
      }
    }

    return accounts.sort((a, b) => b.detectedTime - a.detectedTime).slice(0, limit);
  }

  restrictAccount(
    playerId: string,
    restricted: boolean,
    durationMs?: number,
    notes?: string
  ): { success: boolean; account?: RiskAccount } {
    const account = this.riskAccounts.get(playerId);
    if (!account) {
      return { success: false };
    }

    account.tradeRestricted = restricted;
    if (restricted && durationMs) {
      account.restrictionEndTime = Date.now() + durationMs;
    }
    if (notes) {
      account.notes = (account.notes || '') + `; ${notes}`;
    }

    return { success: true, account };
  }

  private getSellerPlayer(_sellerId: string): Player | null {
    return null;
  }

  getOrderCount(): number {
    return this.orders.size;
  }

  getTradeLimitConfig(): TradeLimitConfig {
    return { ...TRADE_LIMIT_CONFIG };
  }

  getReviewOrderCount(status?: ReviewStatus): number {
    if (status) {
      return Array.from(this.reviewOrders.values()).filter((o) => o.status === status).length;
    }
    return this.reviewOrders.size;
  }

  getRiskAccountCount(): number {
    return this.riskAccounts.size;
  }
}

export default AuctionManager;
