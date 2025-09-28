'use client'

import { useState } from 'react'
import { Layout } from '@/components/Layout'

export default function NotificationsPage() {
  return (
    <Layout>
      <div className='flex-column align-center p-8'>
        <h2 className='text-2xl mb-2'>Notifications</h2>
        <p>This is an example page with the standard layout.</p>
      </div>
    </Layout>
  )
}
