import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';
import { readCrashFileContent } from '~/utils/fuzz';
import prisma from '~/lib/prisma';

export default defineEventHandler(async (event) => {
    // const userinfo = verifyAccessToken(event);
    // if (!userinfo) {
    //   return unAuthorizedResponse(event);
    // }
  
    const id = getRouterParam(event, 'id');
  
    const bug = await prisma.bug.findUnique({
      where: {
          id
      }
    })

    const { crash } = bug;

    const creash_conent = await readCrashFileContent(crash);

    // 设置响应头
    event.res.setHeader('Content-Disposition', `attachment; filename="crash"`);
    // event.res.setHeader('Content-Type', 'text/plain');
  
    // 将内容作为文件流返回
    event.res.writeHead(200);
    event.res.end(creash_conent);
  });