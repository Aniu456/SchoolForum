import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              校园论坛
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              学生交流社区，分享学习经验，交流校园生活
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
              导航
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">
                  首页
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-blue-600 dark:hover:text-blue-400">
                  分类
                </Link>
              </li>
              <li>
                <Link to="/posts/new" className="hover:text-blue-600 dark:hover:text-blue-400">
                  发帖
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
              帮助
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400">
                  关于我们
                </Link>
              </li>
              <li>
                <Link to="/rules" className="hover:text-blue-600 dark:hover:text-blue-400">
                  社区规则
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-blue-600 dark:hover:text-blue-400">
                  常见问题
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
              联系
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a href="mailto:contact@example.com" className="hover:text-blue-600 dark:hover:text-blue-400">
                  邮箱
                </a>
              </li>
              <li>
                <Link to="/feedback" className="hover:text-blue-600 dark:hover:text-blue-400">
                  反馈
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
          <p>© 2024 校园论坛. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
