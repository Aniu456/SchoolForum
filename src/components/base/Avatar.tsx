import { getAvatarUrl, getFallbackAvatarUrl } from '@/utils/avatar';
import { useState, memo } from 'react';
import { cn } from '@/utils/helpers';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: number;
  username?: string;
  className?: string;
  seed?: string;
}

function Avatar({
  src,
  alt,
  size = 40,
  username,
  className = '',
  seed,
}: AvatarProps) {
  const [imgSrc, setImgSrc] = useState(src || getAvatarUrl(seed, username));
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      // 如果主头像加载失败，使用备用头像
      setImgSrc(getFallbackAvatarUrl(username || alt));
    }
  };

  // 使用普通 img 标签以避免额外的运行时限制
  return (
    <img
      src={imgSrc}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      onError={handleError}
      style={{ width: size, height: size }}
    />
  );
}

export default memo(Avatar);
