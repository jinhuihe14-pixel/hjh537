
import { AuctionOrder } from '../../shared/types/game.js';
import { Player } from './PlayerManager.js';

export class AuctionManager {
  private orders: Map<string, AuctionOrder> = new Map();
  
  constructor() {
    this.initMockOrders();
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
  
  getOrders(page: number = 1, pageSize: number = 20): { orders: AuctionOrder[]; total: number } {
    const orderList = Array.from(this.orders.values())
      .filter(o => o.expireTime > Date.now())
      .sort((a, b) => b.timestamp - a.timestamp);
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    return {
      orders: orderList.slice(start, end),
      total: orderList.length,
    };
  }
  
  createOrder(sellerId: string, sellerName: string, itemId: number, quantity: number, price: number): AuctionOrder {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const order: AuctionOrder = {
      id: orderId,
      sellerId,
      sellerName,
      itemId,
      itemName: `物品_${itemId}`,
      quantity,
      price,
      expireTime: Date.now() + 3600000 * 48,
      timestamp: Date.now(),
    };
    
    this.orders.set(orderId, order);
    return order;
  }
  
  buyOrder(orderId: string, buyer: Player): boolean {
    const order = this.orders.get(orderId);
    if (!order) return false;
    if (order.expireTime < Date.now()) return false;
    if (buyer.data.gold < order.price) return false;
    
    buyer.addGold(-order.price);
    
    const seller = this.getSellerPlayer(order.sellerId);
    if (seller) {
      const fee = Math.floor(order.price * 0.05);
      seller.addGold(order.price - fee);
    }
    
    this.orders.delete(orderId);
    return true;
  }
  
  private getSellerPlayer(_sellerId: string): Player | null {
    return null;
  }
  
  getOrderCount(): number {
    return this.orders.size;
  }
}
