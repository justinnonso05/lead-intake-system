'use client';

import { useEffect, useState } from 'react';
import { Loader2, ArrowUpDown, Filter, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Lead {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  industry?: string;
  score: number;
  status: 'QUALIFIED' | 'UNQUALIFIED';
  createdAt: string;
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQualified, setFilterQualified] = useState(false);
  const [sortDescending, setSortDescending] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch('/api/leads');
        const json = await res.json();
        if (json.success) {
          setLeads(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  // processed leads
  const visibleLeads = leads
    .filter(lead => filterQualified ? lead.status === 'QUALIFIED' : true)
    .sort((a, b) => {
      if (sortDescending) {
        return b.score - a.score;
      }
      return a.score - b.score;
    });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Lead Dashboard</h1>
          <p className="text-muted-foreground">Manage and track your incoming leads.</p>
        </div>
        <Link href="/">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Form</Button>
        </Link>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-muted">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Recent Submissions</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={sortDescending ? "default" : "secondary"}
              size="sm"
              onClick={() => setSortDescending(!sortDescending)}
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Score {sortDescending ? '(High to Low)' : '(Low to High)'}
            </Button>
            <Button
              variant={filterQualified ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterQualified(!filterQualified)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {filterQualified ? 'Show All' : 'Show Qualified Only'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No results found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleLeads.map((lead) => (
                      <TableRow key={lead.id} className="border-border hover:bg-muted/50">
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                        <TableCell>
                          {lead.companyName ? (
                            <div className="flex flex-col">
                              <span>{lead.companyName}</span>
                              <span className="text-xs text-muted-foreground">{lead.industry}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            lead.score >= 20 ? "border-green-500 text-green-500" :
                              lead.score >= 0 ? "border-yellow-500 text-yellow-500" :
                                "border-red-500 text-red-500"
                          }>
                            {lead.score}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={lead.status === 'QUALIFIED' ? 'default' : 'secondary'}>
                            {lead.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
