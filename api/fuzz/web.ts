import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';
import prisma from "~/lib/prisma";
import fs from 'fs/promises';
import { spawnPromise } from '~/utils/fuzz';
import { Project } from '@prisma/client';

// interface ProjectParam {
//   executionTime: string;
//   targetIp: string;
//   targetPort: string;
//   useSSL: boolean;
//   enableCheckers: string;
//   disableCheckers: string;
//   host: string;
//   tokenRefreshInterval: string;
//   tokenRefreshCommand: string;
// }


export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const { 
    name, 
    filePath, 
    executionTime,
    tokenRefreshInterval,
    tokenRefreshCommand,
    useSSL,
    enableCheckers,
    disableCheckers,
    targetIp,
    domain,
    targetPort
   } = await readBody(event);
  const project = await prisma.project.create({
    data: {
      type: "webFuzz",
      name,
      filePath,
      param: {
        executionTime,
        tokenRefreshInterval,
        tokenRefreshCommand,
        useSSL,
        enableCheckers,
        disableCheckers,
        targetIp,
        domain,
        targetPort,
      }
    },
  })

  await startWebFuzz(project);

  return useResponseSuccess(project);
});




async function startWebFuzz(project: Project) {
 const {
    id,
    name,
    filePath,
    param,
 } = project;
  const {
    executionTime: fuzz_execution_time,
    targetIp: target_ip,
    targetPort: target_port,
    useSSL: use_ssl,
    enableCheckers: enable_checkers,
    disableCheckers: disable_checkers,
    host,
    tokenRefreshInterval: token_refresh_interval,
    tokenRefreshCommand: token_refresh_command,
  } = param as Record<string, any>;
  const data = {
      "project_id": name,
      "fuzz_task_name": name,
      "package_filename": filePath,
      "fuzz_execution_time": fuzz_execution_time,
      "target_ip": target_ip,
      "target_port": target_port,
      "use_ssl": use_ssl,
      "enable_checkers": enable_checkers,
      "disable_checkers": disable_checkers,
      "host": host,
      "token_refresh_interval": token_refresh_interval,
      "token_refresh_command": token_refresh_command
  };

  const jsonString = JSON.stringify(data, null, 4);
  await writeFile(id, jsonString);

  spawnPromise('bash', ['webfuzz.sh', id], id)
    .then((output: string) => {
      console.log('webfuzz.sh执行成功');
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