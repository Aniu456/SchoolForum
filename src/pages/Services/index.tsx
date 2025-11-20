/**
 * 校园服务中心 - 所有功能入口
 */
import { Link } from 'react-router-dom';

interface ServiceCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  color: string;
}

const SERVICES: ServiceCard[] = [
  {
    id: 'marketplace',
    title: '二手交易',
    description: '校园闲置物品交易平台',
    icon: '🛒',
    path: '/marketplace',
    color: 'bg-blue-500',
  },
  {
    id: 'resources',
    title: '学习资源',
    description: '分享学习资料，共同进步',
    icon: '📚',
    path: '/resources',
    color: 'bg-green-500',
  },
  {
    id: 'clubs',
    title: '社团招新',
    description: '发现有趣的社团，结识志同道合的朋友',
    icon: '🎭',
    path: '/clubs',
    color: 'bg-purple-500',
  },
  {
    id: 'lostfound',
    title: '失物招领',
    description: '帮助失主找回失物',
    icon: '🔍',
    path: '/lostfound',
    color: 'bg-orange-500',
  },
  {
    id: 'carpool',
    title: '拼车拼单',
    description: '拼车出行，拼单优惠',
    icon: '🚗',
    path: '/carpool',
    color: 'bg-red-500',
  },
  {
    id: 'forum',
    title: '论坛广场',
    description: '畅所欲言，分享生活',
    icon: '💬',
    path: '/',
    color: 'bg-indigo-500',
  },
];

export default function ServicesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 头部 */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100">
          🎓 校园服务中心
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          公益性开放性校园论坛 · 服务学生 · 连接你我
        </p>
      </div>

      {/* 服务卡片 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => (
          <Link
            key={service.id}
            to={service.path}
            className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all hover:scale-105 hover:shadow-2xl dark:bg-gray-900">
            {/* 背景装饰 */}
            <div className={`absolute right-0 top-0 h-32 w-32 ${service.color} opacity-10 blur-3xl`} />

            {/* 图标 */}
            <div className="mb-4 text-6xl">{service.icon}</div>

            {/* 标题 */}
            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {service.title}
            </h2>

            {/* 描述 */}
            <p className="text-gray-600 dark:text-gray-400">
              {service.description}
            </p>

            {/* 箭头 */}
            <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400">
              <span className="mr-2">进入</span>
              <span className="transition-transform group-hover:translate-x-2">→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* 底部说明 */}
      <div className="mt-16 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 p-8 dark:from-gray-800 dark:to-gray-900">
        <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          关于我们
        </h3>
        <div className="space-y-3 text-gray-700 dark:text-gray-300">
          <p>
            <strong>🌟 公益性：</strong>本论坛完全免费，不收取任何费用，致力于为学生提供便利的交流平台。
          </p>
          <p>
            <strong>🔓 开放性：</strong>欢迎所有学生加入，自由发表观点，分享资源，互帮互助。
          </p>
          <p>
            <strong>🤝 服务学生：</strong>从学习到生活，从交易到社交，我们提供全方位的校园服务。
          </p>
          <p>
            <strong>🛡️ 安全保障：</strong>支持匿名发帖，保护隐私；内容审核机制，维护良好社区环境。
          </p>
        </div>
      </div>

      {/* 使用指南 */}
      <div className="mt-8 rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-900">
        <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          💡 使用指南
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">📝 发帖须知</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• 支持匿名发帖，保护隐私</li>
              <li>• 内容需经过审核后发布</li>
              <li>• 禁止发布违法违规内容</li>
            </ul>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">🔒 隐私保护</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• 个人信息严格保密</li>
              <li>• 可选择匿名发布内容</li>
              <li>• 举报功能保护社区安全</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

