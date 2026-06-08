
import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ITEMS } from '../../data/gameData';
import { ItemRarity, ItemType } from '../../types/game';

const InventoryPanel: React.FC = () => {
  const { showInventory, toggleInventory, inventory, inventorySize, useItem } = useGameStore();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [currentTab, setCurrentTab] = useState<'all' | 'equip' | 'consumable' | 'material'>('all');
  
  if (!showInventory) return null;
  
  const getRarityColor = (rarity: ItemRarity): string => {
    switch (rarity) {
      case ItemRarity.COMMON: return 'text-gray-300 border-gray-500';
      case ItemRarity.UNCOMMON: return 'text-green-400 border-green-500';
      case ItemRarity.RARE: return 'text-blue-400 border-blue-500';
      case ItemRarity.EPIC: return 'text-purple-400 border-purple-500';
      case ItemRarity.LEGENDARY: return 'text-amber-400 border-amber-500';
      default: return 'text-gray-300 border-gray-500';
    }
  };
  
  const getRarityBg = (rarity: ItemRarity): string => {
    switch (rarity) {
      case ItemRarity.COMMON: return 'from-gray-800 to-gray-900';
      case ItemRarity.UNCOMMON: return 'from-green-900/50 to-gray-900';
      case ItemRarity.RARE: return 'from-blue-900/50 to-gray-900';
      case ItemRarity.EPIC: return 'from-purple-900/50 to-gray-900';
      case ItemRarity.LEGENDARY: return 'from-amber-900/50 to-gray-900';
      default: return 'from-gray-800 to-gray-900';
    }
  };
  
  const filterInventory = (): number[] => {
    const indices: number[] = [];
    for (let i = 0; i < inventory.length; i++) {
      const slot = inventory[i];
      if (slot.itemId === 0) {
        indices.push(i);
        continue;
      }
      
      const item = ITEMS[slot.itemId];
      if (!item) {
        indices.push(i);
        continue;
      }
      
      if (currentTab === 'all') {
        indices.push(i);
      } else if (currentTab === 'equip') {
        if ([ItemType.WEAPON, ItemType.ARMOR, ItemType.HELMET, ItemType.BOOTS, ItemType.ACCESSORY].includes(item.type)) {
          indices.push(i);
        }
      } else if (currentTab === 'consumable') {
        if (item.type === ItemType.CONSUMABLE) {
          indices.push(i);
        }
      } else if (currentTab === 'material') {
        if (item.type === ItemType.MATERIAL) {
          indices.push(i);
        }
      }
    }
    return indices;
  };
  
  const filteredSlots = filterInventory();
  const selectedItem = selectedSlot !== null && inventory[selectedSlot]?.itemId ? ITEMS[inventory[selectedSlot].itemId] : null;
  
  const handleUseItem = () => {
    if (selectedSlot !== null) {
      useItem(selectedSlot);
      setSelectedSlot(null);
    }
  };
  
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/60" onClick={toggleInventory} />
      
      <div className="relative w-[720px] h-[500px] bg-gradient-to-br from-gray-900 to-gray-950 rounded-lg border-2 border-amber-600/70 shadow-2xl shadow-black/50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-600/50 bg-gradient-to-r from-amber-900/30 to-transparent">
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <span>📦</span>
            背包
          </h2>
          <button
            onClick={toggleInventory}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700/50 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex gap-4 p-4 flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col">
            <div className="flex gap-1 mb-3">
              {[
                { key: 'all', label: '全部' },
                { key: 'equip', label: '装备' },
                { key: 'consumable', label: '消耗品' },
                { key: 'material', label: '材料' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setCurrentTab(tab.key as typeof currentTab)}
                  className={`px-3 py-1.5 text-sm rounded-t transition-colors ${
                    currentTab === tab.key
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="flex-1 bg-gray-800/50 rounded-lg p-3 border border-gray-700 overflow-y-auto">
              <div className="grid grid-cols-6 gap-2">
                {filteredSlots.slice(0, 30).map((slotIndex) => {
                  const slot = inventory[slotIndex];
                  const item = slot.itemId ? ITEMS[slot.itemId] : null;
                  
                  return (
                    <button
                      key={slotIndex}
                      onClick={() => setSelectedSlot(slotIndex)}
                      className={`aspect-square rounded-lg border-2 flex items-center justify-center relative transition-all ${
                        selectedSlot === slotIndex
                          ? 'border-amber-400 bg-amber-900/30 scale-105'
                          : item
                          ? `border-gray-600 hover:border-gray-400 bg-gradient-to-br ${getRarityBg(item.rarity)}`
                          : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                      }`}
                    >
                      {item && (
                        <>
                          <span className="text-2xl">{item.icon}</span>
                          {slot.quantity > 1 && (
                            <span className="absolute bottom-0.5 right-1 text-xs font-bold text-white drop-shadow-lg">
                              {slot.quantity}
                            </span>
                          )}
                          {slot.bound && (
                            <span className="absolute top-0.5 left-0.5 text-[8px] text-red-400">
                              绑
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-3 flex items-center justify-between text-sm text-gray-400">
              <span>容量：{inventory.filter(s => s.itemId > 0).length} / {inventorySize}</span>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-gray-700 rounded">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1 hover:bg-gray-700 rounded">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="w-56 bg-gray-800/50 rounded-lg p-3 border border-gray-700 flex flex-col">
            {selectedItem ? (
              <>
                <div className="text-center mb-3">
                  <div className="text-4xl mb-2">{selectedItem.icon}</div>
                  <h3 className={`font-bold ${getRarityColor(selectedItem.rarity)}`}>
                    {selectedItem.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedItem.type === ItemType.WEAPON && '武器'}
                    {selectedItem.type === ItemType.ARMOR && '护甲'}
                    {selectedItem.type === ItemType.HELMET && '头盔'}
                    {selectedItem.type === ItemType.BOOTS && '靴子'}
                    {selectedItem.type === ItemType.ACCESSORY && '饰品'}
                    {selectedItem.type === ItemType.CONSUMABLE && '消耗品'}
                    {selectedItem.type === ItemType.MATERIAL && '材料'}
                  </p>
                </div>
                
                <div className="flex-1 text-sm space-y-2">
                  <p className="text-gray-300 text-xs">{selectedItem.description}</p>
                  
                  {selectedItem.stats && (
                    <div className="space-y-1 pt-2 border-t border-gray-700">
                      {selectedItem.stats.attack && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">攻击力</span>
                          <span className="text-green-400">+{selectedItem.stats.attack}</span>
                        </div>
                      )}
                      {selectedItem.stats.defense && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">防御力</span>
                          <span className="text-green-400">+{selectedItem.stats.defense}</span>
                        </div>
                      )}
                      {selectedItem.stats.health && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">生命值</span>
                          <span className="text-green-400">+{selectedItem.stats.health}</span>
                        </div>
                      )}
                      {selectedItem.stats.mana && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">魔法值</span>
                          <span className="text-green-400">+{selectedItem.stats.mana}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedItem.levelReq && (
                    <div className="pt-2 border-t border-gray-700">
                      <span className="text-gray-400 text-xs">需要等级：</span>
                      <span className="text-amber-400 text-xs">{selectedItem.levelReq}</span>
                    </div>
                  )}
                  
                  {selectedItem.tradable && (
                    <div className="text-xs text-green-400">可交易</div>
                  )}
                </div>
                
                <div className="space-y-2 mt-3">
                  {selectedItem.type === ItemType.CONSUMABLE && (
                    <button
                      onClick={handleUseItem}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded transition-colors text-sm font-bold"
                    >
                      使用
                    </button>
                  )}
                  {selectedItem.tradable && (
                    <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors text-sm">
                      上架拍卖
                    </button>
                  )}
                  <button className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors text-sm">
                    丢弃
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                选择物品查看详情
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryPanel;
