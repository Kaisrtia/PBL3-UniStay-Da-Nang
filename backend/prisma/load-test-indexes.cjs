const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const iterations = Number(process.env.LOAD_TEST_ITERATIONS || 200);

const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;

const flattenPlanNodes = (node, output = []) => {
  if (!node) return output;

  output.push({
    nodeType: node['Node Type'],
    indexName: node['Index Name'] || '',
    relationName: node['Relation Name'] || ''
  });

  for (const child of node.Plans || []) {
    flattenPlanNodes(child, output);
  }

  return output;
};

const explain = async (sql) => {
  const rows = await prisma.$queryRawUnsafe(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`);
  const result = rows[0]['QUERY PLAN'][0];
  const nodes = flattenPlanNodes(result.Plan)
    .filter((node) => node.indexName || node.nodeType?.includes('Scan'))
    .slice(0, 5)
    .map((node) => [node.nodeType, node.indexName || node.relationName].filter(Boolean).join(': '))
    .join(' | ');

  return {
    planningMs: Number(result['Planning Time'].toFixed(3)),
    executionMs: Number(result['Execution Time'].toFixed(3)),
    nodes
  };
};

const bench = async (sql) => {
  for (let index = 0; index < 10; index += 1) {
    await prisma.$queryRawUnsafe(sql);
  }

  const startedAt = process.hrtime.bigint();

  for (let index = 0; index < iterations; index += 1) {
    await prisma.$queryRawUnsafe(sql);
  }

  const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
  return Number((elapsedMs / iterations).toFixed(3));
};

const getSeedContext = async () => {
  const [post] = await prisma.$queryRawUnsafe(`
    SELECT id, "userId", "wardId"
    FROM "post"
    WHERE status = 'APPROVED'
    ORDER BY "createdAt" DESC
    LIMIT 1
  `);
  const [commentedPost] = await prisma.$queryRawUnsafe(`
    SELECT "postId" AS id
    FROM "comment"
    WHERE status = 'DISPLAYED'
    GROUP BY "postId"
    ORDER BY COUNT(*) DESC
    LIMIT 1
  `);
  const [amenity] = await prisma.$queryRawUnsafe(`
    SELECT "amenityId" AS id
    FROM "post_amenity"
    GROUP BY "amenityId"
    ORDER BY COUNT(*) DESC
    LIMIT 1
  `);

  if (!post || !commentedPost || !amenity) {
    throw new Error('Local seed data is missing. Run `npm run seed:local` before this load test.');
  }

  return {
    postId: post.id,
    userId: post.userId,
    wardId: Number(post.wardId),
    commentedPostId: commentedPost.id,
    amenityId: Number(amenity.id)
  };
};

const buildQueries = ({ postId, userId, wardId, commentedPostId, amenityId }) => [
  {
    name: 'public_feed_latest',
    index: 'post_status_createdAt_idx',
    sql: `
      SELECT id, title, price, area, "createdAt"
      FROM "post"
      WHERE status = 'APPROVED'
      ORDER BY "createdAt" DESC
      LIMIT 20
    `
  },
  {
    name: 'public_feed_by_ward',
    index: 'post_status_wardId_createdAt_idx',
    sql: `
      SELECT id, title, "wardId", "createdAt"
      FROM "post"
      WHERE status = 'APPROVED' AND "wardId" = ${wardId}
      ORDER BY "createdAt" DESC
      LIMIT 20
    `
  },
  {
    name: 'filter_price_range',
    index: 'post_status_price_idx',
    sql: `
      SELECT id, title, price
      FROM "post"
      WHERE status = 'APPROVED' AND price BETWEEN 1800000 AND 4500000
      ORDER BY price ASC
      LIMIT 30
    `
  },
  {
    name: 'filter_area_range',
    index: 'post_status_area_idx',
    sql: `
      SELECT id, title, area
      FROM "post"
      WHERE status = 'APPROVED' AND area BETWEEN 18 AND 40
      ORDER BY area ASC
      LIMIT 30
    `
  },
  {
    name: 'host_posts',
    index: 'post_userId_createdAt_idx',
    sql: `
      SELECT id, title, "createdAt"
      FROM "post"
      WHERE "userId" = ${quote(userId)}
      ORDER BY "createdAt" DESC
      LIMIT 30
    `
  },
  {
    name: 'post_root_comments',
    index: 'comment_postId_status_parentId_createdAt_idx',
    sql: `
      SELECT id, content, "createdAt"
      FROM "comment"
      WHERE "postId" = ${quote(commentedPostId)}
        AND status = 'DISPLAYED'
        AND "parentId" IS NULL
      ORDER BY "createdAt" ASC
      LIMIT 50
    `
  },
  {
    name: 'post_reports',
    index: 'report_postId_idx',
    sql: `
      SELECT id, status, reason
      FROM "report"
      WHERE "postId" = ${quote(postId)}
      LIMIT 20
    `
  },
  {
    name: 'pending_reports_admin',
    index: 'report_status_createdAt_idx',
    sql: `
      SELECT id, status, "createdAt"
      FROM "report"
      WHERE status = 'PENDING'
      ORDER BY "createdAt" DESC
      LIMIT 50
    `
  },
  {
    name: 'amenity_to_posts',
    index: 'post_amenity_amenityId_postId_idx',
    sql: `
      SELECT p.id, p.title
      FROM "post_amenity" pa
      JOIN "post" p ON p.id = pa."postId"
      WHERE pa."amenityId" = ${amenityId}
        AND p.status = 'APPROVED'
      LIMIT 50
    `
  }
];

const main = async () => {
  const context = await getSeedContext();
  const queries = buildQueries(context);
  const rows = [];

  for (const query of queries) {
    const plan = await explain(query.sql);
    const averageMs = await bench(query.sql);
    rows.push({
      query: query.name,
      expectedIndex: query.index,
      avgMs: averageMs,
      explainMs: plan.executionMs,
      plan: plan.nodes
    });
  }

  console.table(rows);
  console.log(`Iterations/query: ${iterations}`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
