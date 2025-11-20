'use client';

import { useEffect, useRef } from 'react';
import { memo } from 'react';

interface InfiniteScrollProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  loadingComponent?: React.ReactNode;
  endMessage?: string;
}

function InfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  loadingComponent,
  endMessage = '没有更多内容了',
}: InfiniteScrollProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  if (!hasNextPage) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        {endMessage}
      </div>
    );
  }

  return (
    <div ref={observerTarget} className="py-8">
      {loadingComponent || (
        <div className="flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400" />
        </div>
      )}
    </div>
  );
}

export default memo(InfiniteScroll);

