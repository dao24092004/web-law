import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '../utils';
import { BookingPage } from '@/features/booking';

describe('booking page shell', () => {
  it('renders booking hero and first step copy', () => {
    renderWithProviders(<BookingPage />);

    // Match against the actual vi.json strings rather than a stylized casing.
    expect(screen.getByText('Đặt lịch tư vấn pháp lý')).toBeInTheDocument();
    expect(screen.getByText('Bạn cần tư vấn về lĩnh vực nào?')).toBeInTheDocument();
    expect(screen.getByText('Chọn luật sư bạn muốn tư vấn')).toBeInTheDocument();
  });
});
