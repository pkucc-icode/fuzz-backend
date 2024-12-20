import { exec, spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { promises as fs } from 'fs';


// 创建一个 Promise 来处理 spawn
export function scanSpawnPromise(command: string, args: string[], id: string) {
    return new Promise((resolve, reject) => {
      const logStream = createWriteStream(`work/${id}/scan.log`);
  
      const child = spawn(command, args);
  
      let output = '';
  
      // 重定向标准输出到文件
      // child.stdout.pipe(logStream);
      child.stdout.on('data', (data) => {
        logStream.write(data);
        output += data.toString(); // 将输出保存到内存，供后续使用
      });
  
      // 重定向标准错误到文件
      // child.stderr.pipe(logStream);
      child.stderr.on('data', (data) => {
        logStream.write(data);
        output += data.toString(); // 捕获错误输出
      });
  
      // 监听子进程结束
      child.on('close', (code) => {
        logStream.end(); 
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`子进程退出，退出码 ${code}`));
        }
      });
  
      // 监听子进程错误
      child.on('error', (err) => {
        logStream.end(); 
        reject(err);
      });
    });
  }
