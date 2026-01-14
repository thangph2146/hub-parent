"use client";

import { useMemo, useCallback, useState } from "react";
import { Loader2, Calendar, ChevronDown, ChevronRight, Filter } from "lucide-react";
import { Flex } from "@/components/ui/flex";
import { TypographyP, IconSize, TypographySpanSmall, TypographyPSmall, TypographyPMuted } from "@/components/ui/typography";
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
import type { DetailedScore } from "@/types";
import { cn } from "@/utils";
import { formatScore, formatGrade } from "./ScoreUtils";

const TermScoresDataTable = ({ termScores }: { termScores: DetailedScore[] }) => {
  const columns: DataTableColumn<DetailedScore>[] = useMemo(
    () => [
      {
        accessorKey: "curriculumName",
        header: "Môn học",
        cell: (row) => (
          <Flex direction="col" gap={0.5} minWidth="0" fullWidth>
            <TypographyP className="truncate">{row.curriculumName}</TypographyP>
          </Flex>
        ),
        className: "min-w-[250px] sm:min-w-[300px]",
        filter: { type: "text", placeholder: "Tìm kiếm môn học..." },
      },
      {
        accessorKey: "curriculumID",
        header: "Mã môn",
        cell: (row) => <TypographyP>{row.curriculumID}</TypographyP>,
        className: "min-w-[120px]",
      },
      {
        accessorKey: "studyUnitAlias",
        header: "Mã học phần",
        cell: (row) => <TypographyPMuted>{row.studyUnitAlias}</TypographyPMuted>,
        className: "min-w-[120px]",
      },
      {
        accessorKey: "mark10",
        header: "Hệ 10",
        cell: (row) => {
          const score = formatScore(row.mark10, "10");
          return <TypographyP className={score.color}>{score.text}</TypographyP>;
        },
        className: "w-[80px] text-center",
      },
      {
        accessorKey: "mark4",
        header: "Hệ 4",
        cell: (row) => {
          const score = formatScore(row.mark4, "4");
          return <TypographyP className={score.color}>{score.text}</TypographyP>;
        },
        className: "w-[80px] text-center",
      },
      {
        accessorKey: "markLetter",
        header: "Điểm chữ",
        cell: (row) => {
          const grade = formatGrade(row.markLetter);
          return (
            <Badge variant="outline" className={cn("px-2 py-0.5", grade.color)}>
              <TypographyPSmall>{grade.text}</TypographyPSmall>
            </Badge>
          );
        },
        className: "w-[90px] text-center",
      },
    ],
    []
  );

  const loader: DataTableLoader<DetailedScore> = useCallback(
    async (query: DataTableQueryState): Promise<DataTableResult<DetailedScore>> => {
      if (!termScores || termScores.length === 0) {
        return { rows: [], page: 1, limit: query.limit, total: 0, totalPages: 1 };
      }

      let filtered = [...termScores];
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        filtered = filtered.filter((score) => score.curriculumName?.toLowerCase().includes(searchLower));
      }

      return {
        rows: filtered,
        page: 1,
        limit: filtered.length || 1,
        total: filtered.length,
        totalPages: 1,
      };
    },
    [termScores]
  );

  if (!termScores || termScores.length === 0) {
    return (
      <TypographyPMuted className="py-4">Không có dữ liệu điểm môn học</TypographyPMuted>
    );
  }

  return (
    <DataTable<DetailedScore>
      columns={columns}
      loader={loader}
      initialLimit={termScores.length || 1000}
      limitOptions={[]}
      emptyMessage="Không tìm thấy dữ liệu"
      getRowId={(row) => `${row.curriculumID}-${row.yearStudy}-${row.termID}`}
      enableHorizontalScroll={true}
    />
  );
};

interface DetailedScoresListProps {
  scores?: DetailedScore[];
  isLoading: boolean;
}

export const DetailedScoresList = ({ scores, isLoading }: DetailedScoresListProps) => {
  const [filterYear, setFilterYear] = useState<string>("all");
  const [openTerms, setOpenTerms] = useState<Set<string>>(new Set());

  const uniqueYears = useMemo(() => {
    if (!scores || scores.length === 0) return [];
    return Array.from(new Set(scores.map((s) => s.yearStudy).filter(Boolean))).sort().reverse();
  }, [scores]);

  const groupedData = useMemo(() => {
    if (!scores || scores.length === 0) return {};
    let filtered = [...scores];
    if (filterYear !== "all") {
      filtered = filtered.filter((s) => s.yearStudy === filterYear);
    }
    const grouped: Record<string, Record<string, DetailedScore[]>> = {};
    filtered.forEach((score) => {
      const year = score.yearStudy || "Khác";
      const term = score.termID || "Khác";
      if (!grouped[year]) grouped[year] = {};
      if (!grouped[year][term]) grouped[year][term] = [];
      grouped[year][term].push(score);
    });
    return grouped;
  }, [scores, filterYear]);

  const toggleTerm = useCallback((year: string, term: string) => {
    const key = `${year}-${term}`;
    setOpenTerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
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

  if (!scores || scores.length === 0) {
    return (
      <div className="py-8 text-muted-foreground">
        Chưa có dữ liệu điểm chi tiết môn học
      </div>
    );
  }

  const hasData = Object.keys(groupedData).length > 0;

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
        <Flex direction="col" gap={4} fullWidth>
          {Object.entries(groupedData)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([yearStudy, terms]) => (
              <Flex key={yearStudy} direction="col" gap={2} fullWidth>
                <Flex align="center" gap={2} className="px-1 py-2 border-b">
                  <IconSize size="sm" className="text-primary">
                    <Calendar />
                  </IconSize>
                  <TypographyP className="font-semibold text-primary">Năm học {yearStudy}</TypographyP>
                </Flex>
                <Flex direction="col" gap={2} fullWidth>
                  {Object.entries(terms)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([termID, termScores]) => {
                      const isTermOpen = openTerms.has(`${yearStudy}-${termID}`);
                      return (
                        <Collapsible
                          key={`${yearStudy}-${termID}`}
                          open={isTermOpen}
                          onOpenChange={() => toggleTerm(yearStudy, termID)}
                          className="w-full"
                        >
                          <Flex rounded="md" border="all" overflow="hidden" direction="col" fullWidth>
                            <CollapsibleTrigger asChild className="w-full">
                              <Flex align="center" gap={2} padding="md" className="w-full hover:bg-muted transition-colors">
                                <IconSize size="sm" className="text-muted-foreground">
                                  {isTermOpen ? <ChevronDown /> : <ChevronRight />}
                                </IconSize>
                                <TypographySpanSmall>Học kỳ {termID}</TypographySpanSmall>
                                <Badge variant="secondary" className="ml-auto">
                                  {termScores.length} môn học
                                </Badge>
                              </Flex>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="w-full">
                              <Flex padding="md" border="top" fullWidth>
                                <TermScoresDataTable termScores={termScores} />
                              </Flex>
                            </CollapsibleContent>
                          </Flex>
                        </Collapsible>
                      );
                    })}
                </Flex>
              </Flex>
            ))}
        </Flex>
      ) : (
        <Flex className="py-8 text-muted-foreground" align="center" fullWidth>
          Không tìm thấy dữ liệu phù hợp
        </Flex>
      )}
    </Flex>
  );
};
