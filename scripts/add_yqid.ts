import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 漏洞清单里面需要给每一个漏洞添加统一格式的编号：yqid，比如YQ-2025-0001，
 * 最前面字母表示燕智科技内部漏洞，2025是发现时间具体到年就行，
 * 组后是4-5位编号从0001开始递增，四位满了就用五位
 */
async function main() {
//   const user = await prisma.bug.updateMany({
//     data: {
//       name: 'Alice',
//       password: 'Alice',
//       email: 'alice@prisma.io',
//     },
//   })

    const bugs = await prisma.bug.findMany({
        select: {
        id: true,
        createdAt: true,
        },
        orderBy: {
        createdAt: 'asc',
        },
    })
    
    for (let i = 0; i < bugs.length; i++) {
        const bug = bugs[i]
        const yqid = `YQ-${bug.createdAt.getFullYear()}-${(i + 1).toString().padStart(4, '0')}`
        await prisma.bug.update({
        where: {
            id: bug.id,
        },
        data: {
            yqid,
        },
        })
    }
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