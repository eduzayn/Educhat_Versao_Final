import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorData;
    try {
      // Clonar a resposta para não consumir o stream
      const clonedRes = res.clone();
      errorData = await clonedRes.json();
    } catch (parseError) {
      // Se não conseguir fazer parse do JSON, criar um objeto de erro padrão
      errorData = { error: res.statusText };
    }
    
    const error = new Error(errorData.error || res.statusText);
    (error as any).response = { data: errorData, status: res.status };
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  try {
    const headers: Record<string, string> = {};
    
    if (data) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    
    // Parse JSON response
    const responseData = await res.json();
    return responseData;
  } catch (error) {
    console.error(`❌ Erro na requisição ${method} ${url}:`, error);
    
    // Se é erro de rede, tentar novamente uma vez
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.log(`🔄 Tentando novamente: ${method} ${url}`);
      try {
        const headers: Record<string, string> = {};
        
        if (data) {
          headers["Content-Type"] = "application/json";
        }

        const res = await fetch(url, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
          credentials: "include",
        });

        await throwIfResNotOk(res);
        
        // Parse JSON response on retry
        const responseData = await res.json();
        return responseData;
      } catch (retryError) {
        console.error(`❌ Erro na segunda tentativa ${method} ${url}:`, retryError);
        throw retryError;
      }
    }
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 120000, // 2 minutos - cache mais agressivo para reduzir requests
      gcTime: 300000, // 5 minutos - manter em cache mais tempo
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
