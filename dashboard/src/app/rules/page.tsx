import { redirect } from 'next/navigation';

export default function RulesPage() {
  // Redirect to latest version
  redirect('/rules/v1.0');
}

