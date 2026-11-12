import { redirect } from 'next/navigation';

export default function AdminDatabasePage() {
  redirect('/admin?tab=database_health');
}
