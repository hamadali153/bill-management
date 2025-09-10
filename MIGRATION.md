# Data Migration Guide

This guide will help you migrate your existing bill data to work with the new consumer management system.

## What Changed

- Added a `Consumer` model to manage consumers dynamically
- Updated the `Bill` model to reference consumers via `consumerId` instead of storing `consumerName` directly
- All existing hardcoded consumer names are now managed through the database

## Migration Steps

### 1. Update Database Schema

First, you need to update your database schema to include the new Consumer model and temporarily keep the old consumerName field:

```bash
npx prisma db push
```

### 2. Run the Migration Script

The migration script will:
- Create the default consumers (Hamad, Muneer, Ameer) in the database
- Update all existing bills to reference the correct consumer IDs

```bash
node migrate-data.js
```

### 3. Verify Migration

After running the migration, you can verify that everything worked correctly by:

1. Starting your development server: `npm run dev`
2. Checking the Consumers tab to see if the default consumers are there
3. Checking the Bills History to ensure all bills still show the correct consumer names
4. Verifying the Dashboard still shows correct data

### 4. Clean Up Schema (Optional)

After successful migration, you can remove the old `consumerName` field from the schema:

1. Edit `prisma/schema.prisma` and remove the `consumerName` field from the Bill model
2. Run `npx prisma db push` to update the database
3. Run `npx prisma generate` to regenerate the Prisma client

## What the Migration Does

1. **Creates Default Consumers**: Creates three consumers with names "Hamad", "Muneer", and "Ameer"
2. **Updates Existing Bills**: Links all existing bills to their corresponding consumer records
3. **Preserves Data**: All your existing bill data (amounts, dates, meal types) remains unchanged

## After Migration

Once the migration is complete, you can:

- Add new consumers through the Consumers tab
- Edit existing consumer information
- Deactivate consumers (they won't appear in bill forms but existing bills remain)
- Delete consumers (only if they have no bills)

## Troubleshooting

If you encounter any issues:

1. **Database Connection**: Make sure your `DATABASE_URL` is correctly set in your `.env` file
2. **Schema Issues**: Run `npx prisma generate` to regenerate the Prisma client
3. **Migration Errors**: Check the console output for specific error messages

## Rollback (if needed)

If you need to rollback the changes:

1. Restore your database from a backup taken before the migration
2. Or manually remove the consumer records and update bills back to use consumerName

## Support

If you encounter any issues during migration, please check the console output for error messages and ensure your database is properly configured.
