/**
 * JWT Service Mock
 * Mocks JWT token generation and verification
 */

export const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
};

beforeEach(() => {
  mockJwtService.sign.mockReset();
  mockJwtService.verify.mockReset();
  mockJwtService.decode.mockReset();

  // Default: successful token generation
  mockJwtService.sign.mockReturnValue('mock.jwt.token');

  // Default: successful token verification
  mockJwtService.verify.mockReturnValue({
    sub: 'user-123',
    username: 'testuser',
    familyId: 'family-123',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  // Default: successful token decode
  mockJwtService.decode.mockReturnValue({
    sub: 'user-123',
    username: 'testuser',
    familyId: 'family-123',
  });
});

export default mockJwtService;
