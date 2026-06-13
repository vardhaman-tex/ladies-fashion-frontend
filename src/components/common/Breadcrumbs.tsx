import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Simple breadcrumb trail. The last item (no `href`) is rendered as the
 * current page and is not a link.
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-1">
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
          {index < items.length - 1 && <ChevronRightIcon className="size-3.5" />}
        </span>
      ))}
    </nav>
  );
}
