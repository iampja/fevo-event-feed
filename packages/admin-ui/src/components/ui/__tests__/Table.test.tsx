import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Table, Column } from '@/components/ui/Table';

interface TestRow extends Record<string, unknown> {
  id: number;
  name: string;
  email: string;
}

const columns: Column<TestRow>[] = [
  { header: 'ID', accessor: 'id' },
  { header: 'Name', accessor: 'name' },
  { header: 'Email', accessor: 'email' },
];

const data: TestRow[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

describe('Table', () => {
  it('renders column headers and row data', () => {
    render(<Table columns={columns} data={data} />);

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows default empty message when data is empty', () => {
    render(<Table columns={columns} data={[]} />);

    expect(screen.getByText('No data to display')).toBeInTheDocument();
  });

  it('shows custom empty message when provided', () => {
    render(
      <Table columns={columns} data={[]} emptyMessage="Nothing here" />
    );

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.queryByText('No data to display')).not.toBeInTheDocument();
  });

  it('uses custom render functions for columns', () => {
    const columnsWithRender: Column<TestRow>[] = [
      { header: 'Name', accessor: 'name' },
      {
        header: 'Email',
        accessor: 'email',
        render: (row) => <a href={`mailto:${row.email}`}>{row.email}</a>,
      },
    ];

    render(<Table columns={columnsWithRender} data={data} />);

    const link = screen.getByText('alice@example.com');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'mailto:alice@example.com');
  });

  it('calls onRowClick handler with the correct row when a row is clicked', () => {
    const handleRowClick = vi.fn();

    render(<Table columns={columns} data={data} onRowClick={handleRowClick} />);

    fireEvent.click(screen.getByText('Alice'));

    expect(handleRowClick).toHaveBeenCalledTimes(1);
    expect(handleRowClick).toHaveBeenCalledWith(data[0]);
  });
});
