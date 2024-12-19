import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {

    const { id, type, codeText ,report, status} = await readBody(event);
    console.log("Scan result save param: id:", id);
    console.log("Scan result save param: type:", type);
    console.log("Scan result save param: codeText:\n", codeText);
    console.log("Scan result save param: report:\n", report);

    // 先删除该项目已有的 bugs
    await prisma.bug.deleteMany({
        where: {
        projectId: id,
        },
    });

    if (id) {
        const now = new Date();
        const nowstring = now.toString();
        const bug = await prisma.bug.create({
            data:{
                name: "代码扫描",
                type: type,
                risk: "高",
                firstTime: nowstring,
                total: 1,
                codeText: codeText,
                report: report,
                projectId: id,
                status,
            },
        });

        return useResponseSuccess(bug);

    } else {
        return useResponseError('Scan result save error: no id', 'Scan result save error: no id');
    }

});