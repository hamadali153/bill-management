const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateData() {
  try {
    console.log('Starting data migration...')

    // First, create the default consumers
    const consumers = ['Hamad', 'Muneer', 'Ameer']
    const createdConsumers = {}

    for (const consumerName of consumers) {
      const consumer = await prisma.consumer.upsert({
        where: { name: consumerName },
        update: {},
        create: {
          name: consumerName,
          isActive: true
        }
      })
      createdConsumers[consumerName] = consumer.id
      console.log(`Created/Found consumer: ${consumerName} (ID: ${consumer.id})`)
    }

    // Get all existing bills that still have consumerName but no consumerId
    const existingBills = await prisma.bill.findMany({
      where: {
        consumerName: {
          not: null
        },
        consumerId: null
      }
    })

    console.log(`Found ${existingBills.length} bills to migrate`)

    // Update each bill with the appropriate consumer ID
    for (const bill of existingBills) {
      const consumerName = bill.consumerName
      const consumerId = createdConsumers[consumerName]

      if (consumerId) {
        await prisma.bill.update({
          where: { id: bill.id },
          data: { consumerId }
        })
        console.log(`Updated bill ${bill.id} with consumer ${consumerName}`)
      } else {
        console.warn(`No consumer found for bill ${bill.id} with consumerName: ${consumerName}`)
      }
    }

    // Optional: Remove consumerName field after successful migration
    console.log('Migration completed successfully!')
    console.log('Note: You can now remove the consumerName field from the schema if desired.')
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateData()
