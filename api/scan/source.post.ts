import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';
import { scanSpawnPromise } from '~/utils/scan';
import prisma from '~/lib/prisma';
import fs from 'fs/promises';

export default eventHandler(async (event) => {
    
    const userinfo = verifyAccessToken(event);
    if (!userinfo) {
        return unAuthorizedResponse(event);
    }
    
    const {
        id,
        name,
        repoUrl,
        filePath,
    } = await readBody(event);


    if(id) {
        const project = await prisma.project.update({
            where: {
                id
            },
            data: {
                type: 'sourceScan',
                name,
                repoUrl,
                filePath,
            },
        });

        await startSourceScan(id, name, repoUrl, filePath);
        return useResponseSuccess(project);

    } else {
        const project = await prisma.project.create({
          data: {
            type: 'sourceScan',
            name,
            repoUrl,
            filePath,
          },
        });
    
        const { id } = project;
    
        await startSourceScan(id, name, repoUrl, filePath);
    
        return useResponseSuccess(project);
    }

});

async function startSourceScan(id: string, name: string, repoUrl: string, filePath: string) 
{
   const data = {
     "program_name": name,
     "url": repoUrl || '',
     "source_code_path": filePath || '',
   };
 
   const jsonString = JSON.stringify(data, null, 4); // 第三个参数4用于格式化输出
   await writeFile(id, jsonString);
 
   
   scanSpawnPromise('bash', ['bash/scan.sh', id], id)
     .then((output: string) => {
       console.log('runscan.sh执行成功');
     })
     .catch((error: Error) => {
       console.error('runscan命令执行失败:', error);
     });
   
 }

 async function writeFile(id: string, jsonString: string) {
  try {
    await fs.mkdir(`work/${id}`, { recursive: true });
    await fs.writeFile(`work/${id}/scan-config.json`, jsonString);
    console.log('File written successfully');
  } catch (err) {
    console.error('Error writing file:', err);
  }
}