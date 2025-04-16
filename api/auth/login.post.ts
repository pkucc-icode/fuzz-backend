import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from '~/utils/cookie-utils';
import { generateAccessToken, generateRefreshToken } from '~/utils/jwt-utils';
import { forbiddenResponse } from '~/utils/response';
import prisma from '~/lib/prisma';

export default defineEventHandler(async (event) => {
  const { password, username } = await readBody(event);
  if (!password || !username) {
    setResponseStatus(event, 400);
    return useResponseError(
      'BadRequestException',
      'Username and password are required',
    );
  }

  // const findUser = MOCK_USERS.find(
  //   (item) => item.username === username && item.password === password,
  // );
  const findUser = await prisma.user.findFirst({
    where: {
      username,
      password,
    },
  });

  if (!findUser) {
    clearRefreshTokenCookie(event);
    return forbiddenResponse(event);
  }

  const accessToken = generateAccessToken(findUser);
  const refreshToken = generateRefreshToken(findUser);

  setRefreshTokenCookie(event, refreshToken);

  return useResponseSuccess({
    ...findUser,
    accessToken,
  });
});
