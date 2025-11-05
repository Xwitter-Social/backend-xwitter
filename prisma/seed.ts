import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const existingUsers = await prisma.user.count();

  if (existingUsers > 0) {
    console.log('🌱 Seed skipped: data already exists.');
    return;
  }

  console.log('🌱 Seeding database with development data...');

  const passwordHash = await bcrypt.hash('xwitter123', 10);

  const [alice, bob, charlie] = await prisma.$transaction([
    prisma.user.create({
      data: {
        email: 'alice@xwitter.dev',
        username: 'alice',
        name: 'Alice Martins',
        password: passwordHash,
        bio: 'Engenheira de software e entusiasta de front-end.',
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob@xwitter.dev',
        username: 'bob',
        name: 'Bob Albuquerque',
        password: passwordHash,
        bio: 'Backend lover ⚙️ e fã de arquitetura limpa.',
      },
    }),
    prisma.user.create({
      data: {
        email: 'charlie@xwitter.dev',
        username: 'charlie',
        name: 'Charlie Ferreira',
        password: passwordHash,
        bio: 'Product designer que adora UX acessível.',
      },
    }),
  ]);

  const [helloWorldPost, designPost] = await prisma.$transaction([
    prisma.post.create({
      data: {
        content:
          'Olá, Xwitter! Acabei de subir o backend e ele está um foguete 🚀',
        authorId: alice.id,
      },
    }),
    prisma.post.create({
      data: {
        content:
          'Design é sobre resolver problemas reais com empatia. Qual foi o último app que te surpreendeu?',
        authorId: charlie.id,
      },
    }),
  ]);

  await prisma.comment.create({
    data: {
      content: 'Bem-vinda Alice! Vamos construir uma timeline incrível. 💪',
      authorId: bob.id,
      postId: helloWorldPost.id,
    },
  });

  await prisma.comment.create({
    data: {
      content:
        'A nova versão do Figma tá sensacional! Já testou os recursos de AI? 😍',
      authorId: alice.id,
      postId: designPost.id,
    },
  });

  await prisma.like.createMany({
    data: [
      { userId: bob.id, postId: helloWorldPost.id },
      { userId: charlie.id, postId: helloWorldPost.id },
      { userId: alice.id, postId: designPost.id },
    ],
    skipDuplicates: true,
  });

  await prisma.follow.createMany({
    data: [
      { followerId: alice.id, followingId: bob.id },
      { followerId: alice.id, followingId: charlie.id },
      { followerId: bob.id, followingId: alice.id },
      { followerId: charlie.id, followingId: alice.id },
    ],
    skipDuplicates: true,
  });

  await prisma.repost.create({
    data: {
      userId: bob.id,
      postId: helloWorldPost.id,
    },
  });

  await prisma.conversation.create({
    data: {
      participants: {
        connect: [{ id: alice.id }, { id: bob.id }],
      },
      messages: {
        create: [
          {
            content:
              'Ei, Bob! Vamos revisar as histórias da sprint mais tarde?',
            author: {
              connect: { id: alice.id },
            },
          },
          {
            content: 'Bora! Já deixei os testes da conversa passando aqui. 👍',
            author: {
              connect: { id: bob.id },
            },
          },
        ],
      },
    },
  });

  console.log('✅ Seed concluído com sucesso!');
}

main()
  .catch((error) => {
    console.error('❌ Seed falhou:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
