import React, { useState, useMemo } from 'react';
import { Table, Form, Row, Col, Button, Pagination } from 'react-bootstrap';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react';

const DataTable = ({
  columns = [],
  data = [],
  onRowClick = null,
  searchPlaceholder = 'Search records...',
  title = '',
  exportFilename = 'mota_export'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // 1. Search Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter(row => {
      return columns.some(col => {
        const val = col.accessor ? (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]) : row[col.key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, columns]);

  // 2. Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const col = columns.find(c => (c.key || c.accessor) === sortConfig.key);
      const valA = col?.accessor ? (typeof col.accessor === 'function' ? col.accessor(a) : a[col.accessor]) : a[sortConfig.key];
      const valB = col?.accessor ? (typeof col.accessor === 'function' ? col.accessor(b) : b[col.accessor]) : b[sortConfig.key];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig, columns]);

  // 3. Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const headers = columns.map(c => c.label).join(',');
    const rows = sortedData.map(row => {
      return columns.map(c => {
        const val = c.accessor ? (typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor]) : row[c.key];
        const cleaned = String(val || '').replace(/"/g, '""');
        return `"${cleaned}"`;
      }).join(',');
    }).join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + headers + '\n' + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${exportFilename}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="gov-table-container p-3 mb-4">
      {/* Top Controls Bar */}
      <Row className="align-items-center justify-content-between mb-3 g-2">
        <Col sm={4} xs={12}>
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted text-nowrap">Show</span>
            <Form.Select
              size="sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ width: '80px' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </Form.Select>
            <span className="small text-muted text-nowrap">entries</span>
          </div>
        </Col>

        <Col sm={8} xs={12} className="d-flex align-items-center justify-content-sm-end gap-2">
          <div className="input-group input-group-sm" style={{ maxWidth: '280px' }}>
            <span className="input-group-text bg-white">
              <Search size={14} className="text-muted" />
            </span>
            <Form.Control
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleExportCSV}
            className="d-flex align-items-center gap-1"
            title="Export to CSV"
          >
            <Download size={14} /> Export
          </Button>
        </Col>
      </Row>

      {/* Table */}
      <div className="table-responsive">
        <Table hover bordered className="gov-table align-middle">
          <thead>
            <tr>
              {columns.map((col, i) => {
                const sortKey = col.key || col.accessor;
                const isSorted = sortConfig.key === sortKey;

                return (
                  <th
                    key={i}
                    onClick={() => col.sortable !== false && handleSort(sortKey)}
                    style={{ cursor: col.sortable !== false ? 'pointer' : 'default', width: col.width }}
                  >
                    <div className="d-flex align-items-center justify-content-between gap-1">
                      <span>{col.label}</span>
                      {col.sortable !== false && (
                        <span>
                          {isSorted ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                          ) : (
                            <ArrowUpDown size={13} className="text-muted opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-4 text-muted">
                  No matching records found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={row._id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx}>
                      {col.render
                        ? col.render(row)
                        : (col.accessor
                            ? (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor])
                            : row[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <Row className="align-items-center justify-content-between mt-3 g-2">
        <Col sm={6} xs={12}>
          <div className="small text-muted">
            Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
            {searchTerm && ` (filtered from ${data.length} total entries)`}
          </div>
        </Col>

        <Col sm={6} xs={12} className="d-flex justify-content-sm-end">
          <Pagination size="sm" className="mb-0">
            <Pagination.Prev
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            />
            {[...Array(totalPages)].map((_, idx) => {
              const pageNum = idx + 1;
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <Pagination.Item
                    key={pageNum}
                    active={pageNum === currentPage}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Pagination.Item>
                );
              } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return <Pagination.Ellipsis key={pageNum} disabled />;
              }
              return null;
            })}
            <Pagination.Next
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            />
          </Pagination>
        </Col>
      </Row>
    </div>
  );
};

export default DataTable;
