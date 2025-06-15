import { useState, useMemo } from 'react';

const mockActivities = [
  {
    id: "1",
    title: "Ligação de follow-up",
    type: "call",
    date: new Date().toISOString().split('T')[0],
    time: new Date(Date.now() + 3 * 60000).toTimeString().slice(0, 5),
    contact: "João Silva",
    priority: "high",
    status: "scheduled",
    description: "Acompanhamento da proposta enviada"
  },
  {
    id: "2",
    title: "Reunião com cliente",
    type: "meeting",
    date: new Date().toISOString().split('T')[0],
    time: new Date(Date.now() + 10 * 60000).toTimeString().slice(0, 5),
    contact: "Maria Santos",
    priority: "medium",
    status: "scheduled",
    description: "Apresentação da nova proposta"
  }
];

export function useActivityData() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Filtro local (mock). Substitua por fetch/axios e useQuery futuramente.
  const filtered = useMemo(() => {
    return mockActivities.filter((a) => {
      const matchesSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
      const matchesType = !typeFilter || typeFilter === 'all' || a.type === typeFilter;
      const matchesStatus = !statusFilter || statusFilter === 'all' || a.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [search, typeFilter, statusFilter]);

  return {
    activities: filtered,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
  };
} 