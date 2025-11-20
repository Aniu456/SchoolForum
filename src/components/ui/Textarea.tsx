/**
 * Textarea 多行文本输入组件
 */
import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/helpers';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
  maxLength?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, showCount, maxLength, value, ...props }, ref) => {
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full">
        {/* Label */}
        <div className="mb-2 flex items-center justify-between">
          {label && (
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
              {props.required && <span className="ml-1 text-red-500">*</span>}
            </label>
          )}
          {showCount && maxLength && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={ref}
          maxLength={maxLength}
          value={value}
          className={cn(
            'w-full rounded-lg border bg-white px-4 py-2 text-gray-900 placeholder-gray-500 transition-colors',
            'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
            'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500',
            'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400',
            'dark:focus:border-blue-400 dark:focus:ring-blue-400/20',
            'dark:disabled:bg-gray-900 dark:disabled:text-gray-600',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />

        {/* Error Message */}
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;

