import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';
import prisma from "~/lib/prisma";

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }
  
  const cveTypes = await prisma.bug.findMany({
    distinct: ['cve'], // 通过 distinct 查询唯一的 cve 值
    select: {
      cve: true,
    },
  });
  
  const bugTypes = await prisma.bug.findMany({
    distinct: ['type'], // 通过 distinct 查询唯一的 type 值
    select: {
      type: true,
    },
  });

    
  return useResponseSuccess({bugTypesCount:bugTypes.length,
    cveTypesCount:cveTypes.length, totalBugCount:bugTypes.length});
  // return useResponseSuccess(bugs);
});
