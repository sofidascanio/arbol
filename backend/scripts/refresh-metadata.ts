import { PrismaClient } from '@prisma/client';
import { fetchUrlMetadata } from '../src/utils/metadata';

const prisma = new PrismaClient();

async function main(): Promise<void> {
    const bookmarks = await prisma.bookmark.findMany({
        where: {
            OR: [
                { imageUrl: null },
                { faviconUrl: null },
            ],
        },
        select: { id: true, url: true, title: true },
    });

    console.info(`${bookmarks.length} marcadores sin metadata completa`);

    let success = 0;
    let failed = 0;

    for (const bm of bookmarks) {
        try {
            const meta = await fetchUrlMetadata(bm.url);

            await prisma.bookmark.update({
                where: { id: bm.id },
                data: {
                faviconUrl: meta.faviconUrl ?? undefined,
                imageUrl: meta.imageUrl ?? undefined,
                },
            });

            console.info(`✅ ${bm.title}`);
            success++;
        } catch {
            console.error(`❌ ${bm.title} — ${bm.url}`);
            failed++;
        }

        // delay para no saturar los servidores externos
        await new Promise(r => setTimeout(r, 500));
    }

    console.info(`\nListo: ${success} actualizados, ${failed} fallidos`);
}

main()
    .catch(e => {
        console.error(e);
    })
    .finally(() => prisma.$disconnect());