'use client';

export function BookingFooter() {
  return (
    <footer className="bg-[var(--primary-dark)] px-6 py-6 text-center">
      <p className="text-[0.8rem] text-white/40">
        © 2026 Công ty Luật TNHH ICRC. Mọi quyền được bảo lưu. |{' '}
        <a href="#" className="text-[var(--accent)]">
          Chính sách bảo mật
        </a>{' '}
        |{' '}
        <a href="#" className="text-[var(--accent)]">
          Điều khoản sử dụng
        </a>
      </p>
    </footer>
  );
}
