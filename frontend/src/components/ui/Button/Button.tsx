import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';
import { Spinner } from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'dark';
type ButtonSize = 'sm' | 'md' | 'lg';


interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
  isLoading?: boolean;
  loadingText?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? 'true' : undefined}
      aria-disabled={disabled || isLoading ? 'true' : undefined}
      tabIndex={disabled || isLoading ? -1 : 0}
      {...rest}
    >
      {isLoading && (
        <Spinner size={18} className={styles.spinner} />
      )}
      {!isLoading && leftIcon && (
        <span className={styles.leftIcon}>{leftIcon}</span>
      )}
      <span className={isLoading ? styles.loadingText : undefined}>
        {isLoading ? loadingText || children : children}
      </span>
      {!isLoading && rightIcon && (
        <span className={styles.rightIcon}>{rightIcon}</span>
      )}
    </button>
  );
}
