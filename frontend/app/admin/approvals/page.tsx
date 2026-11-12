import { redirect } from 'next/navigation';

export default function AdminApprovalsPage() {
  redirect('/admin?tab=payments');
}
