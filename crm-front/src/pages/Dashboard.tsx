import {
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import {
  useGetSalesLast7DaysQuery,
  useGetSummaryStatsQuery,
} from "../store/api/statistics";
import { useGetOrdersQuery } from "../store/api/orders";

export default function Dashboard() {
  const { data: stats, isFetching, refetch } = useGetSummaryStatsQuery();
  const {
    data: sales,
    isFetching: salesIsFetching,
    refetch: salesRefetch,
  } = useGetSalesLast7DaysQuery();
  const {
    data: orders,
    isFetching: ordersIsFetching,
    refetch: ordersRefetch,
  } = useGetOrdersQuery({ page: 1, limit: 5, searchQuery: "" });

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-4 rounded-lg ${color}`}>
          <Icon size={28} className="text-white" />
        </div>
      </div>
    </div>
  );

  const maxSales = sales
    ? Math.max(...sales.salesByDay.map((d) => d.amount), 1)
    : 1;

  if (isFetching || salesIsFetching || ordersIsFetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const reload = async () => {
    await Promise.all([refetch(), salesRefetch(), ordersRefetch()]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Панель управління</h1>
        <button
          onClick={reload}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Оновити
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Всього клієнтів"
          value={stats?.totalCustomers}
          color="bg-blue-500"
        />
        <StatCard
          icon={Package}
          label="Товарів в каталозі"
          value={stats?.totalProducts}
          color="bg-purple-500"
        />
        <StatCard
          icon={ShoppingCart}
          label="Замовлень"
          value={stats?.totalOrders}
          color="bg-green-500"
        />
        <StatCard
          icon={DollarSign}
          label="Загальний дохід"
          value={`${stats?.totalRevenue.toFixed(2)} ₴`}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">
              Продажі за останні 7 днів
            </h2>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {sales &&
              sales.salesByDay.map((day, idx) => {
                const height = (day.amount / maxSales) * 100;
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div className="relative w-full" style={{ height: "100%" }}>
                      <div className="absolute bottom-0 w-full group">
                        <div
                          className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-700 hover:to-blue-500"
                          style={{
                            height: `${height}px`,
                            minHeight: day.amount > 0 ? "8px" : "2px",
                          }}
                        />
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.amount.toFixed(2)} ₴
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600">
                      {new Date(day.date).toLocaleDateString("uk-UA", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Останні замовлення
          </h2>
          <div className="space-y-3">
            {!orders || orders.data.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Немає замовлень</p>
            ) : (
              orders.data.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {order.customer_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString("uk-UA")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {order.total_amount.toFixed(2)} ₴
                    </p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : order.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {order.status === "completed"
                        ? "Виконано"
                        : order.status === "pending"
                        ? "В обробці"
                        : "Скасовано"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
