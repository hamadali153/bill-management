'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import BillForm from './components/BillForm'
import BillsList from './components/BillsList'
import Dashboard from './components/Dashboard'
import ExportSection from './components/ExportSection'
import ConsumerList from './components/ConsumerList'

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleBillSubmit = () => {
    // Trigger refresh of bills list and dashboard
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Office Bill Management System</h1>
        <p className="text-muted-foreground">
          Track and manage breakfast, lunch, and dinner expenses for your office
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="secondary">Hamad</Badge>
          <Badge variant="secondary">Muneer</Badge>
          <Badge variant="secondary">Ameer</Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="add-bill" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="add-bill">Add Bill</TabsTrigger>
          <TabsTrigger value="bills-list">Bills History</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="consumers">Consumers</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="add-bill" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Bill</CardTitle>
              <CardDescription>
                Record a new meal expense for breakfast, lunch, or dinner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BillForm onSubmit={handleBillSubmit} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bills-list" className="space-y-4">
          <BillsList key={refreshKey} />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <Dashboard key={refreshKey} />
        </TabsContent>

        <TabsContent value="consumers" className="space-y-4">
          <ConsumerList key={refreshKey} />
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <ExportSection />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground border-t pt-4">
        <p>Built with Next.js, PostgreSQL, and shadcn/ui</p>
      </div>
    </div>
  )
}
