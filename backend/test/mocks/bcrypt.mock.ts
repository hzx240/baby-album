/**
 * Bcrypt Mock
 * Mocks password hashing and comparison
 */

export const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
  genSalt: jest.fn(),
};

jest.mock('bcrypt', () => mockBcrypt);

beforeEach(() => {
  mockBcrypt.hash.mockReset();
  mockBcrypt.compare.mockReset();
  mockBcrypt.genSalt.mockReset();

  // Default: successful hashing
  mockBcrypt.hash.mockResolvedValue('hashedPassword123');
  mockBcrypt.genSalt.mockResolvedValue('salt123');

  // Default: successful comparison
  mockBcrypt.compare.mockImplementation((plain: string, hashed: string) => {
    return Promise.resolve(plain === 'correctPassword');
  });
});

export default mockBcrypt;
