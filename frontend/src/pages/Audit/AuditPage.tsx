import React, { useEffect, useState } from 'react';
import { DataTable } from '../../components/common/DataTable';
import { GlassCard } from '../../components/common/GlassCard';
import { PageTransition } from '../../components/Navigation/PageTransition';

const AuditPage = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch audit logs from the API
    setLoading(false);
  }, []);

  const columns = [
    { key: 'createdAt', label: 'Timestamp' },
    { key: 'user', label: 'User' },
    { key: 'action', label: 'Action' },
    { key: 'resourceType', label: 'Resource Type' },
    { key: 'resourceId', label: 'Resource ID' },
    { key: 'details', label: 'Details' },
    { key: 'ipAddress', label: 'IP Address' },
  ];

  return (
    <PageTransition>
      <GlassCard>
        <h1 className="text-2xl font-bold mb-4">Audit Trail</h1>
        <DataTable
          columns={columns}
          data={auditLogs}
          loading={loading}
        />
      </GlassCard>
    </PageTransition>
  );
};

export default AuditPage;