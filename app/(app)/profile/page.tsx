'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/LoadingSpinner';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { SecurityCard } from '@/components/profile/SecurityCard';
import type { UserProfile } from '@/types/user';

export default function ProfilePage() {
  const { data: profile } = useSWR<UserProfile>('/api/profile', fetcher);

  return (
    <div className="max-w-[980px] px-8 py-7">
      <div className="mb-5 text-xl font-bold">Profil</div>

      {!profile ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <div className="grid grid-cols-[1.7fr_1fr] items-start gap-5">
          <ProfileCard profile={profile} />
          <SecurityCard profile={profile} />
        </div>
      )}
    </div>
  );
}
