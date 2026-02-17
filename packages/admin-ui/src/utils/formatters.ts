export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatStatusLabel(status: string): string {
  switch (status) {
    case 'sold_out':
      return 'Sold Out';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral';

export function getStatusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'neutral';
    case 'sold_out':
      return 'warning';
    case 'deleted':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function formatPriceRange(min: number, max: number): string {
  if (min === max) return `$${min}`;
  if (min && max) return `$${min} - $${max}`;
  if (min) return `From $${min}`;
  if (max) return `Up to $${max}`;
  return 'Free';
}
