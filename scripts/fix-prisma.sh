#!/bin/bash
# Script to fix Prisma Client generation issues

echo "🔧 Fixing Prisma Client generation..."

# Remove corrupted Prisma Client
echo "📦 Removing old Prisma Client..."
rm -rf node_modules/.pnpm/@prisma+client*
rm -rf node_modules/@prisma/client
rm -rf node_modules/.prisma

# Regenerate Prisma Client
echo "🔄 Regenerating Prisma Client..."
pnpm prisma generate

# Verify generation
if [ -f "node_modules/.prisma/client/index.js" ]; then
    echo "✅ Prisma Client generated successfully!"
else
    echo "❌ Prisma Client generation failed!"
    exit 1
fi

echo "✨ Done!"
