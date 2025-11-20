import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-8 text-9xl">404</div>
      <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">页面未找到</h1>
      <p className="mb-8 text-gray-600 dark:text-gray-400">抱歉，您访问的页面不存在或已被删除。</p>
      <div className="flex gap-4">
        <Link
          to="/"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
          返回首页
        </Link>
        <button
          onClick={() => window.history.back()}
          className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
          返回上一页
        </button>
      </div>
    </div>
  )
}
