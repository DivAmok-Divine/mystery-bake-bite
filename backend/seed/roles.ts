import { type Role } from '../lib/db';

export const ADMIN_ROLE_ID = 'e8e81561-12f8-456b-a25e-ea78a48ef89a';

export const SEEDED_ROLES: Role[] = [
  {
    id: ADMIN_ROLE_ID,
    name: 'Admin',
    color: '#3d2314', // Deep chocolate
    description: 'Master access with unrestricted control over all system modules.',
    permissions: ['*'],
    createdAt: new Date('2026-05-18T00:00:00Z')
  }
];
