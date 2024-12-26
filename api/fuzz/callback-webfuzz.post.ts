import prisma from '~/lib/prisma';
import { readFileContent } from '~/utils/fuzz';

interface BugDetail {
  bug_id: string;
  checker_name: string;
  error_code: string;
  reproducible: string;
  bug_file_path: string;
  replay_file_path: string;
}

export default defineEventHandler(async (event) => {
  const { id, status, result } = await readBody(event);

  const project = await prisma.project.update({
    where: {
      id,
    },
    data: {
      status,
      result,
    },
  });

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


  return useResponseSuccess(project);
});