/**
 * 拼车拼单 - 列表页
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { carpoolApi } from '@/api';
import type { CarpoolType, CarpoolQueryParams } from '@/types';

const CARPOOL_TYPES: { value: CarpoolType; label: string; icon: string }[] = [
  { value: 'CARPOOL', label: '拼车', icon: '🚗' },
  { value: 'FOOD_ORDER', label: '拼外卖', icon: '🍔' },
  { value: 'SHOPPING', label: '拼购物', icon: '🛍️' },
  { value: 'TICKET', label: '拼票', icon: '🎫' },
  { value: 'OTHER', label: '其他', icon: '📦' },
];

export default function CarpoolPage() {
  const [params, setParams] = useState<CarpoolQueryParams>({
    page: 1,
    limit: 20,
    status: 'OPEN',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['carpool', params],
    queryFn: () => carpoolApi.getCarpoolItems(params),
  });

  const items = data?.data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">🚗 拼车拼单</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">拼车出行，拼单优惠</p>
        </div>
        <Link to="/carpool/new" className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
          发起拼单
        </Link>
      </div>

      {/* 类型筛选 */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setParams({ ...params, type: undefined })}
          className={`whitespace-nowrap rounded-full px-4 py-2 ${!params.type ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>
          全部
        </button>
        {CARPOOL_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setParams({ ...params, type: type.value })}
            className={`whitespace-nowrap rounded-full px-4 py-2 ${params.type === type.value ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>
            {type.icon} {type.label}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {isLoading ? (
        <div className="text-center py-12">加载中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无拼单信息</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const typeInfo = CARPOOL_TYPES.find(t => t.value === item.type);
            const progress = item.totalSeats ? (item.occupiedSeats / item.totalSeats) * 100 : 0;
            
            return (
              <Link
                key={item.id}
                to={`/carpool/${item.id}`}
                className="rounded-lg border bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-900">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-2xl">{typeInfo?.icon}</span>
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${
                    item.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                    item.status === 'FULL' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {item.status === 'OPEN' ? '进行中' : item.status === 'FULL' ? '已满员' : '已结束'}
                  </span>
                </div>
                
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {item.title}
                </h3>
                
                <p className="mb-4 text-gray-600 dark:text-gray-400 line-clamp-2">
                  {item.description}
                </p>
                
                {item.type === 'CARPOOL' && item.departureLocation && item.arrivalLocation && (
                  <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                    <div>📍 {item.departureLocation} → {item.arrivalLocation}</div>
                    {item.departureTime && (
                      <div>🕐 {new Date(item.departureTime).toLocaleString()}</div>
                    )}
                  </div>
                )}
                
                {item.totalSeats && (
                  <div className="mb-2">
                    <div className="mb-1 flex justify-between text-sm">
                      <span>进度</span>
                      <span>{item.occupiedSeats}/{item.totalSeats} 人</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  {item.pricePerPerson && <span>💰 ¥{item.pricePerPerson}/人</span>}
                  <span>👁️ {item.viewCount}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

