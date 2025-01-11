import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';
import prisma from "~/lib/prisma";

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const bugs = await prisma.bug.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      project: true,
    },
  })

  return useResponseSuccess(bugs);
});
