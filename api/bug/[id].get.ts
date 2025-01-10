import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';
import prisma from '~/lib/prisma';

//extract bug
function extractSection(report: string): string[] {
  const lines = report.split('\n');
  let isSection = true;
  let section: string[] = [];

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('#') && isSection) {
      isSection = true;
      section.push(line);
    } else if (isSection && trimmedLine !== '') {
      section.push(line);
    } else if (isSection && trimmedLine === '') {
      isSection = false; 
    }
  });

  return section;
}

export default defineEventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const id = getRouterParam(event, 'id');

  const bug = await prisma.bug.findUnique({
    where: {
        id
    }
  })

  if (!bug) {
    return {
      success: false,
      message: "Bug not found",
    };
  }
  let stackList = await extractSection(bug.report);
  const data : Record<string, any> = { ... bug }
  data.stackList = stackList
  
  return useResponseSuccess(data);
});
