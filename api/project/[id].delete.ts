import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';
import prisma from '~/lib/prisma';
import fs from 'fs/promises';

export default defineEventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const id = getRouterParam(event, 'id');


  const res = await prisma.project.delete({
    where: {
        id
    }
  })

  await cleanWorkDir(id)

  return useResponseSuccess(res);
});



async function cleanWorkDir(id: string) {
  const path = `work/${id}`;

  try {
    const stats = await fs.stat(path); // 检查路径是否存在并获取其信息

    if (stats.isDirectory()) {
      // 如果是目录，递归删除
      await fs.rm(path, { recursive: true, force: true });
    } else {
      // 如果是文件，直接删除
      await fs.unlink(path);
    }
  } catch (error) {
    console.error(`Failed to clean work directory for id ${id}:`, error);
  }
}