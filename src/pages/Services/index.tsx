/**
 * 交易平台入口：二手交易 & 学习资源
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '@/components';

type TradeTab = 'marketplace' | 'study';

const TAB_META: Record<TradeTab, { title: string; description: string; icon: string; entry: string; publish: string }> = {
  marketplace: {
    title: '二手交易',
    description: '发布和浏览闲置物品，覆盖数码、书籍、生活用品等多个类别',
    icon: '🛒',
    entry: '/marketplace',
    publish: '/marketplace/new',
  },
  study: {
    title: '学习资源',
    description: '课程资料、题库、学习笔记集中地，支持上传文件或分享链接',
    icon: '📚',
    entry: '/study-resources',
    publish: '/study-resources',
  },
};

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<TradeTab>('marketplace');
  const current = useMemo(() => TAB_META[activeTab], [activeTab]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* 头部 */}
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">交易平台</p>
        <h1 className="mt-2 text-4xl font-bold text-gray-900 dark:text-gray-100">二手交易 · 学习资源</h1>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
          精简后的服务入口，专注交易和资源互助，提供发布与浏览一站式体验
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="mb-6 flex justify-center gap-3">
        {(['marketplace', 'study'] as TradeTab[]).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'primary' : 'outline'}
            onClick={() => setActiveTab(tab)}
          >
            {TAB_META[tab].icon} {TAB_META[tab].title}
          </Button>
        ))}
      </div>

      {/* 主模块 */}
      <Card className="mb-8 overflow-hidden border border-gray-100 shadow-sm dark:border-gray-800">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col justify-between bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:from-slate-900 dark:to-indigo-900/40">
            <div>
              <div className="mb-3 text-4xl">{current.icon}</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{current.title}</h2>
              <p className="mt-2 text-gray-700 dark:text-gray-300">{current.description}</p>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to={current.entry}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                进入{current.title}列表
              </Link>
              <Link
                to={current.publish}
                className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-white px-4 py-2 text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 dark:border-blue-500/60 dark:bg-slate-900 dark:text-blue-200 dark:hover:bg-blue-900/40">
                发布{current.title}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">浏览与筛选</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• 分类、价格/类型筛选</li>
                  <li>• 关键字搜索与排序</li>
                  <li>• 支持图片/文件预览</li>
                </ul>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">发布入口</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• 支持图片、价格/类型等字段</li>
                  <li>• 自动保存草稿，便捷再次编辑</li>
                  <li>• 与个人中心收藏/关注联动</li>
                </ul>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">安全与沟通</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• 支持站内私信联系发布者</li>
                  <li>• 举报与审核保障交易安全</li>
                  <li>• 关注作者，获取更新提醒</li>
                </ul>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">常用入口</h3>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/marketplace"
                    className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-200">
                    前往二手市场
                  </Link>
                  <Link
                    to="/study-resources"
                    className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-200">
                    学习资源
                  </Link>
                  <Link
                    to="/profile"
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200">
                    我的发布
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 商城式快捷分类 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: '数码闲置', desc: '手机 · 平板 · 电脑配件', pill: '二手交易', path: '/marketplace' },
          { title: '书籍教材', desc: '专业课教材 · 考研资料', pill: '学习资源', path: '/study-resources' },
          { title: '校园生活', desc: '生活用品 · 小家电', pill: '二手交易', path: '/marketplace' },
          { title: '课程笔记', desc: 'PDF/文档/链接分享', pill: '学习资源', path: '/study-resources' },
          { title: '题库练习', desc: '刷题/真题/解析合集', pill: '学习资源', path: '/study-resources' },
          { title: '其他宝贝', desc: '更多类别等待发布', pill: '综合', path: '/services' },
        ].map((item) => (
          <Card key={item.title} className="flex flex-col justify-between border border-gray-100 p-5 shadow-sm transition hover:shadow-md dark:border-gray-800">
            <div>
              <div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                {item.pill}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
            </div>
            <div className="mt-4">
              <Link to={item.path} className="inline-block">
                <Button variant="outline" size="sm">
                  进入 {item.pill}
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
