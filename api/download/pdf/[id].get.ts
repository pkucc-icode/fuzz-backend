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
  
    const bug = await prisma.bug.findUnique({
      where: {
          id
      }
    })

    const doc = new PDFDocument();

    const { crash } = bug;
    doc.fontSize(16).text(crash, 100, 100);

    // 设置响应头
    event.res.setHeader('Content-Type', 'application/pdf');
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