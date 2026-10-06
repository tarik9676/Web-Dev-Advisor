export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="skeleton-table" aria-label="Loading">
      {Array.from({ length: rows + 1 }).map((_, row) => (
        <div className="skeleton-row" key={row}>
          {Array.from({ length: 7 }).map((__, column) => <span key={column} />)}
        </div>
      ))}
    </div>
  );
}

export function SkeletonLines({ count = 4 }) {
  return <div className="skeleton-lines">{Array.from({ length: count }).map((_, index) => <span key={index} style={{ width: `${96 - index * 10}%` }} />)}</div>;
}
