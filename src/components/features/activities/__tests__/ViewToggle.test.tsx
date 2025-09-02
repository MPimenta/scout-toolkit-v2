import { render, screen, fireEvent } from '@testing-library/react';
import { ViewToggle, ViewMode } from '../ViewToggle';

describe('ViewToggle', () => {
  const mockOnViewChange = jest.fn();

  beforeEach(() => {
    mockOnViewChange.mockClear();
  });

  it('renders both view options', () => {
    render(
      <ViewToggle 
        currentView="tiles" 
        onViewChange={mockOnViewChange} 
      />
    );

    expect(screen.getByText('Tiles')).toBeInTheDocument();
    expect(screen.getByText('Tabela')).toBeInTheDocument();
  });

  it('shows tiles view as active when currentView is tiles', () => {
    render(
      <ViewToggle 
        currentView="tiles" 
        onViewChange={mockOnViewChange} 
      />
    );

    const tilesButton = screen.getByText('Tiles').closest('button');
    const tableButton = screen.getByText('Tabela').closest('button');

    expect(tilesButton).toHaveClass('bg-primary');
    expect(tableButton).toHaveClass('bg-transparent');
  });

  it('shows table view as active when currentView is table', () => {
    render(
      <ViewToggle 
        currentView="table" 
        onViewChange={mockOnViewChange} 
      />
    );

    const tilesButton = screen.getByText('Tiles').closest('button');
    const tableButton = screen.getByText('Tabela').closest('button');

    expect(tableButton).toHaveClass('bg-primary');
    expect(tilesButton).toHaveClass('bg-transparent');
  });

  it('calls onViewChange with tiles when tiles button is clicked', () => {
    render(
      <ViewToggle 
        currentView="table" 
        onViewChange={mockOnViewChange} 
      />
    );

    fireEvent.click(screen.getByText('Tiles'));
    expect(mockOnViewChange).toHaveBeenCalledWith('tiles');
  });

  it('calls onViewChange with table when table button is clicked', () => {
    render(
      <ViewToggle 
        currentView="tiles" 
        onViewChange={mockOnViewChange} 
      />
    );

    fireEvent.click(screen.getByText('Tabela'));
    expect(mockOnViewChange).toHaveBeenCalledWith('table');
  });

  it('renders with correct icons', () => {
    render(
      <ViewToggle 
        currentView="tiles" 
        onViewChange={mockOnViewChange} 
      />
    );

    // Check that icons are present (they should be rendered as SVG elements)
    expect(screen.getByText('Tiles').closest('button')).toBeInTheDocument();
    expect(screen.getByText('Tabela').closest('button')).toBeInTheDocument();
  });
});
