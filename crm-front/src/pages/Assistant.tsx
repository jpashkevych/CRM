import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User} from 'lucide-react';
import { useGetSummaryStatsQuery, useGetAdditionalStatsQuery } from '../store/api/statistics';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}


export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Вітаю! Я ваш AI-асистент для CRM-системи. Можу допомогти з аналітикою продажів, статистикою клієнтів, управлінням товарами та багато іншим. Як можу допомогти?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
    const { data: stats, refetch } = useGetSummaryStatsQuery();
const { data: addStats, refetch: refetchAdd } = useGetAdditionalStatsQuery();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  
  const generateResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();

    if (!stats || !addStats) {
      return 'Зачекайте, завантажую дані...';
    }

    if (lowerMessage.includes('скільки клієнт') || lowerMessage.includes('кількість клієнт')) {
      return `У вашій базі зараз ${stats.totalCustomers} ${
        stats.totalCustomers === 1 ? 'клієнт' : 'клієнтів'
      }.`;
    }

    if (lowerMessage.includes('скільки товар') || lowerMessage.includes('кількість товар')) {
      return `У каталозі ${stats.totalProducts} ${
        stats.totalProducts === 1 ? 'товар' : 'товарів'
      }.`;
    }

    if (lowerMessage.includes('скільки замовлен') || lowerMessage.includes('кількість замовлен')) {
      return `Всього створено ${stats.totalOrders} ${
        stats.totalOrders === 1 ? 'замовлення' : 'замовлень'
      }. З них ${addStats.pendingOrders} в обробці.`;
    }

    if (lowerMessage.includes('дохід') || lowerMessage.includes('виручк') || lowerMessage.includes('загальн')) {
      return `Загальний дохід від всіх замовлень становить ${stats.totalRevenue.toFixed(2)} ₴.`;
    }

    if (lowerMessage.includes('кращий клієнт') || lowerMessage.includes('топ клієнт')) {
      if (addStats.topCustomer) {
        return `Найкращий клієнт: ${addStats.topCustomer.name} з загальною сумою покупок ${addStats.topCustomer.spent.toFixed(
          2
        )} ₴.`;
      }
      return 'Поки що немає клієнтів з покупками.';
    }

    if (
      lowerMessage.includes('склад') ||
      lowerMessage.includes('запас') ||
      lowerMessage.includes('залишк') || 
      lowerMessage.includes('закін') 
    ) {
      if (addStats.lowStockProducts.length === 0) {
        return 'Всі товари в достатній кількості на складі!';
      }
      const productList = addStats.lowStockProducts
        .map((p) => `${p.name} (${p.stock} шт)`)
        .join(', ');
      return `Товари з низьким запасом: ${productList}. Рекомендую поповнити запаси.`;
    }

    if (
      lowerMessage.includes('статистик') ||
      lowerMessage.includes('аналітик') ||
      lowerMessage.includes('звіт')
    ) {
      return `Коротка статистика:\n\n📊 Клієнтів: ${stats.totalCustomers}\n📦 Товарів: ${
        stats.totalProducts
      }\n🛒 Замовлень: ${stats.totalOrders}\n💰 Дохід: ${stats.totalRevenue.toFixed(2)} ₴\n⏳ В обробці: ${
        addStats.pendingOrders
      } замовлень\n\nЩо б ви хотіли дізнатися детальніше?`;
    }

    if (
      lowerMessage.includes('допоможи') ||
      lowerMessage.includes('що вміє') ||
      lowerMessage.includes('що можеш')
    ) {
      return `Я можу допомогти вам з:\n\n✓ Аналітикою продажів та доходів\n✓ Статистикою клієнтів\n✓ Інформацією про товари та їх залишки\n✓ Стан замовлень\n✓ Рекомендаціями щодо управління магазином\n\nПросто запитайте!`;
    }

    if (
      lowerMessage.includes('рекоменд') ||
      lowerMessage.includes('порад') ||
      lowerMessage.includes('що робити')
    ) {
      const recommendations = [];

      if (addStats.lowStockProducts.length > 0) {
        recommendations.push(
          `🔴 Поповніть запаси товарів: ${addStats.lowStockProducts.map((p) => p.name).join(', ')}`
        );
      }

      if (addStats.pendingOrders > 5) {
        recommendations.push(
          `🟡 У вас ${addStats.pendingOrders} замовлень в обробці. Рекомендую опрацювати їх якнайшвидше.`
        );
      }

      if (stats.totalCustomers > 0 && addStats.topCustomer) {
        recommendations.push(
          `🟢 Найактивніший клієнт ${addStats.topCustomer.name}. Можливо, варто запропонувати спеціальну знижку або програму лояльності.`
        );
      }

      if (recommendations.length === 0) {
        return 'Все виглядає чудово! Ваш магазин працює ефективно. Продовжуйте в тому ж дусі!';
      }

      return `Рекомендації для покращення:\n\n${recommendations.join('\n\n')}`;
    }

    if (lowerMessage.includes('привіт') || lowerMessage.includes('вітаю')) {
      return 'Вітаю! Чим можу допомогти вам сьогодні?';
    }

    if (lowerMessage.includes('дякую') || lowerMessage.includes('спасибі')) {
      return 'Будь ласка! Завжди радий допомогти. Якщо матимете ще питання - звертайтесь!';
    }

    return 'Вибачте, я не зовсім розумію ваше запитання. Спробуйте запитати про:\n\n• Статистику клієнтів\n• Кількість товарів\n• Стан замовлень\n• Загальний дохід\n• Залишки на складі\n• Рекомендації';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    await refetch();
    await refetchAdd();

    setTimeout(async () => {
      const response = await generateResponse(userMessage.content);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLoading(false);
    }, 500);
  };

  const quickQuestions = [
    'Покажи статистику',
    'Скільки клієнтів?',
    'Який загальний дохід?',
    'Які товари закінчуються?',
    'Дай рекомендації',
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
          <Bot size={32} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Асистент</h1>
          <p className="text-gray-600">Ваш розумний помічник для управління магазином</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Bot size={18} className="text-green-600" />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-line">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString('uk-UA', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-blue-600" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Bot size={18} className="text-green-600" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex flex-wrap gap-2 mb-3">
            {quickQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => setInput(question)}
                className="px-3 py-1 text-sm bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишіть ваше запитання..."
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
