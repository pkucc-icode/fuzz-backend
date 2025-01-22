import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';
import prisma from "~/lib/prisma";
import { createVerify } from 'crypto';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const bugs = await prisma.bug.findMany({
    select: {
      cve: true,
      name: true,
      type: true,
      risk: true,
      id: true,
      publicReport: true,
      project: {
        select: {
          id: true,
          name: true
        }
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    // include: {
    //   project: true,
    // },
  })

  return useResponseSuccess(bugs);
});
