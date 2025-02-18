import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse } from '~/utils/response';
import prisma from '~/lib/prisma';
import PDFDocument from 'pdfkit';

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

    const doc = new PDFDocument();

    // 加载中文字体文件
    const fontPath = './simsunb.ttf';
    doc.registerFont('SimSun', fontPath);

    const { name, type, repoUrl, param, bugs,startTime, status, taskCount, coverage, projectBugs } = project;
    const title = `${name}项目漏洞挖掘报告`
    doc.fontSize(16).text(title, 100, 100, {
      align: 'center'
    });

    const introduce = `
    一、项目介绍
     项目参数
      项目名 ${name}
      类型 ${type}
      项目源码 ${repoUrl}
      编译器 ${param.compiler}
      默认编译配置 ${param.compilerSettings}
      模糊测试时间 ${param.fuzzTime}
      模糊测试目标 ${param.fuzzTarget}
      模糊测试命令 ${param.fuzzCommands}

    `

    doc.fontSize(16).text(introduce, 100, 100, {
      align: 'left'
    });

  
    const report = `
     项目FUZZ报告
      Bug总数 ${bugs}
      开始时间 ${startTime}
      状态 ${status}
      覆盖率 ${coverage}
      任务数量 ${taskCount}

    `

    doc.fontSize(16).text(report, 100, 100, {
      align: 'left'
    });


    const detail = `
      二、漏洞详情
    `
    let bugDetails = '';

    projectBugs.forEach((projectBug: Record<string, any>, index: number) => {
      bugDetails += `
      ${index + 1}、${projectBug.name}漏洞详情
      
      漏洞类型：
      ${projectBug.type}

      风险等级：
      ${projectBug.risk}

      发现时间：
      ${projectBug.time}

      漏洞描述：
      ${projectBug.desc}

      修复建议：
      ${projectBug.fix}

      源码文件路径: 
      ${projectBug.source}

      漏洞源码：
      ${projectBug.codeText}

      ASAN报告:
      ${projectBug.report}
    `;
    });


    doc.fontSize(16).text(detail + bugDetails, 100, 100, {
      align: 'left'
    });

    const filename = `${name}报告.pdf`

    // 设置响应头
    event.res.setHeader('Content-Type', 'application/pdf');
    // event.res.setHeader(`Content-Disposition', 'attachment; filename="${filename}"`);
    event.res.setHeader('Content-Disposition', 'attachment; filename="generated.pdf"');
    // 将内容作为文件流返回
    event.res.writeHead(200);
    // 将 PDF 数据管道传输到响应流
    doc.pipe(event.res);

    doc.end();

    // 监听 PDF 文档结束事件，确保数据完全写入响应流
    doc.on('end', () => {
      event.res.end();
    });

  });