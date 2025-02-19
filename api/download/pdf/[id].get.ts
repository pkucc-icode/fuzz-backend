import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';
import prisma from '~/lib/prisma';
import { promisify } from 'util';
import path from 'path';
import { writeFile, createReadStream, mkdir } from 'fs';
import { exec } from 'child_process'; // 用于执行命令行命令
import { defineEventHandler, sendStream, getRouterParam  } from 'h3';


const execAsync = promisify(exec); // 转换为异步函数
const writeFileAsync = promisify(writeFile);
const mkdirAsync = promisify(mkdir)

export default defineEventHandler(async (event) => {
    // const userinfo = verifyAccessToken(event);
    // if (!userinfo) {
    //   return unAuthorizedResponse(event);
    // }
  
    const id = getRouterParam(event, 'id');
  
    const project = await prisma.project.findUnique({
      where: {
          id
      },
      include: {
        projectBugs: true,
      }
    })


    const { name, type, repoUrl, param, bugs,startTime, status, taskCount, coverage, projectBugs } = project;
    const title = `
# ${name}项目漏洞挖掘报告`

    const introduce = `
## 项目介绍
### 项目参数
- 项目名 ${name}
- 类型 ${type}
- 项目源码 ${repoUrl}
- 编译器 ${param.compiler}
- 默认编译配置 ${param.compilerSettings}
- 模糊测试时间 ${param.fuzzTime}
- 模糊测试目标 ${param.fuzzTarget}
- 模糊测试命令 ${param.fuzzCommands}

    `

  
    const report = `
### 项目FUZZ报告
- Bug总数 ${bugs}
- 开始时间 ${startTime}
- 状态 ${status}
- 覆盖率 ${coverage}
- 任务数量 ${taskCount}
    `


    const detail = `
## 漏洞详情
    `
    let bugDetails = '';

    projectBugs.forEach((projectBug: Record<string, any>, index: number) => {
      bugDetails += `
### ${index + 1}、${projectBug.name}漏洞详情

#### 漏洞类型：
${projectBug.type}

#### 风险等级：
${projectBug.risk}

#### 发现时间：
${projectBug.time}

#### 漏洞描述：
${projectBug.desc}

#### 修复建议：
${projectBug.fix}

#### 源码文件路径: 
${projectBug.source}

#### 漏洞源码：
${projectBug.codeText}

#### ASAN报告:

\`\`\`bash
${projectBug.report}
\`\`\`
    `;
    });

    const markdownContent = `
      ${title}
      ${introduce}
      ${report}
      ${detail}
      ${bugDetails}
    `;

    // 保存Markdown文件
    const mdFilePath = `static/${name}-report.md`;
    const pdfFilePath = `static/${name}-report.pdf`;

    // 尝试创建 static 目录，recursive: true 表示如果父目录不存在也会一并创建
    await mkdirAsync(path.dirname(mdFilePath), { recursive: true });

    await writeFileAsync(mdFilePath, markdownContent, 'utf8');

    // console.log('Markdown File Path:', mdFilePath);
    // console.log('PDF File Path:', pdfFilePath);

    // 用pandoc生成pdf文件
    // 使用 pandoc 命令转换Markdown为PDF
    try {
      // 执行 pandoc 命令，使用 xelatex 引擎支持中文
      await execAsync(`pandoc ${mdFilePath} -o ${pdfFilePath} --pdf-engine=xelatex --variable mainfont="Noto Sans CJK SC" --variable sansfont="Noto Sans CJK SC"`);
      console.log('PDF文件生成成功');
    } catch (error) {
        console.error('使用 pandoc 转换为 PDF 失败:', error);
        event.res.writeHead(500);
        event.res.end('PDF生成失败');
    }

    // 设置响应头，返回PDF文件给用户
    event.res.setHeader('Content-Disposition', `attachment; filename="${name}-report.pdf"`);
    event.res.setHeader('Content-Type', 'application/pdf');
    
    // 读取并返回PDF文件
    const pdfStream = createReadStream(pdfFilePath);
    return sendStream(event, pdfStream);

  });