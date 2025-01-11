import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';
import prisma from "~/lib/prisma";

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const {
    name, 
    cve, 
    type, 
    risk,
    projectId,
    publicReport,
    crash, 
    report,
    desc,
    fix,
    codeText,
   } = await readBody(event);

  const bugs = await prisma.bug.create({
    data: {
        cve,
        type,
        risk,
        projectId,
        publicReport,
        name,
        crash, 
        report,
        desc,
        fix,
        codeText,
    }
  })

  return useResponseSuccess(bugs);
});
