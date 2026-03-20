import PropTypes from 'prop-types'

export default function PaginationControls({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  options = [10, 20, 50, 100],
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="paginationRow">
      <div>
        <label>
          Rows per page:
          <select
            className="select selectSm"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {options.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <span>{total} total</span>
        <button
          className="btn btnSm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Prev
        </button>
        <button
          className="btn btnSm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        >
          Next
        </button>
        <span>
          Page {page} of {pageCount}
        </span>
      </div>
    </div>
  )
}

PaginationControls.propTypes = {
  total: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.number),
}
