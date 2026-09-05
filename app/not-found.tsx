export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold' }}>404</h1>
      <p style={{ margin: '1rem 0' }}>Sayfa bulunamadi</p>
      <a href="/" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Ana Sayfaya Don</a>
    </div>
  );
}
