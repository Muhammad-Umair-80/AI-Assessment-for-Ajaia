export interface SeedUser {
  id: string;
  name: string;
  email: string;
}

export const SEEDED_USERS: SeedUser[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Muhammad Umair',
    email: '44muhammadumair@gmail.com',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Uzair',
    email: 'uzair@example.com',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Zubair',
    email: 'zubair@example.com',
  },
];

export const CURRENT_MOCK_USER = SEEDED_USERS[0]; // Muhammad Umair
