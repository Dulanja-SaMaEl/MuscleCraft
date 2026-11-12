import { redirect } from 'next/navigation';

export default function AdminSalesPage() {
  redirect('/admin?tab=daily_dashboard');
}
