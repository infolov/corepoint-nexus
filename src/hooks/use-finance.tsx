import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Currency {
  code: string;
  rate: string;
  change: string;
  changePercent: string;
}

interface Crypto {
  symbol: string;
  name: string;
  price: string;
  change24h: string;
}

interface Index {
  symbol: string;
  name: string;
  value: string;
  change: string;
  changePercent: string;
}

interface FinanceData {
  currencies: Currency[];
  crypto: Crypto[];
  indices: Index[];
  timestamp: string;
}

interface UseFinanceResult {
  data: FinanceData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFinance(): UseFinanceResult {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFinance = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: responseData, error: fnError } = await supabase.functions.invoke("get-finance");

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (responseData.error) {
        throw new Error(responseData.error);
      }

      setData(responseData);
    } catch (err) {
      console.error("Error fetching finance data:", err);
      setError(err instanceof Error ? err.message : "Błąd pobierania danych finansowych");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinance();
  }, [fetchFinance]);

  return { data, loading, error, refetch: fetchFinance };
}
