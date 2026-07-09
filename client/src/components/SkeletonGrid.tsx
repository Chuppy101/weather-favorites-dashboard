export function SkeletonGrid() {
  return (
    <div className="cards-grid">
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="skeleton-card" key={index}>
          <div />
          <div />
          <div />
          <div />
        </div>
      ))}
    </div>
  );
}
