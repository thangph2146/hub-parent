"use client";

import { useMemo, useCallback, useState } from "react";
import { Loader2, Calendar, ChevronDown, ChevronRight, Filter } from "lucide-react";
import { Flex } from "@/components/ui/flex";
import { TypographyP, TypographyPSmall, TypographyPSmallMuted, TypographySpanSmall, IconSize, TypographyPMuted } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DataTable,
  type DataTableColumn,
  type DataTableLoader,
  type DataTableQueryState,
  type DataTableResult,
} from "@/components/tables";
import type { TermAverage } from "@/types";
import { cn } from "@/utils";
import { formatScore } from "./ScoreUtils";

const YearTermAveragesDataTable = ({ termAverages }: { termAverages: TermAverage[] }) => {
  const uniqueTerms = useMemo(() => {
    if (!termAverages || termAverages.length === 0) return [];
    return Array.from(new Set(termAverages.map((avg) => avg.termID).filter(Boolean))).sort();
  }, [termAverages]);

  const columns: DataTableColumn<TermAverage>[] = useMemo(
    () => [
      {
        accessorKey: "termID",
        header: "Học kỳ",
        cell: (row) => (
          <Flex align="center" gap={2} wrap>
            <Badge variant="outline" className="whitespace-nowrap">
              <TypographyPSmall>{row.termID}</TypographyPSmall>
            </Badge>
            {row.orderTerm && (
              <TypographyPSmallMuted className="whitespace-nowrap">
                Học kỳ {row.orderTerm}
              </TypographyPSmallMuted>
            )}
          </Flex>
        ),
        className: "min-w-[140px]",
        filter: {
          type: "select",
          options: uniqueTerms.map((term) => ({ label: term, value: term })),
          placeholder: "Tất cả học kỳ",
        },
      },
      {
        accessorKey: "averageScore10",
        header: "Điểm hệ 10",
        cell: (row) => {
          const score10 = formatScore(row.averageScore10, "10");
          return <TypographyP className={score10.color}>{score10.text}</TypographyP>;
        },
        className: "min-w-[100px]",
      },
      {
        accessorKey: "averageScore4",
        header: "Điểm hệ 4",
        cell: (row) => {
          const score4 = formatScore(row.averageScore4, "4");
          return <TypographyP className={cn(score4.color)}>{score4.text}</TypographyP>;
        },
        className: "min-w-[100px]",
      },
      {
        accessorKey: "averageGatherScore10",
        header: "Tích lũy hệ 10",
        cell: (row) => {
          const gatherScore10 = formatScore(row.averageGatherScore10, "10");
          return <TypographyP className={gatherScore10.color}>{gatherScore10.text}</TypographyP>;
        },
        className: "min-w-[120px]",
      },
      {
        accessorKey: "averageGatherScore4",
        header: "Tích lũy hệ 4",
        cell: (row) => {
          const gatherScore4 = formatScore(row.averageGatherScore4, "4");
          return <TypographyP className={gatherScore4.color}>{gatherScore4.text}</TypographyP>;
        },
        className: "min-w-[120px]",
      },
    ],
    [uniqueTerms]
  );

  const loader: DataTableLoader<TermAverage> = useCallback(
    async (query: DataTableQueryState): Promise<DataTableResult<TermAverage>> => {
      if (!termAverages || termAverages.length === 0) {
        return { rows: [], page: 1, limit: query.limit, total: 0, totalPages: 1 };
      }

      let filtered = [...termAverages];
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        filtered = filtered.filter(
          (avg) =>
            avg.termID?.toLowerCase().includes(searchLower) ||
            avg.orderTerm?.toString().toLowerCase().includes(searchLower)
        );
      }
      if (query.filters.termID && query.filters.termID !== "all") {
        filtered = filtered.filter((avg) => avg.termID === query.filters.termID);
      }
      filtered.sort((a, b) => (a.termID || "").localeCompare(b.termID || ""));

      return {
        rows: filtered,
        page: 1,
        limit: filtered.length || 1,
        total: filtered.length,
        totalPages: 1,
      };
    },
    [termAverages]
  );

  if (!termAverages || termAverages.length === 0) {
    return (
      <TypographyPMuted className="py-4">Không có dữ liệu học kỳ</TypographyPMuted>
    );
  }

  return (
    <DataTable<TermAverage>
      columns={columns}
      loader={loader}
      initialLimit={termAverages.length || 1000}
      limitOptions={[]}
      emptyMessage="Không tìm thấy dữ liệu"
      getRowId={(row) => `${row.yearStudy}-${row.termID}`}
      enableHorizontalScroll={true}
    />
  );
};

interface TermAveragesListProps {
  averages?: TermAverage[];
  isLoading: boolean;
}

export const TermAveragesList = ({ averages, isLoading }: TermAveragesListProps) => {
  const [filterYear, setFilterYear] = useState<string>("all");
  const [openYears, setOpenYears] = useState<Set<string>>(new Set());

  const uniqueYears = useMemo(() => {
    if (!averages || averages.length === 0) return [];
    return Array.from(new Set(averages.map((avg) => avg.yearStudy).filter(Boolean))).sort().reverse();
  }, [averages]);

  const groupedByYear = useMemo(() => {
    if (!averages || averages.length === 0) return {};
    let filtered = [...averages];
    if (filterYear !== "all") {
      filtered = filtered.filter((avg) => avg.yearStudy === filterYear);
    }
    const grouped: Record<string, TermAverage[]> = {};
    filtered.forEach((avg) => {
      const year = avg.yearStudy || "Khác";
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(avg);
    });
    return grouped;
  }, [averages, filterYear]);

  const toggleYear = useCallback((year: string) => {
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }, []);

  if (isLoading) {
    return (
      <Flex align="center" className="py-8">
        <IconSize size="lg" className="animate-spin text-muted-foreground">
          <Loader2 />
        </IconSize>
      </Flex>
    );
  }

  if (!averages || averages.length === 0) {
    return (
      <div className="py-8 text-muted-foreground">
        Chưa có dữ liệu điểm trung bình tích lũy theo học kỳ
      </div>
    );
  }

  const hasData = Object.keys(groupedByYear).length > 0;

  return (
    <Flex direction="col" gap={4} fullWidth>
      <Flex gap={3} direction="col" fullWidth>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <IconSize size="sm" className="mr-2">
              <Filter />
            </IconSize>
            <SelectValue placeholder="Tất cả năm học" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả năm học</SelectItem>
            {uniqueYears.map((year) => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Flex>

      {hasData ? (
        <Flex direction="col" gap={2} fullWidth>
          {Object.entries(groupedByYear)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([yearStudy, termAverages]) => {
              const isYearOpen = openYears.has(yearStudy);
              return (
                <Collapsible key={yearStudy} open={isYearOpen} onOpenChange={() => toggleYear(yearStudy)} className="w-full">
                  <Flex rounded="md" border="all" overflow="hidden" direction="col" fullWidth>
                    <CollapsibleTrigger asChild className="w-full">
                      <Flex align="center" gap={2} padding="md" className="w-full hover:bg-muted transition-colors">
                        <IconSize size="sm" className="text-muted-foreground">
                          {isYearOpen ? <ChevronDown /> : <ChevronRight />}
                        </IconSize>
                        <IconSize size="sm" className="text-muted-foreground">
                          <Calendar />
                        </IconSize>
                        <TypographySpanSmall>Năm học ({yearStudy})</TypographySpanSmall>
                        <Badge variant="secondary" className="ml-auto">
                          {termAverages.length} học kỳ
                        </Badge>
                      </Flex>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="w-full">
                      <Flex padding="md" border="top" fullWidth>
                        <YearTermAveragesDataTable termAverages={termAverages} />
                      </Flex>
                    </CollapsibleContent>
                  </Flex>
                </Collapsible>
              );
            })}
        </Flex>
      ) : (
        <Flex className="py-8 text-muted-foreground" align="center" fullWidth>
          Không tìm thấy dữ liệu phù hợp
        </Flex>
      )}
    </Flex>
  );
};
