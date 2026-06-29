const path = require('path');

/** @type {import('prisma').PrismaConfig} */
const config = {
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),
};

module.exports = config;
