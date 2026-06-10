import { useEffect } from 'react';
import { useRouter } from 'expo-router';
export default function InquirySlot() {
  const r = useRouter();
  useEffect(() => { r.replace('/profile/contact-support'); }, []);
  return null;
}
