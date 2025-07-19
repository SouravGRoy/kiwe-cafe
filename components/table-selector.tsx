"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface TableSelectorProps {
  onTableSelected: (tableNumber: number) => void;
  currentTable?: number | null;
}

export function TableSelector({
  onTableSelected,
  currentTable,
}: TableSelectorProps) {
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [isOpen, setIsOpen] = useState(!currentTable);
  const { toast } = useToast();

  useEffect(() => {
    if (currentTable) {
      setSelectedTable(currentTable.toString());
      setIsOpen(false);
    }
  }, [currentTable]);

  const handleTableSelect = () => {
    if (!selectedTable) {
      toast({
        title: "Please select a table",
        description: "Choose your table number to continue ordering.",
        variant: "destructive",
      });
      return;
    }

    const tableNumber = Number.parseInt(selectedTable);
    onTableSelected(tableNumber);
    setIsOpen(false);

    toast({
      title: "Table Selected",
      description: `You are now ordering for Table ${tableNumber}`,
    });
  };

  const handleChangeTable = () => {
    setIsOpen(true);
  };

  if (!isOpen && currentTable) {
    return (
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Badge variant="default" className="bg-blue-600">
            🪑 Table {currentTable}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleChangeTable}>
            Change Table
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-6">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Select Your Table</CardTitle>
            <CardDescription>
              Choose your table number to start ordering
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger>
                <SelectValue placeholder="Choose table number" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 15 }, (_, i) => i + 1).map((tableNum) => (
                  <SelectItem key={tableNum} value={tableNum.toString()}>
                    Table {tableNum}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleTableSelect}
              className="w-full"
              disabled={!selectedTable}
            >
              Continue to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
