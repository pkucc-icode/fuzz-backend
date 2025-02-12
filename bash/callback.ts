// script.ts

import { PrismaClient } from '@prisma/client'
import { readFileContent } from '../utils/fuzz';

const prisma = new PrismaClient()

interface BugDetail {
  bug_id: string;
  checker_name: string;
  error_code: string;
  reproducible: string;
  bug_file_path: string;
  replay_file_path: string;
}


async function main() {
  const args = process.argv.slice(2); // 跳过前两个默认参数（node路径和脚本路径）


  if (args.length > 1) {
    // console.log("Second argument:", args[1]);
    const id = args[0]
    const result = args[1]
    if (result == "") {
      await prisma.project.update({
        where: {
          id: id,
        },
        data: {
          status: 'FAIL',
        },
      });
    } else {
      await callback(id, result)
    }
  }
}

async function callback(id: string, result: string) {

  const project = await prisma.project.findUnique({
    where: {
        id
    },
  })

  const type = project?.type;

  if (!type) {
    return;
  }

  const res_obj = JSON.parse(result);

  if (type == 'openFuzz') {
    await callbackOpenFuzz(id, res_obj);
  }

  if (type == 'webFuzz') {
    await callbackWebFuzz(id, res_obj);
  }

  if (type == 'sourceScan') {
    await callbackScan(id, res_obj);
  }

  await prisma.project.update({
    where: {
      id,
    },
    data: {
      status: 'SUCCESS',
      result: res_obj,
    },
  });
}


async function callbackScan(id: string, result: Record<string, any>) {
  await prisma.scan.deleteMany({
    where: {
      projectId: id,
    },
  });
  const formattedScans = result.map((bug: { type: string; code_line: number; code: string }) => ({
    type: bug.type,
    codeLine: bug.code_line, // 转换 code_line 到 codeLine
    code: bug.code,
    projectId: id, // 需要将 id 关联到每条 bug 记录
  }));

  if (id) {
    await prisma.scan.createMany({
      data: formattedScans,
      skipDuplicates: true, // 可选：跳过重复的记录（基于唯一约束）
    });
  }
}


async function callbackWebFuzz(id: string, result: Record<string, any>) {

  const { bug_details } = result;

  const bugs = await Promise.all(
    bug_details.map(async (bugdetail: BugDetail) => {
      const report = await readFileContent(bugdetail.bug_file_path);
      const crash = await readFileContent(bugdetail.replay_file_path);
      return {
        name: bugdetail.checker_name || 'Unknown',
        type: "webfuzz",
        detail: bugdetail,
        report,
        crash,
        projectId: id
      };
    })
  );

  await prisma.bug.createMany({
    data: bugs,
    skipDuplicates: true,
  });
}

async function callbackOpenFuzz(id: string, result: Record<string, any>) {
  const { code_coverage, fuzzing_task_count, total_bugs_found, bugs_found } = result;
  const { bitmap_cvg } = code_coverage;

  // 先删除该项目已有的 bugs
  await prisma.bug.deleteMany({
    where: {
      projectId: id,
    },
  });

  if (bugs_found) {
    await Promise.all(
      bugs_found.map(async (bug: Record<string, any>) => {
        const crash = await readFileContent(bug.crash_file_path);
        return prisma.bug.create({
          data: {
            name: bug.bug_id,
            type: bug.bug_type,
            risk: bug.risk_level,
            desc: bug.bug_description,
            fix: bug.fix_recommendation,
            firstTime: bug.first_discovery_time,
            total: bug.total_discovery_count,
            codeText: bug.risk_code_display_file,
            report: bug.asan_report_file,
            crash: cleanData(crash),
            projectId: id,
          },
        });
      })
    );
  }

  await prisma.project.update({
    where: {
      id: id,
    },
    data: {
      status: 'SUCCESS',
      result,
      coverage: bitmap_cvg,
      taskCount: fuzzing_task_count,
      bugs: total_bugs_found
    },
  });
}



function cleanData(data: any) {
  if (typeof data === 'string') {
    return data.replace(/\x00/g, '');
  } else if (Buffer.isBuffer(data)) {
    let result = Buffer.alloc(data.length);
    let index = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] !== 0) {
        result[index++] = data[i];
      }
    }
    return result.slice(0, index);
  }
  return data;
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

export { }; // 将文件标记为模块
