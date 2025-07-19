import React from 'react'
import { Routes, Route } from 'react-router-dom'
import InfrastructureOverview from './InfrastructureOverview'
import Resources from './Resources'
import Templates from './Templates'

const Infrastructure: React.FC = () => {
  return (
    <Routes>
      <Route index element={<InfrastructureOverview />} />
      <Route path="resources" element={<Resources />} />
      <Route path="templates" element={<Templates />} />
    </Routes>
  )
}

export default Infrastructure