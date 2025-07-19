import React from 'react'
import { Routes, Route } from 'react-router-dom'
import MonitoringOverview from './MonitoringOverview'
import Metrics from './Metrics'
import Alerts from './Alerts'

const Monitoring: React.FC = () => {
  return (
    <Routes>
      <Route index element={<MonitoringOverview />} />
      <Route path="metrics" element={<Metrics />} />
      <Route path="alerts" element={<Alerts />} />
    </Routes>
  )
}

export default Monitoring