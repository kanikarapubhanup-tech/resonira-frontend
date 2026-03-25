import React, { useState } from 'react';
import { Search, Filter, Calendar, Users } from 'lucide-react';
import { useLeave } from '@/hooks/useLeave';

export const LeaveSummaryTable = () => {
  const { leaveRequests } = useLeave();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'HR' | 'Employee'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Approved' | 'Pending'>('All');

  const realLeaveData = leaveRequests.map(req => ({
    id: req.id,
    name: req.userName,
    role: req.role,
    department: req.dept,
    leaveType: req.type,
    startDate: req.from,
    endDate: req.to,
    status: req.status
  }));

  const filteredData = realLeaveData.filter(record => {
    const name = record.name || "";
    const status = record.status || "";
    const role = record.role || "";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isHR = role.includes('HR') || role.includes('Human Resources');
    const matchesRole = roleFilter === 'All' || 
                        (roleFilter === 'HR' ? isHR : !isHR);
                        
    const matchesStatus = statusFilter === 'All' || status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="card-surface mt-8 overflow-hidden flex flex-col animate-fade-up">
      <div className="p-6 border-b border-border/50">
        <h2 className="text-xl font-heading font-bold mb-4 flex items-center gap-2">
          <Users className="text-primary" size={24} /> 
          Employees Currently on Leave
        </h2>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5 rounded-xl border border-border/50">
              <Filter size={14} className="text-muted-foreground" />
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value as 'All' | 'HR' | 'Employee')}
                className="bg-transparent border-none text-sm outline-none text-foreground cursor-pointer"
              >
                <option value="All">All Roles</option>
                <option value="HR">HR</option>
                <option value="Employee">Employee</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5 rounded-xl border border-border/50">
              <Calendar size={14} className="text-muted-foreground" />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Approved' | 'Pending')}
                className="bg-transparent border-none text-sm outline-none text-foreground cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-secondary/20 text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-semibold tracking-wide">Name</th>
              <th className="px-6 py-4 font-semibold tracking-wide">Role</th>
              <th className="px-6 py-4 font-semibold tracking-wide">Department</th>
              <th className="px-6 py-4 font-semibold tracking-wide">Leave Type</th>
              <th className="px-6 py-4 font-semibold tracking-wide">From</th>
              <th className="px-6 py-4 font-semibold tracking-wide">To</th>
              <th className="px-6 py-4 font-semibold tracking-wide rounded-tr-xl">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filteredData.length > 0 ? (
              filteredData.map((record) => (
                <tr key={record.id} className="hover:bg-secondary/10 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{record.name}</td>
                  <td className="px-6 py-4">
                    <span className={`badge-pill text-[10px] tracking-wider font-bold shadow-sm ${
                      (record.role?.includes('HR') || record.role?.includes('Human Resources')) 
                        ? 'bg-primary/15 text-primary border border-primary/20' 
                        : 'bg-accent/15 text-accent border border-accent/20'
                    }`}>
                      {record.role?.toUpperCase() || "EMPLOYEE"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{record.department}</td>
                  <td className="px-6 py-4 font-medium">{record.leaveType}</td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{record.startDate}</td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{record.endDate}</td>
                  <td className="px-6 py-4">
                    <span className={`badge-pill text-[10px] tracking-wider font-bold shadow-sm ${
                      record.status === 'Approved' 
                        ? 'bg-success/15 text-success border border-success/20' 
                        : 'bg-warning/15 text-warning border border-warning/20'
                    }`}>
                      {record.status?.toUpperCase() || "PENDING"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground italic">
                  No records found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
