/** @jsxImportSource preact */

export function SkeletonCard() {
  return (
    <div class="fevo-ef-skeleton">
      <div class="fevo-ef-skeleton-block fevo-ef-skeleton-image" />
      <div class="fevo-ef-skeleton-body">
        <div class="fevo-ef-skeleton-block fevo-ef-skeleton-title" />
        <div class="fevo-ef-skeleton-block fevo-ef-skeleton-line fevo-ef-skeleton-line-medium" />
        <div class="fevo-ef-skeleton-block fevo-ef-skeleton-line fevo-ef-skeleton-line-short" />
        <div class="fevo-ef-skeleton-block fevo-ef-skeleton-line fevo-ef-skeleton-line-short" />
        <div class="fevo-ef-skeleton-block fevo-ef-skeleton-btn" />
      </div>
    </div>
  );
}
