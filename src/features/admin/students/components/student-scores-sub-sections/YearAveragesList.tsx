"use client";

import { useMemo, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Flex } from "@/components/ui/flex";
import { TypographyP, IconSize } from "@/components/ui/typography";
import {
  DataTable,
  type DataTableColumn,
  type DataTableLoader,
  type DataTableQueryState,
  type DataTableResult,
} from "@/components/tables";
import type { YearAverage } from "@/types";
import { cn } from "@/utils";
import { formatScore } from "./ScoreUtils";

interface YearAveragesListProps {
  averages?: YearAverage[];
  isLoading: boolean;
}

export const YearAveragesList = ({ averages, isLoading }: YearAveragesListProps) => {
  const uniqueYears = useMemo(() => {
    if (!averages || averages.length === 0) return [];
    return Array.from(new Set(averages.map((avg) => avg.yearStudy))).sort().reverse();
  }, [averages]);

  const columns: DataTableColumn<YearAverage>[] = useMemo(
    () => [
      {
        accessorKey: "yearStudy",
        header: "Năm học",
        cell: (row) => <TypographyP>{row.yearStudy}</TypographyP>,
        className: "min-w-[120px]",
        filter: {
          type: "select",
          options: uniqueYears.map((year) => ({ label: year, value: year })),
          placeholder: "Tất cả năm học",
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
    [uniqueYears]
  );

  const loader: DataTableLoader<YearAverage> = useCallback(
    async (query: DataTableQueryState): Promise<DataTableResult<YearAverage>> => {
      if (!averages || averages.length === 0) {
        return {
          rows: [],
          page: 1,
          limit: query.limit,
          total: 0,
          totalPages: 0,
        };
      }

      let filtered = [...averages];
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        filtered = filtered.filter((avg) => avg.yearStudy?.toLowerCase().includes(searchLower));
      }
      if (query.filters.yearStudy && query.filters.yearStudy !== "all") {
        filtered = filtered.filter((avg) => avg.yearStudy === query.filters.yearStudy);
      }
      filtered.sort((a, b) => (b.yearStudy || "").localeCompare(a.yearStudy || ""));

      const total = filtered.length;
      const totalPages = Math.ceil(total / query.limit);
      const startIndex = (query.page - 1) * query.limit;
      const paginatedRows = filtered.slice(startIndex, startIndex + query.limit);

      return {
        rows: paginatedRows,
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      };
    },
    [averages]
  );

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
      <Flex className="py-8 text-muted-foreground" align="center">
        Chưa có dữ liệu điểm trung bình theo năm học
      </Flex>
    );
  }

  return (
    <DataTable<YearAverage>
      columns={columns}
      loader={loader}
      initialLimit={10}
      limitOptions={[10, 20, 50]}
      emptyMessage="Không tìm thấy dữ liệu"
      getRowId={(row) => row.yearStudy || `year-${row.updateDate}`}
      enableHorizontalScroll={true}
    />
  );
};
