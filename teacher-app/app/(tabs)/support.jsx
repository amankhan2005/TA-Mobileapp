// FIXED Issue 4: Support tab now redirects to Inquiry instead of Contact Support
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
export default function SupportTab() {
  const r = useRouter();
  useEffect(() => { r.replace('/profile/inquiry'); }, []);
  return null;
}
