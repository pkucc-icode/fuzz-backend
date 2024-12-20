import prisma from '~/lib/prisma';
import { readFileContent } from '~/utils/fuzz';

export default defineEventHandler(async (event) => {
  const { id, status, result } = await readBody(event);
  console.log(id, status, result);

  const project = await prisma.project.update({
    where: {
      id,
    },
    data: {
      status,
      result,
    },
  });

  return useResponseSuccess(project);
});