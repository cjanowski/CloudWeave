import React from 'react'
import { Routes, Route } from 'react-router-dom'
import DeploymentOverview from './DeploymentOverview'
import Pipelines from './Pipelines'
import History from './History'

const Deployments: React.FC = () => {
  return (
    <Routes>
      <Route index element={<DeploymentOverview />} />
      <Route path="pipelines" element={<Pipelines />} />
      <Route path="history" element={<History />} />
    </Routes>
  )
}

export default Deployments