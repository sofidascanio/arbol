import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
    console.info('Seeding database...');

    await prisma.bookmarkTag.deleteMany();
    await prisma.bookmark.deleteMany();
    await prisma.folder.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();

    // usuarios 
    const passwordHash = await bcrypt.hash('password123', 10);

    const alex = await prisma.user.create({
        data: {
            username: 'alex',
            password: passwordHash,
        },
    });

    const sara = await prisma.user.create({
        data: {
            username: 'sara',
            password: passwordHash,
        },
    });

    console.info(`Created users: ${alex.username}, ${sara.username}`);

    const tags = await Promise.all([
        prisma.tag.create({ data: { name: 'design',        color: '#60a5fa', userId: alex.id } }),
        prisma.tag.create({ data: { name: 'ux',            color: '#4ade80', userId: alex.id } }),
        prisma.tag.create({ data: { name: 'engineering',   color: '#fbbf24', userId: alex.id } }),
        prisma.tag.create({ data: { name: 'architecture',  color: '#f87171', userId: alex.id } }),
        prisma.tag.create({ data: { name: 'inspiration',   color: '#c084fc', userId: alex.id } }),
        prisma.tag.create({ data: { name: 'resources',     color: '#fb923c', userId: alex.id } }),
        prisma.tag.create({ data: { name: 'typography',    color: '#34d399', userId: alex.id } }),
        prisma.tag.create({ data: { name: '3d',            color: '#a78bfa', userId: alex.id } }),
        prisma.tag.create({ data: { name: 'ai',            color: '#60a5fa', userId: alex.id } }),
        prisma.tag.create({ data: { name: 'personal',      color: '#4ade80', userId: alex.id } }),
    ]);

    // helper para buscar tag por nombre
    const tag = (name: string) => tags.find(t => t.name === name)!;

    console.info(`Created ${tags.length} tags`);

    // carpeta de Alex 
    const workFolder = await prisma.folder.create({
        data: { name: 'Work', userId: alex.id },
    });

    const personalFolder = await prisma.folder.create({
        data: { name: 'Personal', userId: alex.id },
    });

    const inspirationFolder = await prisma.folder.create({
        data: { name: 'Inspiration', userId: alex.id },
    });

    // subcarpetas dentro de inspiration
    const colorPalettesFolder = await prisma.folder.create({
        data: {
            name: 'Color Palettes',
            userId: alex.id,
            parentId: inspirationFolder.id,
        },
    });

    const typographyFolder = await prisma.folder.create({
        data: {
            name: 'Typography',
            userId: alex.id,
            parentId: inspirationFolder.id,
        },
    });

    const uiPatternsFolder = await prisma.folder.create({
        data: {
            name: 'UI Patterns',
            userId: alex.id,
            parentId: inspirationFolder.id,
        },
    });

    console.info(`Created folders for ${alex.username}`);

    // marcadores de Alex 
    const bookmarksData = [
        // Work
        {
            title: 'Understanding Modern Minimalist Design Patterns',
            url: 'https://uxdesign.cc/minimalist-patterns-2024',
            description: 'A comprehensive guide on creating accessible and scalable user interfaces for modern web applications.',
            folderId: workFolder.id,
            tagNames: ['design', 'ux'],
        },
        {
            title: 'Tailwind CSS v4 Configuration Guide',
            url: 'https://tailwindcss.com/docs/v4-upgrade',
            description: 'Complete migration guide from v3 to v4 with breaking changes and new features.',
            folderId: workFolder.id,
            tagNames: ['engineering'],
        },
        {
            title: 'Q4 Roadmap for Personal Projects',
            url: 'https://notion.so/work-workspace/q4-roadmap',
            description: 'Planning document for side projects and learning goals for Q4 2024.',
            folderId: workFolder.id,
            tagNames: ['resources'],
        },
        // Inspiration > UI Patterns
        {
            title: 'Abstract Flow Hero Design',
            url: 'https://dribbble.com/shots/abstract-flow-hero',
            description: 'Excellent use of depth through background blurs and layering. Reference for the landing page project.',
            folderId: uiPatternsFolder.id,
            tagNames: ['design', 'inspiration'],
        },
        {
            title: 'Vitality Tracker Dashboard',
            url: 'https://mobbin.design/apps/vitality',
            description: 'Clean data visualization patterns for health-related metrics. Focus on font-weight hierarchy.',
            folderId: uiPatternsFolder.id,
            tagNames: ['design', 'ux'],
        },
        {
            title: 'Contextual Sidebar Patterns',
            url: 'https://lapa.ninja/sidebar-patterns',
            description: 'Unique navigation shell logic. High quality reference for the desktop app redesign.',
            folderId: uiPatternsFolder.id,
            tagNames: ['design', 'ux'],
        },
        // Inspiration > Typography
        {
            title: 'Serif & Sans Pairings',
            url: 'https://fontshare.com/pairings',
            description: 'A definitive guide for modern branding. The Editorial New pairing is particularly strong.',
            folderId: typographyFolder.id,
            tagNames: ['typography', 'design'],
        },
        // Inspiration > Color Palettes
        {
            title: 'Metallic Organic Sculptures',
            url: 'https://behance.net/gallery/metallic-organic',
            description: 'Inspiration for landing page background textures and illustrative elements for the marketing site.',
            folderId: colorPalettesFolder.id,
            tagNames: ['3d', 'inspiration'],
        },
        // Sin carpeta (raíz)
        {
            title: 'Design Systems Reference',
            url: 'https://designsystems.surf',
            description: 'A comprehensive guide on building scalable UI components with Figma and Tailwind CSS.',
            folderId: null,
            tagNames: ['design', 'resources'],
        },
        {
            title: 'AI-driven Workflows for Knowledge Workers',
            url: 'https://magi.ai/blog/workflows-productivity',
            description: 'How AI tools are reshaping the daily workflows of designers and developers.',
            folderId: null,
            tagNames: ['ai', 'resources'],
        },
        {
            title: 'Frontend Performance Case Study',
            url: 'https://web.dev/case-study/frontend-performance',
            description: 'Case study on optimizing Web Vitals for high-traffic content sites.',
            folderId: null,
            tagNames: ['engineering'],
        },
        {
            title: 'Productivity Toolkit 2024',
            url: 'https://producthunt.com/stories/productivity-toolkit',
            description: 'Curated list of apps and methods for deep focus and better writing.',
            folderId: personalFolder.id,
            tagNames: ['personal', 'resources'],
        },
        {
            title: 'Minimalist Architectures — Tokyo',
            url: 'https://archdaily.com/tokyo-minimalist',
            description: 'Visual inspiration from Tokyo\'s latest contemporary residential projects.',
            folderId: inspirationFolder.id,
            tagNames: ['architecture', 'inspiration'],
        },
        {
            title: 'A List Apart: The Future of Web Standards',
            url: 'https://alistapart.com/article/web-standards-2025',
            description: 'Thoughtful analysis on where web standards are heading in the next decade.',
            folderId: null,
            tagNames: ['engineering'],
        },
    ];

    for (const bm of bookmarksData) {
        const { tagNames, ...bookmarkFields } = bm;

        await prisma.bookmark.create({
            data: {
                ...bookmarkFields,
                userId: alex.id,
                tags: {
                    create: tagNames.map(name => ({
                        tag: {
                        connect: { id: tag(name).id },
                        },
                    })),
                },
            },
        });
    }

    console.info(`✅ Created ${bookmarksData.length} bookmarks for ${alex.username}`);

    // carpetas y marcadores de Sara (datos minimos) 
    const saraWork = await prisma.folder.create({
        data: { name: 'Work', userId: sara.id },
    });

    await prisma.bookmark.create({
        data: {
            title: 'React Query Documentation',
            url: 'https://tanstack.com/query/latest',
            description: 'Official docs for TanStack Query v5.',
            userId: sara.id,
            folderId: saraWork.id,
        },
    });

    console.info(`Created sample data for ${sara.username}`);
    console.info('Seed completed successfully!');
}

main()
    .catch(e => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });