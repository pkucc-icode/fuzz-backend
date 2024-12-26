import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {

    const { id, scans } = await readBody(event);

    await prisma.scan.deleteMany({
        where: {
            projectId: id,
        },
    });

    const formattedScans = scans.map((bug: { type: string; code_line: number; code: string }) => ({
        type: bug.type,
        codeLine: bug.code_line, // 转换 code_line 到 codeLine
        code: bug.code,
        projectId: id, // 需要将 id 关联到每条 bug 记录
    }));

    if (id) {
        const result = await prisma.scan.createMany({
            data: formattedScans,
            skipDuplicates: true, // 可选：跳过重复的记录（基于唯一约束）
          });
        return useResponseSuccess(result);

    } else {
        return useResponseError('Scan result save error: no id', 'Scan result save error: no id');
    }

});