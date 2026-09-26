import Link from "next/link";
import type { ComponentProps } from "react";

import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary";

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-control px-6 text-body font-medium no-underline transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-action text-on-action hover:bg-action-hover",
  secondary: "border-[1.5px] border-fg text-fg hover:bg-surface",
};

export function buttonClasses(
  variant: Variant = "primary",
  className?: string,
) {
  return cx(base, variants[variant], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant };
type LinkButtonProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  variant?: Variant;
};

/**
 * Primary or secondary button (DESIGN §7): 48 px tall, the text says what
 * happens. With `href` it renders a link styled as a button.
 */
export function Button(props: ButtonProps | LinkButtonProps) {
  if ("href" in props && props.href !== undefined) {
    const { variant, className, ...rest } = props;
    return <Link {...rest} className={buttonClasses(variant, className)} />;
  }
  const { variant, className, type = "button", ...rest } = props as ButtonProps;
  return (
    <button
      {...rest}
      type={type}
      className={buttonClasses(variant, className)}
    />
  );
}
