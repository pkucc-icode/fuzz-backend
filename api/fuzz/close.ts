import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';
import prisma from "~/lib/prisma";
import fs from 'fs/promises';
import { Project } from '@prisma/client';
import { spawnPromise } from '~/utils/fuzz';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const { name } = await readBody(event);
  const project = await prisma.project.create({
    data: {
      type:"closeFuzz",
      name
    },
  })
  
  await startCloseFuzz(project);

  return useResponseSuccess(project);
});

async function startCloseFuzz(project: Project) {
  const {
    id, 
    name
  } = project;
  const data = {
    name,
  }
  const jsonString = JSON.stringify(data, null, 4);
  await writeFile(id, jsonString);
  spawnPromise('bash', ['bash/closefuzz.sh', id], id)
    .then((output: string) => {
      console.log('closefuzz.sh执行成功');
    })
    .catch((error: Error) => {
      console.error('命令执行失败:', error);
    });
}

async function writeFile(id: string, jsonString: string) {
  try {
    await fs.mkdir(`work/${id}`, { recursive: true });
    await fs.writeFile(`work/${id}/config.json`, jsonString);
    console.log('File written successfully');
  } catch (err) {
    console.error('Error writing file:', err);
  }
}